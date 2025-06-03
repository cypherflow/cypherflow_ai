<!-- src/lib/components/chat/AssistantResponse.svelte -->
<script lang="ts">
	import { Copy, Info, RefreshCw } from 'lucide-svelte';
	import Button from '../ui/button/button.svelte';
	import { copyToClipboard } from '$lib/utils';
	import MarkdownRenderer from '../markdown/MarkdownRenderer.svelte';
	import * as Popover from "$lib/components/ui/popover/index.js";
	
	let { content = $bindable(''), isLastMessage, isSubmitting, onRegenerateClick, getMsgInfo } = $props();
	
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
		
		if (!isFreeModel && info.promptTokensPerSat > 0 && info.completionTokensPerSat > 0) {
			totalPromptCost = info.promptTokens / info.promptTokensPerSat;
			totalCompletionCost = info.completionTokens / info.completionTokensPerSat;
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
			return '< 1';
		}
		if (sats >= 1) {
			return sats.toFixed(2);
		}
		return '0';
	}
</script>

<div class="group flex flex-col justify-start">
	<div class="max-w-[640px] px-2">
		<MarkdownRenderer {content} />
	</div>
	<!-- Action buttons that respond to group hover/focus -->
	<div
		class="m-0 flex flex-row p-0 transition-opacity duration-200
        {isLastMessage && !isSubmitting
			? 'opacity-100'
			: 'opacity-0 group-hover:opacity-100 group-focus:opacity-100 group-active:opacity-100'}"
	>
		<Button onclick={() => copyToClipboard(content, 'Text')} variant="ghost" size="icon" disabled={isSubmitting && isLastMessage}>
			<Copy />
		</Button>
		<Button disabled onclick={onRegenerateClick} variant="ghost" size="icon">
			<RefreshCw />
		</Button>	
		<Popover.Root>
			<Popover.Trigger>
				<Button onclick={onInfo} variant="ghost" size="icon">
					<Info />
				</Button>
			</Popover.Trigger>
			<Popover.Content class="w-80">
				<div class="space-y-3">
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
									<span class="font-mono">{formatCostSats(tokenInfo.totalPromptCost)} sats</span>
								</div>
								<div class="flex justify-between">
									<span class="text-muted-foreground">Output cost:</span>
									<span class="font-mono">{formatCostSats(tokenInfo.totalCompletionCost)} sats</span>
								</div>
								<div class="flex justify-between font-medium border-t pt-1">
									<span>Total cost:</span>
									<span class="font-mono">{tokenInfo.totalCost} sats</span>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</Popover.Content>
		</Popover.Root>
	</div>
</div>
