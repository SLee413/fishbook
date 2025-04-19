import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../css/AccountPage.module.css';

const AccountPage = ({ user, handleLogout, onUserUpdate }) => {
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    username: user?.username || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    bio: user?.bio || '',
    password: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (user) {
      setEditData({
        username: user.username || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        bio: user.bio || '',
        password: ''
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
      const formData = new FormData();
      formData.append('username', editData.username);
      formData.append('firstName', editData.firstName);
      formData.append('lastName', editData.lastName);
      formData.append('email', editData.email);
      formData.append('bio', editData.bio);

      if (editData.password) {
        formData.append('password', editData.password);
      }

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
    <main className={styles['account-page']}>
      <div className={styles['account-container']}>
        <h2 className={styles['account-title']}>My Account</h2>

        {user ? (
          editMode ? (
            <form className={styles['account-info']} onSubmit={handleSave}>
              <div className={styles['edit-field-group']}>
                <label className={styles['edit-label']}>First Name</label>
                <input
                  className={styles['account-field']}
                  name="firstName"
                  value={editData.firstName}
                  onChange={handleChangeEdit}
                  required
                />
              </div>

              <div className={styles['edit-field-group']}>
                <label className={styles['edit-label']}>Last Name</label>
                <input
                  className={styles['account-field']}
                  name="lastName"
                  value={editData.lastName}
                  onChange={handleChangeEdit}
                  required
                />
              </div>

              <div className={styles['edit-field-group']}>
                <label className={styles['edit-label']}>Username</label>
                <input
                  className={styles['account-field']}
                  name="username"
                  value={editData.username}
                  onChange={handleChangeEdit}
                  required
                />
              </div>

              <div className={styles['edit-field-group']}>
                <label className={styles['edit-label']}>Email</label>
                <input
                  className={styles['account-field']}
                  name="email"
                  type="email"
                  value={editData.email}
                  onChange={handleChangeEdit}
                  required
                />
              </div>

              <div className={styles['edit-field-group']}>
                <label className={styles['edit-label']}>Password</label>
                <input
                  className={styles['account-field']}
                  name="password"
                  type="password"
                  placeholder="(leave blank to keep same)"
                  value={editData.password}
                  onChange={handleChangeEdit}
                />
              </div>

              <div className={styles['edit-field-group']}>
                <label className={styles['edit-label']}>Bio</label>
                <textarea
                  className={styles['account-field']}
                  name="bio"
                  value={editData.bio}
                  onChange={handleChangeEdit}
                  rows="3"
                />
              </div>

              <div className={styles['edit-field-group']}>
                <label className={styles['edit-label']}>Profile Picture</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className={styles['account-field']}
                />
              </div>

              <div className={styles['account-buttons']}>
                <button type="submit" className={styles['edit-button']}>Save Changes</button>
                <button
                  type="button"
                  className={styles['logout-button']}
                  onClick={() => setEditMode(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className={styles['account-info']}>
              <div className={styles['profile-picture-wrapper']}>
               <img
              src={
                user.profilePictureUrl 
                  ? user.profilePictureUrl.startsWith('/uploads/')
                    ? user.profilePictureUrl // user-uploaded image
                    : user.profilePictureUrl // default image from public
                  : '/profileImages/default.png' // fallback if no image
              }
              alt="Profile"
              className={styles['profile-picture']}
              />
              </div>
              <div className={styles['account-field']}>
                <span className={styles['field-label']}>Username:</span> {user.username}
              </div>
              <div className={styles['account-field']}>
                <span className={styles['field-label']}>First Name:</span> {user.firstName || 'N/A'}
              </div>
              <div className={styles['account-field']}>
                <span className={styles['field-label']}>Last Name:</span> {user.lastName || 'N/A'}
              </div>
              <div className={styles['account-field']}>
                <span className={styles['field-label']}>Email:</span> {user.email}
              </div>
              <div className={styles['account-field']}>
                <span className={styles['field-label']}>Bio:</span> {user.bio || 'N/A'}
              </div>
              <div className={styles['account-field']}>
                <span className={styles['field-label']}>Member Since:</span> {user.memberSince}
              </div>

              <div className={styles['account-buttons']}>
                <button
                  className={styles['edit-button']}
                  onClick={() => setEditMode(true)}
                >
                  Edit Profile
                </button>
                <button
                  className={styles['logout-button']}
                  onClick={onLogoutClick}
                >
                  Logout
                </button>
              </div>
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