<!-- src/lib/components/markdown/renderers/TableCell.svelte -->
<script lang="ts">
  //let { header = $state(false) } = $props();
  export let header;
</script>

{#if header}
  <th {...$$props} class="border px-4 py-2 bg-gray-100 font-semibold text-left">
    <slot />
  </th>
{:else}
  <td {...$$props} class="border px-4 py-2">
    <slot />
  </td>
{/if}
