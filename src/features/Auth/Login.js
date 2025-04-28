import React, { useState } from 'react'; // Import React and useState hook
import { signInWithEmailAndPassword, sendPasswordResetEmail, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'; // Firebase auth functions
import { auth, db } from '../../services/firebase'; // Firebase services
import { useNavigate, Link } from 'react-router-dom'; // React Router for navigation and linking
import { setDoc, doc, getDoc } from 'firebase/firestore'; // Firestore functions for user data management
import './Login.css'; // Import CSS for styling


// Login component
const Login = () => {
  // States for form inputs, errors, loading status, and password visibility
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate(); // Hook to programmatically navigate

  // Ensure user document exists in Firestore after login
  const handleUserLogin = async (user) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      // If user doesn't exist, create a new document
      await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName || "Anonymous",
        email: user.email,
      }, { merge: true });
    }
  };

  // Handle login with email and password
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await handleUserLogin(userCredential.user);
      navigate('/dashboard'); // Navigate to dashboard after successful login
    } catch (err) {
      setError(err.message); // Show error message if login fails
    }
    setLoading(false);
  };

  // Handle login with Google OAuth
  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await handleUserLogin(result.user);
      navigate('/dashboard'); // Navigate to dashboard after successful login
    } catch (err) {
      setError(err.message); // Show error message if Google login fails
    }
    setLoading(false);
  };

  // Handle password reset email
  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email to reset your password.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent. Check your inbox.');
      setError('');
    } catch (err) {
      setError(err.message); // Show error if sending reset email fails
    }
  };

  // Render the login form
  return (
    <div className="auth-container">
      <h2>Login</h2>

      {/* Display error or success messages */}
      {error && <p className="error-text">{error}</p>}
      {message && <p className="success-text">{message}</p>}

      {/* Login form */}
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {/* Password input with show/hide toggle */}
        <div className="password-container">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        {/* Submit button */}
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {/* Login with Google button */}
      <button onClick={handleGoogleLogin} disabled={loading}>
        Login with Google
      </button>

      {/* Forgot password link */}
      <p>
        <a href="#" onClick={handleForgotPassword}>Forgot password?</a>
      </p>

      {/* Legal text and navigation links */}
      <p>
        By continuing, you agree to our <Link to="/user-agreement">User Agreement</Link> and acknowledge that you understand the <Link to="/privacy-policy">Privacy Policy</Link>.
      </p>

      {/* Link to signup page */}
      <p>
        Don't have an account? <Link to="/signup">Sign up here</Link>
      </p>
    </div>
  );
};

export default Login; // Export the Login component
