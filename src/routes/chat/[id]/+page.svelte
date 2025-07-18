<!-- src/routes/chat/[id]/+page.svelte -->
<script lang="ts">
	import MessageList from '$lib/components/chat/MessageList.svelte';
	import ChatInput from '$lib/components/chat/ChatInput.svelte';
	import type { PageProps } from './$types';
	import { activeChat, loadExistingChat } from '$lib/client/stores/activeChat.svelte';

	let { data }: PageProps = $props();

	$effect(() => {
		// Load the specific chat when we land on the chat page
		loadExistingChat(data.id);
		console.log('effect new page!!!! loaded existing chat');
		console.log('activechat message', $state.snapshot(activeChat.chat));
	});
</script>

<svelte:head>
	<title>{activeChat.chat.title || 'New Chat'} - CypherFlow</title>
</svelte:head>

<div class="mx-auto h-full w-full max-w-3xl">
	<div class="flex h-full w-full flex-grow flex-col overflow-auto">
		{#if activeChat.chat.status == 'ready'}}
			<MessageList chat={activeChat.chat} />

			<!-- Pass the entire chatSession object to ChatInput -->
			<ChatInput bind:chat={activeChat.chat} />
		{:else}
			<span>Loading chat...</span>
		{/if}
	</div>
</div>
