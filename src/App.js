import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { UserProvider } from './context/UserContext';
import { ChatProvider } from './context/ChatContext';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/layout/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Counselors from './pages/Counselors';
import Booking from './pages/Booking';
import DashboardClient from './pages/ClientDashboard';
import DashboardCounselor from './pages/CounselorDashboard';
import Settings from './pages/SettingsPage';
import NotFound from './pages/NotFound';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <ChatProvider>
          <Router>
            <Navbar />
            <main className="flex-grow-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/counselors" element={
                  <ProtectedRoute>
                    <Counselors />
                  </ProtectedRoute>
                } />
                <Route path="/booking/:counselorId" element={
                  <ProtectedRoute>
                    <Booking />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute roles={['client']}>
                    <DashboardClient />
                  </ProtectedRoute>
                } />
                <Route path="/counselor-dashboard" element={
                  <ProtectedRoute roles={['counselor']}>
                    <DashboardCounselor />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute roles={['client', 'counselor', 'admin']}>
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute roles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
	        <Route path="/session/:bookingId/chat" element={<ProtectedRoute><ChatScreen /></ProtectedRoute>} />
                <Route path="/session/:bookingId/video" element={<ProtectedRoute><VideoScreen /></ProtectedRoute>} />
              </Routes>
            </main>
            <Footer />
          </Router>
        </ChatProvider>
      </UserProvider>
    </AuthProvider>
  );
}

export default App;

