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
import { Post, postSchema, User, Comment } from '../schemas/index';
import { Request, Response, Router } from 'express';
import { AuthRequest } from './authentication';

const auth = require('./authentication');
const router = Router();

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
router.get('/', auth, async (req: AuthRequest, res: Response) => {
	try {
		const database: Db = await getDatabase();
		const postsCollection: Collection<Post> = database.collection("Posts");
		const likesCollection: Collection<any> = database.collection("Likes");

		let filters: any = {};

		// Filter by water type
		let waterType = req.query["filterWaterType"];
		if (waterType) {
			filters["waterType"] = waterType;
		}

		// Only query posts made before the given post
		let lastPost = req.query["lastPost"];
		if (typeof lastPost === 'string' && ObjectId.isValid(lastPost)) {
			filters["_id"] = { $lt: new ObjectId(lastPost) };
		}

		// Only query posts made by a specific user
		let user = req.query["user"];
		if (typeof user === 'string' && ObjectId.isValid(user)) {
			filters["authorId"] = new ObjectId(user);
		}

		let posts = await postsCollection.find(filters)
			.sort({ createdAt: 1 })
			.toArray();

		// If there's an authenticated user, return whether or not they liked each post
		if (req.user) {
			let likes = await likesCollection.find({
				authorId: req.user._id,
				postId: {
					"$in": posts.map((p: Post) => p._id)
				}
			}).toArray();

			let likedPostIds = likes.map((l: any) => l.postId.toString());

			let postsWithLikes: any[] = [];

			posts.forEach((post: Post) => {
				let newPost = post as any;
				newPost.liked = likedPostIds.includes(post._id.toString());
				postsWithLikes.push(newPost);
			});

			res.send({ posts: postsWithLikes });
			return;
		}

		res.send({ posts: posts });

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
router.get('/:postid', auth, async (req: AuthRequest, res: Response) => {
	try {
		const database: Db = await getDatabase();
		const postsCollection: Collection<Post> = database.collection("Posts");
		const likesCollection: Collection<any> = database.collection("Likes");

		// Ensure that the post id is valid
		if (!ObjectId.isValid(req.params.postid)) {
			res.status(404).send("Invalid post");
			return;
		}

		// Get the post
		let post = await postsCollection.findOne({
			_id: new ObjectId(req.params.postid)
		});
		if (post == null) {
			res.status(404).send("Invalid post");
			return;
		}

		// User is signed in, add a liked field
		if (req.user != null) {
			let newPost = post as any;
			newPost.liked = false;

			let likeDocument = await likesCollection.findOne({
				authorId: req.user._id,
				postId: post._id
			});
			if (likeDocument != null) {
				newPost.liked = true;
			}

			res.send(newPost);
			return;
		}

		res.send(post);

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
router.post('/', auth, async (req: AuthRequest, res: Response) => {
	// Only authenticated users can use this endpoint
	if (!req.user) {
		res.status(401).send("Unauthorized");
		return;
	}

	try {
		const database: Db = await getDatabase();
		const postsCollection: Collection<Post> = database.collection("Posts");
		const usersCollection: Collection<User> = database.collection("Users");

		let user: User = req.user;

		// Create the post
		let newPost: Post = {
			authorId: user._id,
			authorName: user.name, 
			authorProfilePicture: user.profilePictureUrl,
			datePosted: new Date(),
			likes: 0
		};

		// Transfer all non-existing properties to the new post
		for (let property in req.body) {
			if (!newPost[property]) {
				if (property === "dateCaught") {
					newPost[property] = new Date(req.body[property]);
				} else {
					newPost[property] = req.body[property];
				}
			}
		}

		// Parse the schema
		let result = postSchema.safeParse(newPost);

		// Schema check failed
		if (!result.success) {
			res.status(400).send('Invalid post structure');
			return;
		}

		let postData: Post = result.data;
		let postInsertion = await postsCollection.insertOne(postData);

		// If the post goes through, update the user's total post count
		if (postInsertion.acknowledged) {
			usersCollection.updateOne(
				{ "_id": user._id },
				{ $inc: { 'totalPosts': 1 } }
			);
		}

		res.status(201).send({ postId: postInsertion.insertedId });

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
router.get('/:postid/comments', async (req: Request, res: Response) => {
	try {
		const database: Db = await getDatabase();
		const commentsCollection: Collection<Comment> = database.collection("Comments");

		// Ensure post id is valid
		if (!ObjectId.isValid(req.params.postid)) {
			res.status(404).send("Invalid post");
			return;
		}

		// Add in query filters
		let filters: any = {
			postId: new ObjectId(req.params.postid)
		};

		// You can use this to implement infinite scroll
		let lastComment = req.query["lastComment"];
		if (typeof lastComment === 'string' && ObjectId.isValid(lastComment)) {
			filters["_id"] = { $lt: new ObjectId(lastComment) };
		}

		let comments = await commentsCollection.find(filters)
			.sort({ createdAt: 1 })
			.limit(10)
			.toArray();

		res.send({ comments: comments });

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
router.post('/:postid/comments', auth, async (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).send("Unauthorized");
        return;
    }

    try {
        const database: Db = await getDatabase();
        const postsCollection: Collection<Post> = database.collection("Posts");
        const commentsCollection: Collection<Comment> = database.collection("Comments");

        // Ensure post id is valid
        if (!ObjectId.isValid(req.params.postid)) {
            res.status(404).send("Invalid post");
            return;
        }

        // Find the post, ensure it's valid
        let post = await postsCollection.findOne({
            _id: new ObjectId(req.params.postid)
        });
        if (post == null) {
            res.status(404).send("Invalid post");
            return;
        }

        // Create comment
        let newComment: Comment = {
            postId: post._id,
            datePosted: new Date(),
            authorId: req.user._id,
            authorName: req.user.name, // Changed from username to name
            authorProfilePicture: req.user.profilePictureUrl,
            comment: req.body.content // Changed to match frontend's field name
        };

        // No need for property transfer or schema validation for now
        let commentInsertion = await commentsCollection.insertOne(newComment);

        res.status(201).send({ 
            commentId: commentInsertion.insertedId,
            comment: newComment 
        });

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
router.post('/:postid/like', auth, async (req: AuthRequest, res: Response) => {
	// User must be authenticated to use this
	if (!req.user) {
		res.status(401).send("Unauthorized");
		return;
	}

	try {
		const database: Db = await getDatabase();
		const postsCollection: Collection<Post> = database.collection("Posts");
		const likesCollection: Collection<any> = database.collection("Likes");

		// Ensure post id is valid
		if (!ObjectId.isValid(req.params.postid)) {
			res.status(404).send("Invalid post");
			return;
		}

		// Find the post
		let post = await postsCollection.findOne({
			_id: new ObjectId(req.params.postid)
		});
		if (post == null) {
			res.status(404).send("Invalid post");
			return;
		}

		// Attempt to find like document
		let likeDocument = await likesCollection.findOne({
			postId: post._id,
			authorId: req.user._id
		});

		// If there's no like document, the user has not liked this post yet
		if (!likeDocument) {
			// Basically we just create one and then increment the likes count
			await likesCollection.insertOne({
				authorId: req.user._id,
				postId: post._id
			});

			let updateResult = await postsCollection.findOneAndUpdate(
				{ "_id": post._id },
				{ $inc: { 'likes': 1 } },
				{ returnDocument: "after" }
			);

			res.send({
				likes: updateResult?.likes || 0,
				liked: true
			});
		} else {
			// We found a like document, meaning the user has already liked it
			// Now we delete that document and decrement the likes counter
			await likesCollection.findOneAndDelete({ "_id": likeDocument._id });

			let updateResult = await postsCollection.findOneAndUpdate(
				{ "_id": post._id },
				{ $inc: { 'likes': -1 } },
				{ returnDocument: "after" }
			);

			res.send({
				likes: updateResult?.likes || 0,
				liked: false
			});
		}

	} catch (error) {
		console.error(error);
		res.status(500).send("Internal error");
	}
});

export const postsRouter = router;