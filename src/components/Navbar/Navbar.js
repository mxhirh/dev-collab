import React, { useState } from 'react'; // Import React and the useState hook
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation between routes

// Navbar component
const Navbar = () => {
  const navigate = useNavigate(); // Hook for navigating programmatically
  const [searchTerm, setSearchTerm] = useState(''); // State to track the search input value

  // Function to handle search when 'Enter' key is pressed
  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchTerm.trim()) {
        // Navigate to the search results page with the search query as a URL parameter
        navigate(`/searchresults?q=${encodeURIComponent(searchTerm.trim())}`);
        setSearchTerm(''); // Clear the search field after navigating
      }
    }
  };

  // Render the navigation bar
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 20px',
      background: '#333',
      color: 'white'
    }}>

      {/* Logo/Brand name that navigates to the dashboard */}
      <div
        style={{ fontSize: '20px', fontWeight: 'bold', cursor: 'pointer' }}
        onClick={() => navigate('/dashboard')}
      >
        DevConnect
      </div>

      {/* Search input field */}
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)} // Update searchTerm on input change
        onKeyDown={handleSearch} // Listen for 'Enter' key to trigger search
        style={{
          width: '300px',
          padding: '8px',
          borderRadius: '5px',
          border: '1px solid #ccc',
          fontSize: '16px'
        }}
      />

      {/* Navigation buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <button onClick={() => navigate('/friends')} style={buttonStyle}>Friends</button>
        <button onClick={() => navigate('/forum')} style={buttonStyle}>Forum</button>
        <button onClick={() => navigate('/search')} style={buttonStyle}>Discover</button>
        <button onClick={() => navigate('/createproject')} style={buttonStyle}>+</button>
        <button onClick={() => navigate('/messages')} style={buttonStyle}>💬</button>
        <button onClick={() => navigate('/profile')} style={buttonStyle}>👤</button>
      </div>
    </div>
  );
};

// Reusable button styling
const buttonStyle = {
  padding: '8px 12px',
  fontSize: '18px',
  border: 'none',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  color: 'white',
};

export default Navbar; // Export the Navbar component
