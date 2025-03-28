/**
 * @file Controls the posts API
 * @description
 * This is an ExpressJS Router that specifically handles posts and comments
 * 
 * @author Spencer Lee
 * 
 */

import { Collection, Db, ObjectId } from 'mongodb';
import { getDatabase } from '../clients/mongoclient';
import { Post, postSchema, User, Comment, commentSchema } from '../schemas/index';

const express = require('express');
const router = express.Router();
const auth = require('./authentication');

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
router.post('/user/:userid', auth, async (req, res) => {
    try {
        // TODO: check session authentication
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

        // basic info for new posts
        let newPost : Post = {
            authorId : user._id,
            datePosted : new Date(),
            likes : 0
        }

        // Transfer properties from body to post
        for (let property in req.body) {
            if (!newPost[property]) {
                // If it's the dateCaught, we turn it into a Date object
                if (property == "dateCaught") {
                    newPost[property] = new Date(req.body[property]);
                } else {
                    newPost[property] = req.body[property];
                }
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

// Get comments of a post
router.get('/:postid/comments', async (req, res) => {
    // TODO: pagination
    const database : Db = await getDatabase();
    const commentsCollection : Collection<Comment> = await database.collection("Comments");

    // Ensure postid is valid
    if (!ObjectId.isValid(req.params.postid)) return res.status(404).send("Invalid post");

    let comments = await commentsCollection.find({
        postId : new ObjectId(req.params.postid)
    })
        .sort({ createdAt: -1 }) // Sort in descending order by createdAt
        .limit(10) // Limit the result to 5 documents
        .toArray(); // Convert the result to an array

    res.send(comments);
});

// Create a comment on a post
router.post('/:postid/comments', auth, async (req, res) => {
    const database : Db = await getDatabase();
    const postsCollection : Collection<Post> = await database.collection("Posts");
    const commentsCollection : Collection<Comment> = await database.collection("Comments");

    // Ensure postid is valid
    if (!ObjectId.isValid(req.params.postid)) return res.status(404).send("Invalid post");

    // Ensure post exists
    let post = await postsCollection.findOne({
        _id : new ObjectId(req.params.postid)
    });
    if (post == null) return res.status(404).send("Invalid post");

    let newComment : Comment = {
        postId : post._id,
        datePosted : new Date(),
        authorId : new ObjectId(req.userId)
    }

    // Transfer properties from body to comment
    for (let property in req.body) {
        if (!newComment[property]) {
            newComment[property] = req.body[property];
        }
    }
    let result = commentSchema.safeParse(newComment);

    // Validate user
    if (!result.success) return res.status(400).send('Invalid comment');

    let commentData : Comment = result.data;
        
    commentsCollection.insertOne(commentData);

    res.status(201).send("Created");
});

export const postsRouter = router;