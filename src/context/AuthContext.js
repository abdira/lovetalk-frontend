import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  // Axios instance with auth header
  const axiosInstance = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://lovetalk.local/api',
  });

  // Attach token to every request if exists
  axiosInstance.interceptors.request.use(
    config => {
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    },
    error => Promise.reject(error)
  );

  // Login function
  const login = async (email, password) => {
    try {
      const res = await axiosInstance.post('/auth/login', { email, password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // Fetch user info on mount if token exists
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setAuthLoading(false);
        return;
      }
      try {
        const res = await axiosInstance.get('/auth/me');
        setUser(res.data.user);
      } catch {
        logout();
      } finally {
        setAuthLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  return (
    <AuthContext.Provider
      value={{ user, token, authLoading, login, logout, axiosInstance }}
    >
      {children}
    </AuthContext.Provider>
  );
};

