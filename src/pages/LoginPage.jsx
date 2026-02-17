import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/authService";
import { saveToken, saveRole } from "../auth/tokenService";
import "./LoginPage.css";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 4000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const loginData = { email, password };
      const response = await login(loginData);

      console.log(response);

      if (response.status === 200) {
        saveToken(response.token);
        saveRole(response.role);
        showMessage(response.message);
        navigate("/dashboard");
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Error Sign in a user";
      showMessage(msg);
      console.error("Sign in error:", error);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-left">
        <div className="brand-box">
          <div className="brand-pill">BioGenHoldings</div>
          <p className="brand-text">
            Smart inventory control powered by real-time analytics
          </p>
        </div>

        <div className="brand-footer">
          © BioGenHolding {new Date().getFullYear()}
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form-container">
          <h2 className="auth-title">
            Welcome Back <span>✨</span>
          </h2>
          <p className="auth-subtitle">
            Log into manage your inventory efficiently
          </p>

          {message && <p className="message">{message}</p>}

          <form onSubmit={handleLogin} className="auth-form">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="auth-options">
              <label className="remember">
                <input type="checkbox" />
                Remember for 30 days
              </label>
              <span className="forgot">Forgot password</span>
            </div>

            <button type="submit" className="auth-btn">
              Login
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account?{" "}
            <span onClick={() => navigate("/register")}>Register</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
