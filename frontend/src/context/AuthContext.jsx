import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from local storage on load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  // Student Login (Password-less, email verification)
  const loginStudent = async (email) => {
    try {
      const response = await api.post('/auth/student/login', { email });
      const { token, ...userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      setToken(token);
      return userData;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  // Admin Login (Email and Password validation)
  const loginAdmin = async (email, password) => {
    try {
      const response = await api.post('/auth/admin/login', { email, password });
      const { token, ...userData } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      setToken(token);
      return userData;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Invalid email or password.');
    }
  };

  // Logout session
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  };

  const updateStudentStatus = (newStatus) => {
    if (user && user.role === 'student') {
      const updatedUser = { ...user, examStatus: newStatus };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  const value = {
    user,
    token,
    loading,
    loginStudent,
    loginAdmin,
    logout,
    updateStudentStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
