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
import { User } from '../schemas/index';

const jwt = require("jsonwebtoken");

/**
 * Ensures that the user is authenticated
 * 
 * To pass this function, you must include an Authorization header
 * with a VALID token, given to you by logging in or signing up
 * Invalid tokens will receive a 401 Unauthorized error
 * 
 * This function then adds the user to the request, available via
 * request.user
 */
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
		_id : new ObjectId(userId)
	});
	if (userDoc == null) return response.status(401).json({error: new Error("Invalid request!")});

	// pass the user down to the endpoints here
	request.user = userDoc;

	// pass down functionality to the endpoint
	next();

  } catch (error) {
	response.status(401).json({
	  error: new Error("Invalid request!"),
	});
  }
};