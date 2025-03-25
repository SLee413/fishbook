/**
 * @file Controls the posts API
 * @description
 * This is an ExpressJS Router that specifically handles posts
 * 
 * @author Spencer Lee
 * 
 */

import { Collection, Db, ObjectId } from 'mongodb';
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

// Get user's posts
router.get('/user/:userid', async (req, res) => {
    try {
        const database : Db = await getDatabase();
        const postsCollection : Collection<Post> = await database.collection("Posts");
        const usersCollection : Collection<User> = await database.collection("Users");

        // Ensure userid is valid
        if (!ObjectId.isValid(req.params.userid)) return res.status(404).send("Invalid user");

        // Ensure user is a valid user
        let user = await usersCollection.findOne({
            _id : new ObjectId(req.params.userid)
        });
        if (user == null) return res.status(400).send("Invalid user");

        let posts = await postsCollection.find({
            authorId : user._id
        })
            .sort({ createdAt: -1 }) // Sort in descending order by createdAt
            .limit(10) // Limit the result to 5 documents
            .toArray(); // Convert the result to an array


        res.send(posts);
    } catch {
        res.sendStatus(500);
    }
});

// Post creation
router.post('/user/:userid', async (req, res) => {
    try {
        // TODO: check session authentication
        const database : Db = await getDatabase();
        const postsCollection : Collection<Post> = await database.collection("Posts");
        const usersCollection : Collection<User> = await database.collection("Users");

        // Ensure user is a valid user
        let user = await usersCollection.findOne({
            _id : req.params.userid
        });
        if (user == null) return res.status(400).send("Invalid user");

        // basic info for new posts
        let newPost : Post = {
            authorId : user._id,
            datePosted : new Date(),
            likes : 0
        }

        // Transfer properties from body to post
        for (let property in req.body) {
            if (!newPost[property]) {
                newPost[property] = req.body[property];
            }
        }

        let result = postSchema.safeParse(newPost);

        // Validate post
        if (!result.success) return res.status(400).send('Invalid post structure');

        let postData : Post = result.data;
        
        postsCollection.insertOne(postData);

        res.sendStatus(200);
    } catch {
        res.sendStatus(500);
    }
});



export const postsRouter = router;