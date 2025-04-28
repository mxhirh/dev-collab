import React, { useState, useEffect } from 'react'; // Import React and hooks
import { auth, db } from '../../services/firebase'; // Firebase auth and database
import { signOut, updateProfile } from 'firebase/auth'; // Firebase auth functions
import { useNavigate } from 'react-router-dom'; // Navigation hook
import { doc, getDoc, updateDoc } from 'firebase/firestore'; // Firestore functions
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Storage functions for profile pictures

// Reusable Checkbox Group Component
const CheckboxGroup = ({ options, selectedValues, onChange }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
    {options.map((option) => (
      <div key={option}>
        <input
          type="checkbox"
          value={option}
          checked={selectedValues.includes(option)}
          onChange={onChange}
        />
        <span style={{ marginLeft: '5px' }}>{option}</span>
      </div>
    ))}
  </div>
);

// Main Profile Component
const Profile = () => {
  // State variables
  const [user, setUser] = useState(null); // Authenticated user
  const [displayName, setDisplayName] = useState(''); // User's display name
  const [skills, setSkills] = useState([]); // Skills selected
  const [interests, setInterests] = useState([]); // Interests selected
  const [languages, setLanguages] = useState([]); // Languages known
  const [photoURL, setPhotoURL] = useState(''); // Profile picture URL
  const [loading, setLoading] = useState(true); // Loading state
  const [uploading, setUploading] = useState(false); // Uploading state
  const [error, setError] = useState(''); // Error message
  const [successMessage, setSuccessMessage] = useState(''); // Success message
  const [editMode, setEditMode] = useState(false); // Toggle edit mode

  const navigate = useNavigate(); // Hook for navigation
  const storage = getStorage(); // Get Firebase storage instance

  // Available options for checkboxes
  const skillsOptions = ['Frontend Development', 'Backend Development', 'Database Management', 'Cloud Computing', 'Cybersecurity'];
  const interestsOptions = ['Web Development', 'Data Science', 'Mobile Apps', 'AI & Machine Learning', 'Game Development'];
  const languagesOptions = ['Python', 'Java', 'JavaScript', 'C++', 'Ruby', 'Go'];

  // Fetch and load user data on component mount
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setDisplayName(currentUser.displayName || '');
        setPhotoURL(currentUser.photoURL || '');

        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setSkills(data.skills || []);
          setInterests(data.interests || []);
          setLanguages(data.languages || []);
        }
        setLoading(false);
      } else {
        navigate('/signup'); // Redirect if not logged in
      }
    });
    return () => unsubscribe(); // Clean up the listener
  }, [navigate]);

  // Handle changes for checkboxes
  const handleCheckboxChange = (setter, values) => (e) => {
    const value = e.target.value;
    if (e.target.checked) {
      setter([...values, value]); // Add value if checked
    } else {
      setter(values.filter((item) => item !== value)); // Remove value if unchecked
    }
  };

  // Save updated profile information
  const handleSaveProfile = async () => {
    try {
      if (user) {
        await updateProfile(user, { displayName, photoURL });
        await updateDoc(doc(db, 'users', user.uid), { displayName, photoURL, interests, skills, languages });
        setSuccessMessage('Profile updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000); // Clear message after 3s
        setEditMode(false); // Exit edit mode
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile.');
    }
  };

  // Log out the user
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/signup'); // Redirect to signup page after logout
    } catch (err) {
      setError('Failed to log out.');
    }
  };

  // Handle uploading a new profile picture
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `profilePictures/${user.uid}`);
      await uploadBytes(storageRef, file); // Upload image to storage
      const downloadURL = await getDownloadURL(storageRef); // Get download URL

      setPhotoURL(downloadURL);
      await updateProfile(user, { photoURL: downloadURL });
      await updateDoc(doc(db, 'users', user.uid), { photoURL: downloadURL });
      setSuccessMessage('Profile picture updated!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  // Show loading message if profile data is still loading
  if (loading) return <p>Loading...</p>;

  // Render Profile Page
  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>Your Profile</h1>

      {/* Notifications */}
      {uploading && <p style={{ textAlign: 'center', color: 'blue' }}>Uploading image...</p>}
      {successMessage && <p style={{ textAlign: 'center', color: 'green' }}>{successMessage}</p>}
      {error && <p style={{ textAlign: 'center', color: 'red' }}>{error}</p>}

      {/* Profile Picture and Email */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <label style={{ cursor: 'pointer' }}>
          <img
            src={photoURL || '/default-avatar.png'}
            alt="Profile"
            width="100"
            height="100"
            style={{ borderRadius: '50%', objectFit: 'cover' }}
          />
          {/* Allow uploading new profile picture in edit mode */}
          {editMode && (
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          )}
        </label>
        <h2>{user?.email}</h2> {/* Display user's email */}
      </div>

      {/* Display Name Section */}
      <div style={{ marginBottom: '20px' }}>
        <label><strong>Display Name:</strong></label><br />
        {editMode ? (
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter new display name"
            style={{ padding: '8px', width: '100%', marginTop: '10px' }}
          />
        ) : (
          <p>{displayName || 'No display name set'}</p>
        )}
      </div>

      {/* Interests Section */}
      <div style={{ marginBottom: '20px' }}>
        <label><strong>Interests:</strong></label>
        {editMode ? (
          <CheckboxGroup
            options={interestsOptions}
            selectedValues={interests}
            onChange={handleCheckboxChange(setInterests, interests)}
          />
        ) : (
          <p>{interests.length ? interests.join(', ') : 'No interests specified.'}</p>
        )}
      </div>

      {/* Skills Section */}
      <div style={{ marginBottom: '20px' }}>
        <label><strong>Skills:</strong></label>
        {editMode ? (
          <CheckboxGroup
            options={skillsOptions}
            selectedValues={skills}
            onChange={handleCheckboxChange(setSkills, skills)}
          />
        ) : (
          <p>{skills.length ? skills.join(', ') : 'No skills specified.'}</p>
        )}
      </div>

      {/* Programming Languages Section */}
      <div style={{ marginBottom: '20px' }}>
        <label><strong>Programming Languages:</strong></label>
        {editMode ? (
          <CheckboxGroup
            options={languagesOptions}
            selectedValues={languages}
            onChange={handleCheckboxChange(setLanguages, languages)}
          />
        ) : (
          <p>{languages.length ? languages.join(', ') : 'No languages specified.'}</p>
        )}
      </div>

      {/* Buttons for Save/Cancel/Edit Profile */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        {editMode ? (
          <>
            <button
              onClick={handleSaveProfile}
              style={{
                margin: '0 10px',
                padding: '10px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px'
              }}
            >
              Save Changes
            </button>
            <button
              onClick={() => setEditMode(false)}
              style={{
                margin: '0 10px',
                padding: '10px 20px',
                backgroundColor: '#ccc',
                border: 'none',
                borderRadius: '5px'
              }}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setEditMode(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px'
            }}
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* Logout Button */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            fontSize: '18px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Log Out
        </button>
      </div>
    </div>
  );
};

export default Profile; // Export the Profile component

