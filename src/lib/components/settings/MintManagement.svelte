<!-- src/lib/components/settings/MintManagement.svelte -->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Banknote, RefreshCw } from 'lucide-svelte';
	import { consolidateTokens } from '$lib/client/stores/wallet';
	import MintList from './MintList.svelte';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import Separator from '../ui/separator/separator.svelte';
	import Alert from '../ui/alert/alert.svelte';
	import AlertDescription from '../ui/alert/alert-description.svelte';

	// Simple state for the consolidation process
	let isConsolidating: boolean = false;
	let consolidateError: string | null = '';

	async function handleConsolidate() {
		try {
			// Reset state
			isConsolidating = true;
			consolidateError = '';

			// Call the consolidateTokens function
			await consolidateTokens();
		} catch (error) {
			consolidateError =
				error instanceof Error ? error.message : 'Failed to consolidate your tokens.';
		} finally {
			isConsolidating = false;
		}
	}
</script>

<Accordion.Item>
	<Accordion.Trigger>
		<span class="flex w-full gap-2 text-left">
			<Banknote />
			Mint Management
		</span>
	</Accordion.Trigger>
	<Accordion.Content>
		<div class="mt-2 space-y-3">
			<p class="text-sm text-muted-foreground">
				Mints are servers that issue ecash tokens. Add trusted mints to send, receive, and manage
				your Cashu tokens.
			</p>
			<MintList />
			<Separator />
			<p class="text-sm text-muted-foreground">
				Consolidation combines your tokens and removes spent ones for better wallet performance.
			</p>

			<!-- Simple consolidation button with minimal feedback -->
			<Button
				disabled={isConsolidating}
				variant="outline"
				class="w-full"
				onclick={handleConsolidate}
			>
				<RefreshCw class={isConsolidating ? 'mr-2 animate-spin' : 'mr-2'} />
				{isConsolidating ? 'Consolidating tokens...' : 'Consolidate Tokens'}
			</Button>

			<!-- Error message -->
			{#if consolidateError}
				<Alert class="mt-2 border-red-200 bg-red-50">
					<AlertDescription class="text-red-700">
						{consolidateError}
					</AlertDescription>
				</Alert>
			{/if}
		</div>
	</Accordion.Content>
</Accordion.Item>
