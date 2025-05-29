import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toast } from 'svelte-sonner';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Utility function to copy text to clipboard
 * @param text Text to copy to clipboard
 * @returns Promise that resolves when the text is copied
 */
export async function copyToClipboard(text: string, label: string) {
	await navigator.clipboard
		.writeText(text)
		.then(() => {
			toast.success(`${label} copied to clipboard`);
		})
		.catch((err) => {
			console.error('Could not copy text: ', err);
			toast.error('Failed to copy');
		});
}

/**
 * Pastes text from clipboard if available
 * @returns Promise with the clipboard text or null if not supported/permitted
 */
export async function pasteFromClipboard(): Promise<string | null> {
	try {
		// Check if clipboard API is available and the context is secure
		if (
			typeof navigator !== 'undefined' &&
			navigator.clipboard &&
			navigator.clipboard.readText &&
			window.isSecureContext
		) {
			const text = await navigator.clipboard.readText();
			return text;
		} else {
			console.warn('Clipboard read access not available');
			return null;
		}
	} catch (error) {
		console.error('Failed to read from clipboard:', error);
		return null;
	}
}

/**
 * Formats a transaction description by removing the nanoId if present
 * @param description The original transaction description
 * @returns The formatted description with nanoId removed
 */
export function formatTransactionDescription(description: string): string {
	if (!description) return 'Unknown';

	// Check if this is an outgoing token with nanoId pattern
	// Pattern: "Token sent #XXXXX" where XXXXX is the nanoId
	const tokenSentPattern = /^(Token sent) #[A-Za-z0-9_-]{5,}$/;

	if (tokenSentPattern.test(description)) {
		// Return just "Token sent" without the nanoId
		return 'Token sent';
	}

	return description;
}
