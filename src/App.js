import React, { useState, createContext, useContext } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Register from './pages/Register';
import OTPVerification from './pages/OTPVerification';
import ChatHome from './pages/ChatHome';
import ChatWindow from './pages/ChatWindow';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Appearance from './pages/Appearance';
import BlockedUsers from './pages/BlockedUsers';
import './App.css';
import './styles/theme.css';

// Auth context to force rerender on login/logout
export const AuthContext = createContext({ refreshAuth: () => {} });

function App() {
  const [authTick, setAuthTick] = useState(0);
  const refreshAuth = () => setAuthTick(t => t + 1);
  const hasToken = !!localStorage.getItem('accessToken');

  return (
    <ThemeProvider>
      <AuthContext.Provider value={{ refreshAuth }}>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={!hasToken ? <Login /> : <Navigate to="/chats" />} />
              <Route path="/register" element={!hasToken ? <Register /> : <Navigate to="/chats" />} />
              <Route path="/verify-otp" element={<OTPVerification />} />
              <Route path="/chats" element={hasToken ? <ChatHome /> : <Navigate to="/login" />} />
              <Route path="/chat/:chatId" element={hasToken ? <ChatWindow /> : <Navigate to="/login" />} />
              <Route path="/profile" element={hasToken ? <Profile /> : <Navigate to="/login" />} />
              <Route path="/settings" element={hasToken ? <Settings /> : <Navigate to="/login" />} />
              <Route path="/appearance" element={hasToken ? <Appearance /> : <Navigate to="/login" />} />
              <Route path="/blocked-users" element={hasToken ? <BlockedUsers /> : <Navigate to="/login" />} />
              <Route path="/" element={<Navigate to={hasToken ? "/chats" : "/login"} />} />
            </Routes>
          </div>
        </Router>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}

export default App;
