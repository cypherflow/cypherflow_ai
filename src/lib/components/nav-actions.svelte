<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	// import { walletStore } from "$lib/client/stores/wallet";
	import { onMount } from 'svelte';

	import ArrowUpCircle from 'lucide-svelte/icons/arrow-up-circle';
	import ArrowDownCircle from 'lucide-svelte/icons/arrow-down-circle';
	import Settings from 'lucide-svelte/icons/settings';
	import History from 'lucide-svelte/icons/history';
	import RefreshCw from 'lucide-svelte/icons/refresh-cw';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	// import ReceiveModal from "./receive-modal.svelte";
	// import SendModal from "./send-modal.svelte";

	let open = false;
	let showReceiveModal = false;
	let showSendModal = false;

	const walletActions = [
		[
			{
				label: 'Receive',
				icon: ArrowDownCircle,
				action: () => {
					// To be implemented
					console.log('Receive');
					showReceiveModal = true;
					open = false;
				}
			},
			{
				label: 'Send',
				icon: ArrowUpCircle,
				action: () => {
					// To be implemented
					console.log('Send');
					showSendModal = true;
					open = false;
				}
			}
		],
		[
			{
				label: 'History',
				icon: History,
				action: () => {
					// To be implemented
					console.log('History');
				}
			},
			{
				label: 'Settings',
				icon: Settings,
				action: () => {
					// To be implemented
					console.log('Settings');
				}
			},
			{
				label: 'Refresh Balance',
				icon: RefreshCw,
				action: async () => {
					// await walletStore.initialize();
					console.log('walletStore.initialize()');
				}
			}
		]
	];

	onMount(() => {
		// walletStore.initialize();
		console.log('walletStore.initialize();');
	});
</script>

<div class="flex items-center gap-2 text-sm">
	<Popover.Root bind:open>
		<Popover.Trigger>
			{#snippet child({ props })}
				<!-- <Button variant="outline" {...props} disabled={$walletStore.isLoading}> -->
				<Button variant="outline" {...props}>
					<!-- {#if $walletStore.isLoading} -->
					{#if false}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						Loading...
					{:else}
						<!-- {$walletStore.balance.toLocaleString()} sats -->

						420 sats
					{/if}
				</Button>
			{/snippet}
		</Popover.Trigger>
		<Popover.Content class="w-56 overflow-hidden rounded-lg p-0" align="end">
			<Sidebar.Root collapsible="none" class="bg-transparent">
				<Sidebar.Content>
					{#each walletActions as group, index (index)}
						<Sidebar.Group class="border-b last:border-none">
							<Sidebar.GroupContent class="gap-0">
								<Sidebar.Menu>
									{#each group as item, index (index)}
										<Sidebar.MenuItem>
											<Sidebar.MenuButton onclick={item.action}>
												<item.icon /> <span>{item.label}</span>
											</Sidebar.MenuButton>
										</Sidebar.MenuItem>
									{/each}
								</Sidebar.Menu>
							</Sidebar.GroupContent>
						</Sidebar.Group>
					{/each}
				</Sidebar.Content>
			</Sidebar.Root>
		</Popover.Content>
	</Popover.Root>
</div>

<!-- <ReceiveModal bind:isOpen={showReceiveModal} />
<SendModal bind:isOpen={showSendModal} /> -->
