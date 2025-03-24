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
// TODO: wrap in try catch block

    const database : Db = await getDatabase();
    const usersCollection : Collection<User> = await database.collection("Users");

    if (!ObjectId.isValid(req.params.userid)) return res.status(404).send("Invalid user");

    let user = await usersCollection.findOne({
        _id : new ObjectId(req.params.userid)
    });

    if (user == null) return res.status(404).send("Invalid user");

    if (user.password) {
        delete user["password"]
    }

    res.send(user);
});

// User creation
router.get('/create', async (req, res) => {
    // TODO: create user enpoint
    res.sendStatus(500);
});
  
export const usersRouter = router;