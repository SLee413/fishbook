import { Collection, Db, ObjectId } from 'mongodb';
import { getDatabase } from '../clients/mongoclient';
import { Post, postSchema, User, Comment, userSchema } from '../schemas/index';
import { Request, Response, Router } from 'express';
import * as bcrypt from 'bcrypt';

const jwt = require("jsonwebtoken");
const router = Router();

/**
 * Gets user data by ID
 */
router.get('/:userid', async (req: Request, res: Response) => {
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
router.post('/create', async (req: Request, res: Response) => {
  try {
    const database: Db = await getDatabase();
    const usersCollection: Collection<User> = await database.collection("Users");

    let newUser: User = {
      createdAt: new Date(),
      lastLoginAt: new Date()
    };

    for (let property in req.body) {
      if (!(property in newUser)) {
        newUser[property] = req.body[property];
      }
    }

    const result = userSchema.safeParse(newUser);

    if (!result.success) {
      res.status(400).send('Invalid user');
      return;
    }

    const existingUser = await usersCollection.findOne({ username: newUser.username });
    if (existingUser) {
      res.status(400).send('Username taken');
      return;
    }

    const hashedPassword = await bcrypt.hash(newUser.password!, 10);
    const userData: User = { ...result.data, password: hashedPassword };

    const sysUser = await usersCollection.insertOne(userData);

    if (!sysUser.insertedId) {
      res.sendStatus(500);
      return;
    }

    const token = jwt.sign({ userId: sysUser.insertedId }, process.env.JWT_SECRET);
    res.status(201).send({ userId: sysUser.insertedId, token: token });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal error");
  }
});

/**
 * Logs in a user
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const database: Db = await getDatabase();
    const usersCollection: Collection<User> = await database.collection("Users");

    const { username, password } = req.body;
    console.log('[LOGIN] Incoming request:', req.body);

    if (!username || !password) {
      console.warn("[LOGIN] Missing credentials");
      res.status(400).send("Invalid credentials");
      return;
    }

    const user = await usersCollection.findOne({ username });
    console.log('[LOGIN] Found user:', user);

    if (!user) {
      console.warn("[LOGIN] User not found");
      res.status(400).send("Invalid credentials");
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password!);
    console.log('[LOGIN] Password match:', isMatch);

    if (!isMatch) {
      console.warn("[LOGIN] Incorrect password");
      res.status(400).send("Invalid credentials");
      return;
    }

    user.lastLoginAt = new Date();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.send({ token });
  } catch (error) {
    console.error("🔥 Login error:", error);
    res.status(500).send("Internal error");
  }
});

export const usersRouter = router;
