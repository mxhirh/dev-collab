// src/Dashboard.js
import React, { useState, useEffect } from 'react'; // Import React and hooks
import { useNavigate } from 'react-router-dom'; // React Router hook
import { db } from '../services/firebase'; // Firebase Firestore instance
import { collection, query, where, getDocs } from 'firebase/firestore'; // Firestore functions
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Firebase Auth
import Calendar from 'react-calendar'; // Calendar component
import 'react-calendar/dist/Calendar.css'; // Calendar CSS

// Dashboard Component
const Dashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]); // User's projects
  const [tasks, setTasks] = useState([]); // Tasks across all projects
  const [calendarDate, setCalendarDate] = useState(new Date()); // Selected date on calendar
  const firebaseAuth = getAuth(); // Firebase Auth instance

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        fetchUserProjectsAndTasks(user.uid); // Fetch data if logged in
      } else {
        navigate('/signup'); // Redirect if not logged in
      }
    });
    return () => unsubscribe(); // Clean up subscription
  }, [navigate, firebaseAuth]);

  // Fetch user's projects and their tasks
  const fetchUserProjectsAndTasks = async (userId) => {
    const projectsRef = collection(db, 'projects');
    const q = query(projectsRef, where('members', 'array-contains', userId));
    const snapshot = await getDocs(q);
    const projectList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setProjects(projectList);

    const allTasks = [];
    for (const project of projectList) {
      const tasksSnapshot = await getDocs(collection(db, 'projects', project.id, 'tasks'));
      tasksSnapshot.forEach(taskDoc => {
        allTasks.push({ id: taskDoc.id, ...taskDoc.data(), projectId: project.id });
      });
    }
    setTasks(allTasks);
  };

  // --- UI Rendering ---
  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
      
      {/* Sidebar Menu */}
      <div style={sidebarStyle}>
        <h3 style={{ marginBottom: '20px' }}>Menu</h3>
        <button style={sidebarButton} onClick={() => navigate('/createproject')}>
          ➕ Create Project
        </button>
        <button style={sidebarButton} onClick={() => navigate('/matchmaking')}>
          👫 Matchmaking
        </button>
      </div>

      {/* Main Content */}
      <div style={mainContentStyle}>

        {/* Calendar Section */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ marginBottom: '10px' }}>Upcoming Deadlines 🗓️</h2>

          {/* Calendar showing deadlines */}
          <Calendar
            onChange={setCalendarDate}
            value={calendarDate}
            tileContent={({ date, view }) => {
              if (view === 'month') {
                const hasDeadline = tasks.some(task =>
                  task.deadline && new Date(task.deadline).toDateString() === date.toDateString()
                );
                return hasDeadline ? <div style={{ color: 'red', fontSize: '18px' }}>•</div> : null;
              }
            }}
          />

          {/* Tasks due on selected day */}
          <div style={{ marginTop: '20px' }}>
            {tasks.filter(task =>
              task.deadline && new Date(task.deadline).toDateString() === calendarDate.toDateString()
            ).map(task => (
              <div key={task.id} style={{ marginTop: '10px', padding: '10px', backgroundColor: '#1f1f1f', borderRadius: '8px' }}>
                <strong>{task.title}</strong>
                <p style={{ color: '#bbb', fontSize: '14px' }}>
                  Due: {task.deadline}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Projects Section */}
        <h2 style={{ marginBottom: '20px' }}>Your Projects</h2>

        {/* Project Grid or Empty State */}
        {projects.length > 0 ? (
          <div style={projectGrid}>
            {projects.map((project) => (
              <div
                key={project.id}
                style={projectCard}
                onClick={() => navigate(`/projects/${project.id}`)}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2a2a2a'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1f1f1f'}
              >
                <h3 style={{ marginBottom: '10px' }}>{project.title}</h3>
                <p style={{ color: '#bbb', fontSize: '14px' }}>
                  {project.description?.length > 120
                    ? project.description.slice(0, 120) + '...'
                    : project.description || 'No description yet.'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div style={emptyState}>
            <h3>No projects yet!</h3>
            <p style={{ color: '#aaa' }}>Create one to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Styling ---
const sidebarStyle = {
  width: '260px',
  backgroundColor: '#1f1f1f',
  padding: '20px',
  borderRight: '1px solid #333',
  color: 'white',
  boxSizing: 'border-box',
};

const sidebarButton = {
  width: '100%',
  padding: '10px',
  marginBottom: '12px',
  backgroundColor: '#333',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '16px',
  transition: 'background-color 0.2s',
};

const mainContentStyle = {
  flexGrow: 1,
  backgroundColor: '#121212',
  padding: '20px',
  color: 'white',
  overflowY: 'auto',
};

const projectGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '20px',
};

const projectCard = {
  backgroundColor: '#1f1f1f',
  border: '1px solid #333',
  borderRadius: '10px',
  padding: '20px',
  cursor: 'pointer',
  transition: 'background-color 0.2s, transform 0.2s',
};

const emptyState = {
  marginTop: '50px',
  textAlign: 'center',
};

export default Dashboard;
