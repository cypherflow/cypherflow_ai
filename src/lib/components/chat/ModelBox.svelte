<!-- src/lib/components/chat/ModelBox.svelte -->
<script lang="ts">
	import Check from 'lucide-svelte/icons/check';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import { tick } from 'svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import { getModelById, modelDetailsState } from '$lib/client/chat/manager/modelDetails.svelte';
	import type { ModelPublicationDetails } from '$lib/types';
	import { isWalletReady, walletBalance } from '$lib/client/stores/wallet';
	import type { ChatSession } from '$lib/client/chat';
	import { createDebug } from '$lib/utils/debug';
	
	// Create a debug logger specifically for ModelBox
	const d = createDebug('chat:modelbox');
	
	// Provider icons - served from static folder
	// Icons should be placed in static/{provider}.svg
	const SUPPORTED_PROVIDERS = [
		'qwen',
		'deepseek', 
		'openai',
		'arcee',
		'anthropic',
		'google',
		'meta-llama',
	];
	
	// Replace modelId prop with chatSession prop
	let { chatSession = $bindable() } = $props<{ chatSession: ChatSession }>();
	
	// UI state
	let open = $state(false);
	let triggerRef = $state<HTMLButtonElement>(null!);
	
	// Derived states based on modelDetailsState
	const availableModels = $derived(modelDetailsState.availableModels || []);
	const isLoading = $derived(modelDetailsState.isLoading || false);
	const selectedModel = $derived(getModelById(chatSession?.modelId) || (availableModels.length > 0 ? availableModels[0] : null));
	const currentBalance = $derived($walletBalance);
	
	// Extract provider from model ID
	function getProviderFromModelId(modelId: string): string {
		const slashIndex = modelId.indexOf('/');
		return slashIndex !== -1 ? modelId.substring(0, slashIndex).toLowerCase() : '';
	}
	
	// Get provider icon path from static folder
	function getProviderIcon(modelId: string): string | null {
		const provider = getProviderFromModelId(modelId);
		return SUPPORTED_PROVIDERS.includes(provider) ? `/${provider}.svg` : null;
	}
	
	// Clean model name by removing "Provider: " prefix
	function getCleanModelName(modelName: string): string {
		const colonIndex = modelName.indexOf(': ');
		return colonIndex !== -1 ? modelName.substring(colonIndex + 2) : modelName;
	}
	
	// Model deposits as a derived value - will be recalculated when dependencies change
	const modelDeposits = $derived.by(() => {
		d.log('[MODEL DEPOSITS] Recalculating model deposits');
		
		// Default to empty object if no models or messages
		if (!availableModels.length) {
			d.warn('[MODEL DEPOSITS] No available models, returning empty deposits object');
			return {};
		}
		
		// Calculate deposits for all models
		const deposits: Record<string, number> = {};
		d.log(`[MODEL DEPOSITS] Calculating deposits for ${availableModels.length} models`);
		
		availableModels.forEach(model => {
			d.log(`[MODEL DEPOSITS] Calculating deposit for model: ${model.id}`);
			// Log the model details we're using for calculation
			d.log(`[MODEL DEPOSITS] Model details:`, {
				id: model.id,
				completion_tokens_per_sat: model.completion_tokens_per_sat,
				max_output_tokens: model.max_output_tokens
			});
			
			// only calculate the deposit to cover the max output. dont mind the input deposit for model box
			deposits[model.id] = Math.ceil(model.max_output_tokens / model.completion_tokens_per_sat)
      if (model.prompt_tokens_per_sat == -1) deposits[model.id] = 0;
			d.log(`[MODEL DEPOSITS] Calculated deposit for ${model.id}: ${deposits[model.id]} sats`);
		});
		
		d.log('[MODEL DEPOSITS] Final deposits:', deposits);
		return deposits;
	});
	
	// Get deposit for a specific model
	function getDepositForModel(modelId: string): number {
		const deposit = modelDeposits[modelId];
    //console.log("deposit for modelId: ", modelId, ": ", deposit)
		return deposit;
	}
	
	// Check if a model is affordable
	function isModelAffordable(modelId: string): boolean {
		const deposit = getDepositForModel(modelId);
		const affordable = deposit <= currentBalance;
		d.log(`[AFFORDABILITY] Model ${modelId}: deposit=${deposit}, balance=${currentBalance}, affordable=${affordable}`);
		//d.log("models: ", availableModels)
		return affordable;
	}
	
	// We want to refocus the trigger button when the user selects
	// an item from the list so users can continue navigating the
	// rest of the form with the keyboard.
	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}
	
	// Consolidated function for words per sat calculation and formatting
	function getFormattedWordsPerSat(model: ModelPublicationDetails): string {
    // if prompt and completion prices are zero, then it is a free model
    if (model.prompt_tokens_per_sat == -1) {
      return "Free"
    }


		// Using the heuristic that 1 token ≈ 0.75 words
		// Calculating a weighted average of prompt and completion tokens
		const inputWordsPerSat = model.prompt_tokens_per_sat * 0.75;
		const outputWordsPerSat = model.completion_tokens_per_sat * 0.75;
		
		// Weighted average - 25% input, 75% output
		const wordsPerSat = (inputWordsPerSat * 0.25 + outputWordsPerSat * 0.75);
		
		// Format the result
		return wordsPerSat >= 1000 
			? `${Math.round(wordsPerSat / 100) / 10}k words/sat`
			: `${Math.round(wordsPerSat)} words/sat`;
	}
	
	// Calculate average tokens per sat for sorting
	function calculateAvgTokensPerSat(model: ModelPublicationDetails): number {
    if (model.prompt_tokens_per_sat == -1 && model.completion_tokens_per_sat == -1){
      // free model so it is infinite tokens per sat
      return 1e6
    }
		// Using a weighted average with more weight on completion tokens
		return (model.prompt_tokens_per_sat * 0.25 + model.completion_tokens_per_sat * 0.75);
	}
	
	let selectedModelName = $derived.by(() => {
		const name = selectedModel?.name;
		return name ? getCleanModelName(name) : '';
	})
</script>

<Popover.Root bind:open>
	<Popover.Trigger bind:ref={triggerRef}>
		{#snippet child({ props })}
			<Button
				variant="outline"
				class={cn(
					"w-fit justify-between bg-secondary",
				)}
				{...props}
				role="combobox"
				aria-expanded={open}
				disabled={isLoading}
			>
				{#if isLoading}
					<span>Loading models...</span>
				{:else if selectedModel}
					<div class="flex items-center gap-3">
						<!-- Provider Icon -->
						{#if getProviderIcon(selectedModel.id)}
							<img 
								src={getProviderIcon(selectedModel.id)} 
								alt="{getProviderFromModelId(selectedModel.id)} icon"
								class="w-6 h-6 flex-shrink-0 rounded text-foreground"
							/>
						{:else}
							<!-- Fallback: Show first letter of provider -->
							<div class="w-6 h-6 flex-shrink-0 bg-muted rounded flex items-center justify-center text-xs font-medium">
								{getProviderFromModelId(selectedModel.id).charAt(0).toUpperCase()}
							</div>
						{/if}
						
						<!-- Model Info -->
						<div class="flex flex-col items-start">
							<div class="flex items-center gap-1">
								<span class="font-medium truncate">{selectedModelName}</span>
							</div>
							<span class="text-xs text-muted-foreground">
								{getFormattedWordsPerSat(selectedModel)}
							</span>
						</div>
					</div>
				{:else}
					<span>Select a model...</span>
				{/if}
				<ChevronsUpDown class="h-4 w-4 opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-80 p-0" side='top'>
		<Command.Root>
			<Command.List class="max-h-[300px]">
				<Command.Empty>No model found.</Command.Empty>
				{#if isLoading || (!chatSession?.chat?.messages && availableModels.length > 0)}
					<div class="p-2 text-center text-sm">Loading deposit calculations...</div>
				{:else if availableModels.length === 0}
					<div class="p-2 text-center text-sm">No models available.</div>
				{:else}
					<Command.Group>
						{#each [...availableModels].sort((a, b) => {
							// Sort by average tokens per sat (higher is cheaper/better)
							const aAvgTokensPerSat = calculateAvgTokensPerSat(a);
							const bAvgTokensPerSat = calculateAvgTokensPerSat(b);
							return bAvgTokensPerSat - aAvgTokensPerSat; // Descending order (cheapest first)
						}) as model (model.id)}
							<Command.Item
								value={model.id}
								onSelect={() => {
									d.log(`[SELECTION] Model selected: ${model.id}, deposit: ${getDepositForModel(model.id)}`);
									chatSession.modelId = model.id;
									closeAndFocusTrigger();
								}}
								class={cn(
									"py-2", 
									!isModelAffordable(model.id) && "text-muted-foreground"
								)}
							>
								<div class="flex items-start justify-between w-full">
									<div class="flex items-center gap-3">
										<Check class={cn('h-4 w-4 mt-1 flex-shrink-0', chatSession?.modelId !== model.id && 'text-transparent')} />
										
										<!-- Provider Icon -->
										{#if getProviderIcon(model.id)}
											<img 
												src={getProviderIcon(model.id)} 
												alt="{getProviderFromModelId(model.id)} icon"
												class="w-5 h-5 flex-shrink-0 rounded text-foreground"
											/>
										{:else}
											<!-- Fallback: Show first letter of provider -->
											<div class="w-5 h-5 flex-shrink-0 bg-muted rounded flex items-center justify-center text-xs font-medium">
												{getProviderFromModelId(model.id).charAt(0).toUpperCase()}
											</div>
										{/if}
										
										<!-- Model Info -->
										<div class="flex flex-col">
											<div class="flex items-center gap-1">
												<span class="font-medium">{getCleanModelName(model.name)}</span>
											</div>
											<span class={!isModelAffordable(model.id) && $isWalletReady ? "text-xs text-yellow-600 dark:text-yellow-500" : "text-xs text-green-600 dark:text-green-500 font-medium"}>
												{getFormattedWordsPerSat(model)}
											</span>
										</div>
									</div>
									<div class="flex flex-col items-end text-xs">
										<!--<div class="flex flex-col items-end text-muted-foreground">
											{#if model.supports_vision}
												<span>✓ Vision</span>
											{/if}
										</div>-->
									</div>
								</div>
							</Command.Item>
						{/each}
					</Command.Group>
				{/if}
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
