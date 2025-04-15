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
import { Request, Response, Router } from 'express';
import { AuthRequest } from './authentication';

import cookieParser from 'cookie-parser';
app.use(cookieParser());

const jwt = require("jsonwebtoken");

const router = Router();

/** 
 * Gets user data
 */
router.get('/:userid', async (req: AuthRequest, res: Response) => {
	try {
		const database: Db = await getDatabase();
		const usersCollection: Collection<User> = await database.collection("Users");

		if (!ObjectId.isValid(req.params.userid)) {
			res.status(404).send("Invalid user");
			return;
		}

		let user = await usersCollection.findOne({ _id: new ObjectId(req.params.userid) });

		if (user == null) {
			res.status(404).send("Invalid user");
			return;
		}

		if (user.password) {
			delete user["password"];
		}

		res.send(user);

	} catch (error) {
		console.error(error);
		res.status(500).send("Internal error");
	}
});

/**
 * Creates a new user
 */
router.post('/create', async (req: AuthRequest, res: Response) => {
	try {
		const database: Db = await getDatabase();
		const usersCollection: Collection<User> = await database.collection("Users");

		let newUser: User = {
			createdAt: new Date(),
			lastLoginAt: new Date(),
			totalPosts: 0
		}

		for (let property in req.body) {
			if (!newUser[property]) {
				newUser[property] = req.body[property];
			}
		}
		let result = userSchema.safeParse(newUser);

		if (!result.success) {
			res.status(400).send('Invalid user');
			return;
		}

		let otherUser = await usersCollection.findOne({
			name: newUser.name
		});
		if (otherUser) {
			res.status(400).send('Username taken');
			return;
		}

		let userData: User = result.data;
		let sysUser = await usersCollection.insertOne(userData);

		if (!sysUser.insertedId) {
			res.sendStatus(500);
			return;
		}

		let token = jwt.sign({
			userId: sysUser.insertedId
		}, process.env.JWT_SECRET);

		res.status(201).send({
			userId: sysUser.insertedId,
			token: token
		});

	} catch (error) {
		console.error(error);
		res.status(500).send("Internal error");
	}
});

/**
 * Logs a user in given valid credentials
 */
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const database: Db = await getDatabase();
    const usersCollection: Collection<User> = await database.collection("Users");

    if (!req.body.name || !req.body.password) {
      res.status(400).send("Invalid credentials");
      return;
    }

    let user = await usersCollection.findOne({
      name: req.body.name,
      password: req.body.password
    });

    if (user == null) {
      res.status(400).send("Invalid credentials");
      return;
    }

    user.lastLoginAt = new Date();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    });

    res.send({ token }); // or just a success flag
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal error");
  }
});

/**
 * Updates user info
 */
router.put('/:userid', async (req: AuthRequest, res: Response) => {
	try {
		const database: Db = await getDatabase();
		const usersCollection: Collection<User> = await database.collection("Users");

		const userId = req.params.userid;

		if (!ObjectId.isValid(userId)) {
			res.status(400).send("Invalid user ID");
			return;
		}

		const updateFields: Partial<User> = {};
		if (req.body.bio) updateFields.bio = req.body.bio;
		if (req.body.profilePicture) updateFields.profilePic = req.body.profilePicture;
		if (req.body.name) updateFields.name = req.body.name;
		if (req.body.email) updateFields.email = req.body.email;

		const result = await usersCollection.findOneAndUpdate(
			{ _id: new ObjectId(userId) },
			{ $set: updateFields },
			{ returnDocument: 'after' }
		);

		if (!result.value) {
			res.status(404).send("User not found");
			return;
		}

		res.send(result.value);

	} catch (error) {
		console.error(error);
		res.status(500).send("Internal error");
	}
});

export const usersRouter = router;
