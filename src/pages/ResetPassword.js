import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ResetPassword.css';
import { useToast } from '../hooks/useToast';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  // Allow userId from navigation state or query param (uid)
  const params = new URLSearchParams(location.search);
  const rawUserId = location.state?.userId ?? params.get('uid') ?? null;
  const userId = rawUserId != null ? Number(rawUserId) : null;
  const otpCode = location.state?.otpCode || null;

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId || !otpCode) {
      showToast('Session expired. Please request password reset again.', 'error');
      navigate('/forgot-password');
      return;
    }
    if (!password || password.length < 6) {
      showToast('Please enter a password of at least 6 characters.', 'error');
      return;
    }
    if (password !== confirm) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      console.log(JSON.stringify({ userId: Number(userId), otpCode, newPassword: password }));
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: Number(userId), otpCode, newPassword: password }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Password reset successfully. You can now login.', 'success');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        showToast(data.error || data.message || 'Failed to reset password', 'error');
        setTimeout(() => navigate('/forgot-password'), 1200);
      }
    } catch (err) {
      console.error('Reset password error:', err);
      showToast('Unable to reset password. Try again later.', 'error');
      setTimeout(() => navigate('/forgot-password'), 1200);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-container">
      <div className="reset-card">
        <h2>Set a new password</h2>
        <p>Enter a new password for your account. This will replace your old password.</p>

        <form onSubmit={handleSubmit} className="reset-form">
          <label>New password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

          <label>Confirm password</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />

          <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Reset password'}</button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
