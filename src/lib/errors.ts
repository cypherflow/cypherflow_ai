// src/lib/errors.ts
import type { MeltQuoteResponse } from '@cashu/cashu-ts';

// Base error class for all application errors
export class AppError extends Error {
	public readonly timestamp: Date;

	constructor(
		message: string,
		public readonly code: string,
		public readonly cause?: unknown
	) {
		super(message);
		this.name = this.constructor.name;
		this.timestamp = new Date();

		// Set the prototype explicitly
		Object.setPrototypeOf(this, new.target.prototype);
	}

	public toJSON() {
		return {
			name: this.name,
			code: this.code,
			message: this.message,
			timestamp: this.timestamp,
			cause: this.cause,
			stack: this.stack
		};
	}
}

// Base class for all wallet-related errors
export abstract class WalletError extends AppError {
	constructor(message: string, code: string, cause?: unknown) {
		super(message, code, cause);
	}
}

// Validation errors
export class ValidationError extends WalletError {
	constructor(message: string, cause?: unknown) {
		super(message, 'VALIDATION_ERROR', cause);
	}
}

export class InsufficientBalanceError extends WalletError {
	constructor(
		public readonly available: number,
		public readonly required: number,
		cause?: unknown
	) {
		super(
			`Insufficient balance. Available: ${available} sats, Required: ${required} sats`,
			'INSUFFICIENT_BALANCE',
			cause
		);
	}
}

// Payment-related errors
export abstract class PaymentError extends WalletError {
	constructor(message: string, code: string, cause?: unknown) {
		super(message, code, cause);
	}
}

export class LightningPaymentError extends PaymentError {
	constructor(message: string, cause?: unknown) {
		super(message, 'LIGHTNING_PAYMENT_ERROR', cause);
	}
}

export class TokenPaymentError extends PaymentError {
	constructor(message: string, cause?: unknown) {
		super(message, 'TOKEN_PAYMENT_ERROR', cause);
	}
}

// Infrastructure errors
export class WalletNotInitializedError extends WalletError {
	constructor(cause?: unknown) {
		super('Wallet not initialized', 'WALLET_NOT_INITIALIZED', cause);
	}
}

export class DatabaseError extends WalletError {
	constructor(message: string, cause?: unknown) {
		super(message, 'DATABASE_ERROR', cause);
	}
}

export class NetworkError extends WalletError {
	constructor(message: string, cause?: unknown) {
		super(message, 'NETWORK_ERROR', cause);
	}
}

// Mint-related errors
export abstract class MintError extends WalletError {
	constructor(
		message: string,
		code: string,
		public readonly response?: MeltQuoteResponse,
		cause?: unknown
	) {
		super(message, code, cause);
	}
}

export class MintConnectionError extends MintError {
	constructor(message: string, cause?: unknown) {
		super(message, 'MINT_CONNECTION_ERROR', undefined, cause);
	}
}

export class MintResponseError extends MintError {
	constructor(message: string, response: MeltQuoteResponse, cause?: unknown) {
		super(message, 'MINT_RESPONSE_ERROR', response, cause);
	}
}

// Proof-related errors
export abstract class ProofError extends WalletError {
	constructor(message: string, code: string, cause?: unknown) {
		super(message, code, cause);
	}
}

export class ProofVerificationError extends ProofError {
	constructor(message: string, cause?: unknown) {
		super(message, 'PROOF_VERIFICATION_ERROR', cause);
	}
}

export class ProofStorageError extends ProofError {
	constructor(message: string, cause?: unknown) {
		super(message, 'PROOF_STORAGE_ERROR', cause);
	}
}

// Lightning invoice errors
export class LightningInvoiceError extends ValidationError {
	constructor(message: string, cause?: unknown) {
		super(message, cause);
	}

	override get code(): string {
		return 'LIGHTNING_INVOICE_ERROR';
	}
}

// Unexpected errors
export class UnexpectedError extends AppError {
	constructor(cause?: unknown) {
		super('An unexpected error occurred', 'UNEXPECTED_ERROR', cause);
	}
}

// Helper function to wrap unknown errors
export function wrapUnknownError(error: unknown): AppError {
	if (error instanceof AppError) {
		return error;
	}

	if (error instanceof Error) {
		return new UnexpectedError(error);
	}

	return new UnexpectedError(new Error(String(error)));
}

// Type guard to check if an error is a specific type
export function isErrorType<T extends AppError>(
	error: unknown,
	ErrorClass: { new (...args: never[]): T }
): error is T {
	return error instanceof ErrorClass;
}
