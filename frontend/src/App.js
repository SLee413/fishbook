import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FeedPage from './pages/FeedPage';
import AccountPage from './pages/AccountPage';
import MapPage from './pages/MapPage';
import CreatePost from './pages/CreatePost';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FeedPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/create-post" element={<CreatePost />} />
      </Routes>
    </Router>
  );
};

export default App;
