<!-- src/lib/components/chat/MessageList.svelte -->
<script lang="ts">
	import { onMount, tick } from 'svelte';
	import Button from '../ui/button/button.svelte';
	import { Loader, ArrowDownToDot } from 'lucide-svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import type { ChatCF } from '$lib/client/chat';
	import AssistantResponse from './AssistantResponse.svelte';
	import { blur } from 'svelte/transition';

	let { chat = $bindable() }: { chat: ChatCF } = $props();
	// Reference to the ScrollArea component
	let scrollAreaRef = $state<HTMLDivElement | null>(null);

	// Smart scroll state
	let shouldAutoScroll = $state(true);
	let isUserScrolling = $state(false);
	const BOTTOM_THRESHOLD = 20; // pixels from bottom to consider "at bottom"

	function isNearBottom(): boolean {
		if (!scrollAreaRef) return false;

		const viewport = scrollAreaRef.querySelector('[data-scroll-area-viewport]');
		if (!viewport) return false;

		const { scrollTop, scrollHeight, clientHeight } = viewport;
		const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
		return distanceFromBottom <= BOTTOM_THRESHOLD;
	}

	function handleScroll() {
		if (isUserScrolling) {
			// User is actively scrolling, check if they're near bottom
			if (isNearBottom()) {
				shouldAutoScroll = true;
			} else {
				shouldAutoScroll = false;
			}
		}
	}

	async function scrollToBottom(msg?: string) {
		if (!shouldAutoScroll) return;

		await tick(); // Wait for DOM update
		if (scrollAreaRef) {
			// Access the viewport through the ref
			const viewport = scrollAreaRef.querySelector('[data-scroll-area-viewport]');
			if (viewport) {
				viewport.scrollTop = viewport.scrollHeight - viewport.clientHeight;
				console.log(msg, 'after update ', viewport.scrollHeight);
			}
		}
	}

	function scrollToBottomManual() {
		// Force scroll regardless of shouldAutoScroll state
		if (scrollAreaRef) {
			const viewport = scrollAreaRef.querySelector('[data-scroll-area-viewport]');
			if (viewport) {
				viewport.scrollTop = viewport.scrollHeight - viewport.clientHeight;
				shouldAutoScroll = true; // Resume auto-scrolling
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

		// Set up scroll listener
		const viewport = scrollAreaRef?.querySelector('[data-scroll-area-viewport]');
		if (viewport) {
			let scrollTimeout: number;

			const onScrollStart = () => {
				isUserScrolling = true;
				clearTimeout(scrollTimeout);
			};

			const onScrollEnd = () => {
				scrollTimeout = window.setTimeout(() => {
					isUserScrolling = false;
				}, 150); // 150ms delay to detect end of scrolling
			};

			viewport.addEventListener('scroll', () => {
				onScrollStart();
				handleScroll();
				onScrollEnd();
			});

			resizeObserver.observe(scrollAreaRef!);

			return () => {
				resizeObserver.disconnect();
				clearTimeout(scrollTimeout);
			};
		}
	});

	// Scroll when messages change
	$effect(() => {
		chat.messages; // Track changes to messages
		scrollToBottom('messages changed...');
	});

	//force scroll when the spinner appears
	$effect(() => {
		if (chat.status == 'submitted') {
			scrollToBottom('spinner scroll');
		}
	});

	function isLastAiMessage(index: number): boolean {
		// Get all AI messages (not user messages)
		const aiMessages = chat.messages.filter((m) => m.role !== 'user');
		// Get the last AI message
		const lastAiMessage = aiMessages[aiMessages.length - 1];
		// Check if current message is the last AI message
		return chat.messages[index].id === lastAiMessage?.id;
	}

	function handleRegenerateClick() {
		// Implement regeneration logic here
		console.log('Regenerate clicked');
	}
</script>

<div class="relative flex h-0 flex-grow flex-col">
	<ScrollArea
		bind:ref={scrollAreaRef}
		class="h-full flex-grow"
		orientation="vertical"
		scrollHideDelay={1000}
	>
		<div class="mb-8 flex min-w-full flex-col px-2 pt-2">
			{#each chat.messages as message, index (message.id)}
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
					<!-- <AssistantResponse  -->
					<!-- 	content={message.content} -->
					<!-- 	isLastMessage={isLastAiMessage(index)} -->
					<!-- 	isSubmitting={chatSession.isSubmitting} -->
					<!-- 	onRegenerateClick={handleRegenerateClick} -->
					<!--        getMsgInfo={() => chatSession.getMsgInfo(message.id)} -->
					<!-- /> -->
				{/if}
			{/each}
			{#if chat.status !== 'submitted' && chat.status !== 'streaming'}
				<Loader class="mb-2 ml-2 animate-spin" />
			{/if}
		</div>
	</ScrollArea>

	<!-- Floating scroll to bottom button -->
	{#if !shouldAutoScroll && chatSession.chat.messages.length > 0}
		<div class="absolute bottom-4 right-4 mb-8" transition:blur>
			<Button
				variant="secondary"
				size="icon"
				class="rounded-full shadow-lg"
				onclick={scrollToBottomManual}
			>
				<ArrowDownToDot class="h-4 w-4" />
			</Button>
		</div>
	{/if}
</div>
