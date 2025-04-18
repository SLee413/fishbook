import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../css/CreateAccountPage.module.css';

const CreateAccountPage = ({ onLogin }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    firstName: '',
    lastName: '',
    password: '',
    bio: '',
    email: '',
    profilePictureUrl: ''
  });

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
      
        const userId = parseJwt(data.token)?.userId;
        if (userId) {
          localStorage.setItem('userId', userId);
        }
      
        localStorage.setItem('name', formData.name);
      
        await onLogin(formData.name); 
      
        navigate('/');  
      } else {
        const err = await res.text();
        alert(`Account creation failed: ${err}`);
      }
    } catch (err) {
      console.error(err);
      alert('Registration error');
    }
  };

  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
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
          />

          <label className={styles['create-account-label']}>Last Name</label>
          <input 
            name="lastName" 
            value={formData.lastName} 
            onChange={handleChange} 
            className={styles['create-account-input']} 
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
