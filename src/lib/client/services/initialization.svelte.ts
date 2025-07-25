// src/lib/client/services/initialization.ts
import { get } from 'svelte/store';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import {
  ndkInstance,
  currentUser,
  autoLogin,
  EXTENSION_LOGIN_MARKER
} from '$lib/client/stores/nostr';
import { initializeWallet } from '$lib/client/stores/wallet';
import {
  initChatList,
} from '$lib/client/chat/manager/chatList.svelte';
import { createDebug } from '$lib/utils/debug';
import { initModelDetails } from '../chat/manager/modelDetails.svelte';
import { initUserMenuNavigation } from '../stores/wallet-navigation';
import { startUnpublishedEventsMonitor } from './unpublishedEvents';

// Create a debug logger
const d = createDebug('init');

// Simple status enum
export enum InitStatus {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  INITIALIZED = 'initialized',
  ERROR = 'error'
}

// Create a state object to track initialization status
export const appState = $state({
  status: InitStatus.IDLE,
  error: null as string | null,
  isInitialized: false
});

/**
 * Main initialization function that sets up the entire app
 * This is the only function called from the layout
 * @param skipAuth Whether to skip authentication (for login pages)
 */
export async function initializeApp(skipAuth = false): Promise<{
  initialized: boolean;
}> {
  // Prevent multiple initialization attempts
  if (appState.status === InitStatus.INITIALIZING) {
    d.log('Initialization already in progress, skipping');
    return { initialized: false };
  }

  d.log('Starting app initialization');
  appState.status = InitStatus.INITIALIZING;
  appState.error = null;

  try {
    // Step 1: Auto-login if needed
    let autoLoginSuccess = false;

    if (!skipAuth && browser) {
      d.log('Attempting auto-login');
      try {
        autoLoginSuccess = await autoLogin() !== null;
        d.log(`Auto-login result: ${autoLoginSuccess ? 'success' : 'failed'}`);
      } catch (error) {
        d.error('Auto-login error:', error);
        // If extension marker exists but extension is not available
        if (localStorage.getItem(EXTENSION_LOGIN_MARKER) === 'true' && !window.nostr) {
          appState.error = 'Nostr extension not found. Please install or enable your extension.';
        } else {
          appState.error = error instanceof Error ? error.message : 'Auto-login failed';
        }

        // Clear any problematic markers
        localStorage.removeItem(EXTENSION_LOGIN_MARKER);
        return { initialized: false };
      }
    } else {
      d.log('Skipping auto-login');
    }

    // Step 2: Check if we have NDK instance and user after auto-login
    const ndk = get(ndkInstance);
    const user = get(currentUser);

    // If we don't have both NDK and user, we're not ready for full app initialization
    if (!ndk || !user) {
      d.log('No NDK instance or user available, initialization incomplete');

      if (skipAuth) {
        // This is expected on login page
        d.log('Auth skipped, this is likely the login page');
        appState.status = InitStatus.IDLE;
        return { initialized: false };
      } else {
        // This is unexpected on non-login pages
        appState.status = InitStatus.ERROR;
        appState.error = 'Authentication required';
        return { initialized: false };
      }
    }

    // Step 3: Initialize all components since we have NDK and user
    d.log('NDK and user available, initializing components');
    console.log(ndk.activeUser?.pubkey, user.pubkey)

    // Initialize synchronous components immediately
    initModelDetails();
    initChatList();
    initUserMenuNavigation();

    // Initialize async components
    await initializeWallet();

    // Start monitoring for unpublished events
    d.log('Starting unpublished events monitor');
    startUnpublishedEventsMonitor();

    // Mark initialization as complete
    d.log('App initialization complete');
    appState.status = InitStatus.INITIALIZED;
    appState.isInitialized = true;

    return { initialized: true };
  } catch (error) {
    d.error('App initialization failed:', error);
    appState.status = InitStatus.ERROR;
    appState.error = error instanceof Error ? error.message : 'Unknown initialization error';
    return { initialized: false };
  }
}

/**
 * Check if user is authenticated and app is initialized
 * Useful for route guards
 */
export function isAppReady(): boolean {
  return !!get(currentUser) && appState.isInitialized;
}

/**
 * Validation function for route guards
 * Redirects to login if not authenticated
 */
export function requireAuth(): boolean {
  if (browser && !isAppReady()) {
    d.log('Not authenticated, redirecting to login page');
    goto('/login');
    return false;
  }
  d.log('Authentication verified');
  return true;
}
