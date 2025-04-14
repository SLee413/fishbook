import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import FeedPage from './pages/FeedPage';
import AccountPage from './pages/AccountPage';
import MapPage from './pages/MapPage';
import CreatePost from './pages/CreatePost';
import LoginPage from './pages/LoginPage';
import CreateAccountPage from './pages/CreateAccountPage';

import Header from './components/Header';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingLogin, setIsCheckingLogin] = useState(true);
  const [user, setUser] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('name');
    localStorage.removeItem('userId');
    setIsLoggedIn(false);
    setUser(null);
  };

  const fetchUserInfo = async (userId, token) => {
    try {
      const res = await fetch(`/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setUser({
          username: data.name,
          email: data.email,
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
      setIsCheckingLogin(false); // ✅ finished checking
    }
  };

  const handleLogin = async (username) => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (token && userId) {
      await fetchUserInfo(userId, token);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (token && userId) {
      fetchUserInfo(userId, token);
    } else {
      setIsCheckingLogin(false); // ✅ nothing to check
    }
  }, []);

  // while checking login, render nothing (or a loading screen)
  if (isCheckingLogin) {
    return <div>Loading...</div>; // you can replace this with a fancy spinner later
  }

  return (
    <Router>
      <Header isLoggedIn={isLoggedIn} />

      <Routes>
        <Route path="/" element={<FeedPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/create-post" element={isLoggedIn ? <CreatePost /> : <Navigate to="/login" />} />
        <Route
          path="/account"
          element={
            isLoggedIn
              ? <AccountPage user={user} handleLogout={handleLogout} />
              : <Navigate to="/login" />
          }
        />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/create-account" element={<CreateAccountPage />} />
      </Routes>
    </Router>
  );
};

export default App;
