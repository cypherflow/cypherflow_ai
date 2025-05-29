// src/test/helpers.ts
import { type Proof, type MeltQuoteResponse, MeltQuoteState } from '@cashu/cashu-ts';
import type { StoredProof } from '$lib/client/db/wallet-db';
import { vi } from 'vitest';

export const TEST_MINT_URL = 'https://test.mint';

export function createTestProof(amount: number, override: Partial<Proof> = {}): Proof {
	return {
		id: '009a1f293253e41e',
		amount,
		secret: `secret-${Math.random().toString(36).slice(2)}`,
		C: '02f970b6ee058705c0dddc4313721cffb7efd3d142d96ea8e01d31c2b2ff09f181',
		...override
	};
}

export function createStoredProof(
	amount: number,
	status: StoredProof['status'] = 'active',
	override: Partial<StoredProof> = {}
): StoredProof {
	return {
		...createTestProof(amount),
		receivedAt: new Date(),
		status,
		...override,
		spentAt: status === 'spent' ? new Date() : undefined
	};
}

export function createMeltQuoteResponse(
	amount: number,
	override: Partial<MeltQuoteResponse> = {}
): MeltQuoteResponse {
	return {
		quote: `quote-${Math.random().toString(36).slice(2)}`,
		amount,
		fee_reserve: Math.floor(amount * 0.01), // 1% fee
		state: MeltQuoteState.UNPAID,
		expiry: Date.now() + 600000, // 10 minutes
		payment_preimage: null,
		...override
	};
}

export class MockMint {
	private proofs: Map<string, Proof> = new Map();

	async checkProofsStates(proofs: Proof[]) {
		return proofs.map((proof) => ({
			Y: proof.secret,
			state: this.proofs.has(proof.secret) ? 'SPENT' : 'UNSPENT',
			witness: null
		}));
	}

	async createMeltQuote(invoice: string): Promise<MeltQuoteResponse> {
		// Mock implementation based on invoice
		const amount = parseInt(invoice.match(/\d+/)?.[0] || '0');
		return createMeltQuoteResponse(amount);
	}

	markProofAsSpent(proof: Proof) {
		this.proofs.set(proof.secret, proof);
	}

	reset() {
		this.proofs.clear();
	}
}

export function mockFetchError(message: string) {
	return vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error(message));
}

export function mockFetchResponse<T>(status: number, data: T) {
	return vi
		.spyOn(globalThis, 'fetch')
		.mockResolvedValueOnce(new Response(JSON.stringify(data), { status }));
}
