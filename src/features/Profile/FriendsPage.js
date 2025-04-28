import React, { useEffect, useState } from 'react'; // Import React and hooks
import { db, auth } from '../../services/firebase'; // Firebase services
import { collection, doc, getDoc, getDocs, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore'; // Firestore functions
import { onAuthStateChanged } from 'firebase/auth'; // Auth state change listener
import { useNavigate } from 'react-router-dom'; // React Router navigation
import { toast, Toaster } from 'react-hot-toast'; // Toast notifications

// FriendsPage component
const FriendsPage = () => {
  // State variables
  const [user, setUser] = useState(null); // Current user
  const [friends, setFriends] = useState([]); // List of friends
  const [incomingRequests, setIncomingRequests] = useState([]); // Friend requests received
  const [outgoingRequests, setOutgoingRequests] = useState([]); // Friend requests sent
  const [suggestions, setSuggestions] = useState([]); // Suggested users to add
  const [loading, setLoading] = useState(true); // Loading state
  const navigate = useNavigate(); // Hook for navigation

  // Check user authentication on component mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser); // Set logged-in user
        await fetchFriendsData(currentUser.uid); // Fetch friends data
      } else {
        setLoading(false); // Stop loading if no user
      }
    });
    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  // Fetch user's friends, incoming/outgoing requests, and suggestions
  const fetchFriendsData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      const userData = userDoc.data();

      if (userData) {
        const friendsList = userData.friends || [];
        const incomingList = userData.incomingRequests || [];
        const outgoingList = userData.outgoingRequests || [];

        // Helper to fetch profile info for multiple users
        const fetchProfiles = async (ids) => {
          return Promise.all(ids.map(async (id) => {
            const profileDoc = await getDoc(doc(db, 'users', id));
            return { id, ...profileDoc.data() };
          }));
        };

        // Set states with fetched data
        setFriends(await fetchProfiles(friendsList));
        setIncomingRequests(await fetchProfiles(incomingList));
        setOutgoingRequests(await fetchProfiles(outgoingList));

        // Fetch all users and filter to get suggestions
        const allUsersSnapshot = await getDocs(collection(db, 'users'));
        const allUsers = allUsersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const filteredSuggestions = allUsers.filter(u =>
          u.id !== uid &&
          !friendsList.includes(u.id) &&
          !incomingList.includes(u.id) &&
          !outgoingList.includes(u.id)
        );
        setSuggestions(filteredSuggestions);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
      toast.error('Failed to load friends.');
    }
    setLoading(false);
  };

  // Accept an incoming friend request
  const handleAcceptRequest = async (fromUserId) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const fromUserRef = doc(db, 'users', fromUserId);

      await updateDoc(userRef, {
        friends: arrayUnion(fromUserId), // Add to friends
        incomingRequests: arrayRemove(fromUserId), // Remove from incoming
      });

      await updateDoc(fromUserRef, {
        friends: arrayUnion(user.uid),
        outgoingRequests: arrayRemove(user.uid),
      });

      toast.success('Friend request accepted!');
      await fetchFriendsData(user.uid); // Refresh data
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.error('Error accepting request.');
    }
  };

  // Decline an incoming friend request
  const handleDeclineRequest = async (fromUserId) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const fromUserRef = doc(db, 'users', fromUserId);

      await updateDoc(userRef, {
        incomingRequests: arrayRemove(fromUserId),
      });

      await updateDoc(fromUserRef, {
        outgoingRequests: arrayRemove(user.uid),
      });

      toast('Request declined.', { icon: '👋' });
      await fetchFriendsData(user.uid); // Refresh data
    } catch (error) {
      console.error('Error declining friend request:', error);
      toast.error('Error declining request.');
    }
  };

  // Send a new friend request
  const handleSendRequest = async (toUserId) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const toUserRef = doc(db, 'users', toUserId);

      await updateDoc(userRef, {
        outgoingRequests: arrayUnion(toUserId),
      });

      await updateDoc(toUserRef, {
        incomingRequests: arrayUnion(user.uid),
      });

      toast.success('Friend request sent!');
      await fetchFriendsData(user.uid); // Refresh data
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error('Error sending request.');
    }
  };

  // Cancel a sent friend request
  const handleCancelRequest = async (toUserId) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const toUserRef = doc(db, 'users', toUserId);

      await updateDoc(userRef, {
        outgoingRequests: arrayRemove(toUserId),
      });

      await updateDoc(toUserRef, {
        incomingRequests: arrayRemove(user.uid),
      });

      toast('Cancelled request.', { icon: '❌' });
      await fetchFriendsData(user.uid); // Refresh data
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error('Error cancelling request.');
    }
  };

  // Handle unfriending a user
  const handleUnfriend = async (friendId) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const friendRef = doc(db, 'users', friendId);

      // Remove each other from friends lists
      await updateDoc(userRef, {
        friends: arrayRemove(friendId),
      });
      await updateDoc(friendRef, {
        friends: arrayRemove(user.uid),
      });

      toast('Unfriended.', { icon: '🛑' }); // Notify user
      await fetchFriendsData(user.uid); // Refresh data
    } catch (error) {
      console.error('Error unfriending user:', error);
      toast.error('Error unfriending.');
    }
  };

  // Show loading message while fetching data
  if (loading) return <p>Loading your friends...</p>;

  // Render Friends Page
  return (
    <div style={{ padding: '20px' }}>
      <Toaster position="top-center" reverseOrder={false} />
      <h1>Friends</h1>

      {/* Friends List Section */}
      <h2>Friends List</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        {friends.map(friend => (
          <div key={friend.id} style={{ background: '#f9f9f9', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
            {/* Friend Profile Avatar */}
            <img
              src={friend.photoURL || '/default-avatar.png'}
              alt="avatar"
              style={{ width: '60px', height: '60px', borderRadius: '50%', marginBottom: '8px', cursor: 'pointer' }}
              onClick={() => navigate(`/profile/${friend.id}`)}
            />
            <p>{friend.displayName || 'Unnamed User'}</p>
            {/* Unfriend Button */}
            <button
              onClick={() => handleUnfriend(friend.id)}
              style={{ backgroundColor: '#dc3545', color: 'white', padding: '5px 10px', borderRadius: '5px', border: 'none', marginTop: '5px' }}
            >
              Unfriend
            </button>
          </div>
        ))}
      </div>

      {/* Incoming Friend Requests Section */}
      <h2>Incoming Friend Requests</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        {incomingRequests.map(user => (
          <div key={user.id} style={{ background: '#fff3cd', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
            {/* Incoming Request Avatar */}
            <img
              src={user.photoURL || '/default-avatar.png'}
              alt="avatar"
              style={{ width: '60px', height: '60px', borderRadius: '50%', marginBottom: '8px' }}
            />
            <p>{user.displayName || 'Unnamed User'}</p>
            {/* Accept or Decline Buttons */}
            <button
              onClick={() => handleAcceptRequest(user.id)}
              style={{ backgroundColor: 'green', color: 'white', padding: '5px 10px', margin: '5px', borderRadius: '5px', border: 'none' }}
            >
              Accept
            </button>
            <button
              onClick={() => handleDeclineRequest(user.id)}
              style={{ backgroundColor: 'red', color: 'white', padding: '5px 10px', borderRadius: '5px', border: 'none' }}
            >
              Decline
            </button>
          </div>
        ))}
      </div>

      {/* Outgoing Friend Requests Section */}
      <h2>Outgoing Friend Requests</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        {outgoingRequests.map(user => (
          <div key={user.id} style={{ background: '#f8d7da', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
            {/* Outgoing Request Avatar */}
            <img
              src={user.photoURL || '/default-avatar.png'}
              alt="avatar"
              style={{ width: '60px', height: '60px', borderRadius: '50%', marginBottom: '8px' }}
            />
            <p>{user.displayName || 'Unnamed User'}</p>
            {/* Cancel Request Button */}
            <button
              onClick={() => handleCancelRequest(user.id)}
              style={{ backgroundColor: '#dc3545', color: 'white', padding: '5px 10px', borderRadius: '5px', border: 'none' }}
            >
              Cancel
            </button>
          </div>
        ))}
      </div>

      {/* Suggested Users Section */}
      <h2>Suggested Users</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
        {suggestions.map(user => (
          <div key={user.id} style={{ background: '#e2e3e5', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
            {/* Suggested User Avatar */}
            <img
              src={user.photoURL || '/default-avatar.png'}
              alt="avatar"
              style={{ width: '60px', height: '60px', borderRadius: '50%', marginBottom: '8px' }}
            />
            <p>{user.displayName || 'Unnamed User'}</p>
            {/* Send Friend Request Button */}
            <button
              onClick={() => handleSendRequest(user.id)}
              style={{ backgroundColor: '#007bff', color: 'white', padding: '5px 10px', borderRadius: '5px', border: 'none' }}
            >
              Add Friend
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FriendsPage; // Export FriendsPage component

