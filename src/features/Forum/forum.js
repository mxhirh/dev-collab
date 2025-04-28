import React, { useState, useEffect } from 'react'; // Import React and hooks
import { useNavigate } from 'react-router-dom'; // Hook for navigation
import { db } from '../../services/firebase'; // Firebase Firestore instance
import { collection, addDoc, getDocs, orderBy, query } from 'firebase/firestore'; // Firestore functions
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Firebase authentication functions

// Forum component
const Forum = () => {
  const navigate = useNavigate(); // Hook to navigate programmatically
  const auth = getAuth(); // Get the current Firebase auth instance

  // State variables
  const [threads, setThreads] = useState([]); // All forum threads
  const [newThread, setNewThread] = useState({ // New thread data
    title: '',
    description: '',
    topic: 'General',
    createdBy: '',
    date: new Date().toISOString().slice(0, 10),
    likes: 0,
    dislikes: 0,
    likedBy: [],
    dislikedBy: [],
    replies: [],
  });
  const [currentUser, setCurrentUser] = useState(null); // Current logged-in user
  const [searchTerm, setSearchTerm] = useState(''); // Search input
  const [filterTopic, setFilterTopic] = useState('All'); // Topic filter

  // List of available topics
  const topics = ['General', 'Web Development', 'AI & Machine Learning', 'Mobile Apps', 'Cybersecurity', 'Cloud Computing'];

  // Check for authenticated user and fetch threads
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user); // Set the current user
        fetchThreads(); // Fetch threads once user is authenticated
      }
    });
    return () => unsubscribe(); // Clean up listener on unmount
  }, [auth]);

  // Fetch all threads from Firestore ordered by most recent date
  const fetchThreads = async () => {
    const threadsRef = collection(db, 'forumThreads');
    const q = query(threadsRef, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    setThreads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); // Map snapshot data into state
  };

  // Handle input changes for creating a new thread
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewThread({ ...newThread, [name]: value });
  };

  // Handle adding a new thread to Firestore
  const handleAddThread = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const threadData = {
      ...newThread,
      createdBy: currentUser.displayName || 'Anonymous', // Default to 'Anonymous' if no display name
      date: new Date().toISOString().slice(0, 10),
    };

    await addDoc(collection(db, 'forumThreads'), threadData); // Save new thread to Firestore

    // Reset form after posting
    setNewThread({
      title: '',
      description: '',
      topic: 'General',
      createdBy: '',
      date: new Date().toISOString().slice(0, 10),
      likes: 0,
      dislikes: 0,
      likedBy: [],
      dislikedBy: [],
      replies: [],
    });

    fetchThreads(); // Refresh threads after posting
  };

  // Filter threads by selected topic and search term
  const filteredThreads = threads.filter(thread => {
    const matchesTopic = filterTopic === 'All' || thread.topic === filterTopic;
    const matchesSearch = thread.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTopic && matchesSearch;
  });

  // Render the forum page
  return (
    <div style={{ padding: '20px', flexGrow: 1, backgroundColor: '#f0f0f0' }}>
      <h1>Forum</h1>
      <p>Explore discussions. Start a conversation!</p>

      {/* Create a new thread form */}
      <div style={{ marginBottom: '30px', background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h2>Create a New Thread</h2>
        <form onSubmit={handleAddThread}>
          <input
            type="text"
            name="title"
            value={newThread.title}
            onChange={handleInputChange}
            placeholder="Thread title"
            required
            style={{ width: '100%', padding: '10px', margin: '10px 0', fontSize: '16px' }}
          />
          <textarea
            name="description"
            value={newThread.description}
            onChange={handleInputChange}
            placeholder="Thread description"
            required
            style={{ width: '100%', padding: '10px', marginBottom: '10px', fontSize: '16px' }}
          />
          <select
            name="topic"
            value={newThread.topic}
            onChange={handleInputChange}
            style={{ width: '100%', padding: '10px', marginBottom: '10px', fontSize: '16px' }}
          >
            {topics.map(topic => (
              <option key={topic} value={topic}>{topic}</option>
            ))}
          </select>
          <button
            type="submit"
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '5px',
            }}
          >
            Post Thread
          </button>
        </form>
      </div>

      {/* Search and filter controls */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search threads..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 2, padding: '10px', fontSize: '16px' }}
        />
        <select
          value={filterTopic}
          onChange={(e) => setFilterTopic(e.target.value)}
          style={{ flex: 1, padding: '10px', fontSize: '16px' }}
        >
          <option value="All">All Topics</option>
          {topics.map(topic => (
            <option key={topic} value={topic}>{topic}</option>
          ))}
        </select>
      </div>

      {/* Display list of filtered threads */}
      <div>
        <h2>Recent Threads</h2>
        <ul style={{ listStyleType: 'none', padding: '0' }}>
          {filteredThreads.map((thread) => (
            <li
              key={thread.id}
              style={{
                marginBottom: '15px',
                padding: '20px',
                backgroundColor: '#fff',
                borderRadius: '10px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                cursor: 'pointer',
              }}
              onClick={() => navigate(`/forumthread/${thread.id}`)} // Navigate to thread details page
            >
              <h3 style={{ marginBottom: '8px' }}>{thread.title}</h3>
              <div style={{ fontSize: '14px', color: '#555' }}>
                <span>🏷️ {thread.topic || 'General'}</span> &nbsp; | &nbsp;
                <span>👍 {thread.likes || 0} Likes</span> &nbsp; | &nbsp;
                <span>👎 {thread.dislikes || 0} Dislikes</span> &nbsp; | &nbsp;
                <span>💬 {thread.replies?.length || 0} Comments</span> &nbsp; | &nbsp;
                <span>📅 {thread.date}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Forum; // Export the Forum component
