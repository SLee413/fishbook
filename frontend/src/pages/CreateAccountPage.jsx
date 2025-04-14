import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../css/CreateAccountPage.module.css';

const CreateAccountPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
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
        localStorage.setItem('userId', data.userId);
        navigate('/account');
      } else {
        const err = await res.text();
        alert(`Error: ${err}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error creating account');
    }
  };

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  return (
    <main className={styles['create-account-page']}>
      <div className={styles['create-account-container']}>
        <h2 className={styles['create-account-title']}>Create Account</h2>
        <form onSubmit={handleSubmit} className={styles['create-account-form']}>
          <label className={styles['create-account-label']}>Name</label>
          <input name="name" value={formData.name} onChange={handleChange} className={styles['create-account-input']} required />

          <label className={styles['create-account-label']}>Password</label>
          <input name="password" type="password" value={formData.password} onChange={handleChange} className={styles['create-account-input']} required />

          <label className={styles['create-account-label']}>Email</label>
          <input name="email" type="email" value={formData.email} onChange={handleChange} className={styles['create-account-input']} />

          <label className={styles['create-account-label']}>Bio</label>
          <input name="bio" value={formData.bio} onChange={handleChange} className={styles['create-account-input']} />

          <label className={styles['create-account-label']}>Profile Picture URL</label>
          <input name="profilePictureUrl" value={formData.profilePictureUrl} onChange={handleChange} className={styles['create-account-input']} />

          <button type="submit" className={styles['create-account-button']}>Create Account</button>
        </form>
        <div className={styles['or-divider']}>or</div>
        <div onClick={handleLoginRedirect} className={styles['already-have-account']}>Already have an account? Log in</div>
      </div>
    </main>
  );
};

export default CreateAccountPage;
