import { postsRouter, usersRouter } from "./routes";
import * as cors from "cors";
const uploadRouter = require('./routes/upload');
const express = require('express');
const path = require('path');
const app = express();

// Configure environment variables
require('dotenv').config();

// Configure CORS to allow the React app
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Ensure uploads directory exists and serve it statically
const fs = require('fs');
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// 🔥 ✅ Add upload router
app.use('/upload', uploadRouter);

// Posts API routes
app.use('/api/posts', postsRouter);

// Test route (unchanged)
app.post('/api/test-log', (req, res) => {
  console.log("✅ HIT /api/test-log:", req.body);
  res.send("Logged!");
});

// Users API routes
app.use('/users', usersRouter);

// Root route
app.get('/', (req, res) => {
  res.sendStatus(200);
});

app.listen(5000, () => console.log('API is running on http://localhost:5000/'));
