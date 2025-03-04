import { Collection, Db } from 'mongodb';
import { getDatabase } from './clients/mongoclient';

const express = require('express');
const app = express();

// Configure environment variables
import dotenv from 'dotenv';
dotenv.config();

app.use('/', (req, res) => {
  res.send(200);
});

// Posts API
app.route('/posts')
  .get(async (req, res) => {
    const database : Db = await getDatabase();
    const postsCollection : Collection<Comment> = await database.collection("Comments");

    
    res.send('feed of posts will go here');
  })
  .post((req, res) => {
    res.send('Add a post here');
  })

app.listen(5000, () => console.log('API is running on http://localhost:5000/'));
