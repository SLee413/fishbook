// backend/index.js
const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 5000;

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Default route for testing
app.get('/', (req, res) => {
  res.send('Express Server is running');
});

// Catch-all route to serve React on any other paths
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
