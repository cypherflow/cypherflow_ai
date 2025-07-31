// src/lib/client/chat/manager/chatSession.ts
import { Chat } from '@ai-sdk/svelte';
import { NDKEvent, NDKSubscription, NDKSubscriptionCacheUsage, type NDKFilter, type NDKSubscriptionOptions } from '@nostr-dev-kit/ndk';
import { generateId, type Message, type UIMessage } from '@ai-sdk/ui-utils';
import { NDKChatContainer } from '../events/chatContainer';
import { NDKChatBranch } from '../events/branchContainer';
import { NDKChatMessage } from '../events/message';
import { NDKChatKind, type LanguageModelUsage, type LanguageModelV1FinishReason } from '../types';
import type { MyAnnotation } from '$lib/types/chat';
import { receiveToken } from '$lib/client/stores/wallet';
import { PUBLIC_CHAT_ENDPOINT } from '$env/static/public';
import { calculateCurrentDepositAmount, calculateMaxInputChars } from '$lib/client/utils/deposit';
import { createDebug } from '$lib/utils/debug';
import { getNDK } from '$lib/client/stores/nostr';
import { goto } from '$app/navigation';

// Create debug logger for the chat session with proper namespacing
const d = createDebug('chat:session');
// Create extended namespaces for specific functionalities
const dDeposit = d.extend('deposit');
const dEvents = d.extend('events');
const dSubscription = d.extend('subscription');
const dMessages = d.extend('messages');
const dNostr = d.extend('nostr');

export class ChatSession {
  // Nostr events tracking
  private chatContainer = $state<NDKChatContainer | undefined>();
  private branches = $state<Map<string, NDKChatBranch>>(new Map());
  private messages = $state<Map<string, NDKChatMessage>>(new Map());
  private activeBranchId = $derived(this.chatContainer?.activeBranchId);
  modelId = $state<string>('google/gemma-3n-e4b-it:free');

  // Track if this is a new or existing chat
  isNewChat = $state<boolean>(true);

  maxInputChars = $derived(this.modelId ? calculateMaxInputChars(this.modelId) : 8000);

  // Track processed events to avoid duplicates
  private processedEventIds = $state<Set<string>>(new Set());
  // The Vercel AI SDK Chat instance
  chat: Chat;

  // Chat metadata
  id: string;
  title = $derived(this.chatContainer?.title || 'New Chat');

  // Deposit tracking
  currentDepositAmount = $state<number>(0);
  isCalculatingDeposit = $state<boolean>(false);
  showBalanceWarning = $state<boolean>(true);

  // Calculate the required deposit amount based on current messages and model
  requiredDepositAmount = $derived(this.calculateRequiredDeposit());

  // Chat loading and state
  isSubmitting = $state<boolean>(false);
  isReady = $state<boolean>(false);

  // Subscription management
  private subscription: NDKSubscription | null = null;

  constructor(chatId?: string) {
    // For new chats, generate an ID. For existing chats, use provided ID
    this.id = chatId || generateId();
    this.isNewChat = !chatId;

    d.log(`Creating new ChatSession - ID: ${this.id}, isNewChat: ${this.isNewChat}`);

    // For new chats, mark as ready immediately
    if (this.isNewChat) {
      this.isReady = true;
      d.log('New chat marked as ready');
    }

    // Initialize with default Chat instance
    this.chat = new Chat({
      api: PUBLIC_CHAT_ENDPOINT,
      onFinish: async (message, { usage, finishReason }) => {
        d.log(`Assistant message finished - finishReason: ${finishReason}, usage:`, usage);

        let firstAnnotation: MyAnnotation | undefined = undefined;

        if (
          message.annotations &&
          Array.isArray(message.annotations) &&
          message.annotations.length > 0
        ) {
          d.log('Message contains annotations:', message.annotations);
          firstAnnotation = message.annotations[0] as unknown as MyAnnotation;

          // this.isSubmitting = false;
          if (firstAnnotation.change)
            try {
              dDeposit.log('Processing token change:', firstAnnotation.change);
              await receiveToken(firstAnnotation.change);
              dDeposit.log('Token change received successfully');
            } catch (error) {
              dDeposit.error('Failed to receive token change:', error);
            }
        }

        this.isSubmitting = false;

        this.showBalanceWarning = true;
        await this.handleAssistantMessage(message, usage, finishReason, firstAnnotation);
      }
    });

    // Set up subscription only for existing chats
    if (!this.isNewChat) {
      d.log('Setting up subscription for existing chat');
      this.setupSubscription();
    }
  }

  /**
   * Set up NDK subscription for this specific chat
   */
  private setupSubscription(): void {
    try {
      dSubscription.log(`Setting up subscription for chat ${this.id}`);
      let ndk = getNDK();
      // Get the current user
      if (!ndk.activeUser) {
        dSubscription.error('No active user found');
        throw new Error('No active user found');
      }

      // Create filters for this specific chat
      const filters: NDKFilter[] = [
        // Chat container for this specific chat
        {
          kinds: [NDKChatKind.CHAT_CONTAINER],
          authors: [ndk.activeUser.pubkey],
          '#d': [this.id]
        },
        // Branches for this chat
        {
          kinds: [NDKChatKind.BRANCH_CONTAINER],
          authors: [ndk.activeUser.pubkey],
          '#chat': [this.id]
        },
        // Messages for this chat
        {
          kinds: [NDKChatKind.MESSAGE],
          authors: [ndk.activeUser.pubkey],
          '#chat': [this.id]
        }
      ];

      dSubscription.log('Created filters for subscription:', filters);

      // Set up subscription options
      const opts: NDKSubscriptionOptions = {
        subId: `chat-session-${this.id}`,
        closeOnEose: false, // Keep listening for new events
        cacheUsage: NDKSubscriptionCacheUsage.PARALLEL, // Use cache in parallel with relays
      };

      // Create subscription
      this.subscription = ndk.subscribe(filters, opts);
      dSubscription.log('Created NDK subscription with ID:', opts.subId);

      // Handle events from both cache and relays
      this.subscription.on('event', async (event: NDKEvent, _relay: any, _subscription: any, fromCache: boolean) => {
        dEvents.log(`Received event ${event.id.slice(0, 8)}... (kind: ${event.kind}) from ${fromCache ? 'cache' : 'relay'}`);
        if (fromCache) dEvents.log("Event from cache:", event);
        await this.handleEvent(event);
      });

      // Start the subscription
      this.subscription.start();
      this.isReady = true;
      dSubscription.log('Subscription started successfully');

    } catch (error) {
      dSubscription.error('Failed to set up subscription:', error);
      throw error;
    }
  }

  /**
   * Handle events from both cache and real-time subscription
   */
  private async handleEvent(event: NDKEvent): Promise<void> {
    try {
      // Skip if we've already processed this event
      if (this.processedEventIds.has(event.id)) {
        dEvents.log(`Skipping already processed event ${event.id.slice(0, 8)}...`);
        return;
      }

      // Mark as processed immediately to avoid races
      this.processedEventIds.add(event.id);
      dEvents.log(`Processing event ${event.id.slice(0, 8)}... (kind: ${event.kind})`);

      // Handle based on event kind
      switch (event.kind) {
        case NDKChatKind.CHAT_CONTAINER:
          // Only process if it's our chat
          if (event.dTag === this.id) {
            dEvents.log(`Processing chat container event for chat ${this.id}`);
            await this.processChatContainer(event);
          } else {
            dEvents.log(`Skipping chat container event for different chat: ${event.dTag}`);
          }
          break;

        case NDKChatKind.BRANCH_CONTAINER:
          // Only process if it belongs to our chat
          if (event.tagValue('chat') === this.id) {
            dEvents.log(`Processing branch container event for chat ${this.id}`);
            await this.processBranch(event);
          } else {
            dEvents.log(`Skipping branch container event for different chat: ${event.tagValue('chat')}`);
          }
          break;

        case NDKChatKind.MESSAGE:
          // Only process if it belongs to our chat
          if (event.tagValue('chat') === this.id) {
            dEvents.log(`Processing message event for chat ${this.id}`);
            await this.processMessage(event);
          } else {
            dEvents.log(`Skipping message event for different chat: ${event.tagValue('chat')}`);
          }
          break;
      }
    } catch (error) {
      dEvents.error('Error handling event:', error);
    }
  }

  private async processChatContainer(event: NDKEvent) {
    try {
      let ndk = getNDK();
      // Decrypt event into ChatContainer
      event.ndk = ndk;
      dEvents.log(`Decrypting chat container event ${event.id.slice(0, 8)}...`);
      let chatContainer = await NDKChatContainer.from(event);
      if (!chatContainer) {
        dEvents.warn('Failed to decrypt chat container event');
        return;
      }

      // Skip if we have a newer version
      if (this.chatContainer && this.chatContainer.created_at > chatContainer.created_at) {
        dEvents.log(`Skipping older chat container version (${chatContainer.created_at} < ${this.chatContainer.created_at})`);
        return;
      }

      // Store the chat container
      this.chatContainer = chatContainer;
      dEvents.log(`Chat container updated: "${chatContainer.title}" (created: ${new Date(chatContainer.created_at * 1000).toISOString()})`);
    } catch (error) {
      dEvents.error('Error processing chat container:', error);
    }
  }

  private async processBranch(event: NDKEvent) {
    try {
      let ndk = getNDK();
      // Decrypt into a branchContainer
      event.ndk = ndk;
      dEvents.log(`Decrypting branch event ${event.id.slice(0, 8)}...`);
      let branch = await NDKChatBranch.from(event);
      if (!branch) {
        dEvents.warn('Failed to decrypt branch event');
        return;
      }

      // Store the branch
      this.branches.set(branch.branchId, branch);
      dEvents.log(`Branch added/updated: ${branch.branchId} (parent: ${branch.parentBranchId || 'none'})`);

      // If this is the active branch, update messages
      if (branch.branchId === this.activeBranchId) {
        dEvents.log(`Branch is active branch, updating chat messages`);
        this.updateChatMessages();
      }
    } catch (error) {
      dEvents.error('Error processing branch:', error);
    }
  }

  private async processMessage(event: NDKEvent) {
    try {
      let ndk = getNDK();
      // Decrypt into NDKChatMessage
      event.ndk = ndk;
      dEvents.log(`Decrypting message event ${event.id.slice(0, 8)}...`);
      let message = await NDKChatMessage.from(event);
      if (!message) {
        dEvents.warn('Failed to decrypt message event');
        return;
      }

      // Store the message event
      this.messages.set(message.messageId, message);
      dEvents.log(`Message added/updated: ${message.messageId} (role: ${message.role}, branch: ${message.branchId || 'main'})`);

      // Update chat messages if this belongs to the active branch or its parents
      if (this.isMessageRelevantToActiveBranch(message.branchId)) {
        dEvents.log(`Message is relevant to active branch, updating chat messages`);
        this.updateChatMessages();
      } else {
        dEvents.log(`Message is not relevant to active branch, skipping update`);
      }
    } catch (error) {
      dEvents.error('Error processing message:', error);
    }
  }

  /**
   * Calculate the required deposit amount based on current messages and model
   */
  calculateRequiredDeposit(): number {
    if (!this.modelId || !this.chat?.messages) {
      dDeposit.warn('Cannot calculate deposit - model or messages not available');
      return 1; // Fallback minimum
    }

    try {
      this.isCalculatingDeposit = true;
      dDeposit.log(`Calculating deposit for model ${this.modelId} with ${this.chat.messages.length} messages`);

      // Create a preview of what messages will be sent
      const previewMessages = [...this.chat.messages];

      // Add the current input as a draft user message if it exists
      if (this.chat.input && this.chat.input.trim().length > 0) {
        dDeposit.log(`Including draft message in deposit calculation (length: ${this.chat.input.trim().length})`);
        previewMessages.push({
          id: 'draft',
          role: 'user',
          content: this.chat.input.trim(),
          createdAt: new Date(),
          experimental_attachments: undefined,
          parts: [{ type: 'text', text: this.chat.input.trim() }]
        });
      }

      // Calculate deposit based on messages and selected model
      const depositAmount = calculateCurrentDepositAmount(this.chat.messages, this.modelId);
      this.currentDepositAmount = depositAmount;

      dDeposit.log(`Required deposit calculated: ${depositAmount} sats for model ${this.modelId}`);
      return depositAmount;
    } catch (error) {
      dDeposit.error('Error calculating deposit:', error);
      return 1; // Fallback minimum
    } finally {
      this.isCalculatingDeposit = false;
    }
  }

  private isMessageRelevantToActiveBranch(messageBranchId: string | undefined): boolean {
    // If the message is in the active branch, it's relevant
    if (messageBranchId === this.activeBranchId) {
      dMessages.log(`Message is in active branch ${this.activeBranchId}`);
      return true;
    }

    // Check if the message branch is a parent of the active branch
    let currentBranchId = this.activeBranchId;
    const branchPath: string[] = [];

    while (currentBranchId) {
      branchPath.push(currentBranchId);
      const branch = this.branches.get(currentBranchId);
      if (!branch) break;

      const parentBranchId = branch.parentBranchId;
      if (parentBranchId === messageBranchId) {
        dMessages.log(`Message is in parent branch ${messageBranchId} of active branch (path: ${branchPath.join(' -> ')})`);
        return true;
      }

      if (!parentBranchId) break;
      currentBranchId = parentBranchId;
    }

    dMessages.log(`Message branch ${messageBranchId} is not relevant to active branch ${this.activeBranchId}`);
    return false;
  }

  private updateChatMessages() {
    // Get messages for the active branch
    dMessages.log(`Updating chat messages for active branch ${this.activeBranchId}`);
    const activeMessages = this.getActiveMessages();

    // Sort messages by creation time
    const sortedMessages = activeMessages.sort((a, b) => a.created_at - b.created_at);

    // Map to Vercel Chat message format
    const aiMessages: Message[] = sortedMessages.map((msg) => {
      return {
        id: msg.messageId,
        role: msg.role,
        content: msg.content || '',
        createdAt: new Date(msg.created_at ? msg.created_at * 1000 : Date.now())
      };
    });

    // Update the Chat instance with the new messages
    this.chat.messages = aiMessages;
    dMessages.log(`Updated chat messages: ${aiMessages.length} messages`);

    // Log a warning if there are no messages
    if (aiMessages.length === 0) {
      dMessages.warn('No messages found for active branch');
    }
  }

  private getActiveMessages(): NDKChatMessage[] {
    dMessages.log(`Getting messages for active branch ${this.activeBranchId}`);
    return this.getBranchMessages(this.activeBranchId);
  }

  getMsgInfo(id: string): {} | undefined {
    // get original message nostr event
    const msgFilter = Array.from(this.messages.values())
      .filter((msg) => msg.messageId == id)

    // return if no match for message info
    if (!msgFilter || !msgFilter[0]) return undefined


    // Assume there will only be at least one
    const msg = msgFilter[0]

    const info = {
      modelId: msg.modelId,
      promptTokens: msg.promptTokens,
      promptTokensPerSat: msg.promptTokensPerSat,
      completionTokens: msg.completionTokens,
      completionTokensPerSat: msg.completionTokensPerSat,

    }

    return info
  }

  /**
   * Get all messages for a branch, including those from parent branches
   */
  private getBranchMessages(branchId: string | undefined): NDKChatMessage[] {
    // If no branch ID is provided, return all messages without a branch ID (main sequence)
    if (!branchId) {
      dMessages.log('Getting messages from main sequence (no branch ID)');
      const mainMessages = Array.from(this.messages.values())
        .filter((msg) => !msg.branchId)
        .sort((a, b) => a.created_at - b.created_at);

      dMessages.log(`Found ${mainMessages.length} messages in main sequence`);
      return mainMessages;
    }

    // Get existing branch
    const branch = this.branches.get(branchId);
    if (!branch) {
      dMessages.warn(`Branch ${branchId} not found`);
      return [];
    }

    // Get messages for this branch
    dMessages.log(`Getting messages for branch ${branchId}`);
    const branchMessages = Array.from(this.messages.values())
      .filter((msg) => msg.branchId === branchId)
      .sort((a, b) => a.created_at - b.created_at);

    dMessages.log(`Found ${branchMessages.length} messages directly in branch ${branchId}`);

    // If no forkPointMessageId return branchMessages
    if (!branch.forkPointMessageId) {
      dMessages.log(`Branch ${branchId} has no fork point, returning only branch messages`);
      return branchMessages;
    }

    // Get parent branch messages
    const parentBranchId = branch.parentBranchId;
    dMessages.log(`Getting parent messages from branch ${parentBranchId}`);
    const parentMessages = this.getBranchMessages(parentBranchId);
    dMessages.log(`Found ${parentMessages.length} messages in parent branch(es)`);

    // Find index of fork point in parent messages
    const forkPointMessageId = branch.forkPointMessageId;
    const forkPointIndex = parentMessages.findIndex((msg) => msg.messageId === forkPointMessageId);

    // If fork point not found, return all messages
    if (forkPointIndex === -1) {
      dMessages.warn(`Fork point ${forkPointMessageId} not found in parent messages, returning all messages`);
      return [...parentMessages, ...branchMessages];
    }

    // Return parent messages up to and including fork point, plus branch messages
    dMessages.log(`Fork point found at index ${forkPointIndex}, returning ${forkPointIndex + 1} parent messages + ${branchMessages.length} branch messages`);
    return [...parentMessages.slice(0, forkPointIndex + 1), ...branchMessages];
  }

  /**
   * Unified method to send a user message - handles both new and existing chats
   */
  sendUserMessage = async (event?: { preventDefault?: () => void }) => {
    event?.preventDefault?.();
    if (!this.chat.input.trim()) {
      d.warn('Attempted to send empty message, aborting');
      return;
    }
    this.showBalanceWarning = false;

    let ndk = getNDK();
    d.log(`Sending user message: "${this.chat.input.substring(0, 50)}${this.chat.input.length > 50 ? '...' : ''}"`);

    try {
      // For new chats, create the chat container first
      if (this.isNewChat) {
        d.log('This is a new chat, setting up subscription and creating chat container');

        // Start the subscription now that we have a chat
        this.setupSubscription();

        // Create a new chat container if needed
        if (!this.chatContainer) {
          d.log('Creating new chat container');
          let chatContainer = new NDKChatContainer(ndk);
          chatContainer.chatId = this.id;
          chatContainer.title = this.chat.input.substring(0, 50); // Use first message as title
          d.log(`Publishing chat container with title: "${chatContainer.title}"`);
          await chatContainer.publish();
          //this.chatContainer = chatContainer;

          d.log(`Created new chat container with ID: ${this.id}`);

          this.isNewChat = false;

          // Navigate to the chat page if we're on the home page
          d.log(`Navigating to chat page: /chat/${this.id}`);
          goto(`/chat/${this.id}`);
        }
      }

      // Create the message object for UI
      d.log('Creating user message for UI');
      const message: UIMessage = {
        id: generateId(),
        createdAt: new Date(),
        role: 'user',
        content: this.chat.input,
        experimental_attachments: undefined,
        parts: [{ type: 'text', text: this.chat.input }]
      };

      // Record previous message id
      const prevMessageId = this.chat.messages[this.chat.messages.length - 1]?.id;
      d.log(`Previous message ID: ${prevMessageId || 'none'}`);

      // Add message to UI messages
      this.chat.messages.push(message);
      d.log(`Added message to UI, total messages: ${this.chat.messages.length}`);

      this.isSubmitting = true;
      // Reset chat input
      this.chat.input = '';

      // Generate the token with the calculated deposit amount
      const requiredDeposit = this.calculateRequiredDeposit();
      dDeposit.log(`Requesting token for ${requiredDeposit} sats deposit`);

      let encodedToken: string;
      if (requiredDeposit == 0) {
        d.log("This must be a free model, setting to free token")
        encodedToken = "free-model"
      } else {
        const { generateToken } = await import('$lib/client/stores/wallet');
        d.log("This is a paid model, generating token for: ", requiredDeposit, "sats")
        let result = await generateToken(requiredDeposit, ["https://mint.cypherflow.ai"]);
        encodedToken = result.encodedToken;
      }

      if (encodedToken) {
        dDeposit.log(`Token generated successfully for ${requiredDeposit} sats`);
        d.log('Reloading chat with token and model');
        this.chat.reload({
          headers: { 'X-Cashu': encodedToken },
          body: { modelId: this.modelId }
        });
      } else {
        // Handle deposit creation failure
        dDeposit.error('Failed to create deposit token');
        this.isSubmitting = false;
        // Remove the message from the UI since we couldn't send it
        d.warn('Removing message from UI due to deposit failure');
        this.chat.messages.pop();
        return;
      }

      // Create and publish the message event to Nostr
      dNostr.log('Creating and publishing message event to Nostr');
      let messageEvent = new NDKChatMessage(ndk);
      messageEvent.chatId = this.id;
      messageEvent.branchId = this.activeBranchId;
      messageEvent.messageId = message.id;
      messageEvent.role = message.role;
      messageEvent.content = message.content;
      messageEvent.prevMessageId = prevMessageId;

      dNostr.log(`Publishing message to Nostr - ID: ${message.id}, branch: ${this.activeBranchId || 'main'}`);
      await this.updateLocal(messageEvent);
      d.log('User message sent and published successfully');
    } catch (error) {
      d.error('Error sending user message:', error);
      this.isSubmitting = false;
      // If this was the first message and we failed, stay in new chat mode
      if (this.isNewChat && !this.chatContainer) {
        d.log('First message failed, staying in new chat mode');
        // Do nothing, stay in new chat mode
      } else {
        // For subsequent messages, remove the last message if we couldn't send it
        d.warn('Removing failed message from UI');
        this.chat.messages.pop();
      }
    }
  };

  /**
   * Send an assistant message
   */
  async handleAssistantMessage(message: Message, usage: LanguageModelUsage, finishReason: LanguageModelV1FinishReason, annotation?: MyAnnotation) {
    d.log(`Handling assistant message: "${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}"`);
    if (!message.content.trim()) {
      d.warn('Empty assistant message, skipping');
      return;
    }

    let ndk = getNDK();

    // Create message event
    dNostr.log('Creating assistant message event for Nostr');
    let messageEvent = new NDKChatMessage(ndk);
    messageEvent.chatId = this.id;
    messageEvent.branchId = this.activeBranchId;
    messageEvent.messageId = message.id;
    messageEvent.role = message.role;
    messageEvent.content = message.content;
    messageEvent.finishReason = finishReason;
    messageEvent.promptTokens = usage.promptTokens;
    messageEvent.completionTokens = usage.completionTokens;

    if (annotation) {
      messageEvent.promptTokensPerSat = annotation.prompt_tokens_per_sat || 0
      messageEvent.completionTokensPerSat = annotation.completion_tokens_per_sat || 0
      messageEvent.modelId = annotation.modelId || '';
      messageEvent.depositAmount = annotation.deposit || 0;
    }

    // Since UI is updated automatically for AI responses, previous message should be the second to last
    const prevMessageId = this.chat.messages[this.chat.messages.length - 2]?.id;
    messageEvent.prevMessageId = prevMessageId;
    dNostr.log(`Previous message ID: ${prevMessageId || 'none'}`);

    dNostr.log(`Publishing assistant message to Nostr - ID: ${message.id}, branch: ${this.activeBranchId || 'main'}`);
    await this.updateLocal(messageEvent);
    d.log('Assistant message published successfully');
  }

  /**
   * Save an event locally and publish it to Nostr
   */
  async updateLocal(event: NDKEvent) {
    try {
      // Sign (and encrypt) event
      dNostr.log(`Signing event ${event.kind}`);
      await event.sign();

      // Add to local state - this will also decrypt the event
      dNostr.log('Adding event to local state');
      await this.handleEvent(event);

      // Publish to Nostr
      // Note: Since we're using the cache, the event will be stored automatically
      // when we publish it. The cache adapter handles saving for us.
      dNostr.log('Publishing event to Nostr');
      await event.publish();

      dNostr.log(`Event published successfully: ${event.id.slice(0, 8)}...`);
    } catch (error) {
      dNostr.error('Failed to update and publish event:', error);
    }
  }

  /**
   * Clean up subscriptions
   */
  destroy() {
    if (this.subscription) {
      dSubscription.log('Stopping subscription');
      this.subscription.stop();
      this.subscription = null;
    }
    d.log('ChatSession destroyed');
  }
}
