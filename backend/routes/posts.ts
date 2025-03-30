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

/**
 * Gets a list of posts
 * 
 * TODO: Implement these query parameters
 * @query filterWaterType String - Filters posts by specific water type
 * @query postsAfter PostId - Will return posts after a specific postId
 * 
 * @return {
 * 	posts - Array of posts
 * }
 */
router.get('/', async (req, res) => {
	try {
		// TODO: add options for filters + pagination
		const database : Db = await getDatabase();
		const postsCollection : Collection<Post> = await database.collection("Posts");

		let posts = await postsCollection.find()
			.sort({ createdAt: -1 }) // Sort in descending order by createdAt
			.limit(10) // Limit the result to 5 documents
			.toArray(); // Convert the result to an array

		res.send({
			posts : posts
		});
	// Log errors and return 500
	} catch (error) {
		console.error(error);
		res.status(500).send("Internal error");
	}
});

/**
 * Creates a new post
 * 
 * Requires an authenticated user (see ./authentication)
 * 
 * @body A JSON object that contains:
 * 	- imageURL	-	String
 * 	- dateCaught-	Date (can be string)
 * 	- location -	JSON object that contains
 * 		- lat -		Number
 * 		- lng -		Number
 * 	- species -		String (optional)
 * 	- bait -		String (optional)
 * 	- waterType -	String (optional)
 * 
 * @return {
 * 	postId - ID of the new post
 * }
 */
router.post('/', auth, async (req, res) => {
	// Ensure user is authenticated
	if (!req.user) return res.status(401).send("Unauthorized");

	try {
		const database : Db = await getDatabase();
		const postsCollection : Collection<Post> = await database.collection("Posts");

		let user : User = req.user;

		// basic info for new posts
		let newPost : Post = {
			authorId : user._id,
			authorName : user.name,
			authorProfilePicture : user.profilePictureUrl,
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
		
		let postInsertion = await postsCollection.insertOne(postData);

		res.status(201).send({
			postId : postInsertion.insertedId
		});

	// Log errors and return 500
	} catch (error) {
		console.error(error);
		res.status(500).send("Internal error");
	}
});

/** 
 * Gets a list of comments on a given post
 * 
 * @param postid The ID of the post
 * 
 * @query commentsAfter - CommentId - Will return comments after a specific commentId
 * 
 * @return {
 * 	comments - Array of comments
 * }
 */
router.get('/:postid/comments', async (req, res) => {
	try {
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

		res.send({
			comments: comments
		});

	// Log errors and return 500
	} catch (error) {
		console.error(error);
		res.status(500).send("Internal error");
	}
});

/** 
 * Creates a comment on a post
 * 
 * @param postid The ID of the post
 * 
 * @body A JSON object that contains:
 *	- comment - 	String
 * 
 * @return The CommentId of the new comment
 */
router.post('/:postid/comments', auth, async (req, res) => {
	// Ensure user is authenticated
	if (!req.user) return res.status(401).send("Unauthorized");

	try {
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
	
		// Create a new comment object
		let newComment : Comment = {
			postId : post._id,
			datePosted : new Date(),
			authorId : req.user._id,
			authorName : req.user.name,
			authorProfilePicture : req.user.profilePictureUrl
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
			
		let commentInsertion = await commentsCollection.insertOne(commentData);
	
		res.status(201).send(commentInsertion.insertedId);
	
	// Log errors and return 500
	} catch (error) {
		console.error(error);
		res.status(500).send("Internal error");
	}
});

// TODO: Likes

export const postsRouter = router;