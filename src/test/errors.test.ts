import { describe, it, expect } from 'vitest';
import {
	AppError,
	WalletError,
	ValidationError,
	InsufficientBalanceError,
	NetworkError,
	MintResponseError,
	UnexpectedError,
	wrapUnknownError,
	isErrorType
} from '$lib/errors';
import { createMeltQuoteResponse } from './helpers';

describe('Error Classes', () => {
	describe('AppError', () => {
		it('should create base error with all properties', () => {
			const cause = new Error('Original error');
			const error = new AppError('Test error', 'TEST_ERROR', cause);

			expect(error.message).toBe('Test error');
			expect(error.code).toBe('TEST_ERROR');
			expect(error.cause).toBe(cause);
			expect(error.timestamp).toBeInstanceOf(Date);
			expect(error.name).toBe('AppError');
		});

		it('should serialize to JSON correctly', () => {
			const error = new AppError('Test error', 'TEST_ERROR');
			const json = error.toJSON();

			expect(json).toEqual({
				name: 'AppError',
				code: 'TEST_ERROR',
				message: 'Test error',
				timestamp: error.timestamp,
				cause: undefined,
				stack: error.stack
			});
		});
	});

	describe('InsufficientBalanceError', () => {
		it('should format message with available and required amounts', () => {
			const error = new InsufficientBalanceError(100, 200);

			expect(error.message).toBe('Insufficient balance. Available: 100 sats, Required: 200 sats');
			expect(error.available).toBe(100);
			expect(error.required).toBe(200);
			expect(error.code).toBe('INSUFFICIENT_BALANCE');
		});
	});

	describe('MintResponseError', () => {
		it('should include response data', () => {
			const response = createMeltQuoteResponse(100);
			const error = new MintResponseError('Invalid response', response);

			expect(error.response).toBe(response);
			expect(error.code).toBe('MINT_RESPONSE_ERROR');
		});
	});

	describe('wrapUnknownError', () => {
		it('should return original error if already AppError', () => {
			const original = new ValidationError('Test error');
			const wrapped = wrapUnknownError(original);
			expect(wrapped).toBe(original);
		});

		it('should wrap Error in UnexpectedError', () => {
			const original = new Error('Test error');
			const wrapped = wrapUnknownError(original);

			expect(wrapped).toBeInstanceOf(UnexpectedError);
			expect(wrapped.cause).toBe(original);
		});

		it('should wrap non-Error in UnexpectedError with string message', () => {
			const wrapped = wrapUnknownError('Test error');

			expect(wrapped).toBeInstanceOf(UnexpectedError);
			expect((wrapped.cause as Error).message).toBe('Test error');
		});
	});

	describe('isErrorType', () => {
		it('should correctly identify error types', () => {
			const validationError = new ValidationError('Test');
			const networkError = new NetworkError('Test');

			expect(isErrorType(validationError, ValidationError)).toBe(true);
			expect(isErrorType(networkError, ValidationError)).toBe(false);
			expect(isErrorType(validationError, WalletError)).toBe(true);
			expect(isErrorType(new Error(), ValidationError)).toBe(false);
		});
	});
});
