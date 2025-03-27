import { postsRouter, usersRouter } from "./routes";
const express = require('express');
const path = require('path');
const app = express();

// Configure environment variables
require('dotenv').config();

// Parse JSON bodies
app.use(express.json());

// Posts API
app.use('/posts', postsRouter);

// Users API
app.use('/users', usersRouter);

app.get('/', (req, res) => {
	res.sendStatus(200);
});



app.listen(5000, () => console.log('API is running on http://localhost:5000/'));
