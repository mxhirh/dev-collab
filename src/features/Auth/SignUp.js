import React, { useState } from 'react'; // Import React and useState hook
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'; // Import Firebase authentication methods
import { auth } from '../../services/firebase'; // Import the configured Firebase auth instance
import { useNavigate, Link } from 'react-router-dom'; // Import navigation and link components
import './SignUp.css'; // Import CSS file

// SignUp component
const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Handle email/password signup
  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate('/profile-setup');
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle Google signup
  const handleGoogleSignUp = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/profile-setup');
    } catch (err) {
      setError(err.message);
    }
  };

  // Render
  return (
    <div className="auth-container">
      <h2>Sign Up</h2>

      {/* Error Message */}
      {error && <p className="error-text">{error}</p>}

      {/* Sign Up Form */}
      <form onSubmit={handleSignUp}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">
          Sign Up
        </button>
      </form>

      {/* Google Signup */}
      <button onClick={handleGoogleSignUp}>
        Sign Up with Google
      </button>

      {/* Legal text */}
      <p>
        By continuing, you agree to our <Link to="/user-agreement">User Agreement</Link> and acknowledge the <Link to="/privacy-policy">Privacy Policy</Link>.
      </p>

      {/* Redirect to Login */}
      <p>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
};

export default SignUp;
