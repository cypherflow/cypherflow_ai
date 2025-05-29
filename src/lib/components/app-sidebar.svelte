<script lang="ts" module>
	import Search from 'lucide-svelte/icons/search';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	const data = {
		navMain: [
			{
				title: 'Search',
				url: '#',
				icon: Search
			},
			{
				title: 'New Chat',
				url: '/',
				icon: Sparkles
			}
		]
	};
</script>

<script lang="ts">
	import NavMain from '$lib/components/nav-main.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';
	import NavChats from '$lib/components/nav-chats.svelte';
	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root bind:ref class="border-r-0" {...restProps}>
	<Sidebar.Header>
		<NavMain items={data.navMain} />
	</Sidebar.Header>
	<Sidebar.Content>
		<NavChats />
	</Sidebar.Content>
	<Sidebar.Rail />
</Sidebar.Root>
