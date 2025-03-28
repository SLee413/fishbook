import { z } from "zod";
import { ObjectId } from "mongodb";

/**
 * @file Defines a post object
 * @decription
 * Defines what fields a post will have. Comments will be stored in a separate collection
 * 
 * @author Spencer Lee
 * @version 2025.3.4
 * 
 */


// Create a Zod schema
export const postSchema = z.object({
	_id : z.instanceof(ObjectId).optional(),
	authorId : z.instanceof(ObjectId),
	datePosted : z.date(),

	likes: z.number(),
	imageUrl: z.string().regex(/.*/),	// TODO: add url regexing
	dateCaught: z.date(),
	location: z.object({
		lat : z.number(),
		lng : z.number()
	}),
	
	species: z.string().optional(),
	bait: z.string().optional(),
	waterType: z.string().optional(),
});

export type Post = z.infer<typeof postSchema>;