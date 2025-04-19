/**
 * @file Controls authentication
 * @description 
 * This is an ExpressJS middleware function that authenticates the user
 */

import { Collection, Db, ObjectId } from 'mongodb';
import { getDatabase } from '../clients/mongoclient';
import { User } from '../schemas/index';
import { Request, Response, NextFunction } from 'express';

const jwt = require("jsonwebtoken");

export interface AuthRequest extends Request {
  user?: any;
  file?: any; // ✅ 
}

/**
 * Adds an authenticated user to the request
 */
module.exports = async (request: AuthRequest, response: Response, next: NextFunction) => {
  try {
    const token = request.headers.authorization?.split(" ")[1];
    if (!token) {
      request.user = null;
      return next();
    }

    const decodedToken = await jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedToken.userId;

    const database: Db = await getDatabase();
    const usersCollection: Collection<User> = database.collection("Users");

    const userDoc = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!userDoc) {
      request.user = null;
      return next();
    }

    request.user = userDoc;
    next();

  } catch (error) {
    request.user = null;
    next();
  }
};
