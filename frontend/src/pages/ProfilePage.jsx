// This is page for public profile view. AKA Other users looking at your profile

import React from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const { username } = useParams();
  const navigate = useNavigate();

  // Simulated user and posts (replace with fetch call later)
  const viewedUser = {
    username: username,
    memberSince: 'January 2023',
    bio: 'Avid fisher and lake explorer.',
    profilePic: 'https://via.placeholder.com/100',
  };

  const posts = [
    { content: 'Caught a big one today!' },
    { content: 'Anyone know a good spot near Des Moines?' },
  ];

  return (
    <main style={{ padding: '20px' }}>
      <h2>{viewedUser.username}'s Profile</h2>
      <img src={viewedUser.profilePic} alt="Profile" style={{ width: '100px', borderRadius: '50%' }} />
      <p><strong>Member Since:</strong> {viewedUser.memberSince}</p>
      <p><strong>Bio:</strong> {viewedUser.bio}</p>

      <h3>Posts:</h3>
      <ul>
        {posts.map((post, i) => (
          <li key={i}>{post.content}</li>
        ))}
      </ul>
    </main>
  );
};

export default ProfilePage;
