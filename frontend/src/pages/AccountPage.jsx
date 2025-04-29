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
    <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Profile Section */}
        <div style={{ flex: 1 }}>
          <img 
            src={user?.profilePictureUrl || '/profileImages/default.png'} 
            alt="Profile" 
            style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover' }} 
          />
          <h2>{user?.username}'s Profile</h2>
          <p><strong>Member Since:</strong> {user?.memberSince}</p>
          <p><strong>Bio:</strong> {user?.bio || 'No bio yet'}</p>
          <p><strong>Total Posts:</strong> {posts?.length || 0}</p>

          <div className={styles['account-buttons']}>
            <button className={styles['edit-button']} onClick={() => setEditMode(true)}>
              Edit Profile
            </button>
            <button className={styles['logout-button']} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {/* Posts Section */}
        <div style={{ flex: 2 }}>
          <h3>Posts</h3>
          {posts.length === 0 ? (
            <p>No posts yet.</p>
          ) : (
            posts.map(post => (
              <div key={post._id} style={{
                border: '1px solid #ccc',
                padding: '15px',
                marginBottom: '15px',
                borderRadius: '8px'
              }}>
                {post.imageUrl && (
                  <img 
                    src={post.imageUrl} 
                    alt="Catch" 
                    style={{ 
                      width: '100%', 
                      maxHeight: '300px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      marginBottom: '10px'
                    }} 
                  />
                )}
                <p><strong>🐟 Fish:</strong> {post.species}</p>
                <p><strong>📝 Description:</strong> {post.description}</p>
                <p><strong>📅 Date:</strong> {new Date(post.dateCaught).toLocaleDateString()}</p>
                {post.waterType && <p><strong>💧 Water:</strong> {post.waterType}</p>}
                {post.bait && <p><strong>🪱 Bait:</strong> {post.bait}</p>}
                {post.weight && (
                  <p><strong>⚖️ Weight:</strong> {post.weight} {post.weightUnit || "lbs"}</p>
                )}
                {post.length && (
                  <p><strong>📏 Length:</strong> {post.length} {post.lengthUnit || "in"}</p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Edit Profile Modal/Form */}
        {editMode && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            zIndex: 1000,
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3>Edit Profile</h3>
            <form onSubmit={handleSave}>
              {/* ...existing edit form fields... */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className={styles['edit-button']}>Save</button>
                <button 
                  type="button" 
                  onClick={() => setEditMode(false)}
                  className={styles['logout-button']}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
};

export default AccountPage;
