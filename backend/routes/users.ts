/**
 * @file Controls the users API
 * @description
 * This is an ExpressJS Router that specifically handles users
 * 
 * @author Spencer Lee
 * 
 */

import { Collection, Db, ObjectId } from 'mongodb';
import { getDatabase } from '../clients/mongoclient';
import { Post, postSchema, User, Comment } from '../schemas/index';

const express = require('express');
const router = express.Router();

// Get user data
router.get('/:userid', async (req, res) => {
    const database : Db = await getDatabase();
    const usersCollection : Collection<User> = await database.collection("Users");

    let user = await usersCollection.findOne({
        _id : req.params.userid
    });

    if (user == null) return res.status(404).send("Invalid user");

    if (user.password) {
        user.password = null;
    }

    res.send(user);

    res.sendStatus(200);
});

// User creation
router.get('/create', async (req, res) => {
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
  
export const usersRouter = router;