// This is page for public profile view. AKA Other users looking at your profile

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const ProfilePage = () => {
  const { username } = useParams();
  const [viewedUser, setViewedUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch user data
        const userRes = await fetch(`/users/byUsername/${username}`);
        if (!userRes.ok) {
          throw new Error('User not found');
        }
        const userData = await userRes.json();
        setViewedUser(userData);

        // Fetch user's posts
        const postsRes = await fetch(`/api/posts?user=${userData._id}`);
        const postsData = await postsRes.json();
        setUserPosts(postsData.posts || []);
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [username]);

  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (!viewedUser) {
    return <div>User not found</div>;
  }

  return (
    <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Profile Section */}
        <div style={{ flex: 1 }}>
          <img 
            src={viewedUser.profilePictureUrl || '/profileImages/default.png'} 
            alt="Profile" 
            style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover' }} 
          />
          <h2>{viewedUser.name}'s Profile</h2>
          <p><strong>Member Since:</strong> {new Date(viewedUser.createdAt).toLocaleDateString()}</p>
          <p><strong>Bio:</strong> {viewedUser.bio || 'No bio yet'}</p>
          <p><strong>Total Posts:</strong> {viewedUser.totalPosts || 0}</p>
        </div>

        {/* Posts Section */}
        <div style={{ flex: 2 }}>
          <h3>Posts</h3>
          {userPosts.length === 0 ? (
            <p>No posts yet.</p>
          ) : (
            userPosts.map(post => (
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
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
};

export default ProfilePage;
