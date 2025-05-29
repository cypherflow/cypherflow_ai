// src/routes/chat/[id]/+page.ts
import type { PageLoad } from './$types';

export const ssr = false;

export const load: PageLoad = async ({ params, parent }) => {
	// Wait for parent layout load to validate auth and app state
	await parent();

	// If we get here, authentication has been verified by the parent layout
	const id = params.id;

  // TODO: maybe add some validation that this chat id exist on the cache or something... later allegator
	return {
		id,
	};
};
