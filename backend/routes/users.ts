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

const jwt = require("jsonwebtoken");

const express = require('express');
const router = express.Router();

/** 
 * Gets user data
 * 
 * @param userid The ID of the user
 * @return The User object for the particular user (minus password)
 */
router.get('/:userid', async (req, res) => {
	try {
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
	
	// Log errors and return 500
	} catch (error) {
		console.error(error);
		res.status(500).send("Internal error");
	}
});

/**
 * Creates a new user
 * 
 * @body A JSON object that contains:
 * 	- name -				String
 * 	- password - 			String
 * 	- bio -					String
 * 	- profilePictureURL - 	String
 * 	- email - 				String
 * 
 * @return {
 * 	userId - The new user's ID
 * 	token - The session token for the user
 * }
 * 
 * NOTE: If a username is taken, it will be a 400 status with the message "Username taken"
 */
router.post('/create', async (req, res) => {
	try {
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
		let sysUser = await usersCollection.insertOne(userData);

		if (!sysUser.insertedId) return res.sendStatus(500); 

		// Generate token
		let token = jwt.sign({
			userId : sysUser.insertedId
		}, process.env.JWT_SECRET);

		res.status(201).send({
			userId : sysUser.insertedId,
			token : token
		});

	// Log errors and return 500
	} catch (error) {
		console.error(error);
		res.status(500).send("Internal error");
	}
});
  
/**
 * Logs a user in given valid credentials
 * 
 * @body A JSON object that contains:
 * 	- name - 		String
 *  - password -	String
 * 
 * @return {
 * 	token - Session token for the user
 * }
 * NOTE: Invalid credentials will be met with a 400 status error 
 * with the message "Invalid credentials"
 */
router.post('/login', async (req, res) => {
	try {
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

		// Generate token
		let token = jwt.sign({
			userId : user._id
		}, process.env.JWT_SECRET);

		res.send({
			token: token
		});

	// Log errors and return 500
	} catch (error) {
		console.error(error);
		res.status(500).send("Internal error");
	}
});

export const usersRouter = router;