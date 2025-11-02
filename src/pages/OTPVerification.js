import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../App';
import { Shield } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { io } from 'socket.io-client';
import './OTPVerification.css';

const OTPVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);
  const socketRef = useRef(null);
  const verifiedRef = useRef(false);
  const type = location.state?.type || 'login';
  // Get username and userId from navigation state or from URL query param (uid)
  const username = location.state?.username || '';
  const params = new URLSearchParams(location.search);
  const rawUserId = location.state?.userId ?? params.get('uid') ?? null;
  const userId = rawUserId != null ? Number(rawUserId) : null;
  const { refreshAuth } = useContext(AuthContext);

  // Initialize WebSocket connection for registration monitoring
  useEffect(() => {
    if (type !== 'register' || !username) return;

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

    // Connect to registration namespace
    const socket = io(`${SOCKET_URL}/registration`, {
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Registration WebSocket connected:', socket.id);
      // Start monitoring this registration
      socket.emit('monitor_registration', { username });
    });

    socket.on('monitoring_started', (data) => {
      console.log('Monitoring started for:', data.username);
    });

    socket.on('registration_cancelled', (data) => {
      console.log('Registration cancelled:', data.username);
      if (!verifiedRef.current) {
        showToast('Registration cancelled. Please try again.', 'info');
        navigate('/register');
      }
    });

    socket.on('disconnect', () => {
      console.log('Registration WebSocket disconnected');
    });

    socket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err);
    });

    // Cleanup on unmount
    return () => {
      if (socket && socket.connected) {
        // Only cancel if not verified
        if (!verifiedRef.current) {
          socket.emit('cancel_registration', { username });
        }
        socket.disconnect();
      }
    };
  }, [username, type, navigate, showToast]);

  // Initialize WebSocket connection for login monitoring
  useEffect(() => {
    if (type !== 'login' || !userId) return;

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

    // Connect to login namespace
    const socket = io(`${SOCKET_URL}/login`, {
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Login WebSocket connected:', socket.id);
      // Start monitoring this login OTP
      socket.emit('monitor_login', { userId: Number(userId) });
    });

    socket.on('monitoring_started', (data) => {
      console.log('Login monitoring started for userId:', data.userId);
    });

    socket.on('login_cancelled', (data) => {
      console.log('Login cancelled for userId:', data.userId);
      if (!verifiedRef.current) {
        showToast('Login session expired. Please try again.', 'info');
        navigate('/login');
      }
    });

    socket.on('disconnect', () => {
      console.log('Login WebSocket disconnected');
    });

    socket.on('connect_error', (err) => {
      console.error('Login WebSocket connection error:', err);
    });

    // Cleanup on unmount
    return () => {
      if (socket && socket.connected) {
        // Only cancel if not verified
        if (!verifiedRef.current) {
          socket.emit('cancel_login', { userId });
        }
        socket.disconnect();
      }
    };
  }, [userId, type, navigate, showToast]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  useEffect(() => {
    // Debug: log incoming navigation state to help trace reset flow
    console.debug('OTPVerification mounted', { state: location.state, queryUid: params.get('uid'), resolvedUserId: userId, type });
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length; i++) {
      if (!isNaN(pastedData[i])) {
        newOtp[i] = pastedData[i];
      }
    }
    setOtp(newOtp);
  };

  const [error, setError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    setError('');
    
    if (otpString.length !== 6) {
      setError('Please enter the 6-digit code.');
      showToast('Please enter the complete 6-digit code.', 'error');
      return;
    }
    
    if (type === 'register' && !username) {
      setError('Username not found. Please try again.');
      showToast('Session expired. Please try again.', 'error');
      navigate('/register');
      return;
    }
    
    if (type === 'login' && !userId) {
      setError('Session not found. Please try again.');
      showToast('Session expired. Please try again.', 'error');
      navigate('/login');
      return;
    }

    // For password reset flow, verify OTP together with new password by calling reset API
    if (type === 'reset') {
      if (!userId) {
        showToast('Session not found. Please request password reset again.', 'error');
        navigate('/forgot-password');
        return;
      }

      const otpString = otp.join('');
      if (otpString.length !== 6) {
        setError('Please enter the 6-digit code.');
        showToast('Please enter the complete 6-digit code.', 'error');
        return;
      }

      if (!newPassword || newPassword.length < 6) {
        setError('Please enter a password of at least 6 characters.');
        showToast('Please enter a password of at least 6 characters.', 'error');
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('Passwords do not match.');
        showToast('Passwords do not match.', 'error');
        return;
      }

      setLoading(true);
      try {
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
        const endpoint = `${API_URL}/api/auth/reset-password`;
        const body = { userId, otpCode: otpString, newPassword };
        // Diagnostic log: show payload and endpoint so it's easy to verify the request in the browser console
        console.debug('Reset password POST', { endpoint, body });
        showToast('Resetting password...', 'info');
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await response.json();
        if (response.ok) {
          // Clear persisted userId since reset is complete
          try { sessionStorage.removeItem('passwordResetUserId'); } catch (e) { /* ignore */ }
          showToast(data.message || 'Password reset successful. Please login.', 'success');
          // disconnect socket if present
          if (socketRef.current && socketRef.current.connected) {
            socketRef.current.disconnect();
          }
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

      return;
    }

    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      
      // Use different endpoints based on type
      const endpoint = type === 'register' 
        ? `${API_URL}/api/auth/verify-registration-otp`
        : `${API_URL}/api/auth/verify-otp`;
      
      const requestBody = type === 'register'
        ? { username: username, otpCode: otpString }
        : { userId: Number(userId), otpCode: otpString };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        verifiedRef.current = true; // Mark as verified to prevent cancellation
        
        if (type === 'register') {
          // Registration verification successful
          showToast('Registration verified successfully! Please login.', 'success');
          
          // Disconnect socket before redirecting
          if (socketRef.current && socketRef.current.connected) {
            socketRef.current.disconnect();
          }
          
          // Redirect to login after 2 seconds
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else {
          // Login verification successful
          showToast('Login successful!', 'success');
          
          // Save tokens for further requests
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          // Disconnect socket before redirecting
          if (socketRef.current && socketRef.current.connected) {
            socketRef.current.disconnect();
          }
          
          refreshAuth(); // force App rerender to update auth state
          
          // Redirect to chats after a short delay
          setTimeout(() => {
            navigate('/chats');
          }, 1000);
        }
      } else {
        setError(data.error || data.message || 'OTP verification failed.');
        showToast(data.error || data.message || 'OTP verification failed. Please try again.', 'error');
        
        // If OTP expired, redirect back
        if (data.error && data.error.includes('expired')) {
          setTimeout(() => {
            if (socketRef.current && socketRef.current.connected) {
              socketRef.current.disconnect();
            }
            navigate(type === 'register' ? '/register' : '/login', {
              state: { message: 'OTP expired. Please try again.' }
            });
          }, 3000);
        }
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError('Unable to connect to server. Please try again later.');
      showToast('Unable to connect to server. Please try again later.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      
      const endpoint = type === 'register'
        ? `${API_URL}/api/auth/resend-registration-otp`
        : `${API_URL}/api/auth/resend-otp`;
      
      const requestBody = type === 'register'
        ? { username: username }
        : { userId: Number(userId), otpType: 'login' };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showToast('OTP resent successfully!', 'success');
        setTimer(data.expiresIn || 300);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        showToast(data.error || data.message || 'Failed to resend OTP', 'error');
        
        // If no pending session, redirect back
        if (data.error && (data.error.includes('No pending') || data.error.includes('expired'))) {
          setTimeout(() => {
            if (socketRef.current && socketRef.current.connected) {
              socketRef.current.disconnect();
            }
            navigate(type === 'register' ? '/register' : '/login');
          }, 2000);
        }
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      showToast('Unable to resend OTP. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    verifiedRef.current = false;
    
    if (socketRef.current && socketRef.current.connected) {
      if (type === 'register') {
        socketRef.current.emit('cancel_registration', { username });
      } else {
        socketRef.current.emit('cancel_login', { userId });
      }
      socketRef.current.disconnect();
    }
    
    showToast(`${type === 'register' ? 'Registration' : 'Login'} cancelled.`, 'info');
    navigate(type === 'register' ? '/register' : '/login');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="otp-container">
      <div className="otp-card fade-in">
        <div className="otp-header">
          <div className="shield-icon">
            <Shield size={64} />
          </div>
          <h1>Verification Code</h1>
          <p>
            We've sent a verification code to your {type === 'register' ? 'email and mobile' : type === 'reset' ? 'email' : 'registered contact'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="otp-form">
          {error && <div className="error-text" style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
          <div className="otp-inputs" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength="1"
                className="otp-input"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
              />
            ))}
          </div>

          {type === 'reset' && (
            <div className="reset-password-fields">
              <div className="form-group">
                <label htmlFor="newPassword">New password</label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary btn-verify"
            disabled={
              loading ||
              otp.join('').length !== 6 ||
              (type === 'reset' && (newPassword.length < 6 || newPassword !== confirmPassword))
            }
          >
            {loading ? (type === 'reset' ? 'Resetting...' : 'Verifying...') : (type === 'reset' ? 'Reset Password' : 'Verify & Continue')}
          </button>
        </form>

        <div className="otp-footer">
          <p className="timer-text">
            Time remaining: <strong>{formatTime(timer)}</strong>
          </p>
          <p className="timer-text">
            {canResend ? (
              <span>
                Didn't receive the code?{' '}
                <button className="resend-btn" onClick={handleResend} disabled={loading}>
                  Resend OTP
                </button>
              </span>
            ) : (
              <span>You can resend OTP in {formatTime(timer)}</span>
            )}
          </p>
          
          <button 
            className="cancel-btn" 
            onClick={handleCancel}
            disabled={loading}
            style={{
              marginTop: '15px',
              backgroundColor: '#dc3545',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Cancel {type === 'register' ? 'Registration' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
