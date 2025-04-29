import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; 

const getWeatherIcon = (code) => {
  const icons = {
    0: "☀️",
    1: "🌤️",
    2: "⛅",
    3: "☁️",
    45: "🌫️",
    48: "🌫️",
    51: "🌦️",
    61: "🌧️",
    71: "❄️",
    80: "🌦️",
    95: "⛈️",
    99: "⛈️",
  };
  return icons[code] || "❓";
};

const CommentSection = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [commentCount, setCommentCount] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const navigate = useNavigate();

  // Fetch comment count on initial load
  useEffect(() => {
    fetchCommentCount();
  }, [postId]);

  const fetchCommentCount = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`);
      const data = await response.json();
      setCommentCount(data.comments?.length || 0);
    } catch (error) {
      console.error('Failed to fetch comment count:', error);
    }
  };

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/posts/${postId}/comments`);
      const data = await response.json();
      setComments(data.comments || []);
      setCommentCount(data.comments?.length || 0);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('Please login to comment');
      return;
    }
    
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newComment }), // Change 'comment' to 'content'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Comment posted successfully:', data);
        setNewComment('');
        fetchComments();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to post comment');
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
      alert('Failed to post comment. Please try again.');
    }
  };

  // Toggle comments visibility and fetch if needed
  const toggleComments = () => {
    if (!showComments && comments.length === 0) {
      fetchComments();
    }
    setShowComments(!showComments);
  };

  // Handle profile navigation when clicking on a username
  const handleProfileClick = (username) => {
    navigate(`/profile/${username}`);
  };

  return (
    <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
      <button 
        onClick={toggleComments} 
        style={{
          background: 'none',
          border: 'none',
          color: '#1e3a8a',
          cursor: 'pointer',
          fontWeight: 'bold',
          padding: '5px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}
      >
        <span>
          {showComments ? 'Hide Comments' : 'Show Comments'}
        </span>
        <span style={{ 
          backgroundColor: '#eee', 
          padding: '2px 8px', 
          borderRadius: '10px', 
          fontSize: '0.8em'
        }}>
          {commentCount}
        </span>
      </button>
      
      {showComments && (
        <div>
          {loading ? (
            <p>Loading comments...</p>
          ) : (
            <>
              {comments.length === 0 ? (
                <p style={{ color: '#666', fontStyle: 'italic' }}>No comments yet</p>
              ) : (
                <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '15px' }}>
                  {comments.map((comment) => (
                    <div 
                      key={comment._id} 
                      style={{ 
                        padding: '10px', 
                        borderBottom: '1px solid #eee',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px'
                      }}
                    >
                      {comment.authorProfilePicture && (
                        <img 
                          src={comment.authorProfilePicture} 
                          alt={comment.authorName} 
                          style={{
                            width: '35px',
                            height: '35px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            cursor: 'pointer'
                          }}
                          onClick={() => handleProfileClick(comment.authorName)}
                        />
                      )}
                      <div>
                        <div 
                          style={{ 
                            fontWeight: 'bold', 
                            cursor: 'pointer',
                            color: '#1e3a8a',
                            textDecoration: 'underline'
                          }}
                          onClick={() => handleProfileClick(comment.authorName)}
                        >
                          {comment.authorName}
                        </div>
                        <div>{comment.comment}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {new Date(comment.datePosted).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <form onSubmit={handleSubmitComment} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '20px',
                    border: '1px solid #ccc',
                    outline: 'none',
                  }}
                />
                <button 
                  type="submit"
                  style={{
                    backgroundColor: '#1e3a8a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                  }}
                >
                  Post
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const FeedPage = () => {
  const [posts, setPosts] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate(); 

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    
    const fetchPosts = async () => {
      try {
        // Include auth token if available to get the liked status
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        const response = await fetch('/api/posts', {
          headers
        });
        
        const data = await response.json();

        // Ensure posts are properly sorted
        const sortedPosts = data.posts.sort(
          (a, b) => new Date(b.datePosted) - new Date(a.datePosted)
        );

        // Make sure each post has a liked property
        const postsWithLikedStatus = sortedPosts.map(post => ({
          ...post,
          liked: post.liked || false // Default to false if not provided
        }));

        setPosts(postsWithLikedStatus);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      }
    };

    fetchPosts();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const handleLike = async (postId) => {
    try {
      //Grabbing the auth. token
      const token = localStorage.getItem('token');
      
      //Checking if logged in
      if (!token) {
        alert('Please login to like posts');
        return;
      }
      
      // Making a POST request
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          //Including the auth. token in request
          'Authorization': `Bearer ${token}`,        
        }
      });
  
      if (response.ok) {
        const data = await response.json();
        
        // Update the posts
        setPosts(prevPosts => prevPosts.map(post => {
          // Find the post 
          if (post._id === postId) {
            return {
              ...post,              
              likes: data.likes,    
              liked: data.liked     
            };
          }
          return post;
        }));
      }
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  // Handle profile navigation when clicking on a username
  const handleProfileClick = (username) => {
    navigate(`/profile/${username}`);
  };

  return (
    <main style={{ padding: '20px' }}>
      {posts.length === 0 ? (
        <p>No posts yet.</p>
      ) : (
        posts.map((post) => (
          <div
            key={post._id}
            style={{
              display: 'flex',
              flexDirection: 'row',
              border: '1px solid #ccc',
              padding: '20px',
              marginBottom: '20px',
              borderRadius: '8px',
              backgroundColor: '#f9f9f9',
              gap: '20px',
              alignItems: 'flex-start',
            }}
          >
            {/* Left side - Profile and Image */}
            <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              {/* Profile Pic + Username */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '10px',
                gap: '10px'
              }}>
                {post.authorProfilePicture && (
                  <img
                    src={post.authorProfilePicture}
                    alt="Profile"
                    style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #ccc',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleProfileClick(post.authorName)}
                    title={`View ${post.authorName}'s profile`}
                  />
                )}
                <span
                  style={{ 
                    fontWeight: 'bold', 
                    fontSize: '18px', 
                    cursor: 'pointer', 
                    color: '#1e3a8a', 
                    textDecoration: 'underline' 
                  }}
                  onClick={() => handleProfileClick(post.authorName)}
                  title={`View ${post.authorName}'s profile`}
                >
                  {post.authorName || "Unknown"}
                </span>
              </div>

              {/* Post Image */}
              {post.imageUrl && (
                <img
                  src={post.imageUrl}
                  alt="Catch"
                  style={{
                    width: '450px',
                    height: '450px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    marginTop: '5px'
                  }}
                />
              )}
            </div>

            {/* Right side - Post Info */}
            <div style={{ flex: 1, marginTop: '70px' }}>
              {/* Like Button */}
              <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => handleLike(post._id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '24px',
                    color: post.liked ? '#ff4b4b' : '#666',
                    transition: 'transform 0.2s',
                    transform: post.liked ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  {post.liked ? '❤️' : '🤍'}
                </button>
                <span style={{ fontSize: '16px', color: '#666' }}>
                  {post.likes || 0} {post.likes === 1 ? 'like' : 'likes'}
                </span>
              </div>

              <p><strong>🐟 Fish Type:</strong> {post.species || "Unknown Fish"}</p>
              <p><strong>📝 Description:</strong> {post.description || "No description"}</p>
              {post.bait && <p><strong>🪱 Bait:</strong> {post.bait}</p>}
              {post.waterType && <p><strong>💧 Water:</strong> {post.waterType}</p>}
              {post.weight && (
                <p><strong>⚖️ Weight:</strong> {post.weight} {post.weightUnit || "lbs"}</p>
              )}
              {post.length && (
                <p><strong>📏 Length:</strong> {post.length} {post.lengthUnit || "in"}</p>
              )}
              {post.dateCaught && (
                <p>
                  <strong>🕒 Caught:</strong> {formatDate(post.dateCaught)}{" "}
                  {post.weather && post.weather.weathercode !== undefined && getWeatherIcon(post.weather.weathercode)}
                </p>
              )}
              {post.moonPhase && <p><strong>🌙 Moon:</strong> {post.moonPhase}</p>}
              {post.weather && (
                <>
                  <p><strong>🌡️ Temp:</strong> {post.weather.temperature ?? "?"}°F</p>
                  <p><strong>💧 Precip:</strong> {post.weather.precipitation ?? "?"} in</p>
                  <p><strong>🌬️ Wind:</strong> {post.weather.windspeed ?? "?"} mph</p>
                </>
              )}
              <p style={{ fontStyle: 'italic', marginTop: '10px' }}>
                Posted on {formatDate(post.datePosted)}
              </p>
              
              {/* Comments Section */}
              <CommentSection postId={post._id} />
            </div>
          </div>
        ))
      )}
    </main>
  );
};

export default FeedPage;