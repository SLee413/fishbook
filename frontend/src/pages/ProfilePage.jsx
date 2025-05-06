// FINAL FINAL - Comment section now truly matches AccountPage layout
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [viewedUser, setViewedUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [showComments, setShowComments] = useState({});
  const [comments, setComments] = useState({});
  const [newComments, setNewComments] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);

        const userRes = await fetch(`/users/byUsername/${username}`);
        if (!userRes.ok) throw new Error('User not found');
        const userData = await userRes.json();
        setViewedUser(userData);

        const postsRes = await fetch(`/api/posts?user=${userData._id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const postsData = await postsRes.json();

        const postsWithLiked = (postsData.posts || []).map(post => ({
          ...post,
          liked: post.liked || false,
        }));

        // ✅ Sort posts newest to oldest
        postsWithLiked.sort((a, b) => new Date(b.datePosted) - new Date(a.datePosted));

        setUserPosts(postsWithLiked);
        fetchInitialCommentData(postsWithLiked);
      } catch (err) {
        console.error('Error loading profile:', err);
      }
    };

    const fetchInitialCommentData = async (posts) => {
      try {
        const commentData = {};
        await Promise.all(posts.map(async (post) => {
          const res = await fetch(`/api/posts/${post._id}/comments`);
          const data = await res.json();
          commentData[post._id] = data.comments || [];
        }));
        setComments(commentData);
      } catch (err) {
        console.error('Error loading comments:', err);
      }
    };

    fetchUserData();
  }, [username]);

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

  const handleLike = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return alert('Login to like');

      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setUserPosts(prev => prev.map(p => p._id === postId ? { ...p, likes: data.likes, liked: data.liked } : p));
      }
    } catch (err) {
      console.error('Like failed:', err);
    }
  };

  const toggleComments = (postId) => {
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleSubmitComment = async (e, postId) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return alert('Login to comment');

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newComments[postId] }),
      });

      if (res.ok) {
        const updated = await fetch(`/api/posts/${postId}/comments`).then(r => r.json());
        setComments(prev => ({ ...prev, [postId]: updated.comments || [] }));
        setNewComments(prev => ({ ...prev, [postId]: '' }));
      }
    } catch (err) {
      console.error('Comment error:', err);
    }
  };

  if (!viewedUser) return <div>Loading...</div>;

  return (
    <main style={{ padding: '20px 40px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '40px' }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <img
            src={viewedUser.profilePictureUrl || '/profileImages/default.png'}
            alt="Profile"
            style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <h2>{viewedUser.username || viewedUser.name}'s Profile</h2>
          <p><strong>Member Since:</strong> {formatDate(viewedUser.createdAt)}</p>
          <p><strong>Bio:</strong> {viewedUser.bio || 'No bio yet'}</p>
          <p><strong>Total Posts:</strong> {userPosts.length}</p>
        </div>

        <div style={{ flex: 3 }}>
          <h3>Posts</h3>
          {userPosts.length === 0 ? (
            <p>No posts yet.</p>
          ) : (
            userPosts.map(post => (
              <div key={post._id} style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '12px', marginBottom: '30px', backgroundColor: '#fff' }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <img src={post.imageUrl} alt="Catch" style={{ width: '450px', height: '450px', objectFit: 'cover', borderRadius: '8px' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
                      <button onClick={() => handleLike(post._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: post.liked ? '#ff4b4b' : '#666' }}>
                        {post.liked ? '❤️' : '🤍'}
                      </button>
                      <span>{post.likes || 0}</span>
                      <button onClick={() => toggleComments(post._id)} style={{ background: 'none', border: 'none', color: '#1e3a8a', cursor: 'pointer' }}>
                        {showComments[post._id] ? 'Hide Comments' : 'Show Comments'}
                      </button>
                      <span>{comments[post._id]?.length || 0}</span>
                    </div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <p><strong>🐟 Fish:</strong> {post.species}</p>
                    <p><strong>📝 Description:</strong> {post.description}</p>
                    {post.bait && <p><strong>🪱 Bait:</strong> {post.bait}</p>}
                    {post.waterType && <p><strong>💧 Water:</strong> {post.waterType}</p>}
                    {post.weight && <p><strong>⚖️ Weight:</strong> {post.weight} {post.weightUnit}</p>}
                    {post.length && <p><strong>📏 Length:</strong> {post.length} {post.lengthUnit}</p>}
                    {post.dateCaught && <p><strong>🕒 Caught:</strong> {formatDate(post.dateCaught)}</p>}
                    {post.moonPhase && <p><strong>🌙 Moon:</strong> {post.moonPhase}</p>}
                    {post.weather && (<>
                      <p><strong>🌡️ Temp:</strong> {post.weather.temperature}°F</p>
                      <p><strong>💧 Precip:</strong> {post.weather.precipitation} in</p>
                      <p><strong>🌬️ Wind:</strong> {post.weather.windspeed} mph</p>
                    </>)}
                    <p style={{ fontStyle: 'italic' }}>Posted on {formatDate(post.datePosted)}</p>
                  </div>
                </div>

                {showComments[post._id] && (
                  <div style={{ marginTop: '20px', paddingTop: '10px' }}>
                    {comments[post._id]?.map(comment => (
                      <div key={comment._id} style={{ marginBottom: '8px' }}>
                        <strong>{comment.authorName}</strong>: {comment.comment}
                        <div style={{ fontSize: '12px', color: '#999' }}>{new Date(comment.datePosted).toLocaleString()}</div>
                      </div>
                    ))}
                    {isLoggedIn && (
                      <form onSubmit={(e) => handleSubmitComment(e, post._id)} style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <input
                          type="text"
                          value={newComments[post._id] || ''}
                          onChange={(e) => setNewComments(prev => ({ ...prev, [post._id]: e.target.value }))}
                          placeholder="Add a comment..."
                          style={{ flex: 1, padding: '8px 12px', borderRadius: '20px', border: '1px solid #ccc' }}
                        />
                        <button type="submit" style={{ backgroundColor: '#1e3a8a', color: 'white', border: 'none', borderRadius: '20px', padding: '8px 16px', cursor: 'pointer' }}>
                          Post
                        </button>
                      </form>
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

export default ProfilePage;
