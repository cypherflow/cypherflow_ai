<!-- src/lib/components/chat/AssistantResponse.svelte -->
<script lang="ts">
	import { Copy, RefreshCw } from 'lucide-svelte';
	import Button from '../ui/button/button.svelte';
	import { copyToClipboard } from '$lib/utils';
	import MarkdownRenderer from '../markdown/MarkdownRenderer.svelte';
	import TokenInfoPopover from './TokenInfoPopover.svelte';
	import type { UIMessage } from 'ai';

	// let { content = $bindable(''), isLastMessage, isSubmitting, onRegenerateClick, getMsgInfo } = $props();

	let { message = $bindable({}) } = $props<{ message: UIMessage }>();
</script>

<div class="group flex flex-col justify-start">
	<div class="max-w-[640px] px-2">
		<MarkdownRenderer {message} />
	</div>
	<!-- <!-- Action buttons that respond to group hover/focus --> -->
	<!-- <div -->
	<!-- 	class="m-0 flex flex-row p-0 transition-opacity duration-200 -->
	<!--        {isLastMessage && !isSubmitting -->
	<!-- 		? 'opacity-100' -->
	<!-- 		: 'opacity-0 group-hover:opacity-100 group-focus:opacity-100 group-active:opacity-100'}" -->
	<!-- > -->
	<!-- 	<Button onclick={() => copyToClipboard(content, 'Text')} variant="ghost" size="icon" disabled={isSubmitting && isLastMessage}> -->
	<!-- 		<Copy /> -->
	<!-- 	</Button> -->
	<!-- 	<Button disabled onclick={onRegenerateClick} variant="ghost" size="icon"> -->
	<!-- 		<RefreshCw /> -->
	<!-- 	</Button>	 -->
	<!-- 	<TokenInfoPopover {getMsgInfo} disabled={isSubmitting && isLastMessage} /> -->
	<!-- </div> -->
</div>
