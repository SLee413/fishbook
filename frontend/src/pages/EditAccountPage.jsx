import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const EditAccountPage = ({ user, handleLogout }) => {
  const [bio, setBio] = useState(user?.bio || '');
  const [profilePic, setProfilePic] = useState(user?.profilePic || '');

  const navigate = useNavigate();

  const handleSave = () => {
    alert('Account changes saved!');
    // Future: send update to backend
  };

  return (
    <main style={{ padding: '20px' }}>
      <h2>Edit Your Account</h2>
      {user ? (
        <div>
          <img src={profilePic} alt="Profile" style={{ width: '100px', borderRadius: '50%' }} />
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Member Since:</strong> {user.memberSince}</p>

          <div style={{ marginTop: '10px' }}>
            <label>Bio:</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} style={{ width: '100%' }} />
          </div>

          <div style={{ marginTop: '10px' }}>
            <label>Profile Picture URL:</label>
            <input type="text" value={profilePic} onChange={(e) => setProfilePic(e.target.value)} style={{ width: '100%' }} />
          </div>

          <div style={{ marginTop: '10px' }}>
            <button onClick={handleSave}>Save Changes</button>
            <button onClick={handleLogout} style={{ marginLeft: '10px' }}>Logout</button>
          </div>
        </div>
      ) : (
        <p>No user info available.</p>
      )}
    </main>
  );
};

export default EditAccountPage;
