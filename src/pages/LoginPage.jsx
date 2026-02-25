import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/authService";
import { saveTempPasswordFlag, saveForgotPasswordFlow } from "../auth/tokenService";
import { fetchCurrentUser } from "../components/common/Utils/userUtils/userUtils";
import { Eye, EyeOff } from "lucide-react";
import ForgotPasswordModal from "../components/ForgotPassword/ForgotPasswordModal";
import "./LoginPage.css";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  const navigate = useNavigate();

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 4000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const loginData = { email, password };
      await login(loginData); // saves token + role to localStorage

      // Fetch the actual user object to reliably check isTempPassword
      const user = await fetchCurrentUser();
      const tempFlag = user?.isTempPassword === true || user?.tempPassword === true;

      saveTempPasswordFlag(tempFlag);
      // Mark whether this is a forgot-password flow so ResetPasswordPage uses the right endpoint
      saveForgotPasswordFlow(tempFlag && !user?.isFirstLogin);

      if (tempFlag) {
        navigate("/reset-password");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Error signing in";
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
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="auth-options">
              <label className="remember">
                <input type="checkbox" />
                Remember for 30 days
              </label>
              <span
                className="forgot"
                onClick={() => setIsForgotOpen(true)}
                style={{ cursor: 'pointer' }}
              >
                Forgot password?
              </span>
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

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
      />
    </div>
  );
};

export default LoginPage;
