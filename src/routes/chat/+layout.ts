// src/routes/chat/+layout.ts
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { ndkInstance, isLoggedIn } from '$lib/client/stores/nostr';
import { isAppReady } from '$lib/client/services/initialization.svelte';
import type { LayoutLoad } from '../$types';

export const ssr = false;

export const load: LayoutLoad = async ({ parent }) => {
	await parent();
	// Check if user is logged in and app is initialized
	const loggedIn = get(isLoggedIn);

	if (!loggedIn || !isAppReady()) {
		// Redirect to home with query param to open login popover
		throw redirect(302, '/?login=true');
	}

	// Ensure we have a valid NDK instance
	const ndk = get(ndkInstance);
	if (!ndk) {
		throw redirect(302, '/?login=true&error=ndk');
	}

	return {
		appReady: true
	};
};
