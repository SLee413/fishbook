import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import FeedPage from './pages/FeedPage';
import AccountPage from './pages/AccountPage';
import MapPage from './pages/MapPage';
import CreatePost from './pages/CreatePost';
import LoginPage from './pages/LoginPage';
import CreateAccountPage from './pages/CreateAccountPage';
import ProfilePage from './pages/ProfilePage'; // Add this import

import Header from './components/Header';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingLogin, setIsCheckingLogin] = useState(true);
  const [user, setUser] = useState(null);

  const handleLogout = () => {
    // Clear token and user data on logout
    localStorage.removeItem('token');
    localStorage.removeItem('name');
    localStorage.removeItem('userId');
    setIsLoggedIn(false);
    setUser(null);
  };

  const fetchUserInfo = async (userId, token) => {
    try {
      const res = await fetch(`/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Populate user state with all needed fields
        setUser({
          username: data.name,
          email: data.email,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          bio: data.bio || '',
          profilePictureUrl: data.profilePictureUrl || '',
          memberSince: new Date(data.createdAt).toLocaleDateString(),
          userId: userId
        });
        setIsLoggedIn(true);
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error("Failed to fetch user info:", err);
      handleLogout();
    } finally {
      setIsCheckingLogin(false);
    }
  };

  const handleLogin = async () => {
    // After successful login, retrieve user info
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (token && userId) {
      await fetchUserInfo(userId, token);
    }
  };

  useEffect(() => {
    // On app load, check for existing token to keep user logged in
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (token && userId) {
      fetchUserInfo(userId, token);
    } else {
      setIsCheckingLogin(false);
    }
  }, []);

  if (isCheckingLogin) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Header isLoggedIn={isLoggedIn} />
      <Routes>
        <Route path="/" element={<FeedPage />} />
        <Route 
          path="/map" 
          element={isLoggedIn ? <MapPage /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/create-post" 
          element={isLoggedIn ? <CreatePost /> : <Navigate to="/login" />} 
        />
        <Route
          path="/account"
          element={
            isLoggedIn ? (
              <AccountPage 
                user={user} 
                handleLogout={handleLogout} 
                onUserUpdate={(updatedUser) => setUser(updatedUser)} 
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/create-account" element={<CreateAccountPage onLogin={handleLogin} />} />
        <Route path="/profile/:username" element={<ProfilePage />} /> {/* Add this line */}
      </Routes>
    </Router>
  );
};

export default App;