import React, { useState } from 'react';
import { X, KeyRound } from 'lucide-react';
import './ForgotPasswordModal.css';
import { generateForgotPassword } from '../../api/userService';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState(null); // null | 'success' | 'error'
    const [statusMsg, setStatusMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleClose = () => {
        setEmail('');
        setStatus(null);
        setStatusMsg('');
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus(null);

        try {
            await generateForgotPassword(email.trim());
            setStatus('success');
            setStatusMsg(
                'A temporary password has been sent to your email. Use it to log in and you will be prompted to set a new password.'
            );
            setEmail('');
        } catch (err) {
            setStatus('error');
            setStatusMsg(
                err.response?.data?.message || 'Something went wrong. Please try again.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fp-overlay" onClick={handleClose}>
            <div className="fp-modal" onClick={(e) => e.stopPropagation()}>
                {/* Close button */}
                <button className="fp-close" type="button" onClick={handleClose}>
                    <X size={20} />
                </button>

                {/* Icon */}
                <div className="fp-icon-wrap">
                    <KeyRound size={28} color="#6f42c1" />
                </div>

                <h2 className="fp-title">Forgot your password?</h2>
                <p className="fp-subtitle">
                    Enter your account email address and we will send you a temporary password.
                </p>

                <form onSubmit={handleSubmit}>
                    <label className="fp-label" htmlFor="fp-email">Email Address</label>
                    <input
                        id="fp-email"
                        type="email"
                        className="fp-input"
                        placeholder="you@biogenholdings.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={status === 'success'}
                    />

                    {status !== 'success' && (
                        <button
                            type="submit"
                            className="fp-btn"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Sending…' : 'Send Temporary Password'}
                        </button>
                    )}

                    {status === 'success' && (
                        <button
                            type="button"
                            className="fp-btn"
                            onClick={handleClose}
                        >
                            Back to Login
                        </button>
                    )}

                    {status && (
                        <p className={`fp-message ${status}`}>{statusMsg}</p>
                    )}
                </form>
            </div>
        </div>
    );
};

export default ForgotPasswordModal;
