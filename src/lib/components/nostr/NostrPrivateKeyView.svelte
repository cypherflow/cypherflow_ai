<!-- src/lib/components/nostr/NostrPrivateKeyView.svelte -->
<script lang="ts">
	import { isConnecting, login } from '$lib/client/stores/nostr';
	import { initializeApp, appState, InitStatus } from '$lib/client/services/initialization.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { ChevronLeft, AlertTriangle } from 'lucide-svelte';
	import { navigateTo } from '$lib/client/stores/wallet-navigation';
	import ViewContainer from '../ui/ViewContainer.svelte';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { slide } from 'svelte/transition';

	let privateKey = '';
	let errorMessage = '';
	let securityWarningAccepted = false;

	async function handlePrivateKeyLogin(event: SubmitEvent) {
		// Prevent the default form submission behavior
		event.preventDefault();

		if (!privateKey) {
			errorMessage = 'Please enter your private key';
			return;
		}

		try {
			errorMessage = '';
			// Step 1: Login with private key
			const loginSuccess = await login({
				method: 'private-key',
				privateKey
			});

			if (!loginSuccess) {
				errorMessage = 'Login failed. Please check your private key and try again.';
				return;
			}

			// Step 2: Initialize app with the logged in user
			const initResult = await initializeApp(false);
			if (initResult.initialized) {
				navigateTo('main');
				privateKey = ''; // Clear the private key from memory
			} else {
				errorMessage = appState.error || 'App initialization failed';
			}
		} catch (error) {
			if (error instanceof Error) {
				errorMessage = error.message;
			} else {
				errorMessage = 'Unknown error during login';
			}
			console.error('Login error:', error);
		}
	}
</script>

<ViewContainer className="p-4">
	<div class="mb-4 flex items-center">
		<Button variant="ghost" size="icon" onclick={() => navigateTo('login')} class="mr-2">
			<ChevronLeft class="h-4 w-4" />
		</Button>
		<h3 class="text-lg font-medium">Private Key Login</h3>
	</div>

	<!-- Security Warning -->
	{#if !securityWarningAccepted}
		<div transition:slide>
			<Alert.Root variant="warning" class="mb-4">
				<AlertTriangle class="h-4 w-4" />
				<Alert.Title>Security Warning</Alert.Title>
				<Alert.Description class="mt-2 space-y-3">
					<p class="text-sm">
						Private keys are stored unencrypted in browser storage. We recommend
						<strong>creating a new account</strong> or
						<strong>linking an existing CypherFlow account</strong> instead.
					</p>
					<p class="text-xs text-muted-foreground">
						Only proceed with throwaway keys or if you understand the risks.
					</p>
					<Button size="sm" onclick={() => (securityWarningAccepted = true)} class="mt-2">
						I Understand the Risks
					</Button>
				</Alert.Description>
			</Alert.Root>
		</div>
	{/if}

	<!-- Error message display -->
	{#if errorMessage}
		<div
			class="relative mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
			role="alert"
		>
			<span class="block sm:inline">{errorMessage}</span>
		</div>
	{/if}

	<div class="space-y-4">
		<p class="text-sm text-muted-foreground">Enter your private key (nsec) to sign in.</p>

		<form onsubmit={handlePrivateKeyLogin} class="space-y-2">
			<!-- Hidden username field for accessibility and password managers -->
			<Input type="text" class="hidden" autocomplete="username" value="nsec-private-key" />
			<Input
				type="password"
				placeholder="nsec1..."
				bind:value={privateKey}
				class="font-mono text-sm"
				autocomplete="current-password"
				disabled={!securityWarningAccepted || appState.status === InitStatus.INITIALIZING}
			/>
			<Button
				type="submit"
				class="w-full"
				disabled={!securityWarningAccepted ||
					!privateKey ||
					$isConnecting ||
					appState.status === InitStatus.INITIALIZING}
			>
				{appState.status === InitStatus.INITIALIZING
					? 'Initializing...'
					: $isConnecting
						? 'Signing in...'
						: 'Sign In'}
			</Button>
		</form>
	</div>
</ViewContainer>
