<script lang="ts">
	import { isConnecting, isLoggedIn } from '$lib/client/stores/nostr';
	import { isWalletReady, walletBalance } from '$lib/client/stores/wallet';
	import { LogIn, Wallet } from 'lucide-svelte';
	import Button from '../ui/button/button.svelte';
	import Skeleton from '../ui/skeleton/skeleton.svelte';

	// Format balance for display
	function formatBalance(balance: number): string {
		return balance.toLocaleString();
	}
</script>

{#if $isLoggedIn}
	<Button variant="default">
		<!-- Wallet Balance Display -->
		<Wallet class="h-5 w-5" />
		{#if $isWalletReady}
			<span class="font-medium">{formatBalance($walletBalance)} sats</span>
		{:else}
			<Skeleton class="h-4 w-16" />
		{/if}
	</Button>
{:else}
	<Button variant="default" size="sm" disabled={$isConnecting}>
		{#if $isConnecting}
			<span
				class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
			></span>
			Connecting...
		{:else}
			<LogIn class="mr-2 h-4 w-4" />
			Start
		{/if}
	</Button>
{/if}
