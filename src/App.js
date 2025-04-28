import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

// Pages
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import SearchResults from './pages/SearchResults';

// Auth
import Login from './features/Auth/Login';
import SignUp from './features/Auth/SignUp';

// Profile
import Profile from './features/Profile/Profile';
import ProfileSetup from './features/Profile/ProfileSetup';
import FriendsPage from './features/Profile/FriendsPage';
import ProfileView from './features/Profile/ProfileView';

// Projects
import CreateProject from './features/Project/createproject';
import ProjectManagement from './features/Project/ProjectManagement';
import ProjectDetails from './features/Project/projectdetails';

// Forum
import ForumThreadView from './features/Forum/ForumThreadView';
import Forum from './features/Forum/forum';

// Messaging
import Messaging from './features/Messaging//Messaging';

// Components
import Navbar from './components/Navbar/Navbar';
import Matchmaking from './components/Matchmaking/Matchmaking';

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const location = useLocation();

  const hideNavbarPaths = ['/', '/signup', '/login', '/profile-setup'];

  const shouldHideNavbar = hideNavbarPaths.includes(location.pathname);

  return (
    <div>
      {!shouldHideNavbar && <Navbar />}

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile-setup" element={<ProfileSetup />} />

        {/* Protected/Logged-in routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:id" element={<ProfileView />} />
        <Route path="/friends" element={<FriendsPage />} /> {/* ✅ Added /friends */}

        <Route path="/createproject" element={<CreateProject />} />
        <Route path="/search" element={<Search />} />
        <Route path="/searchresults" element={<SearchResults />} />
        <Route path="/project/:id" element={<ProjectDetails />} />

        <Route path="/forum" element={<Forum />} />
        <Route path="/forumthread/:id" element={<ForumThreadView />} />

        <Route path="/messages" element={<Messaging />} />
        <Route path="/projects/:projectId" element={<ProjectManagement />} />
        <Route path="/matchmaking" element={<Matchmaking />} />

      </Routes>
    </div>
  );
}

export default App;
