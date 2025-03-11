import React, { useState } from 'react';


const CreatePost = () => {
  const [postContent, setPostContent] = useState('');

  const handlePostSubmit = (e) => {
    e.preventDefault();
    console.log('Post submitted:', postContent);
    setPostContent('');
    alert('Your post has been submitted!');
  };

  return (
    <div>
      <main style={{ padding: '20px' }}>
        <h2>Create a Post</h2>
        <form onSubmit={handlePostSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
          <textarea
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            placeholder="Write your post here..."
            rows={5}
            style={{ padding: '10px', fontSize: '16px' }}
          />
          <button type="submit" style={{ padding: '10px', fontSize: '16px', cursor: 'pointer' }}>Post</button>
        </form>
      </main>
    </div>
  );
};

export default CreatePost;
