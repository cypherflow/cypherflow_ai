<!-- src/lib/components/chat/UserMessage.svelte -->
<script lang="ts">
  import Markdown from 'svelte-exmarkdown';
  import { gfmPlugin } from 'svelte-exmarkdown/gfm';
  
  export let content: string;
  export let enableMarkdown = false; // Default to plain text, can be enabled later
  
  // Set up markdown plugins
  const plugins = [gfmPlugin()];
  
  // Define types for custom renderers
  type SnippetProps = {
    children?: () => any;
    [key: string]: any;
  };
</script>

<div class="max-w-[420px] rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-primary-foreground">
  {#if enableMarkdown}
    <Markdown md={content} {plugins}>
      {#snippet p(props: SnippetProps)}
        {@const { children, ...rest } = props}
        <p class="whitespace-pre-wrap break-words text-primary-foreground" {...rest}>
          {@render children?.()}
        </p>
      {/snippet}
      
      {#snippet a(props: SnippetProps)}
        {@const { children, href, ...rest } = props}
        <a 
          href={href as string} 
          class="text-primary-foreground underline hover:text-opacity-80" 
          target="_blank" 
          rel="noreferrer noopener" 
          {...rest}
        >
          {@render children?.()}
        </a>
      {/snippet}
      
      {#snippet code(props: SnippetProps)}
        {@const { children, ...rest } = props}
        <code class="bg-primary-foreground/20 px-1 py-0.5 rounded text-primary-foreground font-mono text-sm" {...rest}>
          {@render children?.()}
        </code>
      {/snippet}
      
      {#snippet pre(props: SnippetProps)}
        {@const { children, ...rest } = props}
        <pre class="bg-primary-foreground/20 p-3 rounded-lg my-3 overflow-x-auto font-mono text-sm" {...rest}>
          {@render children?.()}
        </pre>
      {/snippet}
    </Markdown>
  {:else}
    <p class="whitespace-pre-wrap break-words">{content}</p>
  {/if}
</div>
