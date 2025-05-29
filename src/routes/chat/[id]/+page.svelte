<!-- src/routes/chat/[id]/+page.svelte -->
<script lang="ts">
	import MessageList from '$lib/components/chat/MessageList.svelte';
	import ChatInput from '$lib/components/chat/ChatInput.svelte';
	//import { activeChatSession, loadExistingChat } from '$lib/client/stores/activeChat.svelte';
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';
	import { activeChat, loadExistingChat } from '$lib/client/stores/activeChat.svelte';
	
	let { data }: PageProps = $props();

  $effect(() => {
    		// Load the specific chat when we land on the chat page
		loadExistingChat(data.id);
    console.log("effect new page!!!!")

  })
</script>

<svelte:head>
	<title>{activeChat.chatSession.title || 'New Chat'} - CypherFlow</title>
</svelte:head>

<div class="mx-auto h-full w-full max-w-3xl">
	<div class="flex h-full w-full flex-grow flex-col overflow-auto">
		{#if activeChat.chatSession.isReady}
			<MessageList chatSession={activeChat.chatSession} />
			
			<!-- Pass the entire chatSession object to ChatInput -->
			<ChatInput bind:chatSession={activeChat.chatSession} />
		{:else}
			<span>Loading chat...</span>
		{/if}
	</div>
</div>
