// src/lib/client/chat/manager/chatList.ts
import { NDKEvent, NDKSubscription, NDKSubscriptionCacheUsage, type NDKFilter, type NDKSubscriptionOptions } from '@nostr-dev-kit/ndk';
import { getNDK } from '$lib/client/stores/nostr';
import { NDKChatKind } from '../types';
import { NDKChatContainer } from '../events/chatContainer';
import { createDebug } from '$lib/utils/debug';

const d = createDebug('chat:list');

export interface ChatSummary {
    id: string; // Chat ID (d-tag value)
    title: string; // Chat title
    pubkey: string; // Author's pubkey
    createdAt: number; // Creation timestamp
    lastActivityAt: number; // Timestamp of last activity (for sorting)
}

// Simplified state with only what's needed
export let chatListState = $state<{
    chats: ChatSummary[];
    isLoading: boolean;
    error: string | null;
    processedEventIds: Set<string>; // Track processed events
    subscription: NDKSubscription | null; // Track the active subscription
}>({
    chats: [],
    isLoading: true,
    error: null,
    processedEventIds: new Set(),
    subscription: null
});

/**
 * Initialize the chat list
 */
export function initChatList(): void {
    try {
        d.log('Initializing chat list');
        chatListState.isLoading = true;
        
        // Create subscription to load existing events and listen for new ones
        setupChatSubscription();
        
        chatListState.isLoading = false;
        d.log('Chat list initialization complete');
    } catch (e) {
        chatListState.error = e instanceof Error ? e.message : 'Failed to initialize chat list';
        d.error('Chat list initialization error:', e);
        chatListState.isLoading = false;
    }
}

/**
 * Set up NDK subscription for chat events
 */
function setupChatSubscription(): void {
    const ndk = getNDK();
    if (!ndk) {
        d.error('NDK not initialized');
        throw new Error('NDK not initialized');
    }
    
    // Check if user is authenticated
    const user = ndk.activeUser;
    if (!user) {
        d.error('No active user found');
        throw new Error('No active user found');
    }
    
    // Create filters for chat-related events
    const filters: NDKFilter[] = [
        { kinds: [NDKChatKind.CHAT_CONTAINER], authors: [user.pubkey] },
        { kinds: [NDKChatKind.MESSAGE], authors: [user.pubkey] }
    ];
    
    d.log('Setting up chat subscription with filters');
    
    // Set up subscription options to use the cache
    const opts: NDKSubscriptionOptions = {
        subId: 'chat-list',
        closeOnEose: false, // Keep the subscription open for new events
        cacheUsage: NDKSubscriptionCacheUsage.PARALLEL, // Use cache in parallel with relays
    };
    
    // Create and start the subscription
    const subscription = ndk.subscribe(filters, opts);
    
    // Handle events (both from cache and real-time)
    subscription.on('event', handleEvent);
    
    // Start the subscription
    subscription.start();
    d.log('Chat subscription started');
    
    // Store the subscription in state for later reference
    chatListState.subscription = subscription;
}

/**
 * Handle both cached and real-time events
 */
async function handleEvent(
    event: NDKEvent, 
    _relay: any, 
    _subscription: any, 
    fromCache: boolean,
    _optimisticPublish: boolean
): Promise<void> {
    try {
        // Skip if we've already processed this event
        if (chatListState.processedEventIds.has(event.id)) {
            return;
        }
        
        // Mark as processed
        chatListState.processedEventIds.add(event.id);
        
        // Handle based on event kind
        if (event.kind === NDKChatKind.CHAT_CONTAINER) {
            await handleChatContainerEvent(event);
        } else if (event.kind === NDKChatKind.MESSAGE) {
            await handleMessageEvent(event);
        }
    } catch (e) {
        d.error('Error handling event:', e);
    }
}

/**
 * Handle chat container events
 */
async function handleChatContainerEvent(event: NDKEvent): Promise<void> {
    try {
        d.log(`Processing chat container event: ${event.id.slice(0,4)}...${event.id.slice(-4)}`);
        // Convert to chat container
        const chatContainer = await NDKChatContainer.from(event);
        if (!chatContainer) {
            d.warn(`Failed to parse chat container from event:  ${event.id.slice(0,4)}...${event.id.slice(-4)}`);

            return;
        }
        
        const chatId = chatContainer.chatId;
        if (!chatId) {
            d.warn('Chat container missing chatId, skipping');
            return;
        }
        
        // Find existing chat or its latest activity time
        const existingChat = chatListState.chats.find(c => c.id === chatId);
        const activityTime = existingChat?.lastActivityAt || chatContainer.created_at;
        
        // Create a chat summary
        const summary: ChatSummary = {
            id: chatId,
            title: chatContainer.title || 'New Chat',
            pubkey: chatContainer.pubkey,
            createdAt: chatContainer.created_at,
            lastActivityAt: activityTime
        };
        
        if (existingChat) {
            // Update existing chat if the incoming event is newer
            if (chatContainer.created_at > existingChat.createdAt) {
                d.log(`Updating existing chat: ${chatId.slice(0,8)}...`);
                // Find and update in place
                const index = chatListState.chats.findIndex(c => c.id === chatId);
                if (index >= 0) {
                    // Preserve the lastActivityAt time from the existing chat
                    summary.lastActivityAt = existingChat.lastActivityAt;
                    chatListState.chats[index] = summary;
                }
            }
        } else {
            // Add new chat to the array
            d.log(`Adding new chat: ${chatId.slice(0,8)}... - "${summary.title.slice(0,16)}..."`);
            chatListState.chats.push(summary);
            // Sort the array after adding a new chat
            sortChatsByActivity();
        }
    } catch (e) {
        d.error('Error handling chat container event:', e);
    }
}

/**
 * Handle message events
 */
async function handleMessageEvent(event: NDKEvent): Promise<void> {
    try {
        // Get the chatId from the event tags
        const chatId = event.tagValue('chat');
        if (!chatId) {
            d.warn(`Message event missing chat tag: ${event.id}`);
            return;
        }
        
        // Find this chat in our list
        const chatIndex = chatListState.chats.findIndex(c => c.id === chatId);
        if (chatIndex >= 0) {
            // Update the lastActivityAt time if this message is newer
            if (event.created_at > chatListState.chats[chatIndex].lastActivityAt) {
                d.log(`Updating activity time for chat: ${chatId}`);
                chatListState.chats[chatIndex].lastActivityAt = event.created_at;
                
                // Re-sort the list based on activity time
                sortChatsByActivity();
            }
        }
    } catch (e) {
        d.error('Error handling message event:', e);
    }
}

/**
 * Sort chats by latest activity
 */
function sortChatsByActivity(): void {
    chatListState.chats.sort((a, b) => b.lastActivityAt - a.lastActivityAt);
}

/**
 * Manual refresh - reload chats
 */
export async function refreshChatList(): Promise<void> {
    d.log('Refreshing chat list');
    chatListState.isLoading = true;
    try {
        // Clear existing data
        chatListState.chats = [];
        chatListState.processedEventIds.clear();
        d.log('Cleared existing chat data');
        
        // Stop existing subscription if any
        if (chatListState.subscription) {
            d.log('Stopping existing subscription');
            chatListState.subscription.stop();
            chatListState.subscription = null;
        }
        
        // Set up a new subscription
        await setupChatSubscription();
        d.log('Chat list refreshed successfully');
    } catch (error) {
        d.error('Failed to refresh chat list:', error);
    } finally {
        chatListState.isLoading = false;
    }
}

/**
 * Delete a chat
 */
export async function deleteChat(
    chatId: string,
    publishDeletion: boolean = true
): Promise<boolean> {
    try {
        d.log(`Deleting chat: ${chatId}, publish deletion: ${publishDeletion}`);
        // Remove from UI list
        const index = chatListState.chats.findIndex(chat => chat.id === chatId);
        if (index !== -1) {
            chatListState.chats.splice(index, 1);
            d.log(`Removed chat from list: ${chatId}`);
        } else {
            d.warn(`Chat not found in list: ${chatId}`);
        }
        
        // Optionally publish a deletion event
        if (publishDeletion) {
            const ndk = getNDK();
            if (ndk && ndk.activeUser) {
                d.log(`Publishing chat deletion event for: ${chatId}`);
                // Implementation depends on how your app handles chat deletion events
                // This is a placeholder for Nostr deletion event logic
            } else {
                d.warn('Cannot publish deletion: NDK or active user missing');
            }
        }
        
        return true;
    } catch (e) {
        d.error('Error deleting chat:', e);
        return false;
    }
}

/**
 * Update a chat's title
 */
export function updateChatTitle(chatId: string, newTitle: string): void {
    d.log(`Updating chat title: ${chatId} -> "${newTitle}"`);
    const chatIndex = chatListState.chats.findIndex(chat => chat.id === chatId);
    if (chatIndex >= 0) {
        // Update in-place with deep reactivity
        chatListState.chats[chatIndex].title = newTitle;
        d.log(`Chat title updated: ${chatId}`);
    } else {
        d.warn(`Chat not found for title update: ${chatId}`);
    }
}
