/**
 * @file Controls the posts API
 * @description
 * This is an ExpressJS Router that specifically handles posts
 * 
 * @author Spencer Lee
 * 
 */

import { Collection, Db } from 'mongodb';
import { getDatabase } from '../clients/mongoclient';
import { Post, postSchema, User, Comment } from '../schemas/index';

const express = require('express');
const router = express.Router();

// Get recent posts
router.get('/', async (req, res) => {
    // TODO: add options for filters + pagination
    const database : Db = await getDatabase();
    const postsCollection : Collection<Post> = await database.collection("Posts");

    let posts = await postsCollection.find()
        .sort({ createdAt: -1 }) // Sort in descending order by createdAt
        .limit(10) // Limit the result to 5 documents
        .toArray(); // Convert the result to an array

    res.send(posts);
});

// Post creation
router.post('/', async (req, res) => {
    // TODO: check session authentication
    const database : Db = await getDatabase();
    const postsCollection : Collection<Post> = await database.collection("Posts");

    let result = postSchema.safeParse(req.body);

    // Validate post
    if (!result.success) return res.status(400).send('Invalid post structure');

    let postData : Post = result.data;
    
    postsCollection.insertOne(postData);

    res.sendStatus(200);
});
  
module.exports = router;