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
  
  // 🆕 New: Posts state
  const [posts, setPosts] = useState([]);

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

  // 🆕 New: Fetch user's own posts
  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        const res = await fetch('/api/posts');
        const data = await res.json();
        if (data.posts) {
          const userPosts = data.posts
            .filter(post => post.authorId === user.userId)
            .sort((a, b) => new Date(b.datePosted) - new Date(a.datePosted));
          setPosts(userPosts);
        }
      } catch (err) {
        console.error('Error fetching user posts:', err);
      }
    };

    if (user) {
      fetchUserPosts();
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
      <div style={{ display: 'flex', gap: '20px', padding: '20px' }}>
        
        {/* Left side - Profile Info */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h2 className={styles['account-title']}>My Account</h2>

          {user ? (
            editMode ? (
              <form className={styles['account-info']} onSubmit={handleSave}>
                {/* (All your edit form fields stay the same) */}
                {/* ... */}
              </form>
            ) : (
              <div className={styles['account-info']}>
                {/* (Your display profile fields stay the same) */}
                <div className={styles['profile-picture-wrapper']}>
                  <img
                    src={user.profilePictureUrl 
                      ? user.profilePictureUrl.startsWith('/uploads/')
                        ? user.profilePictureUrl
                        : user.profilePictureUrl
                      : '/profileImages/default.png'}
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

        {/* Right side - User's Posts */}
        <div style={{ flex: 2 }}>
          <h2 style={{ marginBottom: '20px' }}>My Posts</h2>

          {posts.length === 0 ? (
            <p>You have no posts yet.</p>
          ) : (
            posts.map(post => (
              <div key={post._id} style={{
                border: '1px solid #ccc',
                padding: '15px',
                marginBottom: '15px',
                borderRadius: '8px',
                backgroundColor: '#f9f9f9'
              }}>
                <p><strong>Fish:</strong> {post.species}</p>
                <p><strong>Description:</strong> {post.description}</p>
                <p><strong>Date:</strong> {new Date(post.dateCaught).toLocaleDateString()}</p>
              </div>
            ))
          )}
        </div>

      </div>
    </main>
  );
};

export default AccountPage;
