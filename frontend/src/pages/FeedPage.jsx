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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
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
                      border: '2px solid #ccc'
                    }}
                  />
                )}
                <span style={{ fontWeight: 'bold', fontSize: '18px' }}>
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
                <p><strong>🕒 Caught:</strong> {formatDate(post.dateCaught)}</p>
              )}
              {post.moonPhase && <p><strong>🌙 Moon:</strong> {post.moonPhase}</p>}
              {post.weather && (
                <>
                  <p><strong>🌡️ Temp:</strong> {post.weather.temperature ?? "?"}°F</p>
                  <p><strong>💧 Precip:</strong> {post.weather.precipitation ?? "?"} in</p>
                  <p><strong>🌬️ Wind:</strong> {post.weather.windspeed ?? "?"} mph</p>
                  <p>{post.weather.weathercode !== undefined ? getWeatherIcon(post.weather.weathercode) : ""}</p>
                </>
              )}
              <p style={{ fontStyle: 'italic', marginTop: '10px' }}>
                Posted on {formatDate(post.datePosted)}
              </p>
            </div>
          </div>
        ))
      )}
    </main>
  );
};

export default FeedPage;
