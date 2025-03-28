/**
 * @file Controls authentication
 * @description 
 * This is an ExpressJS middleware function that authenticates the user
 * 
 * @author Spencer Lee
 * 
 */

import { Collection, Db, ObjectId } from 'mongodb';
import { getDatabase } from '../clients/mongoclient';
import { Post, postSchema, User, Comment, commentSchema } from '../schemas/index';

const jwt = require("jsonwebtoken");

module.exports = async (request, response, next) => {
  try {
	// Get the authorization token from the headers
	const token = await request.headers.authorization.split(" ")[1];

	// Verify the token
	const decodedToken = await jwt.verify(token, process.env.JWT_SECRET);

	// Retrieve the user details of the logged in user
	const userId = decodedToken.userId;

	// Ensure user is a valid user
	const database : Db = await getDatabase();
	const usersCollection : Collection<User> = await database.collection("Users");

	let userDoc = await usersCollection.findOne({
		_id : userId
	});
	if (userDoc == null) return response.status(401).json({error: new Error("Invalid request!")});

	// pass the user down to the endpoints here
	request.userId = userId;

	// pass down functionality to the endpoint
	next();

  } catch (error) {
	response.status(401).json({
	  error: new Error("Invalid request!"),
	});
  }
};