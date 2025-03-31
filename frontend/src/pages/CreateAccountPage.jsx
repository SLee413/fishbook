import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../css/CreateAccountPage.module.css';

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
    <main className={styles["create-account-page"]}>
      <div className={styles["create-account-container"]}>
        <h1 className={styles["create-account-title"]}>Create Account</h1>
        <form className={styles["create-account-form"]} onSubmit={handleSubmit}>
          <label className={styles["create-account-label"]}>First Name</label>
          <input className={styles["create-account-input"]} value={firstName} onChange={(e) => setFirstName(e.target.value)} />

          <label className={styles["create-account-label"]}>Last Name</label>
          <input className={styles["create-account-input"]} value={lastName} onChange={(e) => setLastName(e.target.value)} />

          <label className={styles["create-account-label"]}>Username</label>
          <input className={styles["create-account-input"]} value={username} onChange={(e) => setUsername(e.target.value)} />

          <label className={styles["create-account-label"]}>Email</label>
          <input className={styles["create-account-input"]} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

          <label className={styles["create-account-label"]}>Password</label>
          <input className={styles["create-account-input"]} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

          {error && <p style={{ color: 'red' }}>{error}</p>}

          <button className={styles["create-account-button"]} type="submit">Create Account</button>
        </form>

        <div className={styles["or-divider"]}>or</div>

        <div className={styles["already-have-account"]} onClick={() => navigate('/login')}>
          Already have an account? Log in
        </div>
      </div>
    </main>
  );
};

export default CreateAccountPage;
