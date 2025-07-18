<!-- src/routes/+page.svelte -->
<script lang="ts">
	import ChatInput from '$lib/components/chat/ChatInput.svelte';
	import { activeChat, resetForNewChat } from '$lib/client/stores/activeChat.svelte';
	import { onMount } from 'svelte';
	import { cypherpunkQuotes } from '$lib/client/quotes';

	// Randomly select a quote
	let randomQuote = cypherpunkQuotes[Math.floor(Math.random() * cypherpunkQuotes.length)];

	onMount(() => {
		// Reset to new chat mode when we land on home page
		resetForNewChat();
	});
</script>

<div class="m-auto h-full w-full px-2">
	<div class="mx-auto flex h-full max-w-2xl flex-col items-center justify-center">
		<div class="mb-16 space-y-4 text-center">
			<h1 class="text-2xl font-bold">What can I help with?</h1>
			<div class="w-full text-center">
				{#if randomQuote.text}
					<blockquote class="text-foreground-300 py-2 pl-4 text-lg italic">
						"{randomQuote.text}"
						<footer class="text-foreground-400 mt-1 text-sm">
							— {randomQuote.author}{#if randomQuote.source}, <cite>{randomQuote.source}</cite>{/if}
						</footer>
					</blockquote>
				{/if}
			</div>
		</div>
		<!-- Pass the entire chatSession object to ChatInput -->
		<ChatInput chat={activeChat.chat} />
	</div>
</div>
