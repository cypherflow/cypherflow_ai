<!-- src/lib/components/nostr/NostrLoginView.svelte -->
<script lang="ts">
	import { isConnecting } from '$lib/client/stores/nostr';
	import { appState, InitStatus } from '$lib/client/services/initialization.svelte';
	import { Button } from '$lib/components/ui/button';
	import { LogIn, UserPlus, Key, MonitorSmartphone } from 'lucide-svelte';
	import { navigateTo } from '$lib/client/stores/wallet-navigation';
	import { onMount } from 'svelte';
	import ViewContainer from '../ui/ViewContainer.svelte';
	import Separator from '../ui/separator/separator.svelte';
  
	let hasNostrExtension = $state<boolean>(false);
  
	onMount(() => {
		// Check if extension exists
		hasNostrExtension = !!window.nostr;
	});
</script>

<ViewContainer className="space-y-4 p-4">
	<div class="text-center">
		<h3 class="text-lg font-medium">Welcome to CypherFlow</h3>
		<p class="text-sm text-gray-500">Choose how you want to get started</p>
	</div>
  
	<!-- Login Options -->
	<div class="space-y-3">
		<!-- Generate New Key -->
		<Button
			variant="default"
			class="w-full justify-start"
			disabled={appState.status === InitStatus.INITIALIZING}
			onclick={() => navigateTo('generate-key')}
		>
			<UserPlus class="mr-2 h-4 w-4" />
			Create new account
		</Button>
		<!-- Link Device login -->
		<div class="space-y-2">
			<Button
				variant="outline"
				class="w-full justify-start"
				disabled={appState.status === InitStatus.INITIALIZING}
				onclick={() => navigateTo('link-device')}
			>
				<MonitorSmartphone class="mr-2 h-4 w-4" />
				Link from another device
			</Button>
		</div>
	</div>
	<Separator class="my-4" />
	<div class="space-y-3">
		<h4 class="text-center text-sm text-gray-500">Or use existing Nostr Identity</h4>
		<!-- Extension Login -->
		<Button
			variant="outline"
			class="w-full justify-start"
			disabled={!hasNostrExtension || $isConnecting || appState.status === InitStatus.INITIALIZING}
			onclick={() => navigateTo('extension-login')}
		>
			<LogIn class="mr-2 h-4 w-4" />
			{hasNostrExtension ? 'Continue with Nostr extension' : 'No Nostr Extension Found'}
		</Button>
		<!-- Private Key Input -->
		<div class="space-y-2">
			<Button
				variant="outline"
				class="w-full justify-start"
				disabled={appState.status === InitStatus.INITIALIZING}
				onclick={() => navigateTo('private-key')}
			>
				<Key class="mr-2 h-4 w-4" />
				Sign in with Private Key
			</Button>
		</div>
	</div>
</ViewContainer>
