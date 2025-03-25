import { z } from "zod";

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
	authorId : z.string(),
	datePosted : z.date(),

	likes: z.number(),
	imageUrl: z.string(),
	dateCaught: z.date(),
	location: z.string(),			// We need to change this once we figure out what will work best for google maps
	
	species: z.string().optional(),
	bait: z.string().optional(),
	waterType: z.string().optional(),
});

export type Post = z.infer<typeof postSchema>;