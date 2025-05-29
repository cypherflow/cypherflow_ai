<!-- src/lib/components/chat/InsufficientBalanceAlert.svelte -->
<script lang="ts">
  import { Wallet } from 'lucide-svelte';
  import * as Alert from '$lib/components/ui/alert/index.js';
  import WalletTopUpButton from '../wallet/WalletTopUpButton.svelte';
  import { slide } from 'svelte/transition';

  let { 
    requiredAmount = $bindable(), 
    modelId = $bindable() 
  } = $props<{
    requiredAmount: number;
    modelId: string;
  }>();

  // Helper to format sats in a readable way
  function formatSats(sats: number): string {
    return new Intl.NumberFormat().format(sats);
  }
</script>

<div transition:slide>
  <Alert.Root variant="warning" class="mb-2 py-2">
    <div class="flex items-center justify-between w-full">
      <div class="flex items-center gap-2">
        <!--<Wallet class="h-4 w-4 mt-0.5" />-->
        <div>
          <div class="font-medium text-sm">{modelId}</div>
          <div class="text-xs">Minimum balance: {formatSats(requiredAmount)} sats to unlock</div>
        </div>
      </div>
      <WalletTopUpButton size="sm" class="h-8 shrink-0" />
    </div>
  </Alert.Root>
</div>

