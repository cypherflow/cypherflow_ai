<!-- src/lib/components/NostrUserMenu.svelte -->
<script lang="ts">
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { initUserMenuNavigation, isUserMenuOpen, openMenuAtCurrentView } from '$lib/client/stores/wallet-navigation';
	import ViewRouter from '$lib/components/nostr/ViewRouter.svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import UserMenuTrigger from './UserMenuTrigger.svelte';
	import * as Drawer from '$lib/components/ui/drawer/index.js';

	const isDesktop = new MediaQuery('(min-width: 768px)').current;
	// When popover opens, reset current view
	$: if ($isUserMenuOpen) {

    console.log(`[NostrUserMenu] user menu opened`)
    // TODO: THIS MIGHT BREAK WHEN TRANSITIONING TO $EFFECT RUNE
		openMenuAtCurrentView();
	} else {
    console.log(`[NostrUserMenu] user menu closed`)
    initUserMenuNavigation();
  }

</script>

{#if isDesktop}
	<div class="relative">
		<Popover bind:open={$isUserMenuOpen}>
			<PopoverTrigger>
				<UserMenuTrigger />
			</PopoverTrigger>
			<PopoverContent align="end" class="w-80 overflow-hidden p-0">
				<ViewRouter {isDesktop} />
			</PopoverContent>
		</Popover>
	</div>
{:else}
	<Drawer.Root bind:open={$isUserMenuOpen} shouldScaleBackground>
		<Drawer.Trigger>
			<UserMenuTrigger />
		</Drawer.Trigger>
		<Drawer.Content class="pt-0">
			<ViewRouter {isDesktop} />
		</Drawer.Content>
	</Drawer.Root>
{/if}
