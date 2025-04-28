import React, { useEffect, useState } from 'react'; // Import React and hooks
import { useParams, useNavigate } from 'react-router-dom'; // Import hooks for routing
import { db } from '../../services/firebase'; // Firebase Firestore database instance
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore'; // Firestore document functions
import { getAuth } from 'firebase/auth'; // Firebase authentication service

// ForumThreadView component
const ForumThreadView = () => {
  const { id } = useParams(); // Get thread ID from URL params
  const navigate = useNavigate(); // Hook to programmatically navigate
  const auth = getAuth(); // Get Firebase auth instance

  // States
  const [thread, setThread] = useState(null); // Current thread data
  const [currentUser, setCurrentUser] = useState(null); // Currently logged-in user
  const [replyText, setReplyText] = useState(''); // Reply input field value

  // Fetch thread data and user authentication on component mount
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) setCurrentUser(user); // Set the user if logged in
    });

    const fetchThread = async () => {
      const threadDoc = await getDoc(doc(db, 'forumThreads', id)); // Fetch thread document
      if (threadDoc.exists()) {
        setThread(threadDoc.data()); // Set thread state
      }
    };

    fetchThread(); // Fetch thread on mount
    return () => unsubscribe(); // Cleanup auth listener on unmount
  }, [id, auth]);

  // Handle like action
  const handleLike = async () => {
    if (!currentUser || !thread) return;
    const threadRef = doc(db, 'forumThreads', id);

    // Prevent duplicate likes
    if (thread.likedBy?.includes(currentUser.uid)) return;

    // Update likes and remove previous dislike if necessary
    const updatedLikedBy = [...(thread.likedBy || []), currentUser.uid];
    const updatedLikes = (thread.likes || 0) + 1;
    const updatedDislikedBy = (thread.dislikedBy || []).filter(uid => uid !== currentUser.uid);
    const updatedDislikes = thread.dislikedBy?.includes(currentUser.uid) ? (thread.dislikes || 0) - 1 : (thread.dislikes || 0);

    await updateDoc(threadRef, { likes: updatedLikes, likedBy: updatedLikedBy, dislikes: updatedDislikes, dislikedBy: updatedDislikedBy });

    const updatedThread = await getDoc(threadRef); // Refresh thread data
    setThread(updatedThread.data());
  };

  // Handle dislike action
  const handleDislike = async () => {
    if (!currentUser || !thread) return;
    const threadRef = doc(db, 'forumThreads', id);

    // Prevent duplicate dislikes
    if (thread.dislikedBy?.includes(currentUser.uid)) return;

    // Update dislikes and remove previous like if necessary
    const updatedDislikedBy = [...(thread.dislikedBy || []), currentUser.uid];
    const updatedDislikes = (thread.dislikes || 0) + 1;
    const updatedLikedBy = (thread.likedBy || []).filter(uid => uid !== currentUser.uid);
    const updatedLikes = thread.likedBy?.includes(currentUser.uid) ? (thread.likes || 0) - 1 : (thread.likes || 0);

    await updateDoc(threadRef, { dislikes: updatedDislikes, dislikedBy: updatedDislikedBy, likes: updatedLikes, likedBy: updatedLikedBy });

    const updatedThread = await getDoc(threadRef); // Refresh thread data
    setThread(updatedThread.data());
  };

  // Handle posting a reply
  const handleReply = async () => {
    if (!currentUser || !replyText.trim()) return;
    const threadRef = doc(db, 'forumThreads', id);

    const newReply = {
      text: replyText,
      createdBy: currentUser.displayName || 'Anonymous',
      date: new Date().toISOString().slice(0, 10),
    };

    await updateDoc(threadRef, { replies: arrayUnion(newReply) }); // Add reply to the replies array
    setReplyText(''); // Clear input
    const updatedThread = await getDoc(threadRef); // Refresh thread data
    setThread(updatedThread.data());
  };

  // Show loading message if thread hasn't loaded yet
  if (!thread) {
    return <p>Loading thread...</p>;
  }

  // Render the thread view
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: '20px',
          padding: '8px 16px',
          backgroundColor: '#ddd',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        ← Back
      </button>

      {/* Thread Details */}
      <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h2>{thread.title}</h2>
        <p style={{ marginBottom: '20px', color: '#666' }}>
          <strong>Posted by:</strong> {thread.createdBy} &nbsp; | &nbsp;
          <strong>Date:</strong> {thread.date}
        </p>

        <p style={{ marginTop: '20px', fontSize: '16px', lineHeight: '1.6' }}>
          {thread.description}
        </p>

        {/* Like & Dislike Buttons */}
        <div style={{ marginTop: '30px' }}>
          <button
            onClick={handleLike}
            style={{ marginRight: '10px', padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}
          >
            👍 Like ({thread.likes || 0})
          </button>
          <button
            onClick={handleDislike}
            style={{ padding: '8px 16px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px' }}
          >
            👎 Dislike ({thread.dislikes || 0})
          </button>
        </div>

        {/* Reply Input (only visible if user logged in) */}
        {currentUser && (
          <div style={{ marginTop: '40px', marginBottom: '20px' }}>
            <h3>Write a Reply:</h3>
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply here..."
              style={{ width: '70%', padding: '10px', marginRight: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
            />
            <button
              onClick={handleReply}
              style={{ padding: '10px 20px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
              Send
            </button>
          </div>
        )}

        {/* Replies Section */}
        <h3 style={{ marginTop: '20px' }}>Replies:</h3>
        <ul style={{ listStyleType: 'none', padding: '0' }}>
          {thread.replies?.length ? (
            thread.replies.map((reply, idx) => (
              <li key={idx} style={{ marginBottom: '15px', background: '#f9f9f9', padding: '10px', borderRadius: '5px' }}>
                <strong>{reply.createdBy}</strong> ({reply.date}):<br />
                {reply.text}
              </li>
            ))
          ) : (
            <p>No replies yet.</p>
          )}
        </ul>
      </div>
    </div>
  );
};

export default ForumThreadView; // Export the ForumThreadView component
