<!-- src/lib/components/nostr/NostrGenerateKeyView.svelte -->
<script lang="ts">
	import { isConnecting, generateNewKeypair, login } from '$lib/client/stores/nostr';
	import {
		initializeApp,
		appState,
		InitStatus
	} from '$lib/client/services/initialization.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ChevronLeft } from 'lucide-svelte';
	import { isUserMenuOpen, navigateTo } from '$lib/client/stores/wallet-navigation';
	import { onMount } from 'svelte';
	import ViewContainer from '../ui/ViewContainer.svelte';
	
	let errorMessage = $state<string>('');
	let isGenerating = $state<boolean>(false);
	
	// Auto-generate key on mount
	onMount(async () => {
		await handleGenerateNewKey();
	});
	
	async function handleGenerateNewKey() {
		try {
			isGenerating = true;
			errorMessage = '';
			
			// Step 1: Generate new keypair
			const privateKey = generateNewKeypair();
			
			// Step 2: Login with the new private key
			const loginSuccess = await login({
				method: 'private-key',
				privateKey
			});
			
			if (!loginSuccess) {
				errorMessage = 'Login failed with new key';
				return;
			}
			
			// Step 3: Initialize app with the logged in user
			const initResult = await initializeApp(false);
			
			if (initResult.initialized) {
        // go quickly to main and then close the user menu so they can focus on the chat interface
				navigateTo('main');
        isUserMenuOpen.set(false)
			} else {
				errorMessage = appState.error || 'App initialization failed';
			}
		} catch (error) {
			if (error instanceof Error) {
				errorMessage = error.message;
			} else {
				errorMessage = 'Failed to generate new keypair';
			}
			console.error('Key generation error:', error);
		} finally {
			isGenerating = false;
		}
	}
</script>

<ViewContainer className="p-4">
	<div class="mb-4 flex items-center">
		<Button variant="ghost" size="icon" onclick={() => navigateTo('login')} class="mr-2">
			<ChevronLeft class="h-4 w-4" />
		</Button>
		<h3 class="text-lg font-medium">Creating New Account</h3>
	</div>
	
	<!-- Error message display -->
	{#if errorMessage}
		<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
			<span class="block sm:inline">{errorMessage}</span>
		</div>
	{/if}
	
	<div class="space-y-4">
		<p class="text-sm text-muted-foreground">
			Creating a new Nostr account for you. Your keys will be generated and stored in your browser's local storage.
		</p>
		
		<div class="flex flex-col items-center justify-center py-8">
			<!-- You could add a loading animation here -->
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
			<p class="text-sm font-medium">
				{isGenerating || appState.status === InitStatus.INITIALIZING 
					? 'Generating your new account...' 
					: errorMessage 
						? 'Error creating account' 
						: 'Account created successfully!'}
			</p>
		</div>
		
		<!-- Retry button if there was an error -->
		{#if errorMessage}
			<Button 
				class="w-full" 
				onclick={handleGenerateNewKey} 
				disabled={isGenerating || appState.status === InitStatus.INITIALIZING}
			>
				Try Again
			</Button>
		{/if}
	</div>
</ViewContainer>
