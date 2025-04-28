import React, { useEffect, useState } from 'react'; // Import React and hooks
import { useParams, useNavigate } from 'react-router-dom'; // Router hooks for params and navigation
import { db } from '../../services/firebase'; // Firebase database
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'; // Firestore functions
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Firebase authentication

// ProfileView Component
const ProfileView = () => {
  const { id } = useParams(); // Get profile ID from URL
  const navigate = useNavigate(); // Hook to navigate back

  const [userProfile, setUserProfile] = useState(null); // Profile being viewed
  const [currentUser, setCurrentUser] = useState(null); // Logged-in user
  const [friendStatus, setFriendStatus] = useState(''); // Friend status with the profile user

  const auth = getAuth(); // Get auth instance

  // Fetch the logged-in user's data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
      }
    });
    return () => unsubscribe(); // Clean up listener
  }, [auth]);

  // Fetch viewed user's profile and determine friend status
  useEffect(() => {
    const fetchProfileAndActivity = async () => {
      if (!id) return;

      try {
        const profileRef = doc(db, 'users', id);
        const userDoc = await getDoc(profileRef);
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }

        if (currentUser) {
          const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
          const currentUserData = currentUserDoc.data();

          if (currentUserData?.friends?.includes(id)) {
            setFriendStatus('friends');
          } else if (currentUserData?.outgoingRequests?.includes(id)) {
            setFriendStatus('request_sent');
          } else if (currentUserData?.incomingRequests?.includes(id)) {
            setFriendStatus('request_received');
          } else {
            setFriendStatus('not_friends');
          }
        }
      } catch (error) {
        console.error('Error fetching profile/activity:', error);
      }
    };

    fetchProfileAndActivity();
  }, [id, currentUser]);

  // Send a friend request
  const handleSendRequest = async () => {
    if (!currentUser) return;
    await updateDoc(doc(db, 'users', currentUser.uid), {
      outgoingRequests: arrayUnion(id),
    });
    await updateDoc(doc(db, 'users', id), {
      incomingRequests: arrayUnion(currentUser.uid),
    });
    setFriendStatus('request_sent');
  };

  // Accept an incoming friend request
  const handleAcceptRequest = async () => {
    if (!currentUser) return;
    await updateDoc(doc(db, 'users', currentUser.uid), {
      incomingRequests: arrayRemove(id),
      friends: arrayUnion(id),
    });
    await updateDoc(doc(db, 'users', id), {
      outgoingRequests: arrayRemove(currentUser.uid),
      friends: arrayUnion(currentUser.uid),
    });
    setFriendStatus('friends');
  };

  // Cancel an outgoing friend request
  const handleCancelRequest = async () => {
    if (!currentUser) return;
    await updateDoc(doc(db, 'users', currentUser.uid), {
      outgoingRequests: arrayRemove(id),
    });
    await updateDoc(doc(db, 'users', id), {
      incomingRequests: arrayRemove(currentUser.uid),
    });
    setFriendStatus('not_friends');
  };

  // If the profile hasn't loaded yet
  if (!userProfile) {
    return <p>Loading profile...</p>;
  }

  // Check if viewing own profile
  const isViewingOwnProfile = currentUser?.uid === id;

  // Render the profile view
  return (
    <div style={{ padding: '20px' }}>
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        style={{ marginBottom: '20px', padding: '8px 16px', backgroundColor: '#ddd', border: 'none', cursor: 'pointer' }}
      >
        ← Back
      </button>

      {/* Profile Details */}
      <div style={{
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h2>{userProfile.displayName || 'Unnamed User'}</h2>
        <p><strong>Interests:</strong> {userProfile.interests?.join(', ') || 'N/A'}</p>
        <p><strong>Skills:</strong> {userProfile.skills?.join(', ') || 'N/A'}</p>
        <p><strong>Programming Languages:</strong> {userProfile.languages?.join(', ') || 'N/A'}</p>

        {/* Friend Interaction Buttons */}
        {!isViewingOwnProfile && (
          <div style={{ marginTop: '15px' }}>
            {friendStatus === 'friends' && (
              <button disabled style={{ backgroundColor: '#4CAF50', color: 'white', padding: '10px', borderRadius: '5px', border: 'none' }}>
                Friends ✅
              </button>
            )}
            {friendStatus === 'not_friends' && (
              <button onClick={handleSendRequest} style={friendButtonStyle}>Add Friend</button>
            )}
            {friendStatus === 'request_sent' && (
              <button onClick={handleCancelRequest} style={friendButtonStyle}>Cancel Request</button>
            )}
            {friendStatus === 'request_received' && (
              <button onClick={handleAcceptRequest} style={friendButtonStyle}>Accept Friend Request</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Styles for friend interaction buttons
const friendButtonStyle = {
  padding: '10px 20px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
};

export default ProfileView; // Export the ProfileView component
