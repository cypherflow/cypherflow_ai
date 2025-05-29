<!-- src/routes/+page.svelte -->
<script lang="ts">
	import ChatInput from '$lib/components/chat/ChatInput.svelte';
	import { activeChat, resetForNewChat } from '$lib/client/stores/activeChat.svelte';
	import { onMount } from 'svelte';
  import {cypherpunkQuotes} from '$lib/client/quotes'
	
	// Randomly select a quote
	let randomQuote = cypherpunkQuotes[Math.floor(Math.random() * cypherpunkQuotes.length)];
	
	onMount(() => {
		// Reset to new chat mode when we land on home page
		resetForNewChat();
	});
</script>

<div class="m-auto h-full w-full px-2">
	<div class="mx-auto flex h-full max-w-2xl flex-col items-center justify-center space-y-4">
		<h1 class="text-2xl font-bold">What can I help with?</h1>
		<div class="text-center my-4 w-full">
			{#if randomQuote.text}
				<blockquote class="italic text-lg text-foreground-300 pl-4 py-2">
					"{randomQuote.text}"
					<footer class="text-sm text-foreground-400 mt-1">— {randomQuote.author}{#if randomQuote.source}, <cite>{randomQuote.source}</cite>{/if}</footer>
				</blockquote>
			{/if}
		</div>
		<!-- Pass the entire chatSession object to ChatInput -->
		<ChatInput chatSession={activeChat.chatSession} />
	</div>
</div>
