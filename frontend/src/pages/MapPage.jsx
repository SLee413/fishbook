import React from 'react';
import Header from '../components/Header';

const MapPage = () => {
  return (
    <div>
      <Header />
      <main style={{ padding: '20px' }}>
        <h2>Map Page</h2>
        <p>This is where the fishing map will be displayed.</p>
        {/* You can add your map component or integration here */}
      </main>
    </div>
  );
};

export default MapPage;
