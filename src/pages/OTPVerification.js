import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../App';
import { Shield } from 'lucide-react';
import './OTPVerification.css';

const OTPVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);
  const type = location.state?.type || 'login';
  // Get username from navigation state for further verification
  const username = location.state?.username || '';

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
  const { refreshAuth } = useContext(AuthContext);
  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    setError('');
    if (otpString.length === 6 && username) {
      try {
        const response = await fetch('http://localhost:3001/api/auth/verify-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: username,
            otpCode: otpString,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          // Save tokens for further requests
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          // Optionally save user info if needed
          localStorage.setItem('user', JSON.stringify(data.user));
          refreshAuth(); // force App rerender to update auth state
          navigate('/chats');
        } else {
          const errData = await response.json();
          setError(errData.message || 'OTP verification failed.');
        }
      } catch (err) {
        setError('Unable to connect to server. Please try again later.');
      }
    } else {
      setError('Please enter the 6-digit code.');
    }
  };

  const handleResend = () => {
    if (canResend) {
      // Here you would resend OTP via backend
      setTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
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
            We've sent a verification code to your {type === 'register' ? 'email and mobile' : 'registered contact'}
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

          <button
            type="submit"
            className="btn-primary btn-verify"
            disabled={otp.join('').length !== 6}
          >
            Verify & Continue
          </button>
        </form>

        <div className="otp-footer">
          <p className="timer-text">
            {canResend ? (
              <span>
                Didn't receive the code?{' '}
                <button className="resend-btn" onClick={handleResend}>
                  Resend
                </button>
              </span>
            ) : (
              <span>Resend code in {timer}s</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
