import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ForgotPassword.css';
import { useToast } from '../hooks/useToast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      showToast('Please enter your email address', 'error');
      return;
    }

    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/api/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'OTP sent to your email', 'success');
        // Expect backend to return a userId/session identifier to continue reset
        // Pass the numeric id through navigation state and as a URL query parameter
        const numericId = Number(data.user_id);
        const url = `/verify-otp?uid=${encodeURIComponent(numericId)}`;
        navigate(url, { state: { userId: numericId, type: 'reset', message: data.message, expiresIn: data.expiresIn } });
      } else {
        showToast(data.error || data.message || 'Failed to request password reset', 'error');
      }
    } catch (err) {
      console.error('Request password reset error:', err);
      showToast('Unable to request password reset. Try again later.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-container">
      <div className="forgot-card">
        <h2>Reset your password</h2>
        <p>Enter your account email and we'll send a one-time code to reset your password.</p>

        <form onSubmit={handleSubmit} className="forgot-form">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send reset code'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default ForgotPassword;
