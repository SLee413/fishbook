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
import { Post, postSchema, User, Comment, userSchema } from '../schemas/index';

const express = require('express');
const router = express.Router();

// Get user data
router.get('/:userid', async (req, res) => {
// TODO: wrap in try catch block

    const database : Db = await getDatabase();
    const usersCollection : Collection<User> = await database.collection("Users");

    // Ensure userid is valid
    if (!ObjectId.isValid(req.params.userid)) return res.status(404).send("Invalid user");

    // Find the user
    let user = await usersCollection.findOne({
        _id : new ObjectId(req.params.userid)
    });

    if (user == null) return res.status(404).send("Invalid user");

    // Don't send everyone this user's password
    if (user.password) {
        delete user["password"];
    }
    

    res.send(user);
});

// User creation
router.post('/create', async (req, res) => {
    // TODO: create user enpoint
    const database : Db = await getDatabase();
    const usersCollection : Collection<User> = await database.collection("Users");

    // Get a new user started
    let newUser : User = {
        createdAt : new Date(),
        lastLoginAt : new Date(),
    }

    // Transfer properties from body to post
    for (let property in req.body) {
        if (!newUser[property]) {
            newUser[property] = req.body[property];
        }
    }
    let result = userSchema.safeParse(newUser);

    // Validate user
    if (!result.success) return res.status(400).send('Invalid user');

    // Ensure username isn't taken
    let otherUser = await usersCollection.findOne({
        name : newUser.name
    });
    if (otherUser) return res.status(400).send('Username taken');

    // Add user to collection
    let userData : User = result.data;
    usersCollection.insertOne(userData);

    // TODO: generate session token

    res.status(201).send("session token?");
});
  
// Login
async function login(req, res) {
    const database : Db = await getDatabase();
    const usersCollection : Collection<User> = await database.collection("Users");

    // Ensure the request contains a name and password
    if (!req.body.name || !req.body.password) return res.status(400).send("Invalid credentials");

    // Right now we just query the database for a user with that name and password - not very safe but works
    let user = await usersCollection.findOne({
        name : req.body.name,
        password : req.body.password
    });

    if (user == null) return res.status(400).send("Invalid credentials");

    // Set the last login time
    user.lastLoginAt = new Date();

    // TODO: generate session token

    res.send("session token here");
}

export const usersRouter = router;