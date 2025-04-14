import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/Login.css';

const LoginPage = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('name', name);
        onLogin(name);
        navigate('/account');
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

  return (
    <main className="login-page">
      <div className="login-container">
        <h2 className="login-title">Login</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-label">Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="login-input" required />

          <label className="login-label">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="login-input" required />

          <button type="submit" className="login-button">Login</button>
        </form>
        <div className="or-divider">or</div>
        <button onClick={handleCreateAccount} className="create-account-button">Create an Account</button>
      </div>
    </main>
  );
};

export default LoginPage;
