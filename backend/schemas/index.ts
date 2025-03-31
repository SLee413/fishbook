import { ObjectId } from "mongodb";

export * from "./Post"
export * from "./User"
export * from "./Comment"

export interface User {
  _id?: ObjectId;
  username?: string;
  password?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  profilePictureUrl?: string;
  createdAt?: Date;
  lastLoginAt?: Date;
}
