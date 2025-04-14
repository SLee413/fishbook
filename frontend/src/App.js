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
  const [user, setUser] = useState(null);

  // called when login succeeds
  const handleLogin = (username) => {
    setIsLoggedIn(true);
    setUser({ username });
  };

  // called on logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('name');
    localStorage.removeItem('userId');
    setIsLoggedIn(false);
    setUser(null);
  };

  // on load, check localStorage for existing session
  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('name');
    if (token && username) {
      setIsLoggedIn(true);
      setUser({ username });
    }
  }, []);

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
