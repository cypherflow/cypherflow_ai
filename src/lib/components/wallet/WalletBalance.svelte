<!-- src/lib/components/wallet/WalletBalance.svelte -->
<script lang="ts">
	import { walletBalance, isWalletReady } from '$lib/client/stores/wallet';
	import { Loader2 } from 'lucide-svelte';

	export let compact = false;
</script>

<div class={compact ? 'text-sm text-muted-foreground' : 'text-3xl font-bold'}>
	{#if $isWalletReady}
		{$walletBalance.toLocaleString()} sats
	{:else}
		<div class="flex items-center gap-2">
			<Loader2 class="h-4 w-4 animate-spin" />
			<span class="text-sm text-muted-foreground">Loading...</span>
		</div>
	{/if}
</div>
