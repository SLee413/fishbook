import { ObjectId } from "mongodb";
import { z } from "zod";

/**
 * @file Defines a comment object
 * @decription
 * Comments are stored in a separate collection, they have a postId that they are associated with
 * 
 * @author Spencer Lee
 * @version 2025.3.4
 * 
 */

export const commentSchema = z.object({
	_id : z.instanceof(ObjectId).optional(),
	postId : z.instanceof(ObjectId),
	authorId : z.instanceof(ObjectId),
	authorName : z.string(),
	authorProfilePicture : z.string(),
	datePosted : z.date(),
	

	comment : z.string(),
	
});

export type Comment = z.infer<typeof commentSchema>;