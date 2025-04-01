import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/Login.css';

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (username && password) {
      onLogin(username);
      navigate('/account');
    } else {
      alert('Enter username and password!');
    }
  };

  const handleCreateAccount = () => {
    navigate('/create-account');
  };

  return (
    <main className="login-page">
      <div className="login-container">
        <h2 className="login-title">Login</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-label">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="login-input"
            placeholder="Username"
          />
          <label className="login-label">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            placeholder="Password"
          />
          <button type="submit" className="login-button">Login</button>
        </form>
        <div className="or-divider">or</div>
        <button onClick={handleCreateAccount} className="create-account-button">
          Create an Account
        </button>
      </div>
    </main>
  );
};

export default LoginPage;
