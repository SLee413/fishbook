/**
 * @file Defines a post object
 * @decription
 * Defines what fields a post will have. Comments will be stored in a separate collection
 * 
 * @author Spencer Lee
 * @version 2025.3.4
 * 
 */

export interface Post {
	_id: string;
	authorId : string;
	datePosted : Date;

	likes: number;
	imageUrl: string;
	dateCaught: Date;
	location: string;			// We need to change this once we figure out what will work best for google maps
	
	species?: string;
	bait?: string;
	waterType?: string;
}