/**
 * @file Defines a user object
 * @decription
 * Defines what fields users will have
 * 
 * @author Spencer Lee
 * @version 2025.3.4
 * 
 */

export interface User {
	_id: string;
	name: string;
	password: string;
	bio: string;
	profilePictureUrl: string;

	lastLoginAt: Date;
	createdAt: Date;
}