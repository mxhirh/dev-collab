import React from 'react'; // Import React
import { useNavigate } from 'react-router-dom'; // Import useNavigate for routing

// LandingPage Component
const LandingPage = () => {
  const navigate = useNavigate(); // Hook for navigation

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      
      {/* Top Navigation Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 20px',
        background: '#333',
        color: 'white',
      }}>
        
        {/* Site Name */}
        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
          DevConnect
        </div>

        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search..."
          style={{
            width: '300px',
            padding: '8px',
            borderRadius: '5px',
            border: '1px solid #ccc',
            fontSize: '16px',
          }}
        />

        {/* Login and Register Buttons */}
        <div style={{
          display: 'flex',
          gap: '15px',
        }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '8px 16px',
              fontSize: '16px',
              backgroundColor: 'transparent',
              border: '1px solid white',
              color: 'white',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Login
          </button>
          <button
            onClick={() => navigate('/signup')}
            style={{
              padding: '8px 16px',
              fontSize: '16px',
              backgroundColor: '#007bff',
              border: 'none',
              color: 'white',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Register
          </button>
        </div>
      </div>

      {/* Main Landing Page Content */}
      <div style={{
        flex: 1,
        padding: '50px 20px',
        textAlign: 'center',
        backgroundColor: '#f9f9f9',
      }}>
        
        {/* Hero Section */}
        <div style={{ marginBottom: '50px' }}>
          <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>
            Welcome to <span style={{ color: '#007bff' }}>DevConnect</span>
          </h1>
          <p style={{ fontSize: '20px', color: '#555' }}>
            Connect with like-minded developers. Collaborate on projects. Build the future.
          </p>
          {/* Call to Action Button */}
          <button style={{
            padding: '15px 30px',
            marginTop: '20px',
            fontSize: '18px',
            backgroundColor: '#007bff',
            border: 'none',
            color: 'white',
            borderRadius: '5px',
            cursor: 'pointer',
          }}>
            Get Started
          </button>
        </div>

        {/* Features Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: '20px',
          marginTop: '30px',
        }}>
          {/* Feature Card 1 */}
          <div style={featureCardStyle}>
            <h2 style={featureTitleStyle}>Find Collaborators</h2>
            <p style={featureTextStyle}>
              Discover developers who share your vision and collaborate on exciting projects.
            </p>
          </div>

          {/* Feature Card 2 */}
          <div style={featureCardStyle}>
            <h2 style={featureTitleStyle}>Create Projects</h2>
            <p style={featureTextStyle}>
              Start new projects and invite others to collaborate with you.
            </p>
          </div>

          {/* Feature Card 3 */}
          <div style={featureCardStyle}>
            <h2 style={featureTitleStyle}>Real-Time Chat</h2>
            <p style={featureTextStyle}>
              Communicate seamlessly with your team using real-time messaging.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '20px',
        backgroundColor: '#333',
        color: 'white',
        textAlign: 'center',
      }}>
        © {new Date().getFullYear()} DevConnect. All rights reserved.
      </div>
    </div>
  );
};

// --- Reusable Style Objects ---
const featureCardStyle = {
  width: '300px',
  padding: '20px',
  backgroundColor: 'white',
  borderRadius: '10px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

const featureTitleStyle = {
  fontSize: '24px',
  marginBottom: '10px',
};

const featureTextStyle = {
  fontSize: '16px',
  color: '#666',
};

export default LandingPage; // Export the component
