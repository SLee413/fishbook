import React, { useEffect, useState } from 'react';

const FeedPage = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    // Simulate fetching posts (newest first)
    const mockPosts = [
      {
        id: 1,
        username: 'angler123',
        description: 'Caught a monster bass today!',
        fishType: 'Bass',
        weight: '4.2 lbs',
        length: '19 inches',
        timestamp: new Date('2025-03-30T14:00:00'),
      },
      {
        id: 2,
        username: 'troutlover',
        description: 'Early morning catch 🐟',
        fishType: 'Trout',
        weight: '2.1 lbs',
        length: '15 inches',
        timestamp: new Date('2025-03-31T08:30:00'),
      },
    ];

    // Sort from newest to oldest
    const sorted = mockPosts.sort((a, b) => b.timestamp - a.timestamp);
    setPosts(sorted);
  }, []);

  return (
    <main style={{ padding: '20px' }}>
      <h2>Feed</h2>

      {posts.length === 0 ? (
        <p>No posts yet.</p>
      ) : (
        posts.map((post) => (
          <div key={post.id} style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '15px' }}>
            <p><strong>User:</strong> {post.username}</p>
            <p><strong>Fish Type:</strong> {post.fishType}</p>
            <p><strong>Description:</strong> {post.description}</p>
            {post.weight && <p><strong>Weight:</strong> {post.weight}</p>}
            {post.length && <p><strong>Length:</strong> {post.length}</p>}
            <p><em>Posted on {post.timestamp.toLocaleString()}</em></p>
          </div>
        ))
      )}
    </main>
  );
};

export default FeedPage;
