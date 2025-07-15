// src/lib/client/stores/chatSession.ts

import { ChatCF } from "../chat";

// Create a global chat session store
export let activeChat = $state<{ chat: ChatCF }>({ chat: new ChatCF() });

/**
 * Reset for a new chat (used on home page)
 */
export function resetForNewChat() {
  if (activeChat) {
    activeChat.chat.destroy();
  }
  activeChat.chat = new ChatCF(); // No ID = new chat mode
}

/**
 * Load an existing chat (used when navigating to chat page)
 */
export function loadExistingChat(chatId: string) {
  if (!activeChat.chat.isNewChat && activeChat.chat.id === chatId) {
    // Already loaded this chat
    return;
  }

  // Clean up existing session
  if (activeChat.chat) {
    activeChat.chat.destroy();
  }

  // Create new session for this chat ID
  activeChat.chat = new ChatCF(chatId);
}
