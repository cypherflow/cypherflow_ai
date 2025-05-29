// src/routes/+layout.ts
import { initializeApp } from '$lib/client/services/initialization.svelte';
import type { LayoutLoad } from './$types';
import { initDebug } from '$lib/utils/debug';

// Disable SSR
export const ssr = false;

// Initialize debug tools early
initDebug();

export const load: LayoutLoad = async ({ url }) => {
  // Extract URL parameters
  const showLogin = url.searchParams.get('login') === 'true';
  
  // Initialize app with a single call
  const result = await initializeApp(showLogin);
  
  // Return minimal data
  return {
    initialized: result.initialized,
    showLogin: showLogin || !result.initialized
  };
};
