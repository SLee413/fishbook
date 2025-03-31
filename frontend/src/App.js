import React, { useState } from 'react';
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

  const handleLogin = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <Router>
      <Header isLoggedIn={isLoggedIn} />
      <Routes>
        <Route path="/" element={<FeedPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/create-post" element={<CreatePost />} />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/create-account" element={<CreateAccountPage onLogin={handleLogin} />} />
        <Route
          path="/account"
          element={
            isLoggedIn ? <AccountPage user={user} /> : <Navigate to="/login" />
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
