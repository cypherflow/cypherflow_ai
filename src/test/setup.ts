// src/test/setup.ts
import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import { vi, afterEach } from 'vitest';
import { indexedDB } from 'fake-indexeddb';

// Mock IndexedDB
vi.stubGlobal('indexedDB', indexedDB);

// Mock fetch
vi.stubGlobal('fetch', vi.fn());

// Cleanup after each test
afterEach(() => {
	vi.clearAllMocks();
});
