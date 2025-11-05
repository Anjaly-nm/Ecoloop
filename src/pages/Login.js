import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import { auth, provider } from "../firebase";
import { signInWithPopup, setPersistence, browserLocalPersistence } from "firebase/auth";

const Login = () => {
  // Use a more generic name for clarity, e.g., loginIdentifier
  const [loginIdentifier, setLoginIdentifier] = useState(""); 
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  // 🔹 Email/Password/Username Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      // ⚡️ CRITICAL FIX: Sending loginIdentifier as 'loginId' ⚡️
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/user/login`,
        { 
          loginId: loginIdentifier, // <-- Mapped to loginId to match the backend
          password 
        } 
      );

      if (response.data && response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        const role = response.data.user?.role?.toLowerCase();
        if (role === "admin") {
          navigate("/Adminpage");
        } else if (role === "collector") {
          navigate("/collector"); 
        } else {
          navigate("/Dashboard"); 
        }
      } else {
        setErrorMsg("Login failed: Invalid response from server");
      }
    } catch (error) {
      console.error("Login error:", error.response || error);
      // Backend now sends 'Invalid credentials' or 'This account was created via social login...'
      setErrorMsg(error.response?.data?.message || "Login failed");
    }
  };

  // 🔹 Google Login (No changes needed here)
  const handleGoogleLogin = async () => {
    // ... (rest of the handleGoogleLogin function remains the same)
    try {
      setErrorMsg("");
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/user/google-login`,
        { idToken }
      );
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      const role = response.data.user?.role?.toLowerCase();
      if (role === "admin") {
        navigate("/Adminpage");
      } else if (role === "collector") {
        navigate("/collector");
      } else {
        navigate("/Dashboard");
      }
    } catch (error) {
      console.error("Google login error:", error);
      let errorMessage = "Google login failed";
      if (error.code === 'auth/popup-blocked') {
        errorMessage = "Popup blocked by browser. Please allow popups for this site.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Google sign-in popup was closed before completing sign-in.";
      } else if (error.response) {
        errorMessage = `Server error: ${error.response.status} - ${error.response.data?.message || error.message}`;
      } else {
        errorMessage = error.message || "Unknown error occurred";
      }
      setErrorMsg(errorMessage);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h2>Get Started</h2>
        <form onSubmit={handleLogin}>
          <label>Username or Email</label>
          <input
            type="text" 
            value={loginIdentifier}
            onChange={(e) => setLoginIdentifier(e.target.value)} // <-- Updated setter
            required
            placeholder="username or you@gmail.com"
          />
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
          {errorMsg && <p className="error">{errorMsg}</p>}
          <button type="submit">Login</button>
        </form>
        <div className="divider">or</div>
        <button className="google-btn" onClick={handleGoogleLogin}>
          <img
            src="https://developers.google.com/identity/images/g-logo.png"
            alt="Google"
          />
          Continue with Google
        </button>
        <p className="register-link">
          Don't have an account? <a href="/register">Register</a>
        </p>
      </div>
    </div>
  );
};

export default Login;