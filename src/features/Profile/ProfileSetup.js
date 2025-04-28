import React, { useState } from 'react'; // Import React and hooks
import { db, auth } from '../../services/firebase'; // Firebase database and auth
import { doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore'; // Firestore functions
import { useNavigate } from 'react-router-dom'; // React Router navigation
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Firebase storage functions
import { updateProfile } from 'firebase/auth'; // Update user profile function

// ProfileSetup Component
const ProfileSetup = () => {
  // State variables
  const [displayName, setDisplayName] = useState(''); // Display Name input
  const [username, setUsername] = useState(''); // Username input
  const [interests, setInterests] = useState([]); // Selected interests
  const [skills, setSkills] = useState([]); // Selected skills
  const [languages, setLanguages] = useState([]); // Selected programming languages
  const [photoFile, setPhotoFile] = useState(null); // Selected profile picture file
  const [loading, setLoading] = useState(false); // Loading state for saving
  const [error, setError] = useState(''); // Error message

  const navigate = useNavigate(); // Navigation hook
  const storage = getStorage(); // Firebase storage reference

  // Handle selecting/deselecting checkboxes
  const handleCheckboxChange = (setter, values) => (e) => {
    const value = e.target.value;
    if (e.target.checked) {
      setter([...values, value]); // Add value
    } else {
      setter(values.filter((item) => item !== value)); // Remove value
    }
  };

  // Handle selecting a profile picture
  const handlePhotoChange = (e) => {
    if (e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
    }
  };

  // Check if the chosen username is unique
  const checkUsernameUnique = async (username) => {
    const q = query(collection(db, 'users'), where('username', '==', username));
    const snapshot = await getDocs(q);
    return snapshot.empty; // Return true if no matching username
  };

  // Handle saving the complete profile
  const handleSaveProfile = async (e) => {
    e.preventDefault(); // Prevent form default
    setLoading(true);
    setError('');

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      // Validate required fields
      if (!displayName.trim()) throw new Error('Display Name is required');
      if (!username.trim()) throw new Error('Username is required');
      if (interests.length < 1) throw new Error('Select at least one interest');
      if (skills.length < 1) throw new Error('Select at least one skill');
      if (languages.length < 1) throw new Error('Select at least one programming language');

      // Check if username is unique
      const isUnique = await checkUsernameUnique(username);
      if (!isUnique) throw new Error('Username already taken. Please choose another.');

      // Upload profile picture if provided
      let photoURL = '/default-avatar.png';
      if (photoFile) {
        const storageRef = ref(storage, `profilePictures/${user.uid}`);
        await uploadBytes(storageRef, photoFile);
        photoURL = await getDownloadURL(storageRef);
      }

      // Save profile data in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName,
        username,
        interests,
        skills,
        languages,
        photoURL,
        friends: [],
        incomingRequests: [],
        outgoingRequests: [],
      });

      // Update Firebase auth profile
      await updateProfile(user, {
        displayName,
        photoURL,
      });

      // Redirect to dashboard after success
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
      setError(error.message || 'Error saving profile.');
    }

    setLoading(false);
  };

  // Styles for checkboxes layout
  const checkboxStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginBottom: '15px',
  };

  const checkboxItemStyle = {
    flex: '1 1 45%',
    display: 'flex',
    alignItems: 'center',
  };

  // Render the Profile Setup form
  return (
    <div style={{ display: 'flex', justifyContent: 'space-around', padding: '20px', flexWrap: 'wrap' }}>
      {/* Form Container */}
      <div style={{ width: '100%', maxWidth: '500px', marginBottom: '20px' }}>
        <h2>Complete Your Profile</h2>

        {/* Form for profile setup */}
        <form onSubmit={handleSaveProfile}>

          {/* Profile Picture Upload */}
          <label><strong>Profile Picture (optional):</strong></label>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            style={{ marginBottom: '15px' }}
          />

          {/* Display Name Input */}
          <label><strong>Display Name:</strong></label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your display name"
            style={{ width: '100%', padding: '10px', marginBottom: '15px' }}
          />

          {/* Username Input */}
          <label><strong>Username (must be unique):</strong></label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter a username"
            style={{ width: '100%', padding: '10px', marginBottom: '15px' }}
          />

          {/* Interests Selection */}
          <label><strong>Interests:</strong></label>
          <div style={checkboxStyle}>
            {['Web Development', 'Data Science', 'Mobile Apps', 'AI & Machine Learning', 'Game Development'].map((interest) => (
              <div key={interest} style={checkboxItemStyle}>
                <input
                  type="checkbox"
                  value={interest}
                  checked={interests.includes(interest)}
                  onChange={handleCheckboxChange(setInterests, interests)}
                />
                <span style={{ marginLeft: '5px' }}>{interest}</span>
              </div>
            ))}
          </div>

          {/* Skills Selection */}
          <label><strong>Skills:</strong></label>
          <div style={checkboxStyle}>
            {['Frontend Development', 'Backend Development', 'Database Management', 'Cloud Computing', 'Cybersecurity'].map((skill) => (
              <div key={skill} style={checkboxItemStyle}>
                <input
                  type="checkbox"
                  value={skill}
                  checked={skills.includes(skill)}
                  onChange={handleCheckboxChange(setSkills, skills)}
                />
                <span style={{ marginLeft: '5px' }}>{skill}</span>
              </div>
            ))}
          </div>

          {/* Programming Languages Selection */}
          <label><strong>Programming Languages:</strong></label>
          <div style={checkboxStyle}>
            {['Python', 'Java', 'JavaScript', 'C++', 'Ruby', 'Go'].map((language) => (
              <div key={language} style={checkboxItemStyle}>
                <input
                  type="checkbox"
                  value={language}
                  checked={languages.includes(language)}
                  onChange={handleCheckboxChange(setLanguages, languages)}
                />
                <span style={{ marginLeft: '5px' }}>{language}</span>
              </div>
            ))}
          </div>

          {/* Error Message */}
          {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: '20px', padding: '10px 20px' }}
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup; // Export the ProfileSetup component
