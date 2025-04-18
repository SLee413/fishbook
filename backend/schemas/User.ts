import { ObjectId } from "mongodb";
import { z } from "zod";

/**
 * @file Defines a user object
 * @description
 * Defines what fields users will have
 * 
 * @author Spencer Lee
 * @version 2025.3.25
 * 
 */

export const userSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  name: z.string(),               // username
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  password: z.string(),
  bio: z.string(),
  profilePictureUrl: z.string().optional(),
  email: z.string(),
  totalPosts: z.number(),
  lastLoginAt: z.date(),
  createdAt: z.date()
});

export type User = z.infer<typeof userSchema>;
