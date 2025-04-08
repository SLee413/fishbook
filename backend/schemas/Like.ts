import { ObjectId } from "mongodb";
import { z } from "zod";

/**
 * @file Defines a like object
 * @decription
 * Defines what fields likes will have
 * 
 * @author Spencer Lee
 * @version 2025.4.07
 * 
 */

export const likeSchema = z.object({
	_id : z.instanceof(ObjectId).optional(),
	authorId : z.instanceof(ObjectId),
	postId : z.instanceof(ObjectId),
});

export type Like = z.infer<typeof likeSchema>;