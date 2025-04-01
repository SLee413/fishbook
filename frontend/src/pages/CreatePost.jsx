import React, { useState } from 'react';

const CreatePost = () => {
  const [description, setDescription] = useState('');
  const [fishType, setFishType] = useState('');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');

  const handlePostSubmit = (e) => {
    e.preventDefault();

    const postData = {
      description,
      fishType,
      weight: weight || null,
      length: length || null,
    };

    console.log('Post submitted:', postData);
    alert('Your post has been submitted!');

    // Clear fields
    setDescription('');
    setFishType('');
    setWeight('');
    setLength('');
  };

  return (
    <main style={{ padding: '20px' }}>
      <h2>Create a Post</h2>
      <form
        onSubmit={handlePostSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}
      >
        <label>
          Description:
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Write your post description..."
            rows={5}
            style={{ padding: '10px', fontSize: '16px' }}
            required
          />
        </label>

        <label>
          Fish Type:
          <input
            type="text"
            value={fishType}
            onChange={(e) => setFishType(e.target.value)}
            placeholder="e.g., Bass, Trout"
            style={{ padding: '10px', fontSize: '16px' }}
            required
          />
        </label>

        <label>
          Weight (optional):
          <input
            type="text"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g., 3.5 lbs"
            style={{ padding: '10px', fontSize: '16px' }}
          />
        </label>

        <label>
          Length (optional):
          <input
            type="text"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            placeholder="e.g., 18 inches"
            style={{ padding: '10px', fontSize: '16px' }}
          />
        </label>

        <button type="submit" style={{ padding: '10px', fontSize: '16px', cursor: 'pointer' }}>
          Post
        </button>
      </form>
    </main>
  );
};

export default CreatePost;
