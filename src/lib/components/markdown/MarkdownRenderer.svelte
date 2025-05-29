<!-- src/lib/components/markdown/MarkdownRenderer.svelte -->
<script lang="ts">
	import Markdown from 'svelte-exmarkdown';
	import { gfmPlugin } from 'svelte-exmarkdown/gfm';
	import type { Plugin } from 'svelte-exmarkdown';
	import rehypeHighlight from 'rehype-highlight';
	
	// Import common languages
	import javascript from 'highlight.js/lib/languages/javascript';
	import typescript from 'highlight.js/lib/languages/typescript';
	import python from 'highlight.js/lib/languages/python';
	import java from 'highlight.js/lib/languages/java';
	import csharp from 'highlight.js/lib/languages/csharp';
	import cpp from 'highlight.js/lib/languages/cpp';
	import css from 'highlight.js/lib/languages/css';
	import html from 'highlight.js/lib/languages/xml';
	import json from 'highlight.js/lib/languages/json';
	import bash from 'highlight.js/lib/languages/bash';
	import markdown from 'highlight.js/lib/languages/markdown';
	import sql from 'highlight.js/lib/languages/sql';
	import yaml from 'highlight.js/lib/languages/yaml';
	import rust from 'highlight.js/lib/languages/rust';
	import go from 'highlight.js/lib/languages/go';
	import php from 'highlight.js/lib/languages/php';
	import ruby from 'highlight.js/lib/languages/ruby';
	import swift from 'highlight.js/lib/languages/swift';
	import kotlin from 'highlight.js/lib/languages/kotlin';
	
	// Import highlight.js styles - you can choose a different theme
	// Make sure to include this in your svelte.config.js for vite optimization
	import 'highlight.js/styles/github-dark.css';
	
	// Import custom renderers
	import Paragraph from './renderers/Paragraph.svelte';
	import Heading1 from './renderers/Heading1.svelte';
	import Heading2 from './renderers/Heading2.svelte';
	import Heading3 from './renderers/Heading3.svelte';
	import Heading4 from './renderers/Heading4.svelte';
	import Heading5 from './renderers/Heading5.svelte';
	import Heading6 from './renderers/Heading6.svelte';
	import Link from './renderers/Link.svelte';
	import CodeBlock from './renderers/CodeBlock.svelte';
	import InlineCode from './renderers/InlineCode.svelte';
	import BlockQuote from './renderers/BlockQuote.svelte';
	import List from './renderers/List.svelte';
	import ListItem from './renderers/ListItem.svelte';
	import Table from './renderers/Table.svelte';
	import TableCell from './renderers/TableCell.svelte';
	import TableRow from './renderers/TableRow.svelte';
	//import Image from './renderers/Image.svelte';
	//import HorizontalRule from './renderers/HorizontalRule.svelte';

	let { content = $bindable('') } = $props();
	//let { class: className = $bindable('') } = $props();

	// Configure language mapping for highlight.js
	const languages = {
		javascript,
		typescript,
		js: javascript,
		ts: typescript,
		python,
		java,
		csharp,
		'c#': csharp,
		cpp,
		'c++': cpp,
		css,
		html,
		xml: html,
		json,
		bash,
		sh: bash,
		shell: bash,
		zsh: bash,
		markdown,
		md: markdown,
		sql,
		yaml,
		yml: yaml,
		rust,
		go,
		golang: go,
		php,
		ruby,
		rb: ruby,
		swift,
		kotlin
	};

	const plugins: Plugin[] = [
		gfmPlugin(),
		{
			rehypePlugin: [
				rehypeHighlight,
				{ 
					ignoreMissing: true, 
					languages,
					aliases: {
						js: 'javascript',
						ts: 'typescript',
						'c#': 'csharp',
						'c++': 'cpp',
						sh: 'bash',
						shell: 'bash',
						zsh: 'bash',
						md: 'markdown',
						yml: 'yaml',
						golang: 'go',
						rb: 'ruby'
					}
				}
			]
		},
		{
			renderer: {
				p: Paragraph,
				h1: Heading1,
				h2: Heading2,
				h3: Heading3,
				h4: Heading4,
				h5: Heading5,
				h6: Heading6,
				a: Link,
				//code: CodeBlock,
				//inlineCode: InlineCode,
				blockquote: BlockQuote,
				ul: List,
				ol: List,
				li: ListItem,
				table: Table,
				td: TableCell,
				th: TableCell,
				tr: TableRow,
				//img: Image,
				//hr: HorizontalRule
			}
		}
	];
</script>

<div class="markdown-content w-full overflow-hidden">
	<Markdown md={content} {plugins} />
</div>

<style>
  /* Target child elements within markdown-content */
  .markdown-content :global(pre) {
    @apply rounded-md p-0 my-4 overflow-x-auto;
  }

  .markdown-content :global(code) {
    @apply bg-foreground/20 px-1 py-0.5 rounded font-mono text-sm;
  }

  /* For code blocks (code inside pre) */
  .markdown-content :global(pre code) {
    @apply py-4 bg-black whitespace-pre-wrap break-all overflow-x-auto;
  }
</style>
