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
 */
router.get('/:postid', auth, async (req: AuthRequest, res: Response) => {
	try {
		const database: Db = await getDatabase();
		const postsCollection: Collection<Post> = database.collection("Posts");
		const likesCollection: Collection<any> = database.collection("Likes");

		if (!ObjectId.isValid(req.params.postid)) {
			res.status(404).send("Invalid post");
			return;
		}

		let post = await postsCollection.findOne({
			_id: new ObjectId(req.params.postid)
		});
		if (post == null) {
			res.status(404).send("Invalid post");
			return;
		}

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
 */
router.post('/', auth, async (req: AuthRequest, res: Response) => {
	if (!req.user) {
		res.status(401).send("Unauthorized");
		return;
	}

	try {
		const database: Db = await getDatabase();
		const postsCollection: Collection<Post> = database.collection("Posts");
		const usersCollection: Collection<User> = database.collection("Users");

		let user: User = req.user;

		let newPost: Post = {
			authorId: user._id,
			authorName: user.name, 
			authorProfilePicture: user.profilePictureUrl,
			datePosted: new Date(),
			likes: 0
		};

		for (let property in req.body) {
			if (!newPost[property]) {
				if (property === "dateCaught") {
					newPost[property] = new Date(req.body[property]);
				} else {
					newPost[property] = req.body[property];
				}
			}
		}

		let result = postSchema.safeParse(newPost);

		if (!result.success) {
			res.status(400).send('Invalid post structure');
			return;
		}

		let postData: Post = result.data;
		let postInsertion = await postsCollection.insertOne(postData);

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
 * Gets comments for a post
 */
router.get('/:postid/comments', async (req: Request, res: Response) => {
	try {
		const database: Db = await getDatabase();
		const commentsCollection: Collection<Comment> = database.collection("Comments");

		if (!ObjectId.isValid(req.params.postid)) {
			res.status(404).send("Invalid post");
			return;
		}

		let filters: any = {
			postId: new ObjectId(req.params.postid)
		};

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

		if (!ObjectId.isValid(req.params.postid)) {
			res.status(404).send("Invalid post");
			return;
		}

		let post = await postsCollection.findOne({
			_id: new ObjectId(req.params.postid)
		});
		if (post == null) {
			res.status(404).send("Invalid post");
			return;
		}

		let newComment: Comment = {
			postId: post._id,
			datePosted: new Date(),
			authorId: req.user._id,
			authorName: req.user.username, // 🔥 FIXED: use username
			authorProfilePicture: req.user.profilePictureUrl
		};

		for (let property in req.body) {
			if (!newComment[property]) {
				newComment[property] = req.body[property];
			}
		}

		let result = postSchema.safeParse(newComment);

		if (!result.success) {
			res.status(400).send('Invalid comment');
			return;
		}

		let commentData: Comment = result.data;
		let commentInsertion = await commentsCollection.insertOne(commentData);

		res.status(201).send({ commentId: commentInsertion.insertedId });

	} catch (error) {
		console.error(error);
		res.status(500).send("Internal error");
	}
});

/**
 * Likes or unlikes a post
 */
router.post('/:postid/like', auth, async (req: AuthRequest, res: Response) => {
	if (!req.user) {
		res.status(401).send("Unauthorized");
		return;
	}

	try {
		const database: Db = await getDatabase();
		const postsCollection: Collection<Post> = database.collection("Posts");
		const likesCollection: Collection<any> = database.collection("Likes");

		if (!ObjectId.isValid(req.params.postid)) {
			res.status(404).send("Invalid post");
			return;
		}

		let post = await postsCollection.findOne({
			_id: new ObjectId(req.params.postid)
		});
		if (post == null) {
			res.status(404).send("Invalid post");
			return;
		}

		let likeDocument = await likesCollection.findOne({
			postId: post._id,
			authorId: req.user._id
		});

		if (!likeDocument) {
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