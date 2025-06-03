<!-- src/lib/components/chat/TokenInfoPopover.svelte -->
<script lang="ts">
	import { Info } from 'lucide-svelte';
	import Button from '../ui/button/button.svelte';
	import * as Popover from "$lib/components/ui/popover/index.js";
	
	interface TokenInfo {
		modelId?: string;
		promptTokens?: number;
		completionTokens?: number;
		promptTokensPerSat?: number;
		completionTokensPerSat?: number;
	}
	
	let { getMsgInfo, disabled = false } = $props<{ 
		getMsgInfo: () => TokenInfo; 
		disabled?: boolean;
	}>();
	
	// State for token info
	let tokenInfo = $state({
		modelId: '',
		promptTokens: 0,
		completionTokens: 0,
		promptTokensPerSat: 0,
		completionTokensPerSat: 0,
		totalPromptCost: 0,
		totalCompletionCost: 0,
		totalCost: 0,
		isFreeModel: false
	});
	
	function onInfo(): void {
		const info = getMsgInfo();
		console.log(info);
		
		// Check if it's a free model
		const isFreeModel = info.promptTokensPerSat === -1 || info.completionTokensPerSat === -1;
		
		// Calculate costs for paid models
		let totalPromptCost = 0;
		let totalCompletionCost = 0;
		let totalCost = 0;
		
		if (!isFreeModel && info.promptTokensPerSat && info.promptTokensPerSat > 0 && 
			info.completionTokensPerSat && info.completionTokensPerSat > 0) {
			totalPromptCost = (info.promptTokens || 0) / info.promptTokensPerSat;
			totalCompletionCost = (info.completionTokens || 0) / info.completionTokensPerSat;
			const rawTotal = totalPromptCost + totalCompletionCost;
			// Round up to next sat, minimum 1 sat for paid models
			totalCost = Math.max(1, Math.ceil(rawTotal));
		}
		
		// Update token info
		tokenInfo = {
			modelId: info.modelId || 'Unknown Model',
			promptTokens: info.promptTokens || 0,
			completionTokens: info.completionTokens || 0,
			promptTokensPerSat: info.promptTokensPerSat || 0,
			completionTokensPerSat: info.completionTokensPerSat || 0,
			totalPromptCost,
			totalCompletionCost,
			totalCost,
			isFreeModel
		};
	}
	
	// Format numbers with commas for readability
	function formatNumber(num: number): string {
		return num.toLocaleString();
	}
	
	// Format satoshis with appropriate decimal places
	function formatCostSats(sats: number): string {
		if (sats < 1 && sats > 0) {
			return '< 1 sat';
		}
		if (sats >= 1) {
			return sats.toFixed(2) + ' sats';
		}
		return '0 sats';
	}
	
	// Format total cost (always an integer)
	function formatTotalSats(sats: number): string {
		if (sats === 1) {
			return '1 sat';
		}
		return sats + ' sats';
	}
</script>

<Popover.Root>
	<Popover.Trigger>
		<Button onclick={onInfo} variant="ghost" size="icon" {disabled}>
			<Info />
		</Button>
	</Popover.Trigger>
	<Popover.Content class="w-80">
		<div class="space-y-3">
			<!-- Header -->
			<div class="flex items-center justify-between border-b pb-2">
				<h3 class="text-base font-semibold">Message Details</h3>
			</div>
			
			<!-- Model Info -->
			<div class="border-b pb-2">
				<h4 class="text-sm font-medium text-muted-foreground">Model</h4>
				<p class="text-sm font-mono">{tokenInfo.modelId}</p>
			</div>
			
			<!-- Token Counts -->
			<div class="space-y-2">
				<h4 class="text-sm font-medium text-muted-foreground">Usage</h4>
				<div class="text-sm space-y-1">
					<div>
						<span class="text-muted-foreground">Input:</span>
						<span class="font-mono ml-1">{formatNumber(tokenInfo.promptTokens)}</span>
						<span class="text-muted-foreground/70 italic ml-1">tokens</span>
					</div>
					<div>
						<span class="text-muted-foreground">Output:</span>
						<span class="font-mono ml-1">{formatNumber(tokenInfo.completionTokens)}</span>
						<span class="text-muted-foreground/70 italic ml-1">tokens</span>
					</div>
				</div>
			</div>
			
			<!-- Token Rates -->
			<div class="space-y-2">
				<h4 class="text-sm font-medium text-muted-foreground">Token Rates</h4>
				{#if tokenInfo.isFreeModel}
					<p class="text-sm text-muted-foreground">Free model</p>
				{:else}
					<div class="space-y-1 text-sm">
						<div class="flex justify-between">
							<span class="text-muted-foreground">Input tokens/sat:</span>
							<span class="font-mono">{formatNumber(tokenInfo.promptTokensPerSat)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Output tokens/sat:</span>
							<span class="font-mono">{formatNumber(tokenInfo.completionTokensPerSat)}</span>
						</div>
					</div>
				{/if}
			</div>
			
			<!-- Cost Breakdown -->
			<div class="space-y-2 border-t pt-2">
				<h4 class="text-sm font-medium text-muted-foreground">Cost Breakdown</h4>
				{#if tokenInfo.isFreeModel}
					<p class="text-sm font-medium">Free</p>
				{:else}
					<div class="space-y-1 text-sm">
						<div class="flex justify-between">
							<span class="text-muted-foreground">Input cost:</span>
							<span class="font-mono">{formatCostSats(tokenInfo.totalPromptCost)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Output cost:</span>
							<span class="font-mono">{formatCostSats(tokenInfo.totalCompletionCost)}</span>
						</div>
						<div class="flex justify-between font-medium border-t pt-1">
							<span>Total cost:</span>
							<span class="font-mono">{formatTotalSats(tokenInfo.totalCost)}</span>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</Popover.Content>
</Popover.Root>
