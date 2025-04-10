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
import { Post, likedPost, postSchema, User, Comment, commentSchema, Like, likeSchema } from '../schemas/index';
import { Request, Response, Router } from 'express';
import { AuthRequest } from './authentication';

const router = Router();
const auth = require('./authentication');

/**
 * Gets a list of posts
 * 
 * @query filterWaterType String - Filters posts by specific water type
 * @query lastPost PostId - Will return the next posts after a given postId
 * @query user UserId - Will return posts by a specific user
 * 
 * IF you supply an authenticated user, each post will have a liked field
 * 
 * @return {
 * 	posts - Array of posts
 * }
 */
router.get('/', auth, async (req : AuthRequest, res : Response) => {
	try {
		const database : Db = await getDatabase();
		const postsCollection : Collection<Post> = await database.collection("Posts");
		const likesCollection : Collection<Like> = await database.collection("Likes");


		let filters = {}

		// Filter by water type
		let waterType = req.query["filterWaterType"];
		if (waterType) {
			filters["waterType"] = waterType
		}

		// Only query posts made before the given post
		let lastPost = req.query["lastPost"];
		if (typeof lastPost === 'string' && ObjectId.isValid(lastPost)) {
			filters["_id"] = {$lt : new ObjectId(lastPost)}
		}

		// Only query posts made by a specific user
		let user = req.query["user"];
		if (typeof user === 'string' && ObjectId.isValid(user)) {
			filters["authorId"] = new ObjectId(user)
		}

		let posts = await postsCollection.find(filters)
			.sort({ datePosted: -1 }) // Sort in ascending order by datePosted
			.limit(10) // Limit the result to 10 documents
			.toArray(); // Convert the result to an array

		// If there's an authenticated user, return whether or not they liked each post
		if (req.user) {
			// Query likes the author made for posts in the previous list
			let likes = await likesCollection.find({
				authorId : req.user._id,
				postId : {
					"$in" : posts.map((p : Post) => p._id)
				}
			}).toArray();
			// Map it to a simpler array to make it easier - we convert ids to strings for easier comparison
			let likedPostIds = likes.map((l : Like) => l.postId.toString());

			let postsWithLikes : [likedPost?] = [];

			// Iterate through each post to see if there's a like object
			posts.forEach((post : Post) => {
				// Create a new liked post object
				let newPost = post as likedPost;
				newPost.liked = false;

				// Set it to liked if it's liked
				if (likedPostIds.includes(post._id.toString())) {
					newPost.liked = true;
				}

				// Add to array
				postsWithLikes.push(newPost);
			});

			// Send posts with likes
			res.send({
				posts : postsWithLikes
			});

			return;
		}

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
 * Gets a specific post by ID
 * 
 * IF you supply an authenticated user, the post will have a liked field
 * 
 * @return post - the post object
*/
router.get('/:postid', auth, async (req : AuthRequest, res : Response) => {
   try {
	   const database : Db = await getDatabase();
	   const postsCollection : Collection<Post> = await database.collection("Posts");
	   const likesCollection : Collection<Like> = await database.collection("Likes");

		// Ensure postid is valid
		if (!ObjectId.isValid(req.params.postid)) {
			res.status(404).send("Invalid post");
			return;
		}

		// Ensure post exists
		let post = await postsCollection.findOne({
			_id : new ObjectId(req.params.postid)
		});
		if (post == null) {
			res.status(404).send("Invalid post");
			return;
		}

		// If there's an authenticated user, check its like status
		if (req.user != null) {
			// Initialize post as not liked
			let newPost = post as likedPost;
			newPost.liked = false;

			// Query the like collection
			let likeDocument = await likesCollection.findOne({
				authorId : req.user._id,
				postId : post._id
			});
			// If the user liked it, set to true
			if (likeDocument != null) {
				newPost.liked = true;
			}

			res.send(newPost);
			return;
		}

		res.send(post);

   // Log errors and return 500
   } catch (error) {
	   console.error(error);
	   res.status(500).send("Internal error");
   }
});

/**
 * Creates a new post
 * 
 * @requires authentication
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
router.post('/', auth, async (req : AuthRequest, res : Response) => {
	// Ensure user is authenticated
	if (!req.user) {
		res.status(401).send("Unauthorized");
		return;
	}

	try {
		const database : Db = await getDatabase();
		const postsCollection : Collection<Post> = await database.collection("Posts");
		const usersCollection : Collection<User> = await database.collection("Users");

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
		if (!result.success) {
			res.status(400).send('Invalid post structure');
			return;
		}

		let postData : Post = result.data;
		let postInsertion = await postsCollection.insertOne(postData);

		// Add 1 to the user's total post count
		if (postInsertion.acknowledged) {
			usersCollection.updateOne({"_id" : user._id}, {
				$inc: { 'totalPosts': 1 },
			});
			
		}

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
 * @query lastComment - CommentId - Will return comments after a specific commentId
 * 
 * @return {
 * 	comments - Array of comments
 * }
 */
router.get('/:postid/comments', async (req : Request, res : Response) => {
	try {
		const database : Db = await getDatabase();
		const commentsCollection : Collection<Comment> = await database.collection("Comments");

		// Ensure postid is valid
		if (!ObjectId.isValid(req.params.postid)) {
			res.status(404).send("Invalid post");
			return;
		}

		let filters = {
			postId : new ObjectId(req.params.postid)
		}

		// Only query comments  made before the given comment
		let lastComment = req.query["lastComment"];
		if (typeof lastComment === 'string' && ObjectId.isValid(lastComment)) {
			filters["_id"] = {$lt : new ObjectId(lastComment)}
		}

		// Query comments
		let comments = await commentsCollection.find(filters)
			.sort({ createdAt: 1 }) // Sort in ascending order by createdAt
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
 * @requires authentication
 * 
 * @param postid The ID of the post
 * 
 * @body A JSON object that contains:
 *	- comment - 	String
 * 
 * @return {
 * 	commentId - The ID of the new comment
 * }
 */
router.post('/:postid/comments', auth, async (req : AuthRequest, res : Response) => {
	// Ensure user is authenticated
	if (!req.user) {
		res.status(401).send("Unauthorized");
		return;
	}

	try {
		const database : Db = await getDatabase();
		const postsCollection : Collection<Post> = await database.collection("Posts");
		const commentsCollection : Collection<Comment> = await database.collection("Comments");
	
		// Ensure postid is valid
		if (!ObjectId.isValid(req.params.postid)) {
			res.status(404).send("Invalid post");
			return;
		}
	
		// Ensure post exists
		let post = await postsCollection.findOne({
			_id : new ObjectId(req.params.postid)
		});
		if (post == null) {
			res.status(404).send("Invalid post");
			return;
		}
	
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
		if (!result.success) {
			res.status(400).send('Invalid comment');
			return;
		}
	
		let commentData : Comment = result.data;
			
		let commentInsertion = await commentsCollection.insertOne(commentData);
	
		res.status(201).send({
			commendId : commentInsertion.insertedId
		});
	
	// Log errors and return 500
	} catch (error) {
		console.error(error);
		res.status(500).send("Internal error");
	}
});

/** 
 * Adds or removes a like on a post
 * @requires authentication
 * 
 * @param postid The ID of the post
 * 
 * @return {
 * 	likes - the number of likes on the post,
 * 	liked - whether the user currently has liked the post
 * }
 */
 router.post('/:postid/like', auth, async (req : AuthRequest, res : Response) => {
	// Ensure user is authenticated
	if (!req.user) {
		res.status(401).send("Unauthorized");
		return;
	}

	try {
		const database : Db = await getDatabase();
		const postsCollection : Collection<Post> = await database.collection("Posts");
		const likesCollection : Collection<Like> = await database.collection("Likes");
	
		// Ensure postid is valid
		if (!ObjectId.isValid(req.params.postid)) {
			res.status(404).send("Invalid post");
			return;
		}
	
		// Ensure post exists
		let post = await postsCollection.findOne({
			_id : new ObjectId(req.params.postid)
		});
		if (post == null) {
			res.status(404).send("Invalid post");
			return;
		}
	
		// Check if a like object exists
		let likeDocument = await likesCollection.findOne({
			postId : post._id,
			authorId : req.user._id
		});

		// Like does not exist, create it
		if (likeDocument == null) {
			// Create the like document
			likesCollection.insertOne({
				authorId : req.user._id,
				postId : post._id
			});

			// Update the post's likes
			let updateResult = await postsCollection.findOneAndUpdate({"_id" : post._id}, {
				$inc : {'likes' : 1}
			}, { returnDocument : "after" });

			res.send({
				likes : updateResult.likes,
				liked : true
			});
			return;
		} else {
			// Like does exist, delete it and decrement post counter
			likesCollection.findOneAndDelete({"_id" : likeDocument._id});

			let updateResult = await postsCollection.findOneAndUpdate({"_id" : post._id}, {
				$inc : {'likes' : -1}
			}, { returnDocument : "after" });

			res.send({
				likes : updateResult.likes,
				liked : false
			});
			return;
		}
	
	// Log errors and return 500
	} catch (error) {
		console.error(error);
		res.status(500).send("Internal error");
	}
});

// Accepts a new post from the map app (no auth for now, adjust if needed)
// posts.ts (already inside your router file)
router.post('/from-map', async (req: AuthRequest, res: Response) => {

	console.log("📬 Received POST /api/posts/from-map");
	console.log("📦 Body received:", req.body); // Add this
  
	try {
		// log request body for debugging
			console.log("📦 Received body:", req.body);
	  const db: Db = await getDatabase();
	  const postsCollection: Collection<Post> = db.collection("Posts");
  
	  const {
		imageUrl,
		dateCaught,
		location,
		species,
		bait,
		waterType,
		weather,
		description,
		weight,
		length
	  } = req.body;
	  
	  
  
	  if (
		!imageUrl ||
		!dateCaught ||
		!location ||
		typeof location.lat !== 'number' ||
		typeof location.lng !== 'number'
	  ) {
		res.status(400).send("Missing or invalid required fields");
		return;
	  }
  
	  const newPost: Post = {
		_id: new ObjectId(),
		authorId: new ObjectId(), // Replace later
		authorName: "MapUser",
		authorProfilePicture: "/default.png",
		datePosted: new Date(),
		likes: 0,
		imageUrl,
		dateCaught: new Date(dateCaught),
		location,
		species: species || undefined,
		bait: bait || undefined,
		waterType: waterType || undefined,
		weather: weather || undefined,
		description: description ?? undefined, // ✅ null-safe
		weight: weight ?? undefined,           // ✅ null-safe
		length: length ?? undefined            // ✅ null-safe
	  };
	  
	  

	  if (!req.body.location || typeof req.body.location.lat !== 'number') {
		console.error("❌ Invalid or missing location:", req.body.location);
	  }
	
  
	  const result = postSchema.safeParse(newPost);
	  if (!result.success) {
		console.error("❌ Validation Error:", result.error);
		res.status(400).send("Invalid post structure");
		return;
	  }
  
	  await postsCollection.insertOne(result.data);
	  res.status(201).send({ message: "Map post created" });
  
	} catch (error) {
	  console.error("❌ Error saving map post:", error);
	  res.status(500).send("Internal server error");
	}
  });
  
  











export const postsRouter = router;