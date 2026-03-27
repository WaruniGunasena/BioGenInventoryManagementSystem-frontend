import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/authService";
import { Eye, EyeOff } from "lucide-react";
import { useAdminStatus } from "../context/AdminStatusContext";
import "./RegisterPage.css";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { adminExists, loading: adminLoading, refreshAdminStatus } = useAdminStatus();

  useEffect(() => {
    if (!adminLoading && adminExists) {
      navigate("/login", { replace: true });
    }
  }, [adminExists, adminLoading, navigate]);

  // Render nothing while the check is in flight or if admin exists (prevents flicker before redirect)
  if (adminLoading || adminExists) return null;

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 4000);
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const registerData = { name, email, password };
      await registerUser(registerData);
      showMessage("Registration Successful ✅");
      await refreshAdminStatus();
      navigate("/login", { replace: true });
    } catch (error) {
      const msg = error.response?.data?.message || "Error registering user";
      showMessage(msg);
      console.error("Register error:", error);
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
          © MenuraWijesekara {new Date().getFullYear()}
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form-container">
          <h2 className="auth-title">
            Create your account <span>✨</span>
          </h2>
          <p className="auth-subtitle">
            Register to start managing your inventory efficiently
          </p>

          {message && <p className="message">{message}</p>}

          <form onSubmit={handleRegister} className="auth-form">
            <label>Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

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
              <span className="forgot">Forgot password</span>
            </div>

            <button type="submit" className="auth-btn">
              Register
            </button>
          </form>

          <p className="auth-footer">
            Already have an account?{" "}
            <span onClick={() => navigate("/login")}>Login</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
