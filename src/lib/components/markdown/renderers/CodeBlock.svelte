<!-- src/lib/components/markdown/renderers/CodeBlock.svelte -->
<script lang="ts">
  //let { language } = $props();
  export let language;
</script>

<div class="my-4 rounded-md overflow-hidden">
  <div class="bg-gray-800 text-gray-200 text-xs p-2 flex justify-between">
    {#if language}
      <span class="font-mono">{language}</span>
    {:else}
      <span class="font-mono">code</span>
    {/if}
  </div>
  <pre class="bg-gray-900 p-4 overflow-x-auto">
    <code class="text-gray-200 font-mono text-sm">
      <slot />
    </code>
  </pre>
</div>
