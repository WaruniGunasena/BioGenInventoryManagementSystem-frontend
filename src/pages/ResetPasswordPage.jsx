import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isTempPassword, clearTempPasswordFlag } from "../auth/tokenService";
import { resetTempPassword } from "../api/userService";
import { getUserId } from "../components/common/Utils/userUtils/userUtils";
import { Eye, EyeOff } from "lucide-react";
import { BRANDING } from "../config/brandingConfig";
import "./LoginPage.css";

const ResetPasswordPage = () => {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const navigate = useNavigate();

    // Guard: if the user isn't here because of a temp password, send them away
    useEffect(() => {
        if (!isTempPassword()) {
            navigate("/dashboard");
        }
    }, [navigate]);

    const showMessage = (msg, error = false) => {
        setIsError(error);
        setMessage(msg);
        setTimeout(() => setMessage(""), 5000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            showMessage("Passwords do not match. Please try again.", true);
            return;
        }

        if (newPassword.length < 8) {
            showMessage("Password must be at least 8 characters long.", true);
            return;
        }

        setIsSubmitting(true);
        try {
            const userId = await getUserId();
            await resetTempPassword(userId, newPassword);
            clearTempPasswordFlag();
            showMessage("Password updated successfully! Redirecting…");
            setTimeout(() => navigate("/dashboard"), 1500);
        } catch (error) {
            const msg =
                error.response?.data?.message || "Failed to reset password. Please try again.";
            showMessage(msg, true);
            console.error("Reset password error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="auth-wrapper">
            {/* Left decorative panel — reuses existing CSS */}
            <div className="auth-left">
                <div className="brand-box">
                    <div className="brand-pill">{BRANDING.companyName}</div>
                    <p className="brand-text">
                        Please set a new password to secure your account and access the system.
                    </p>
                </div>
                <div className="brand-footer">© {BRANDING.companyName} {new Date().getFullYear()}</div>
            </div>

            {/* Right form panel */}
            <div className="auth-right">
                <div className="auth-form-container">
                    <h2 className="auth-title">
                        Set New Password <span>🔒</span>
                    </h2>
                    <p className="auth-subtitle">
                        You logged in with a temporary password. Please create a new one to continue.
                    </p>

                    {message && (
                        <p
                            className="message"
                            style={isError ? { background: "#fff5f5", color: "#c53030" } : {}}
                        >
                            {message}
                        </p>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <label>New Password</label>
                        <div className="password-wrapper">
                            <input
                                type={showNewPassword ? "text" : "password"}
                                placeholder="Enter new password (min. 8 characters)"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                tabIndex={-1}
                            >
                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <label>Confirm New Password</label>
                        <div className="password-wrapper">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Re-enter new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                tabIndex={-1}
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <button type="submit" className="auth-btn" disabled={isSubmitting}>
                            {isSubmitting ? "Saving…" : "Set Password & Continue"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
