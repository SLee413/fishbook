import React from 'react';
import { useNavigate } from 'react-router-dom';

const AccountPage = ({ user, handleLogout }) => {
  const navigate = useNavigate();

  const onLogout = () => {
    handleLogout();
    navigate('/');
  };

  return (
    <main style={{ padding: '20px' }}>
      <h2>Account Page</h2>

      {user ? (
        <div style={{ marginTop: '20px' }}>
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Member Since:</strong> {user.memberSince}</p>

          <button
            onClick={onLogout}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      ) : (
        <p>No user information available.</p>
      )}
    </main>
  );
};

export default AccountPage;
