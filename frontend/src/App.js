import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import FeedPage from './pages/FeedPage';
import AccountPage from './pages/AccountPage';
import MapPage from './pages/MapPage';
import CreatePost from './pages/CreatePost';
import LoginPage from './pages/LoginPage';
import Header from './components/Header';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const handleLogin = (username) => {
    const mockUser = {
      username: username,
      email: `${username.toLowerCase()}@fishbook.com`,
      memberSince: 'March 2024',
    };

    setIsLoggedIn(true);
    setUser(mockUser);
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
        <Route path="/create-post" element={isLoggedIn ? <CreatePost /> : <Navigate to="/login" />} />
        <Route
          path="/account"
          element={isLoggedIn ? <AccountPage user={user} handleLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
      </Routes>
    </Router>
  );
};

export default App;
