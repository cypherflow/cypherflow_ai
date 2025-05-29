// src/lib/client/stores/chatSession.ts
//import { ChatSession } from '../chat/manager/chatSession';

import { ChatSession } from "../chat";

// Create a global chat session store
export let activeChat = $state<{chatSession: ChatSession}>({chatSession: new ChatSession()});

/**
 * Reset for a new chat (used on home page)
 */
export function resetForNewChat() {
	if (activeChat) {
		activeChat.chatSession.destroy();
	}
	activeChat.chatSession = new ChatSession(); // No ID = new chat mode
}

/**
 * Load an existing chat (used when navigating to chat page)
 */
export function loadExistingChat(chatId: string) {
	if (!activeChat.chatSession.isNewChat && activeChat.chatSession.id === chatId) {
		// Already loaded this chat
		return;
	}
	
	// Clean up existing session
	if (activeChat.chatSession) {
		activeChat.chatSession.destroy();
	}
	
	// Create new session for this chat ID
	activeChat.chatSession = new ChatSession(chatId);
}
