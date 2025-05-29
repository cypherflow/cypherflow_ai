<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';
	import {
		chatListState,
		refreshChatList,
		deleteChat,
		updateChatTitle
	} from '$lib/client/chat/manager/chatList.svelte';
	import Ellipsis from 'lucide-svelte/icons/ellipsis';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import { Pencil, RefreshCw, Loader } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	// Get the current chat ID from the URL
	let currentChatId = $derived(page.params.id);

	const sidebar = useSidebar();

	// Function to delete a chat
	async function handleDeleteChat(chatId: string) {
		// Confirm deletion with the user
		if (!confirm('Are you sure you want to delete this chat?')) {
			return;
		}

		// Delete the chat (this will handle database deletion and publish a Nostr event)
		const success = await deleteChat(chatId, true);

		if (success) {
			// If the deleted chat is the current one, navigate away
			if (chatId === currentChatId) {
				goto('/');
			}
		} else {
			alert('Failed to delete chat. Please try again.');
		}
	}

	// Function to rename a chat
	function renameChat(chatId: string) {
		// For simplicity, prompt the user for a new name
		// In a real app, you might want a modal component for this
		const newTitle = prompt('Enter new chat name:', '');
		if (newTitle) {
			updateChatTitle(chatId, newTitle);
			// Here you would also publish a nostr event to update the chat title
		}
	}

	// Function to manually refresh the chat list
	async function handleRefresh() {
		await refreshChatList();
	}
</script>

<Sidebar.Group class="group-data-[collapsible=icon]:hidden">
	<div class="mb-2 flex items-center justify-between">
		<Sidebar.GroupLabel>Chats</Sidebar.GroupLabel>
	</div>

	<Sidebar.Menu>
		{#if chatListState.chats.length === 0 && !chatListState.isLoading}
			<div class="px-2 py-4 text-center text-sm text-muted-foreground">
				No chats yet. Start a new conversation!
			</div>
		{:else if chatListState.error && !chatListState.isLoading && chatListState.chats.length === 0}
			<div class="px-2 py-4 text-center text-sm text-red-500">
				{chatListState.error}
				<button class="mx-auto mt-2 block text-primary hover:underline" onclick={handleRefresh}>
					Try again
				</button>
			</div>
		{:else}
			{#each chatListState.chats as chat (chat.id)}
				<Sidebar.MenuItem class={chat.id === currentChatId ? 'rounded-lg bg-primary/10' : ''}>
					<Sidebar.MenuButton>
						{#snippet child({ props })}
							<a
								onclick={() => {
									sidebar.isMobile ? sidebar.toggle() : null;
								}}
								href={`/chat/${chat.id}`}
								title={chat.title}
								{...props}
							>
								<span class="truncate">{chat.title}</span>
							</a>
						{/snippet}
					</Sidebar.MenuButton>

					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Sidebar.MenuAction showOnHover {...props}>
									<Ellipsis />
									<span class="sr-only">More</span>
								</Sidebar.MenuAction>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content
							class="w-56 rounded-lg"
							side={sidebar.isMobile ? 'bottom' : 'right'}
							align={sidebar.isMobile ? 'end' : 'start'}
						>
							<DropdownMenu.Item onSelect={() => renameChat(chat.id)}>
								<Pencil class="text-muted-foreground" />
								<span>Rename</span>
							</DropdownMenu.Item>
							<DropdownMenu.Separator />
							<DropdownMenu.Item onSelect={() => handleDeleteChat(chat.id)}>
								<Trash2 color="red" class="text-muted-foreground" />
								<span class="text-red-500">Delete</span>
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</Sidebar.MenuItem>
			{/each}
		{/if}
	</Sidebar.Menu>
</Sidebar.Group>
