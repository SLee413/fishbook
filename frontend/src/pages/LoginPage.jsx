import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage = ({ setUser }) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await fetch('/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, password }),
      });

      if (!res.ok) throw new Error('Login failed');

      const userRes = await fetch('/users/me', {
        credentials: 'include',
      });

      const userData = await userRes.json();
      setUser(userData);
      navigate('/feed');
    } catch (err) {
      console.error(err);
      setError('Invalid username or password');
    }
  };

  return (
    <main style={{ display: 'flex', justifyContent: 'center', paddingTop: '40px' }}>
      <div style={{ width: '400px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '20px' }}>Log In</h2>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div style={{ marginBottom: '10px', textAlign: 'left' }}>
          <label>Username</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
        </div>

        <div style={{ marginBottom: '10px', textAlign: 'left' }}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
        </div>

        <button
          onClick={handleLogin}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#102f92',
            color: 'white',
            border: 'none',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Log In
        </button>

        <div style={{ marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
          <p style={{ margin: '0', color: '#666' }}>or</p>
        </div>

        <div style={{ marginTop: '10px' }}>
          <Link to="/create-account" style={{ fontWeight: 'bold', color: '#102f92', textDecoration: 'none' }}>
            Don’t have an account? Create one
          </Link>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
