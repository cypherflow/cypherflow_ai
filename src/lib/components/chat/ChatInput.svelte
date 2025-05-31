<!-- src/lib/components/chat/ChatInput.svelte -->
<script lang="ts">
	import { ArrowUp, Globe, LoaderCircle, Plus } from 'lucide-svelte';
	import Button from '../ui/button/button.svelte';
	import ModelBox from './ModelBox.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { isWalletReady, walletBalance } from '$lib/client/stores/wallet';
	import type { ChatSession } from '$lib/client/chat';
	import { calculateCurrentDepositAmount } from '$lib/client/utils/deposit';
	import InsufficientBalanceAlert from './InsufficientBalanceAlert.svelte';
	import type { Message } from '@ai-sdk/ui-utils';
	
	let { chatSession = $bindable() } = $props<{
		chatSession: ChatSession;
	}>();
	
	let textareaElement = $state<HTMLTextAreaElement | null>(null);
	let isDisabled = $derived(chatSession.isSubmitting || !chatSession.chat.input.trim());
	const currentBalance = $derived($walletBalance);
	
	// Calculate required deposit using the utility function
	let requiredDeposit = $derived.by(() => {
    let messages: Message[] = [];
		
		// If there's a draft message (current input), add it to the messages for deposit calculation
		if (chatSession.chat.input && chatSession.chat.input.trim().length > 0) {
			messages.push({
				id: 'draft',
				role: 'user',
				content: chatSession.chat.input.trim(),
				createdAt: new Date(),
				experimental_attachments: undefined,
				parts: [{type: 'text', text: chatSession.chat.input.trim()}]
			});
		}
		
		return calculateCurrentDepositAmount(messages, chatSession.modelId);
	});
	
	// Check if the current model is affordable based on required deposit
	const isSufficientBalance = $derived(requiredDeposit <= currentBalance);
	
	function autoResize() {
		if (textareaElement) {
			textareaElement.style.height = 'auto';
			textareaElement.style.height = textareaElement.scrollHeight + 'px';
		}
	}
	
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			if (isSufficientBalance) {
				chatSession.sendUserMessage();
			}
		}
	}
	
	function handleSubmit() {
		if (isSufficientBalance) {
			chatSession.sendUserMessage();
		}
		return false; // Prevent default form submission
	}
	
	$effect(() => {
		if (textareaElement && chatSession.chat.input === '') {
			textareaElement.style.height = 'auto';
		}
	});
</script>

<div class="sticky bottom-0 w-full px-2 pb-2">
  <div  class="w-full flex justify-end bg-transparent">
    <!--<div class="bg-secondary rounded-t-xl">-->

					<ModelBox bind:chatSession={chatSession} />
    <!--</div>-->
  </div>
	<div class="w-full rounded-b-xl rounded-tl-xl border bg-secondary p-1 shadow-2xl dark:shadow-popover">
		{#if !isSufficientBalance && $isWalletReady}
			<InsufficientBalanceAlert 
				requiredAmount={requiredDeposit}
				modelId={chatSession.modelId}
			/>
		{/if}
		
		<form onsubmit={handleSubmit}>
			<textarea
				bind:this={textareaElement}
				bind:value={chatSession.chat.input}
				oninput={autoResize}
				onkeydown={handleKeydown}
				placeholder="Message CypherFlow"
				rows="1"
				class="max-h-[10em] w-full resize-none overflow-y-auto overscroll-contain rounded-lg bg-secondary p-2 focus:outline-none disabled:opacity-50 md:max-h-[15em]"
				disabled={chatSession.isSubmitting}
			></textarea>
			<div class="flex items-center justify-between">
				<div class="flex gap-2">
					<Button
						disabled
						variant="secondary"
						class="rounded-xl border border-primary/20"
						size="icon"
					>
						<Plus />
					</Button>
					<Button disabled variant="secondary" class="rounded-xl border border-primary/20">
						<Globe />
						Search
					</Button>
				</div>
				<div class="flex flex-row items-center gap-2">
					<!--<ModelBox bind:chatSession={chatSession} />-->
					
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Button 
								type="submit" 
								size="icon" 
								class="rounded-xl" 
								disabled={isDisabled || !isSufficientBalance}
							>
								{#if chatSession.isSubmitting}
									<LoaderCircle class="animate-spin" />
								{:else}
									<ArrowUp />
								{/if}
							</Button>
						</Tooltip.Trigger>
						{#if !isSufficientBalance && !isDisabled}
							<Tooltip.Content side="top">
								<p>Insufficient balance - top up wallet</p>
							</Tooltip.Content>
						{/if}
					</Tooltip.Root>
				</div>
			</div>
		</form>
	</div>
</div>
