// src/lib/types/chat.ts
import type { Message } from '@ai-sdk/svelte';

export interface ChatSession {
	id: string;
	title: string;
	createdAt: Date;
	updatedAt: Date;
	messages: Message[]; // Full message history
}

export interface ChatSummary {
	id: string;
	title: string;
	createdAt: Date;
	updatedAt: Date;
	lastMessage?: string; // Just the last message preview
}

export interface MyAnnotation {
  deposit: string | null;
  used: number | null;
	change: string | null;
  modelId: string | null;
  prompt_tokens_per_sat: number | null;
  completion_tokens_per_sat: number | null;
}
