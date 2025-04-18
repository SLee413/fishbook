import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../css/CreateAccountPage.module.css';

const AccountPage = ({ user, handleLogout, onUserUpdate }) => {
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    username: user?.username || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    bio: user?.bio || ''
  });
  const [selectedFile, setSelectedFile] = useState(null);

  // When user prop updates (e.g., after save or login), refresh form data
  useEffect(() => {
    if (user) {
      setEditData({
        username: user.username || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        bio: user.bio || ''
      });
      setSelectedFile(null);
    }
  }, [user]);

  const onLogoutClick = () => {
    handleLogout();
    navigate('/');
  };

  const handleChangeEdit = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      // Prepare form data for profile update
      const formData = new FormData();
      formData.append('username', editData.username);
      formData.append('firstName', editData.firstName);
      formData.append('lastName', editData.lastName);
      formData.append('email', editData.email);
      formData.append('bio', editData.bio);
      if (selectedFile) {
        formData.append('profilePicture', selectedFile);
      }
      const token = localStorage.getItem('token');
      const res = await fetch('/users/update', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const updatedUser = await res.json();
        // Update global user state with new values
        onUserUpdate && onUserUpdate({
          username: updatedUser.name,
          email: updatedUser.email,
          firstName: updatedUser.firstName || '',
          lastName: updatedUser.lastName || '',
          bio: updatedUser.bio || '',
          profilePictureUrl: updatedUser.profilePictureUrl || '',
          memberSince: updatedUser.createdAt 
            ? new Date(updatedUser.createdAt).toLocaleDateString() 
            : user.memberSince,
          userId: user.userId
        });
        setEditMode(false);
        alert('Profile updated successfully!');
      } else {
        const errMsg = await res.text();
        alert('Failed to update: ' + errMsg);
      }
    } catch (err) {
      console.error('Update failed', err);
      alert('An error occurred while updating profile.');
    }
  };

  return (
    <main className={styles['create-account-page']}>
      <div className={styles['create-account-container']}>
        <h2 className={styles['create-account-title']}>Account</h2>
        {user ? (
          editMode ? (
            /* -------- EDIT MODE -------- */
            <div style={{ marginTop: '20px', textAlign: 'left' }}>
              {/* Profile Picture (current) */}
              {user.profilePictureUrl && (
                <img 
                  src={user.profilePictureUrl} 
                  alt="Profile" 
                  style={{ width: '100px', borderRadius: '50%' }} 
                />
              )}
              <p><strong>Member Since:</strong> {user.memberSince}</p>
              <form className={styles['create-account-form']} onSubmit={handleSave}>
                <label className={styles['create-account-label']}>First Name</label>
                <input 
                  name="firstName" 
                  value={editData.firstName} 
                  onChange={handleChangeEdit} 
                  className={styles['create-account-input']} 
                />

                <label className={styles['create-account-label']}>Last Name</label>
                <input 
                  name="lastName" 
                  value={editData.lastName} 
                  onChange={handleChangeEdit} 
                  className={styles['create-account-input']} 
                />

                <label className={styles['create-account-label']}>Username</label>
                <input 
                  name="username" 
                  value={editData.username} 
                  onChange={handleChangeEdit} 
                  className={styles['create-account-input']} 
                  required 
                />

                <label className={styles['create-account-label']}>Email</label>
                <input 
                  name="email" 
                  type="email" 
                  value={editData.email} 
                  onChange={handleChangeEdit} 
                  className={styles['create-account-input']} 
                  required 
                />

                <label className={styles['create-account-label']}>Bio</label>
                <textarea 
                  name="bio" 
                  value={editData.bio} 
                  onChange={handleChangeEdit} 
                  rows="4" 
                  style={{ 
                    width: '100%', padding: '10px', marginBottom: '15px',
                    border: '1px solid #ccc', borderRadius: '5px', fontSize: '1rem' 
                  }} 
                />

                <label className={styles['create-account-label']}>Profile Picture</label>
                <input 
                  type="file" 
                  onChange={handleFileChange} 
                  className={styles['create-account-input']} 
                />

                {/* Save/Cancel buttons */}
                <div style={{ marginTop: '15px' }}>
                  <button 
                    type="submit" 
                    className={styles['create-account-button']} 
                    style={{ width: 'auto', marginRight: '10px' }}
                  >
                    Save Changes
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setEditMode(false)} 
                    className={styles['create-account-button']} 
                    style={{ width: 'auto', backgroundColor: '#6b7280' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* -------- VIEW MODE -------- */
            <div style={{ marginTop: '20px', textAlign: 'left' }}>
              {user.profilePictureUrl && (
                <img 
                  src={user.profilePictureUrl} 
                  alt="Profile" 
                  style={{ width: '100px', borderRadius: '50%' }} 
                />
              )}
              <p><strong>Username:</strong> {user.username}</p>
              <p><strong>First Name:</strong> {user.firstName || 'N/A'}</p>
              <p><strong>Last Name:</strong> {user.lastName || 'N/A'}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Bio:</strong> {user.bio ? user.bio : 'N/A'}</p>
              <p><strong>Member Since:</strong> {user.memberSince}</p>
              <button 
                className={styles['create-account-button']} 
                style={{ width: 'auto', marginRight: '10px' }} 
                onClick={() => setEditMode(true)}
              >
                Edit Profile
              </button>
              <button 
                className={styles['create-account-button']} 
                style={{ width: 'auto', backgroundColor: '#6b7280' }} 
                onClick={onLogoutClick}
              >
                Logout
              </button>
            </div>
          )
        ) : (
          <p>No user information available.</p>
        )}
      </div>
    </main>
  );
};

export default AccountPage;
