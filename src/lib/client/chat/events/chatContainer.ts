import NDK, { NDKEvent, type NDKTag, type NostrEvent } from '@nostr-dev-kit/ndk';
import { NDKChatKind } from '../types/index.js';

/**
 * Chat container class - represents kind 30101
 */
export class NDKChatContainer extends NDKEvent {
	static kind = NDKChatKind.CHAT_CONTAINER;
	static kinds = [NDKChatKind.CHAT_CONTAINER];

	constructor(ndk?: NDK, event?: NostrEvent | NDKEvent) {
		super(ndk, event);
		this.kind ??= NDKChatKind.CHAT_CONTAINER;
	}

	static async from(event: NDKEvent): Promise<NDKChatContainer | undefined> {
		const chatContainer = new NDKChatContainer(event.ndk, event);

		const chatId = chatContainer.chatId;
		if (!chatId) return undefined;

		const prevContent = chatContainer.content;
		try {
			await chatContainer.decrypt();
		} catch (_e) {
			chatContainer.content ??= prevContent;
		}

		try {
			const contentTags = JSON.parse(chatContainer.content);
			// Convert content fields to tags
			chatContainer.tags = [...contentTags, ...chatContainer.tags];
		} catch (_e) {
			return undefined;
		}

		return chatContainer;
	}

	get chatId(): string {
		return this.dTag!;
	}

	set chatId(id: string) {
		this.dTag = id;
	}

	get title(): string {
		return this.tagValue('title') || '';
	}

	set title(title: string) {
		this.removeTag('title');
		this.tags.push(['title', title]);
	}

	get activeBranchId(): string | undefined {
		return this.tagValue('activeBranchId');
	}

	set activeBranchId(id: string | undefined) {
		this.removeTag('activeBranchId');
		if (id) this.tags.push(['activeBranchId', id]);
	}

	get branches(): string[] {
		return this.getMatchingTags('branch').map((tag) => tag[1]);
	}

	addBranch(branchId: string): void {
		this.tags.push(['branch', branchId]);
	}

	removeBranch(branchId: string): void {
		this.tags = this.tags.filter((tag) => !(tag[0] === 'branch' && tag[1] === branchId));
	}

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

		this.tags = unencryptedTags;
		this.content = JSON.stringify(encryptedTags);

		const user = await this.ndk?.signer?.user();
		await this.encrypt(user, undefined, 'nip44');

		return super.toNostrEvent(pubkey) as unknown as NostrEvent;
	}

	private shouldEncryptTag(tag: NDKTag): boolean {
		// Only 'd' tags remain unencrypted
		if (tag[0] === 'd') return false;
		return true;
	}
}
