import { Collection, Db } from 'mongodb';
import { getDatabase } from './clients/mongoclient';
import { Post, postSchema, User, Comment } from './schemas';

const express = require('express');
const path = require('path');
const app = express();

// Configure environment variables
require('dotenv').config();

app.get('/', (req, res) => {
	console.log("hi");
	res.sendStatus(200);
});

// TODO: move this into its own file
// Posts API
app.route('/posts')
	.get(async (req, res) => {
		// TODO: add options for filters + pagination
		const database : Db = await getDatabase();
		const postsCollection : Collection<Post> = await database.collection("Posts");

		let posts = await postsCollection.find()
			.sort({ createdAt: -1 }) // Sort in descending order by createdAt
			.limit(5) // Limit the result to 5 documents
			.toArray(); // Convert the result to an array

		res.send(posts);
	})
	.post(async (req, res) => {
		// TODO: check session authentication
		const database : Db = await getDatabase();
		const postsCollection : Collection<Post> = await database.collection("Posts");

		let result = postSchema.safeParse(req.body);

		// Validate post
		if (!result.success) return res.status(400).send('Invalid post structure');

		let postData : Post = result.data;
		
		postsCollection.insertOne(postData);

		res.sendStatus(200);
	})

app.listen(5000, () => console.log('API is running on http://localhost:5000/'));
