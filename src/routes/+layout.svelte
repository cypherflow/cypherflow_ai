<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { SquarePen } from 'lucide-svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import NostrUserMenu from '$lib/components/nostr/NostrUserMenu.svelte';
	import OnboardingDialog from '$lib/components/onboardingDialog.svelte';

	let { data, children } = $props();

	async function detectSWUpdate() {
		const registration = await navigator.serviceWorker.ready;
		registration.addEventListener('updatefound', () => {
			const newSW = registration.installing;
			newSW?.addEventListener('statechange', () => {
				if (newSW.state === 'installed') {
					if (confirm('New update available! Reload to update?')) {
						newSW.postMessage({ type: 'SKIP_WAITING' });
						window.location.reload();
					}
				}
			});
		});
	}

	onMount(async () => {
		detectSWUpdate();
	});
</script>

<ModeWatcher />
<Toaster richColors />
<OnboardingDialog />

<Sidebar.Provider>
	<AppSidebar />
	<Sidebar.Inset data-vaul-drawer-wrapper>
		<header class="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 bg-background">
			<div class="flex flex-1 items-center gap-2 px-3 text-lg">
				<Sidebar.Trigger />
				<Separator orientation="vertical" class="mr-2 h-4" />
				<Button variant="link" size="icon" href="/">
					<SquarePen />
				</Button>
				CypherFlow
			</div>
			<div class="ml-auto px-3">
				<NostrUserMenu showLogin={data.showLogin} />
			</div>
		</header>
		<main class="flex flex-grow flex-col">
			{@render children()}
		</main>
	</Sidebar.Inset>
</Sidebar.Provider>
