<script lang="ts">
	import { Router } from 'lucide-svelte';
	import RelayList from './RelayList.svelte';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
</script>

<Accordion.Item>
	<Accordion.Trigger>
		<span class="flex w-full gap-2 text-left">
			<Router />
			Relay Management
		</span>
	</Accordion.Trigger>
	<Accordion.Content>
		<div class="mt-4 space-y-3">
			<p class="text-sm text-muted-foreground">
				Relays store your encrypted conversations and wallet data. Adding multiple reliable relays
				improves your experience and helps maintain access to your data across devices.
			</p>
			<RelayList />
		</div>
	</Accordion.Content>
</Accordion.Item>
