import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const ProfilePage = () => {
  const { userid } = useParams();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/users/${userid}`);
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
    };

    const fetchPosts = async () => {
      try {
        const res = await fetch(`/api/posts?user=${userid}`);
        const data = await res.json();
        setPosts(data.posts || []);
      } catch (err) {
        console.error('Failed to fetch posts:', err);
      }
    };

    fetchUser();
    fetchPosts();
  }, [userid]);

  if (!user) {
    return <main><p>Loading profile...</p></main>;
  }

  return (
    <main style={{ padding: '20px' }}>
      <h2>{user.name}'s Profile</h2>
      <img src={user.profilePictureUrl || "/default.png"} alt="Profile" style={{ width: '100px', borderRadius: '50%' }} />
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Member Since:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
      <p><strong>Bio:</strong> {user.bio || "No bio yet."}</p>

      <h3>Posts:</h3>
      {posts.length === 0 ? (
        <p>This user hasn't posted anything yet.</p>
      ) : (
        <ul>
          {posts.map((post) => (
            <li key={post._id}>
              <strong>🐟 {post.species || "Fish"}:</strong> {post.description || "No description"} <br />
              <small>📅 {new Date(post.dateCaught).toLocaleDateString()}</small>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
};

export default ProfilePage;
