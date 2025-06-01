import NDK, { NDKEvent, type NDKTag, type NostrEvent } from '@nostr-dev-kit/ndk';
import { NDKChatKind, MessageRole } from '../types/index.js';

/**
 * Message class - represents kind 1103
 */
export class NDKChatMessage extends NDKEvent {
	static kind = NDKChatKind.MESSAGE;
	static kinds = [NDKChatKind.MESSAGE];

	constructor(ndk?: NDK, event?: NostrEvent | NDKEvent) {
		super(ndk, event);
		this.kind ??= NDKChatKind.MESSAGE;
	}

	static async from(event: NDKEvent): Promise<NDKChatMessage | undefined> {
		const message = new NDKChatMessage(event.ndk, event);

		const chatId = message.chatId;
		if (!chatId) return undefined;

		const prevContent = message.content;
		try {
			await message.decrypt();
		} catch (_e) {
			message.content ??= prevContent;
		}

		try {
			const contentTags = JSON.parse(message.content);

			// Convert other fields to tags
			message.tags = [...contentTags, ...message.tags];

			// Set the actual message content
			message.content = message.tagValue('content') || 'no content :(';
			message.removeTag('content');
		} catch (_e) {
			return undefined;
		}

		return message;
	}

	get chatId(): string {
		return this.tagValue('chat')!;
	}

	set chatId(id: string) {
		this.removeTag('chat');
		this.tags.push(['chat', id]);
	}

	get branchId(): string | undefined {
		return this.tagValue('branch');
	}

	set branchId(id: string | undefined) {
		this.removeTag('branch');
		if (id) this.tags.push(['branch', id]);
	}

	get messageId(): string {
		return this.tagValue('messageId') || '';
	}

	set messageId(id: string) {
		this.removeTag('messageId');
		this.tags.push(['messageId', id]);
	}

	get prevMessageId(): string | undefined {
		return this.tagValue('prevMessageId');
	}

	set prevMessageId(id: string | undefined) {
		this.removeTag('prevMessageId');
		if (id) this.tags.push(['prevMessageId', id]);
	}

	get role(): MessageRole {
		return (this.tagValue('role') as MessageRole) || MessageRole.USER;
	}

	set role(role: 'system' | 'user' | 'assistant' | 'data') {
		this.removeTag('role');
		this.tags.push(['role', role]);
	}

	get modelId(): string | undefined {
    return this.tagValue('modelId');
  }

  set modelId(modelId: string) {
    this.removeTag('modelId');
    this.tags.push(['modelId', modelId]);
  }

  get promptTokensPerSat(): number | undefined {
    const tokens = this.tagValue('promptTokensPerSat');
    if (tokens) return Number(tokens);
  }

  set promptTokensPerSat(tokensPerSat: number) {
    this.removeTag('promptTokensPerSat');
    this.tags.push(['promptTokensPerSat', tokensPerSat.toString()]);
  }
  get completionTokensPerSat(): number | undefined {
    const tokens = this.tagValue('completionTokensPerSat')
    if (tokens) return Number(tokens)
  }

  set completionTokensPerSat(tokensPerSat: number) {
    this.removeTag('completionTokensPerSat');
    this.tags.push(['completionTokensPerSat', tokensPerSat.toString()]);
  }
  get promptTokens(): number | undefined {
    const tokens = this.tagValue('promptTokens');
    if (tokens) {
      return Number(tokens)
    }
  }

  get completionTokens(): number | undefined {
    const tokens = this.tagValue('completionTokens');
    if (tokens) {
      return Number(tokens)
    }
  }

  set promptTokens(tokens: number) {
    this.removeTag('promptTokens');
    this.tags.push(['promptTokens', tokens.toString()])
  }

  set completionTokens(tokens: number) {
    this.removeTag('promptTokens');
    this.tags.push(['promptTokens', tokens.toString()])
  }

  get inputCost(): number | undefined {
    if (this.promptTokensPerSat && this.promptTokens){
      return this.promptTokens / this.promptTokensPerSat
    }
  }

  get outputCost(): number | undefined {
    if (this.completionTokensPerSat && this.completionTokens){
      return this.completionTokens / this.completionTokensPerSat
    }
  }

  get totalCost(): number | undefined {
    if (this.inputCost && this.outputCost) return this.inputCost + this.outputCost;
  }

  set finishReason(reason: string){
    this.removeTag('finishReason');
    this.tags.push(['finishReason', reason]);
  }

  get finishReason(): string | undefined {
    return this.tagValue('finishReason');
  }

  set depositAmount(amount: number){
    this.removeTag('depositAmount');
    this.tags.push(['depositAmount', amount.toString()])
  }

  get depositAmount(): number | undefined {
    const amount = this.tagValue('depositAmount');
    if (amount) return Number(amount)
  }

	// Note: The actual message content uses the event's content field

	async toNostrEvent(pubkey?: string): Promise<NostrEvent> {
		const encryptedTags: NDKTag[] = [];
		const unencryptedTags: NDKTag[] = [];

		for (const tag of this.tags) {
			if (!this.shouldEncryptTag(tag)) {
				unencryptedTags.push(tag);
			} else {
				encryptedTags.push(tag);
			}
		}
		// set up unencryptedTags
		this.tags = unencryptedTags;
		// Add event content to encrypted tags
		encryptedTags.push(['content', this.content]);
		this.content = JSON.stringify(encryptedTags);

		const user = await this.ndk?.signer?.user();

		await this.encrypt(user, undefined, 'nip44');

		return super.toNostrEvent(pubkey) as unknown as NostrEvent;
	}

	private shouldEncryptTag(tag: NDKTag): boolean {
		// Only chat and branch tags remain unencrypted
		const unencryptedTags = ['chat', 'branch'];
		return !unencryptedTags.includes(tag[0]);
	}
}
