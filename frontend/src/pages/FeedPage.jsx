import React, { useEffect, useState } from 'react';

const FeedPage = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('/api/posts');
        const data = await response.json();

        const sortedPosts = data.posts.sort(
          (a, b) => new Date(b.datePosted) - new Date(a.datePosted)
        );

        setPosts(sortedPosts);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      }
    };

    fetchPosts();
  }, []);

  return (
    <main style={{ padding: '20px' }}>
      <h2>Feed</h2>

      {posts.length === 0 ? (
        <p>No posts yet.</p>
      ) : (
        posts.map((post) => (
          <div
            key={post._id}
            style={{
              border: '1px solid #ccc',
              padding: '15px',
              marginBottom: '15px',
              borderRadius: '8px',
              backgroundColor: '#f9f9f9',
            }}
          >
            <p><strong>User:</strong> {post.authorName}</p>
            <p><strong>Fish Type:</strong> {post.species || 'Unknown'}</p>
            <p><strong>Description:</strong> {post.description || 'No description'}</p>
            {post.weight && <p><strong>Weight:</strong> {post.weight}</p>}
            {post.length && <p><strong>Length:</strong> {post.length}</p>}
            <p><em>Posted on {new Date(post.datePosted).toLocaleString()}</em></p>
          </div>
        ))
      )}
    </main>
  );
};

export default FeedPage;
