import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/Login.css';

const AccountPage = ({ user, handleLogout }) => {
  const navigate = useNavigate();

  const onLogout = () => {
    handleLogout();
    navigate('/');
  };

  return (
    <main className="login-page">
      <div className="login-container">
        <h2 className="login-title">Account Page</h2>
        {user ? (
          <div style={{ marginTop: '20px', textAlign: 'left' }}>
            <p><strong>Username:</strong> {user.username}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Member Since:</strong> {user.memberSince}</p>
            <button className="login-button" style={{ marginTop: '20px' }} onClick={onLogout}>Logout</button>
          </div>
        ) : (
          <p>No user information available.</p>
        )}
      </div>
    </main>
  );
};

export default AccountPage;
