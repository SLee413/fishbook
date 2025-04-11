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
	authorName : z.string(),
	authorProfilePicture : z.string(),
	datePosted : z.date(),
	likes: z.number(),
  
	imageUrl: z.string().regex(/.*/),
	dateCaught: z.date(),
	location: z.object({
	  lat : z.number(),
	  lng : z.number()
	}),
  
	species: z.string().optional(),
	bait: z.string().optional(),
	waterType: z.string().optional(),
	moonPhase: z.string().optional(),
	
  
	// ✅ Allow nulls here
	description: z.union([z.string(), z.null()]).optional(),
	weight: z.union([z.string(), z.null()]).optional(),
	length: z.union([z.string(), z.null()]).optional(),
	weather: z
	  .object({
		temperature: z.number().nullable(),
		precipitation: z.number().nullable(),
		windspeed: z.number().nullable(),
		weathercode: z.number().nullable(),
	  })
	  .optional()
	  .nullable(),
  });
  
  

export type Post = z.infer<typeof postSchema>;