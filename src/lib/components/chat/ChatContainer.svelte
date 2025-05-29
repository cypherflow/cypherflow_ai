<!-- src/lib/components/chat/ChatContainer.svelte -->
<script lang="ts">
	import MessageList from './MessageList.svelte';
	import ChatInput from './ChatInput.svelte';
	import { initMessage } from '$lib/client/runes.svelte';
	import { onDestroy, untrack } from 'svelte';
	import { ChatSession } from '$lib/client/chat';
	import { generateToken } from '$lib/client/stores/wallet';
	import { createDebug } from '$lib/utils/debug';
	import { calculateCurrentDepositAmount } from '$lib/client/utils/deposit';
	
	// Create debug logger
	const d = createDebug('chat:container');
	const dDeposit = d.extend('deposit');
	
	let { chatId } = $props();
	
	// Create ChatSession with just NDK and initial data
	let chatSession = $state(new ChatSession(chatId));
	
	
	$effect(() => {
		// Check if there is only one previous message and it came from home page
		if (chatSession.chat.messages.length === 1 && initMessage.isFromHome) {
			// set selected modelId from home page into chat chatSession
			chatSession.modelId = $state.snapshot(initMessage.modelId);
			dDeposit(`Initial message with model: ${chatSession.modelId}`);
			
			untrack(() => {
				handleInitialMessage();
				initMessage.isFromHome = false;
				initMessage.modelId = '';
			});
		}
	});
	
	onDestroy(() => {
		chatSession.destroy();
	});

	async function handleInitialMessage() {
		dDeposit('Initial message found, calculating required deposit');
		chatSession.isSubmitting = true;
		
		try {
			// Calculate the required deposit based on the current messages and model
			// Since this is the first message, we can use the one message in chat.messages
			const requiredDeposit = calculateDepositForInitialMessage();
			
			dDeposit(`Initial message deposit calculated: ${requiredDeposit} sats`);
			
			const { encodedToken } = await generateToken(requiredDeposit);
			if (encodedToken) {
				dDeposit(`Token generated for ${requiredDeposit} sats, submitting initial message`);
				
				chatSession.chat.reload({
					headers: { 'X-Cashu': encodedToken },
					body: { modelId: chatSession.modelId }
				});
			} else {
				dDeposit.error('Failed to generate token for initial message');
				chatSession.isSubmitting = false;
			}
		} catch (error: any) {
			dDeposit.error('Error handling initial message:', error);
			chatSession.isSubmitting = false;
		}
	}
	
	// Calculate deposit amount for the initial message
	function calculateDepositForInitialMessage(): number {
		try {
			// Get the current messages (should be just one from the home page)
			const messages = chatSession.chat.messages;
			const modelId = chatSession.modelId;
			
			if (!modelId) {
				dDeposit.warn('No model ID available for initial message, using fallback');
				return 5; // Fallback amount
			}
			
			// Use the deposit calculation utility
			const depositAmount = calculateCurrentDepositAmount(messages, modelId);
			dDeposit(`Calculated deposit for initial message: ${depositAmount} sats`);
			
			return depositAmount;
		} catch (error) {
			dDeposit.error('Error calculating initial deposit:', error);
			return 5; // Fallback amount if calculation fails
		}
	}
</script>

<svelte:head>
	<title>{chatSession.title || 'New Chat'} - CypherFlow</title>
</svelte:head>

<div class="flex h-full w-full flex-grow flex-col overflow-auto">
	{#if chatSession.isReady}
		<MessageList bind:chatSession />
	{:else}
		<span>Loading chatSession...</span>
	{/if}
	
	<ChatInput
		bind:value={chatSession.chat.input}
		bind:modelId={chatSession.modelId}
		onsubmit={chatSession.sendUserMessage}
		isSubmitting={chatSession.isSubmitting}
	/>
</div>
