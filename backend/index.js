// backend/index.js
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/build')));

// --- Simple In-Memory User Store ---
const users = {}; // { username: password }

// Register
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  console.log('Register request:', username);

  if (users[username]) {
    return res.status(400).json({ message: 'User already exists' });
  }
  users[username] = password;
  res.json({ message: 'Registration successful' });
});

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  console.log('Login request:', username);

  if (users[username] !== password) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }
  res.json({ message: 'Login successful' });
});

// Default route
app.get('/', (req, res) => {
  res.send('Express Server is running');
});

// Catch-all: serve React frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
