import React, { useEffect, useState } from 'react';

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
            <p><strong>🎣 Angler:</strong> {post.authorName || "Unknown"}</p>
            <p><strong>🐟 Fish Type:</strong> {post.species || "Unknown Fish"}</p>
            <p><strong>📝 Description:</strong> {post.description || "No description"}</p>
            {post.bait && <p><strong>🪱 Bait:</strong> {post.bait}</p>}
            {post.waterType && <p><strong>💧 Water:</strong> {post.waterType}</p>}
            {post.weight && <p><strong>⚖️ Weight:</strong> {post.weight}</p>}
            {post.length && <p><strong>📏 Length:</strong> {post.length}</p>}
            <p>
              <strong>🕒 Caught:</strong> {new Date(post.dateCaught).toLocaleString()}{" "}
              {post.weather && post.weather.weathercode !== undefined
                ? getWeatherIcon(post.weather.weathercode)
                : ""}
            </p>
            {post.moonPhase && <p><strong>🌙 Moon:</strong> {post.moonPhase}</p>}
            {post.weather && (
              <>
                <p><strong>🌡️ Temp:</strong> {post.weather.temperature ?? "?"}°F</p>
                <p><strong>💧 Precip:</strong> {post.weather.precipitation ?? "?"} in</p>
                <p><strong>🌬️ Wind:</strong> {post.weather.windspeed ?? "?"} mph</p>
              </>
            )}

            <p style={{ fontStyle: 'italic' }}>Posted on {new Date(post.datePosted).toLocaleString()}</p>
          </div>
        ))
      )}
    </main>
  );
};

export default FeedPage;
