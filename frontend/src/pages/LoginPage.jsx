// --- LoginPage.jsx ---

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/Login.css';

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', username);

        const decodedToken = parseJwt(data.token);
        if (decodedToken?.userId) {
          localStorage.setItem('userId', decodedToken.userId);
        }

        await onLogin(username);
        navigate('/');
      } else {
        const err = await res.text();
        alert(`Login failed: ${err}`);
      }
    } catch (err) {
      console.error(err);
      alert('Login error');
    }
  };

  const handleCreateAccount = () => {
    navigate('/create-account');
  };

  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
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
            required
          />

          <label className="login-label">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            required
          />

          <button type="submit" className="login-button">Login</button>
        </form>
        <div className="or-divider">or</div>
        <button onClick={handleCreateAccount} className="create-account-button">Create an Account</button>
      </div>
    </main>
  );
};

export default LoginPage;
