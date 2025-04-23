/**
 * @file Manages the MongoDB client
 * @description 
 * Manages the MongoClient. This module allows us to reuse the same MongoDB connection
 * 
 * @author Spencer Lee
 * 
 */

import { MongoClient, Db } from 'mongodb';

// Configure environment variables
require('dotenv').config();

// we have to keep these here because some team members struggle with actually following instructions
console.log("🔧 Loaded ENV:");
console.log("  USER:", process.env.MONGODB_USER);
console.log("  HOST:", process.env.MONGODB_HOST);
console.log("  DB:", process.env.MONGODB_DATABASE);

// Login to the Mongo client
const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}/?retryWrites=true&w=majority`;

const client = new MongoClient(uri);

// Store the database in a variable for later
let db: Db;

/**
 * Returns the connected database
 * @returns The connection to the database
 */
async function getDatabase() : Promise<Db> {
	// If there's no database, then try connecting to it
	if (!db) {
		try {
			await client.connect();
			db = client.db(process.env.MONGODB_DATABASE);
		} catch (error) {
			console.error('Could not connect to MongoDB', error);
			throw error;
		}
	}
	return db;
}

export { getDatabase };