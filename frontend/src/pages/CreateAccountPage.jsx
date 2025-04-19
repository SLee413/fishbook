import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../css/CreateAccountPage.module.css';

const CreateAccountPage = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    firstName: '',
    lastName: '',
    password: '',
    bio: '',
    email: ''
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.userId);
        await onLogin();
        navigate('/'); // After account creation, go straight to feed
      } else {
        const err = await res.text();
        alert('Account creation failed: ' + err);
      }
    } catch (err) {
      console.error(err);
      alert('Registration error');
    }
  };

  return (
    <main className={styles['create-account-page']}>
      <div className={styles['create-account-container']}>
        <h2 className={styles['create-account-title']}>Create Account</h2>
        <form className={styles['create-account-form']} onSubmit={handleSubmit}>
          <label className={styles['create-account-label']}>First Name</label>
          <input 
            name="firstName" 
            value={formData.firstName} 
            onChange={handleChange} 
            className={styles['create-account-input']} 
            required
          />

          <label className={styles['create-account-label']}>Last Name</label>
          <input 
            name="lastName" 
            value={formData.lastName} 
            onChange={handleChange} 
            className={styles['create-account-input']} 
            required
          />

          <label className={styles['create-account-label']}>Username</label>
          <input 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            className={styles['create-account-input']} 
            required
          />

          <label className={styles['create-account-label']}>Password</label>
          <input 
            name="password" 
            type="password"
            value={formData.password} 
            onChange={handleChange} 
            className={styles['create-account-input']} 
            required
          />

          <label className={styles['create-account-label']}>Email</label>
          <input 
            name="email" 
            type="email"
            value={formData.email} 
            onChange={handleChange} 
            className={styles['create-account-input']} 
            required
          />

          <label className={styles['create-account-label']}>Bio</label>
          <input 
            name="bio" 
            value={formData.bio} 
            onChange={handleChange} 
            className={styles['create-account-input']}
          />

          <button type="submit" className={styles['create-account-button']}>
            Create Account
          </button>
        </form>
      </div>
    </main>
  );
};

export default CreateAccountPage;
