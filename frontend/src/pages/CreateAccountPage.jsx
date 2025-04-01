import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../css/CreateAccountPage.module.css';

const CreateAccountPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Normally you’d send this to your backend
    console.log('Account Created:', formData);
    navigate('/account');
  };

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  return (
    <main className={styles['create-account-page']}>
      <div className={styles['create-account-container']}>
        <h2 className={styles['create-account-title']}>Create Account</h2>
        <form onSubmit={handleSubmit} className={styles['create-account-form']}>
          <label className={styles['create-account-label']}>First Name</label>
          <input
            className={styles['create-account-input']}
            name="firstName"
            type="text"
            value={formData.firstName}
            onChange={handleChange}
          />

          <label className={styles['create-account-label']}>Last Name</label>
          <input
            className={styles['create-account-input']}
            name="lastName"
            type="text"
            value={formData.lastName}
            onChange={handleChange}
          />

          <label className={styles['create-account-label']}>Username</label>
          <input
            className={styles['create-account-input']}
            name="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
          />

          <label className={styles['create-account-label']}>Email</label>
          <input
            className={styles['create-account-input']}
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />

          <label className={styles['create-account-label']}>Password</label>
          <input
            className={styles['create-account-input']}
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
          />

          <button type="submit" className={styles['create-account-button']}>
            Create Account
          </button>
        </form>

        <div className={styles['or-divider']}>or</div>
        <div
          className={styles['already-have-account']}
          onClick={handleLoginRedirect}
        >
          Already have an account? Log in
        </div>
      </div>
    </main>
  );
};

export default CreateAccountPage;
