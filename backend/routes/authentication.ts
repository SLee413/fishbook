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
 * Adds an authenticated user to the request
 * 
 * In order to qualify as authenticated, a valid token must
 * be passed via the Authorization header. The user will be
 * available via request.user. If the token is not valid, 
 * then request.user will be null.
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
	if (userDoc == null) next();

	// pass the user down to the endpoints here
	request.user = userDoc;

	// pass down functionality to the endpoint
	next();

  } catch (error) {
	// Ensure that there is no user field in the request
	response.user = null;
	next();
  }
};