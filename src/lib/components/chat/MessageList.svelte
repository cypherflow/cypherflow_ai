<!-- src/lib/components/chat/MessageList.svelte -->
<script lang="ts">
	import { onMount, tick } from 'svelte';
	import Button from '../ui/button/button.svelte';
	import { Copy, Loader, RefreshCw } from 'lucide-svelte';
	import { copyToClipboard } from '$lib/utils';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import type { ChatSession } from '$lib/client/chat';
	import AssistantResponse from './AssistantResponse.svelte';
	
	let { chatSession = $bindable() }: { chatSession: ChatSession } = $props();
	// Reference to the ScrollArea component
	let scrollAreaRef = $state<HTMLDivElement | null>(null);
	
	async function scrollToBottom(msg?: string) {
		await tick(); // Wait for DOM update
		if (scrollAreaRef) {
			// Access the viewport through the ref
			const viewport = scrollAreaRef.querySelector('[data-scroll-area-viewport]');
			if (viewport) {
				viewport.scrollTop = viewport.scrollHeight - viewport.clientHeight;
				//console.log(msg, 'after update ', viewport.scrollHeight);
			}
		}
	}
	
	// Scroll on mount
	onMount(() => {
		scrollToBottom('onmount... ');
		// Set up resize observer to handle viewport changes
		const resizeObserver = new ResizeObserver(() => {
			scrollToBottom('container resized');
		});
		if (scrollAreaRef) {
			resizeObserver.observe(scrollAreaRef);
			return () => resizeObserver.disconnect();
		}
	});
	
	// Scroll when messages change
	$effect(() => {
		chatSession.chat.messages; // Track changes to messages
		scrollToBottom('messages changed...');
	});
	
	//force scroll when the spinner appears
	$effect(() => {
		if (chatSession.isSubmitting) {
			scrollToBottom('spinner scroll');
		}
	});
	
	function isLastAiMessage(index: number): boolean {
		// Get all AI messages (not user messages)
		const aiMessages = chatSession.chat.messages.filter((m) => m.role !== 'user');
		// Get the last AI message
		const lastAiMessage = aiMessages[aiMessages.length - 1];
		// Check if current message is the last AI message
		return chatSession.chat.messages[index].id === lastAiMessage?.id;
	}
	
	function handleRegenerateClick() {
		// Implement regeneration logic here
		console.log('Regenerate clicked');
	}
</script>

<ScrollArea
	bind:ref={scrollAreaRef}
	class="h-0 flex-grow"
	orientation="vertical"
	scrollHideDelay={1000}
>
	<div class="flex min-w-full flex-col px-2 pt-2">
		{#each chatSession.chat.messages as message, index (message.id)}
			<!-- Inline rendering or delegate to MessageBubble -->
			{#if message.role === 'user'}
				<div class="mb-2 flex justify-end">
					<div
						class="max-w-[420px] rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-primary-foreground"
					>
						<p class="whitespace-pre-wrap break-words">{message.content}</p>
					</div>
				</div>
			{:else}
 
				<AssistantResponse 
					content={message.content}
					isLastMessage={isLastAiMessage(index)}
					isSubmitting={chatSession.isSubmitting}
					onRegenerateClick={handleRegenerateClick}
				/>
			{/if}
		{/each}
		{#if chatSession.isSubmitting && chatSession.chat.status !== 'streaming'}
			<Loader class="mb-2 ml-2 animate-spin" />
		{/if}
	</div>
</ScrollArea>
