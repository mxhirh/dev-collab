import React, { useEffect, useState } from 'react'; // React and hooks
import { useLocation, useNavigate } from 'react-router-dom'; // For navigation and getting URL parameters
import { db } from '../services/firebase'; // Firebase database
import { collection, getDocs } from 'firebase/firestore'; // Firestore functions

// SearchResults Component
const SearchResults = () => {
  const location = useLocation(); // Access URL parameters
  const navigate = useNavigate(); // Navigate to different pages
  const queryParams = new URLSearchParams(location.search); // Parse query string
  const searchTerm = queryParams.get('q')?.toLowerCase() || ''; // Extract search term from URL

  // State variables
  const [userResults, setUserResults] = useState([]);
  const [projectResults, setProjectResults] = useState([]);
  const [forumResults, setForumResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch results when component mounts or searchTerm changes
  useEffect(() => {
    if (!searchTerm) return; // No search term, no fetch

    const fetchResults = async () => {
      setLoading(true);
      try {
        // Fetch and filter users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const users = usersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(user => (user.displayName || '').toLowerCase().includes(searchTerm));
        setUserResults(users);

        // Fetch and filter projects
        const projectsSnapshot = await getDocs(collection(db, 'projects'));
        const projects = projectsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(project => (project.title || '').toLowerCase().includes(searchTerm));
        setProjectResults(projects);

        // Fetch and filter forum posts
        const forumSnapshot = await getDocs(collection(db, 'forumThreads'));
        const forums = forumSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(post => (post.title || '').toLowerCase().includes(searchTerm) || (post.description || '').toLowerCase().includes(searchTerm));
        setForumResults(forums);

      } catch (error) {
        console.error('Error fetching search results:', error);
      }
      setLoading(false);
    };

    fetchResults();
  }, [searchTerm]);

  // Loading spinner 
  if (loading) {
    return <p>Loading results...</p>;
  }

  // Render Search Results
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>Search Results for: <em>{searchTerm}</em></h2>

      {/* Users Section */}
      <section style={{ marginBottom: '40px' }}>
        <h3>👤 Users</h3>
        {userResults.length > 0 ? (
          <div style={gridStyle}>
            {userResults.map(user => (
              <div
                key={user.id}
                style={cardStyle}
                onClick={() => navigate(`/profile/${user.id}`)}
              >
                <img
                  src={user.photoURL || '/default-avatar.png'}
                  alt="Profile"
                  style={profilePicStyle}
                />
                <h4>{user.displayName || 'Unnamed User'}</h4>
              </div>
            ))}
          </div>
        ) : <p>No users found.</p>}
      </section>

      {/* Projects Section */}
      <section style={{ marginBottom: '40px' }}>
        <h3>🛠️ Projects</h3>
        {projectResults.length > 0 ? (
          <div style={gridStyle}>
            {projectResults.map(project => (
              <div
                key={project.id}
                style={cardStyle}
                onClick={() => navigate(`/project/${project.id}`)}
              >
                <h4>{project.title}</h4>
              </div>
            ))}
          </div>
        ) : <p>No projects found.</p>}
      </section>

      {/* Forum Posts Section */}
      <section>
        <h3>💬 Forum Posts</h3>
        {forumResults.length > 0 ? (
          <div style={gridStyle}>
            {forumResults.map(post => (
              <div
                key={post.id}
                style={cardStyle}
                onClick={() => navigate(`/forumthread/${post.id}`)}
              >
                <h4>{post.title}</h4>
              </div>
            ))}
          </div>
        ) : <p>No forum posts found.</p>}
      </section>
    </div>
  );
};

// --- Styles ---
const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '20px',
};

const cardStyle = {
  background: '#f9f9f9',
  padding: '20px',
  borderRadius: '8px',
  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
  cursor: 'pointer',
  textAlign: 'center',
};

const profilePicStyle = {
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  marginBottom: '10px',
};

export default SearchResults;
