const express = require('express');
const path = require('path');
const app = express();

const postsRouter = require('./routes/posts');

// Configure environment variables
require('dotenv').config();

// Posts API
app.use('/posts', postsRouter);

app.get('/', (req, res) => {
	res.sendStatus(200);
});



app.listen(5000, () => console.log('API is running on http://localhost:5000/'));
