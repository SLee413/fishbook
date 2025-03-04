/**
 * @file Defines a comment object
 * @decription
 * Comments are stored in a separate collection, they have a postId that they are associated with
 * 
 * @author Spencer Lee
 * @version 2025.3.4
 * 
 */

export interface Comment {
	_id: string;
	postId : string;
	authorId : string;
	datePosted: Date;
	
	comment: string;
}