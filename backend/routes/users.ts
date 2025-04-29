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
const auth = require('./authentication');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = Router();

/** Multer storage for profile images */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    let filename = file.originalname;
    if (req.user && req.user._id) {
      const files = fs.readdirSync(path.join(__dirname, '..', '..', 'uploads'));
      for (const f of files) {
        if (f.startsWith(req.user._id.toString())) {
          try {
            fs.unlinkSync(path.join(__dirname, '..', '..', 'uploads', f));
          } catch {}
        }
      }
      filename = req.user._id.toString() + ext;
    }
    cb(null, filename);
  }
});
const upload = multer({ storage });

/** 
 * Gets user data
 * 
 * @param userid The ID of the user
 * @return The User object for the particular user (minus password)
 */
router.get('/:userid', async (req: AuthRequest, res: Response) => {
  try {
    const database: Db = await getDatabase();
    const usersCollection: Collection<User> = database.collection("Users");

    if (!ObjectId.isValid(req.params.userid)) {
      res.status(404).send("Invalid user");
      return;
    }

    const user = await usersCollection.findOne({ _id: new ObjectId(req.params.userid) });

    if (!user) {
      res.status(404).send("User not found");
      return;
    }

    if (user.password) {
      delete user.password;
    }

    res.send(user);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal error");
  }
});

router.get('/byUsername/:username', async (req: Request, res: Response) => {
  try {
    const database: Db = await getDatabase();
    const usersCollection: Collection<User> = database.collection("Users");

    const user = await usersCollection.findOne({ name: req.params.username });

    if (!user) {
      res.status(404).send("User not found");
      return;
    }

    // Remove sensitive data
    if (user.password) {
      delete user.password;
    }

    res.send(user);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal error");
  }
});

/**
 * Update user (profile editing)
 */
router.post('/update', auth, upload.single('profilePicture'), async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).send("Unauthorized");
    return;
  }

  try {
    const database: Db = await getDatabase();
    const usersCollection: Collection<User> = database.collection("Users");

    if (req.body.username) {
      req.body.name = req.body.username;
      delete req.body.username;
    }

    const EditableFields = ["name", "firstName", "lastName", "bio", "email", "password"];
    let replacements: any = {};

    for (let property in req.body) {
      if (!EditableFields.includes(property)) continue;
      replacements[property] = req.body[property];
    }

    if (req.file) {
      replacements.profilePictureUrl = `/uploads/${req.file.filename}`;
    }

    if (replacements.name && replacements.name !== req.user.name) {
      const existingUser = await usersCollection.findOne({ name: replacements.name });
      if (existingUser) {
        res.status(400).send("Username taken");
        return;
      }
    }

    await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(req.user._id) },
      { $set: replacements },
      { returnDocument: 'after' }
    );

    const updatedUser = await usersCollection.findOne({ _id: new ObjectId(req.user._id) });

    if (!updatedUser) {
      res.status(404).send("User not found after update");
      return;
    }

    if (updatedUser.password) {
      delete updatedUser.password;
    }

    res.send({
      name: updatedUser.name,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      bio: updatedUser.bio,
      profilePictureUrl: updatedUser.profilePictureUrl || '/profileImages/default.png',
      createdAt: updatedUser.createdAt
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Internal error");
  }
});

/**
 * Create a new user
 */
router.post('/create', async (req: AuthRequest, res: Response) => {
  try {
    const database: Db = await getDatabase();
    const usersCollection: Collection<User> = database.collection("Users");

    let newUser: User = {
      name: req.body.name,
      firstName: req.body.firstName || '',
      lastName: req.body.lastName || '',
      password: req.body.password,
      bio: req.body.bio || '',
      email: req.body.email,
      totalPosts: 0,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      profilePictureUrl: '/profileImages/default.png' // <- always for new users
    };

    const result = userSchema.safeParse(newUser);

    if (!result.success) {
      res.status(400).send('Invalid user');
      return;
    }

    const otherUser = await usersCollection.findOne({ name: newUser.name });

    if (otherUser) {
      res.status(400).send('Username taken');
      return;
    }

    const userData: User = result.data;
    const sysUser = await usersCollection.insertOne(userData);

    if (!sysUser.insertedId) {
      res.sendStatus(500);
      return;
    }

    const token = jwt.sign(
      { userId: sysUser.insertedId },
      process.env.JWT_SECRET
    );

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
 * Log a user in
 */
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const database: Db = await getDatabase();
    const usersCollection: Collection<User> = database.collection("Users");

    if (!req.body.username || !req.body.password) {
      res.status(400).send("Invalid credentials");
      return;
    }

    const user = await usersCollection.findOne({
      name: req.body.username,
      password: req.body.password
    });

    if (!user) {
      res.status(400).send("Invalid credentials");
      return;
    }

    user.lastLoginAt = new Date();
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { lastLoginAt: user.lastLoginAt } }
    );

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET
    );

    res.send({
      token: token,
      user: {
        name: user.name,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        bio: user.bio,
        profilePictureUrl: user.profilePictureUrl || '/profileImages/default.png',
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Internal error");
  }
});

export const usersRouter = router;
