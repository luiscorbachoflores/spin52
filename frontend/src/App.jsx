import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AlbumDetail from './components/AlbumDetail';
import Admin from './components/Admin';

import api from './api';

// Wrapper for protected routes
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Main App Logic (State lifted context-like)
const AppLayout = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));

  const handleLogin = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  useEffect(() => {
    const verifyToken = async () => {
      if (!user) return;
      try {
        await api.get('/me');
      } catch (error) {
        console.error("Token invalid", error);
        handleLogout();
      }
    };
    verifyToken();
  }, []);

  return (
    <Routes>
      <Route path="/login" element={
        user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
      } />

      <Route path="/" element={
        <ProtectedRoute>
          <Dashboard user={user} onLogout={handleLogout} />
        </ProtectedRoute>
      } />

      <Route path="/album/:id" element={
        <ProtectedRoute>
          <AlbumDetail />
        </ProtectedRoute>
      } />

      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
