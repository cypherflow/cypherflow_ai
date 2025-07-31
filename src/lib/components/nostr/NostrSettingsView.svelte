<!-- src/lib/components/nostr/NostrSettingsView.svelte -->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
	import { ChevronLeft, Moon, Sun } from 'lucide-svelte';
	import { mode, setMode } from 'mode-watcher';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import { navigateTo } from '$lib/client/stores/wallet-navigation';
	import ViewContainer from '../ui/ViewContainer.svelte';
	import RelayManagement from '$lib/components/settings/RelayManagement.svelte';
	import MintManagement from '$lib/components/settings/MintManagement.svelte';
	import ScrollArea from '../ui/scroll-area/scroll-area.svelte';
	import NostrKeys from '../settings/NostrKeys.svelte';
	import LinkDevices from '../settings/LinkDevices.svelte';
	import SignOutButton from '../settings/SignOutButton.svelte';

	function toggleTheme() {
		if ($mode === 'dark') {
			setMode('light');
		} else {
			setMode('dark');
		}
	}
</script>

<ViewContainer className="p-0 max-h-[55vh] md:max-h-[60vh]">
	<div class="mb-2 flex items-center p-2">
		<Button variant="ghost" size="icon" onclick={() => navigateTo('main')} class="mr-2">
			<ChevronLeft class="h-4 w-4" />
		</Button>
		<h3 class="text-lg font-medium">Settings</h3>
	</div>

	<ScrollArea class="p-2">
		<!-- Settings content -->
		<div class="max-h-[60vh] px-2 md:max-h-[50vh]">
			<!-- Theme toggle -->
			<div class="flex items-center justify-between border-b pb-4">
				<div class="flex items-center space-x-2">
					{#if $mode === 'dark'}
						<Moon />
					{:else}
						<Sun />
					{/if}
					<span class="text">Dark Mode</span>
				</div>
				<Switch checked={$mode === 'dark'} onCheckedChange={toggleTheme} />
			</div>

			<Accordion.Root type="multiple" class="">
				<LinkDevices />
				<MintManagement />
				<RelayManagement />
				<NostrKeys />
			</Accordion.Root>

			<!-- Logout button - now using the SignOutButton component -->
			<div class="mt-2 w-full pt-4">
				<SignOutButton />
			</div>
		</div>
	</ScrollArea>
</ViewContainer>
