// src/lib/client/db/sentTokenDb.ts
import Dexie, { type Table } from 'dexie';
import { nanoid } from 'nanoid';

export interface SentToken {
	id?: number;
	nanoId: string;
	token: string;
	amount: number;
	createdAt: number;
	isReclaimed: boolean;
	description: string;
}

export class TokenDatabase extends Dexie {
	sentTokens!: Table<SentToken>;

	constructor() {
		super('sentTokenDatabase');
		this.version(1).stores({
			sentTokens: '++id, nanoId, amount, createdAt, isReclaimed'
		});
	}
}

export const tokenDb = new TokenDatabase();

// Generate a unique ID for a token
export function generateTokenId(): string {
	return nanoid(5);
}

// Save a token to the database
export async function saveToken(
	token: string,
	amount: number,
	nanoId: string,
	description: string
): Promise<number> {
	return await tokenDb.sentTokens.add({
		nanoId,
		token,
		amount,
		createdAt: Math.floor(Date.now() / 1000),
		isReclaimed: false,
		description
	});
}

// Get a token by its nanoId
export async function getTokenByNanoId(nanoId: string): Promise<SentToken | undefined> {
	return await tokenDb.sentTokens.where('nanoId').equals(nanoId).first();
}

// Mark a token as reclaimed
export async function markTokenAsReclaimed(nanoId: string): Promise<boolean> {
	try {
		await tokenDb.sentTokens.where('nanoId').equals(nanoId).modify({ isReclaimed: true });
		return true;
	} catch (error) {
		console.error('Failed to mark token as reclaimed:', error);
		return false;
	}
}

export async function deleteTokenByNanoId(nanoId: string): Promise<boolean> {
	try {
		await tokenDb.sentTokens.where('nanoId').equals(nanoId).delete();
		return true;
	} catch (error) {
		console.error('Failed to delete token:', error);
		return false;
	}
}
