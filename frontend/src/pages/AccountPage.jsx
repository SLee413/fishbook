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
  const [previewImage, setPreviewImage] = useState(user?.profilePictureUrl || '/profileImages/default.png');
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState({});
  const [commentCounts, setCommentCounts] = useState({});
  const [showComments, setShowComments] = useState({});

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
      setPreviewImage(user.profilePictureUrl || '/profileImages/default.png');
    }
  }, [user]);

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

          const counts = {};
          const allComments = {};
          for (const post of userPosts) {
            const res = await fetch(`/api/posts/${post._id}/comments`);
            const data = await res.json();
            counts[post._id] = data.comments?.length || 0;
            allComments[post._id] = data.comments || [];
          }
          setCommentCounts(counts);
          setComments(allComments);
        }
      } catch (err) {
        console.error('Error fetching user posts/comments:', err);
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
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    } else {
      setSelectedFile(null);
      setPreviewImage(user?.profilePictureUrl || '/profileImages/default.png');
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

  const toggleComments = (postId) => {
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  return (
    <main style={{ padding: '20px 40px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <img
            src={previewImage}
            alt="Profile"
            style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <h2>{user?.username}'s Profile</h2>
          <p><strong>Member Since:</strong> {user?.memberSince}</p>
          <p><strong>Bio:</strong> {user?.bio || 'No bio yet'}</p>
          <p><strong>Total Posts:</strong> {posts?.length || 0}</p>

          <div className={styles['account-buttons']} style={{ justifyContent: 'center' }}>
            {!editMode && (
              <button className={styles['edit-button']} onClick={() => setEditMode(true)}>Edit Profile</button>
            )}
            {editMode && (
              <button className={styles['logout-button']} onClick={() => setEditMode(false)}>Cancel</button>
            )}
            <button className={styles['logout-button']} onClick={onLogoutClick}>Logout</button>
          </div>
        </div>

        <div style={{ flex: 3 }}>
          {!editMode && <h3>Posts</h3>}
          {editMode ? (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h3>Edit Profile</h3>

              <label className={styles['edit-label']}>First Name</label>
              <input name="firstName" value={editData.firstName} onChange={handleChangeEdit} className={styles['account-field']} />

              <label className={styles['edit-label']}>Last Name</label>
              <input name="lastName" value={editData.lastName} onChange={handleChangeEdit} className={styles['account-field']} />

              <label className={styles['edit-label']}>Username</label>
              <input name="username" value={editData.username} onChange={handleChangeEdit} className={styles['account-field']} />

              <label className={styles['edit-label']}>Email</label>
              <input name="email" value={editData.email} onChange={handleChangeEdit} className={styles['account-field']} />

              <label className={styles['edit-label']}>Password</label>
              <input name="password" type="password" value={editData.password} onChange={handleChangeEdit} className={styles['account-field']} />

              <label className={styles['edit-label']}>Bio</label>
              <input name="bio" value={editData.bio} onChange={handleChangeEdit} className={styles['account-field']} />

              <label className={styles['edit-label']}>Profile Picture</label>
              <input name="profilePicture" type="file" onChange={handleFileChange} className={styles['account-field']} />

              <button type="submit" className={styles['edit-button']}>Save Changes</button>
            </form>
          ) : (
            posts.length === 0 ? <p>No posts yet.</p> : posts.map(post => (
              <div key={post._id} style={{ border: '1px solid #ddd', padding: '20px', marginBottom: '25px', borderRadius: '12px', backgroundColor: '#fff' }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <img
                    src={post.imageUrl}
                    alt="Catch"
                    style={{ width: '450px', height: '450px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <p><strong>🐟 Fish:</strong> {post.species}</p>
                    <p><strong>📝 Description:</strong> {post.description}</p>
                    {post.bait && <p><strong>🪱 Bait:</strong> {post.bait}</p>}
                    {post.waterType && <p><strong>💧 Water:</strong> {post.waterType}</p>}
                    {post.weight && <p><strong>⚖️ Weight:</strong> {post.weight} {post.weightUnit || 'lbs'}</p>}
                    {post.length && <p><strong>📏 Length:</strong> {post.length} {post.lengthUnit || 'in'}</p>}
                    {post.dateCaught && <p><strong>🕒 Caught:</strong> {new Date(post.dateCaught).toLocaleDateString()}</p>}
                    {post.moonPhase && <p><strong>🌙 Moon:</strong> {post.moonPhase}</p>}
                    {post.weather && (
                      <>
                        <p><strong>🌡️ Temp:</strong> {post.weather.temperature ?? '?'}°F</p>
                        <p><strong>💧 Precip:</strong> {post.weather.precipitation ?? '?'} in</p>
                        <p><strong>🌬️ Wind:</strong> {post.weather.windspeed ?? '?'} mph</p>
                      </>
                    )}
                    <p style={{ fontStyle: 'italic' }}>Posted on {new Date(post.datePosted).toLocaleDateString()}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
                  <span>❤️ {post.likes || 0}</span>
                  <button onClick={() => toggleComments(post._id)} style={{ background: 'none', border: 'none', color: '#1e3a8a', cursor: 'pointer' }}>
                    {showComments[post._id] ? 'Hide Comments' : 'Show Comments'}
                  </button>
                  <span>💬 {commentCounts[post._id] || 0}</span>
                </div>
                {showComments[post._id] && (
                  <div style={{ borderTop: '1px solid #eee', marginTop: '10px', paddingTop: '10px' }}>
                    {comments[post._id]?.length === 0 ? (
                      <p style={{ fontStyle: 'italic', color: '#666' }}>No comments yet</p>
                    ) : (
                      comments[post._id]?.map(comment => (
                        <div key={comment._id} style={{ marginBottom: '8px' }}>
                          <strong>{comment.authorName}</strong>: {comment.comment}
                          <div style={{ fontSize: '12px', color: '#999' }}>{new Date(comment.datePosted).toLocaleString()}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
};

export default AccountPage;
