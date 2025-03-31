import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/CreateAccountPage.module.css';

const CreateAccountPage = ({ onLogin }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          username,
          email,
          password,
        }),
      });

      if (response.ok) {
        const user = await response.json();
        onLogin(user);
        navigate('/account');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Account creation failed');
      }
    } catch (err) {
      console.error('Account creation error:', err);
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <main className="create-account-container">
      <h2>Create Account</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Create Account</button>
        {error && <p className="error">{error}</p>}
        <button type="button" onClick={() => navigate('/login')}>
          Already have an account? Log in
        </button>
      </form>
    </main>
  );
};

export default CreateAccountPage;
