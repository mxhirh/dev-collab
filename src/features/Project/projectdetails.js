import React, { useEffect, useState } from 'react'; // Import React and hooks
import { db, auth } from '../../services/firebase'; // Import Firebase database and auth
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore'; // Firestore functions
import { useParams, useNavigate } from 'react-router-dom'; // Router hooks

// ProjectDetails Component
const ProjectDetails = () => {
  const { id } = useParams(); // Get project ID from URL
  const navigate = useNavigate(); // Hook to navigate programmatically

  // State variables
  const [project, setProject] = useState(null); // Project data
  const [ownerProfile, setOwnerProfile] = useState(null); // Project owner's profile
  const [memberProfiles, setMemberProfiles] = useState([]); // Member profiles
  const [loading, setLoading] = useState(true); // Loading state
  const [message, setMessage] = useState(''); // Success/error messages
  const [isMember, setIsMember] = useState(false); // If current user is a member
  const [hasRequested, setHasRequested] = useState(false); // If user already requested to join

  // Fetch project details on mount
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const docRef = doc(db, 'projects', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const projectData = { id: docSnap.id, ...docSnap.data() };
          setProject(projectData);

          // Check if the logged-in user is a member or has requested
          if (auth.currentUser) {
            if (projectData.members?.includes(auth.currentUser.uid)) {
              setIsMember(true);
            }
            if (projectData.joinRequests?.includes(auth.currentUser.uid)) {
              setHasRequested(true);
            }
          }

          // Fetch project owner's profile
          if (projectData.creator) {
            const ownerDoc = await getDoc(doc(db, 'users', projectData.creator));
            if (ownerDoc.exists()) setOwnerProfile(ownerDoc.data());
          }

          // Fetch all project member profiles
          if (projectData.members?.length) {
            const profiles = await Promise.all(
              projectData.members.map(async (memberId) => {
                const memberDoc = await getDoc(doc(db, 'users', memberId));
                return memberDoc.exists() ? { id: memberId, ...memberDoc.data() } : null;
              })
            );
            setMemberProfiles(profiles.filter(Boolean)); // Remove nulls
          }
        }
      } catch (error) {
        console.error('Error fetching project details:', error);
      } finally {
        setLoading(false); // Done loading
      }
    };

    fetchProject();
  }, [id]); // Rerun if project ID changes

  // Handle "Request to Join" action
  const handleJoinProject = async () => {
    if (!auth.currentUser) {
      setMessage('You must be logged in to request to join a project.');
      return;
    }

    const confirmed = window.confirm('Are you sure you want to request to join this project?');
    if (!confirmed) return;

    try {
      const userId = auth.currentUser.uid;
      const projectRef = doc(db, 'projects', id);

      await updateDoc(projectRef, {
        joinRequests: arrayUnion(userId), // Add user to joinRequests
      });

      setMessage('Join request sent! Please wait for the owner to accept.');
      setHasRequested(true);
    } catch (error) {
      setMessage('Error requesting to join project: ' + error.message);
    }
  };

  // Render different states
  if (loading) return <p>Loading project...</p>;
  if (!project) return <p>Project not found.</p>;

  // Calculate team spots left
  const spotsLeft = project.teamSize ? project.teamSize - (project.members?.length || 0) : null;
  const isFull = project.teamSize && (project.members?.length || 0) >= project.teamSize;

  // Main UI
  return (
    <div style={{ padding: '20px' }}>
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        style={{ marginBottom: '20px', padding: '8px 16px', backgroundColor: '#ddd', border: 'none', cursor: 'pointer' }}
      >
        ← Back
      </button>

      {/* Project Information Card */}
      <div style={{
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2>{project.title}</h2>
        <p>{project.description}</p>

        {/* Project Tags */}
        {project.tags && (
          <p><strong>Tags:</strong> {project.tags.join(', ')}</p>
        )}

        {/* Team Information */}
        <p><strong>Team Size:</strong> {project.members?.length || 0} / {project.teamSize || 'N/A'}</p>
        {spotsLeft !== null && (
          <p><strong>Spots Left:</strong> {spotsLeft > 0 ? spotsLeft : 'No spots left'}</p>
        )}

        {/* Project Owner Info */}
        {ownerProfile && (
          <div style={{ marginTop: '20px' }}>
            <strong>Project Owner: </strong>
            <span
              style={{ color: 'blue', cursor: 'pointer' }}
              onClick={() => navigate(`/profile/${project.creator}`)}
            >
              {ownerProfile.displayName || 'Owner'}
            </span>
            <p>Skills: {ownerProfile.skills?.join(', ') || 'N/A'}</p>
          </div>
        )}

        {/* Member List */}
        <div style={{ marginTop: '20px' }}>
          <h3>Team Members</h3>
          {memberProfiles.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
              {memberProfiles.map((member) => (
                <div
                  key={member.id}
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                  onClick={() => navigate(`/profile/${member.id}`)}
                >
                  <img
                    src={member.photoURL || '/default-avatar.png'}
                    alt={member.displayName}
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                  <p style={{ fontSize: '12px', marginTop: '5px' }}>{member.displayName || 'User'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No members yet.</p>
          )}
        </div>

        {/* Join Project Button or Status */}
        {!isMember && !isFull ? (
          <button
            onClick={handleJoinProject}
            disabled={hasRequested}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: hasRequested ? '#888' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: hasRequested ? 'not-allowed' : 'pointer',
            }}
          >
            {hasRequested ? 'Request Sent' : 'Request to Join Project'}
          </button>
        ) : isFull ? (
          <p style={{ marginTop: '20px', color: 'red' }}>
            <strong>This project is full.</strong>
          </p>
        ) : (
          <p style={{ marginTop: '20px', color: 'green' }}>
            <strong>You are already a member.</strong>
          </p>
        )}

        {/* Success/Error Message */}
        {message && (
          <p style={{ marginTop: '20px', color: 'green' }}>{message}</p>
        )}
      </div>
    </div>
  );
};

export default ProjectDetails; // Export the ProjectDetails component
