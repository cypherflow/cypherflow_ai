// // src/test/wallet.test.ts
// import { indexedDB } from 'fake-indexeddb';
// globalThis.indexedDB = indexedDB;

// import { get } from 'svelte/store';
// import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';

// import { walletStore } from '$lib/client/stores/wallet';
// import { walletDb } from '$lib/client/db/wallet-db';
// import {
//     createTestProof,
//     createStoredProof,
//     createMeltQuoteResponse
// } from './helpers';
// import { getEncodedToken } from '@cashu/cashu-ts';
// import {
//     InsufficientBalanceError,
//     ValidationError
// } from '$lib/errors';

// describe('walletStore', () => {
//     beforeEach(async () => {
//         // Reset the underlying database
//         await walletDb.resetAll();

//         // Dynamically import CashuWallet so we can spy on its prototype.
//         // (This avoids a top-level import that can lead to hoisting issues.)
//         const { CashuWallet } = await import('@cashu/cashu-ts');
//         vi.spyOn(CashuWallet.prototype, 'loadMint').mockResolvedValue();

//         // Reset the walletStore (which may trigger initialization)
//         await walletStore.reset().catch(() => { });
//     });

//     afterEach(() => {
//         vi.restoreAllMocks();
//     });

//     it('initializes wallet successfully with default settings', async () => {
//         await walletStore.initialize();
//         const state = get(walletStore);

//         expect(state.isInitialized).toBe(true);
//         expect(state.wallet).toBeDefined();
//         expect(state.balance).toBe(0);

//         // When no settings exist, the default should be set.
//         const settings = await walletDb.getSettings();
//         expect(settings).toBeDefined();
//         expect(settings?.mintUrl).toBeDefined();
//     });

//     it('updates proofs and balance on updateProofs', async () => {
//         // Create two test proofs (amounts 10 and 20)
//         const proofs = [createTestProof(10), createTestProof(20)];
//         await walletStore.updateProofs(proofs);

//         // The new balance should be the sum (30)
//         const state = get(walletStore);
//         expect(state.balance).toBe(30);

//         // Check that the proofs were stored in the database.
//         const storedProofs = await walletDb.getAllProofs();
//         expect(storedProofs.length).toBe(2);
//     });

//     describe('sendToken', () => {
//         it('sends token successfully', async () => {
//             await walletStore.initialize();
//             // Insert a proof to provide balance.
//             const availableProof = createTestProof(100);
//             await walletStore.updateProofs([availableProof]);

//             // Dynamically import CashuWallet for spying.
//             const { CashuWallet } = await import('@cashu/cashu-ts');
//             const sendProof = createTestProof(50);
//             const sendSpy = vi.spyOn(CashuWallet.prototype, 'send').mockResolvedValue({
//                 send: [sendProof],
//                 keep: []
//             });

//             // Call sendToken with a valid amount.
//             const token = await walletStore.sendToken(50);

//             expect(sendSpy).toHaveBeenCalled();
//             const state = get(walletStore);
//             expect(token).toBe(
//                 getEncodedToken({
//                     mint: state.wallet!.mint.mintUrl,
//                     proofs: [sendProof]
//                 })
//             );

//             // After sending, active proofs are cleared so the balance should be zero.
//             const newBalance = await walletDb.getActiveBalance();
//             expect(newBalance).toBe(0);
//         });

//         it('throws error for insufficient balance', async () => {
//             await walletStore.initialize();
//             // With no proofs stored, balance is 0.
//             await expect(walletStore.sendToken(10)).rejects.toThrow(InsufficientBalanceError);
//         });

//         it('throws validation error for non-positive amount', async () => {
//             await walletStore.initialize();
//             await expect(walletStore.sendToken(0)).rejects.toThrow(ValidationError);
//         });
//     });

//     describe('sendLn', () => {
//         it('processes Lightning payment successfully', async () => {
//             await walletStore.initialize();
//             // Store a proof to have sufficient balance.
//             const availableProof = createTestProof(100);
//             await walletStore.updateProofs([availableProof]);

//             // Dynamically import CashuWallet for spying.
//             const { CashuWallet } = await import('@cashu/cashu-ts');

//             // Stub createMeltQuote to return a valid quote.
//             const meltQuoteResponse = createMeltQuoteResponse(40);
//             const quoteSpy = vi.spyOn(CashuWallet.prototype, 'createMeltQuote').mockResolvedValue(meltQuoteResponse);

//             // Stub wallet.send to simulate proof selection for the payment.
//             const sendProof = createTestProof(40);
//             const sendSpy = vi.spyOn(CashuWallet.prototype, 'send').mockResolvedValue({
//                 send: [sendProof],
//                 keep: []
//             });

//             // Stub meltProofs to simulate a successful Lightning payment.
//             const meltSpy = vi.spyOn(CashuWallet.prototype, 'meltProofs').mockResolvedValue({
//                 quote: meltQuoteResponse,
//                 change: []
//             });

//             const invoice = 'lninvoice';
//             const result = await walletStore.sendLn(invoice);

//             expect(quoteSpy).toHaveBeenCalledWith(invoice);
//             expect(sendSpy).toHaveBeenCalled();
//             expect(meltSpy).toHaveBeenCalled();
//             expect(result).toEqual(meltQuoteResponse);

//             // After sending, active proofs are cleared so balance should be 0.
//             const newBalance = await walletDb.getActiveBalance();
//             expect(newBalance).toBe(0);
//         });

//         it('throws error for insufficient balance in LN payment', async () => {
//             await walletStore.initialize();
//             const { CashuWallet } = await import('@cashu/cashu-ts');
//             // Stub createMeltQuote to return a quote that requires more funds than available.
//             const meltQuoteResponse = createMeltQuoteResponse(10);
//             vi.spyOn(CashuWallet.prototype, 'createMeltQuote').mockResolvedValue(meltQuoteResponse);

//             await expect(walletStore.sendLn('lninvoice')).rejects.toThrow(InsufficientBalanceError);
//         });
//     });

//     describe('setMintUrl', () => {
//         it('updates the mint url and reinitializes the wallet', async () => {
//             // Spy on initialize to verify that a reinitialization occurs.
//             const initSpy = vi.spyOn(walletStore, 'initialize');
//             const newUrl = 'https://new.mint.url';

//             await walletStore.setMintUrl(newUrl);

//             // Verify that the settings in the database have been updated.
//             const settings = await walletDb.getSettings();
//             expect(settings?.mintUrl).toEqual(newUrl);
//             expect(initSpy).toHaveBeenCalled();
//         });
//     });

//     describe('getHistory and clearHistory', () => {
//         it('retrieves and clears spent proofs', async () => {
//             await walletStore.initialize();
//             // Insert a spent proof manually.
//             const spentProof = createStoredProof(20, 'spent');
//             await walletDb.storeProofs([spentProof], 'spent');

//             let history = await walletStore.getHistory();
//             expect(history.length).toBeGreaterThan(0);

//             await walletStore.clearHistory();
//             history = await walletStore.getHistory();
//             expect(history.length).toBe(0);
//         });
//     });

//     describe('reset', () => {
//         it('resets the wallet, clearing proofs and settings', async () => {
//             // Initialize and store a proof.
//             await walletStore.initialize();
//             const proof = createTestProof(50);
//             await walletDb.storeProofs([proof]);

//             let activeBalance = await walletDb.getActiveBalance();
//             expect(activeBalance).toBeGreaterThan(0);

//             // Call reset to clear the wallet.
//             await walletStore.reset();

//             activeBalance = await walletDb.getActiveBalance();
//             expect(activeBalance).toBe(0);

//             // After reset, a default settings record should have been re-created.
//             const settings = await walletDb.getSettings();
//             expect(settings).toBeDefined();
//         });
//     });
// });
