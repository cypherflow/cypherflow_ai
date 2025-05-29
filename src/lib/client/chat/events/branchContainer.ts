import NDK, { NDKEvent, type NDKTag, type NostrEvent } from '@nostr-dev-kit/ndk';
import { NDKChatKind } from '../types/index.js';

/**
 * Branch container class - represents kind 1102
 */
export class NDKChatBranch extends NDKEvent {
	static kind = NDKChatKind.BRANCH_CONTAINER;
	static kinds = [NDKChatKind.BRANCH_CONTAINER];

	constructor(ndk?: NDK, event?: NostrEvent | NDKEvent) {
		super(ndk, event);
		this.kind ??= NDKChatKind.BRANCH_CONTAINER;
	}

	static async from(event: NDKEvent): Promise<NDKChatBranch | undefined> {
		const branchContainer = new NDKChatBranch(event.ndk, event);

		const chatId = branchContainer.chatId;
		if (!chatId) return undefined;

		const prevContent = branchContainer.content;
		try {
			await branchContainer.decrypt();
		} catch (_e) {
			branchContainer.content ??= prevContent;
		}

		try {
			const contentTags = JSON.parse(branchContainer.content);
			// Convert content fields to tags
			branchContainer.tags = [...contentTags, ...branchContainer.tags];
		} catch (_e) {
			return undefined;
		}

		return branchContainer;
	}

	get chatId(): string {
		return this.getMatchingTags('chat')[0]?.[1] || '';
	}

	set chatId(id: string) {
		this.removeTag('chat');
		this.tags.push(['chat', id]);
	}

	get branchId(): string {
		return this.getMatchingTags('branch')[0]?.[1] || '';
	}

	set branchId(id: string) {
		this.removeTag('branch');
		this.tags.push(['branch', id]);
	}

	get parentBranchId(): string | undefined {
		return this.tagValue('parentBranchId');
	}

	set parentBranchId(id: string | undefined) {
		this.removeTag('parentBranchId');
		if (id) this.tags.push(['parentBranchId', id]);
	}

	get forkPointMessageId(): string | undefined {
		return this.tagValue('forkPointMessageId');
	}

	set forkPointMessageId(id: string | undefined) {
		this.removeTag('forkPointMessageId');
		if (id) this.tags.push(['forkPointMessageId', id]);
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
		// Only chat and branch tags remain unencrypted
		const unencryptedTags = ['chat', 'branch'];
		return !unencryptedTags.includes(tag[0]);
	}
}
