<!-- src/lib/components/nostr/NostrMainView.svelte -->
<script lang="ts">
	import { currentUser } from '$lib/client/stores/nostr';
	import { Button } from '$lib/components/ui/button';
	import {
		ArrowDownRight,
		ArrowUpRight,
		Clock,
		Settings,
		ScanQrCode,
		ExternalLink
	} from 'lucide-svelte';
	import WalletBalance from '$lib/components/wallet/WalletBalance.svelte';
	import RecentTransactions from '$lib/components/wallet/RecentTransactions.svelte';
	import { isLoadingTransactions, walletTransactions } from '$lib/client/stores/wallet';

	// Import navigation store functions
	import { navigateTo } from '$lib/client/stores/wallet-navigation';
	import ViewContainer from '../ui/ViewContainer.svelte';
</script>

<ViewContainer className="space-y-4 p-4">
	<!-- Top Header with npub and action buttons -->
	<div class="flex items-center justify-between">
		<!-- User npub abbreviated -->
		<p class="text-sm font-medium" title={$currentUser?.npub}>
			{$currentUser?.npub.slice(0, 8)}...{$currentUser?.npub.slice(-4)}
		</p>
		<!-- Action buttons -->
		<div class="flex space-x-1">
			<Button
				variant="ghost"
				size="icon"
				class="h-8 w-8"
				onclick={() => navigateTo('transactions')}
			>
				<Clock class="h-4 w-4" />
			</Button>
			<Button variant="ghost" size="icon" class="h-8 w-8" onclick={() => navigateTo('settings')}>
				<Settings class="h-4 w-4" />
			</Button>
		</div>
	</div>
	<!-- Wallet Balance Section - Centered and prominent -->
	<div class="flex flex-col items-center py-4">
		<div class="mb-2 text-sm text-muted-foreground">Wallet Balance</div>
		<div class="text-xl font-bold">
			<WalletBalance />
		</div>
	</div>
	<!-- Single row with Receive, Scan, and Send buttons -->
	<div class="flex items-center justify-center gap-2">
		<!-- Receive button (fills left side) -->
		<Button
			variant="outline"
			onclick={() => navigateTo('receive')}
			class="flex-1 items-center justify-center"
		>
			<ArrowDownRight class="mr-2 h-4 w-4" />
			Receive
		</Button>
		<!-- Scan button (centered, square) -->
		<Button variant="default" size="icon" class="" onclick={() => navigateTo('qr-scanner')}>
			<ScanQrCode />
		</Button>
		<!-- Send button (fills right side) -->
		<Button
			variant="outline"
			onclick={() => navigateTo('send')}
			class="flex-1 items-center justify-center"
		>
			<ArrowUpRight class="mr-2 h-4 w-4" />
			Send
		</Button>
	</div>
	<!-- Recent Transactions Section -->
	{#if $walletTransactions.length > 0 || $isLoadingTransactions}
		<div class="mt-2 rounded-lg bg-secondary/20 p-3">
			<RecentTransactions limit={3} />
		</div>
	{/if}
	<!-- Footer warning text -->
	<div class="mt-6 border-t pt-2 text-center text-xs text-muted-foreground">
		<p>
			CypherFlow is <a
				href="https://github.com/cypherflow/cypherflow_ai"
				target="_blank"
				class="inline text-blue-500 underline">open source</a
			> and experimental.
		</p>
		<p>Use at your own risk.</p>
	</div>
</ViewContainer>
