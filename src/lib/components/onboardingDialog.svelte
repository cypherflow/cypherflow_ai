<script lang='ts'>
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { 
    Lock, 
    Sparkles,
    Wallet, 
    Zap,
    UserPlus, 
    Key,
    Shield,
    MonitorSmartphone,
  } from "lucide-svelte";
  import { isUserMenuOpen, openMenuAt, type ViewName } from "$lib/client/stores/wallet-navigation";
  import { onMount } from "svelte";
  
  // Props
  // Changed from let { open = false } to allow for controlled or uncontrolled usage
  let { open = undefined } = $props<{ open?: boolean }>();
  let dialogOpen = $state(false);

  // Local storage key
  const ONBOARDING_SEEN_KEY = "cypherflow-onboarding-seen";
  
  // App name - change this to your app's name
  const appName = "CypherFlow";
  
  // State management using Svelte 5 runes
  let currentStep = $state(0);
  const totalSteps = 3; // Compressed to 3 steps
  
  // Check local storage on mount and show dialog if user is new
  onMount(() => {
    // Check localStorage first
    const hasSeenOnboarding = localStorage.getItem(ONBOARDING_SEEN_KEY) === "true";
    
    // Only auto-show if not in controlled mode AND user hasn't seen it
    if (open === undefined) {
      dialogOpen = !hasSeenOnboarding;
    } else {
      // In controlled mode, respect the prop
      dialogOpen = open;
    }
    
    // Set up effect after the initial state is set
    $effect(() => {
      if (open !== undefined) {
        dialogOpen = open;
      }
    });
  });
  
  // Function to mark onboarding as seen
  function markOnboardingAsSeen() {
    localStorage.setItem(ONBOARDING_SEEN_KEY, "true");
  }
  
  // Function to handle dialog closing
  function handleDialogClose(seen: boolean = true) {
    if (seen) {
      markOnboardingAsSeen();
    }
    
    // Only update local state if not in controlled mode
    if (open === undefined) {
      dialogOpen = false;
    }
  }
  
  // Navigation functions
  function nextStep() {
    if (currentStep < totalSteps - 1) {
      currentStep += 1;
    }
  }
  
  function prevStep() {
    if (currentStep > 0) {
      currentStep -= 1;
    }
  }
  
  // Simplified function to handle user menu navigation
  function handleUserMenuAction(menuOption: ViewName) {
    console.log(`Navigating to ${menuOption}`);
    handleDialogClose();
    openMenuAt(menuOption);
    isUserMenuOpen.set(true);
  }
  
  // Function to reset onboarding status (for manual showing)
  export function resetOnboardingStatus() {
    localStorage.removeItem(ONBOARDING_SEEN_KEY);
    if (open === undefined) {
      dialogOpen = true;
    }
    // Reset to first step when manually showing
    currentStep = 0;
  }
</script>

<Dialog.Root bind:open={dialogOpen} onOpenChange={(isOpen) => {
  // When dialog is closed by clicking outside or escape key
  if (!isOpen) {
    handleDialogClose();
  }
}}>
  <Dialog.Content class="sm:max-w-md md:max-w-lg">
    {#if currentStep === 0}
      <Dialog.Header>
        <Dialog.Title class="text-xl font-bold text-center">Welcome to {appName}!</Dialog.Title>
      </Dialog.Header>
      
      <div class="py-6">
        <ul class="space-y-6">
          <li class="flex items-start gap-3">
            <div class="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 class="font-semibold">Cutting-Edge AI with Bitcoin Micropayments</h3>
              <p class="text-sm text-muted-foreground">Access the latest AI models including open source options with tiny Bitcoin payments for each response—simple, private, and no KYC required.</p>
            </div>
          </li>
          
          <li class="flex items-start gap-3">
            <div class="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              <Wallet size={18} />
            </div>
            <div>
              <h3 class="font-semibold">Bitcoin Lightning & Ecash built-in</h3>
              <p class="text-sm text-muted-foreground">A fully functional Bitcoin wallet for instant and private transactions. Send and receive payments with Lightning and Ecash.</p>
            </div>
          </li>
          
          <li class="flex items-start gap-3">
            <div class="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              <Shield size={18} />
            </div>
            <div>
              <h3 class="font-semibold">True privacy by design</h3>
              <p class="text-sm text-muted-foreground">Chat without revealing your identity. Your conversations are encrypted and follow you across all your devices.</p>
            </div>
          </li>
        </ul>
      </div>
      
      <Dialog.Footer class="flex justify-end">
        <Button variant="default" onclick={nextStep}>Next</Button>
      </Dialog.Footer>
    {:else if currentStep === 1}
      <Dialog.Header>
        <Dialog.Title class="text-xl font-bold text-center">How {appName} Works</Dialog.Title>
      </Dialog.Header>
      
      <div class="py-6">
        <ul class="space-y-5">
          <li class="flex items-start gap-3">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <span class="text-sm font-bold">1</span>
            </div>
            <div>
              <h3 class="font-semibold">Top up your wallet</h3>
              <p class="text-sm text-muted-foreground">Add Bitcoin via Lightning or Ecash. Your funds remain under your control at all times.</p>
            </div>
          </li>
          
          <li class="flex items-start gap-3">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <span class="text-sm font-bold">2</span>
            </div>
            <div>
              <h3 class="font-semibold">Ask your AI questions</h3>
              <p class="text-sm text-muted-foreground">Select from state-of-the-art models like Claude, GPT-4, and open source alternatives. Each message costs only a few sats.</p>
            </div>
          </li>
          
          <li class="flex items-start gap-3">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <span class="text-sm font-bold">3</span>
            </div>
            <div>
              <h3 class="font-semibold">Pay automatically & privately</h3>
              <p class="text-sm text-muted-foreground">Tiny Bitcoin payments sent per message, with no identity tracking or subscription fees.</p>
            </div>
          </li>
        </ul>
        
        <div class="mt-6 flex items-start gap-3">
          <div class="h-5 w-5 text-muted-foreground flex items-center justify-center shrink-0">
            <Lock size={14} />
          </div>
          <p class="text-xs text-muted-foreground">
            For enhanced privacy and control, you can add your preferred Nostr relays and Ecash mints at any time.
          </p>
        </div>
      </div>
      
      <Dialog.Footer class="flex flex-row justify-end gap-2">
        <Button variant="outline" onclick={prevStep}>Previous</Button>
        <Button variant="default" onclick={nextStep}>Next</Button>
      </Dialog.Footer>
    {:else if currentStep === 2}
      <Dialog.Header>
        <Dialog.Title class="text-xl font-bold text-center">Choose how to get started</Dialog.Title>
      </Dialog.Header>
      
      <div class="py-6 space-y-4 max-w-full overflow-hidden">
        <!-- Generate New Account - Primary action -->
        <Button 
          variant="default" 
          class="w-full max-w-full h-auto flex-col items-start justify-start p-4 gap-1 text-left"
          onclick={() => handleUserMenuAction('generate-key')}>
          <div class="flex items-center w-full">
            <UserPlus class="mr-2 shrink-0" />
            <span class="font-semibold">Create new account</span>
          </div>
          <p class="text-sm text-primary-foreground/80 pl-6 break-words">Generate a new key and get started right away.</p>
        </Button>
        
        <!-- Link from another device -->
        <Button 
          variant="outline" 
          class="w-full max-w-full h-auto flex-col items-start justify-start p-4 gap-1 text-left" 
          onclick={() => handleUserMenuAction('link-device')}>
          <div class="flex items-center w-full">
            <MonitorSmartphone class="mr-2 shrink-0" />
            <span class="font-semibold">Link from another device</span>
          </div>
          <p class="text-sm text-muted-foreground pl-6 break-words">Already using {appName}? Sync with your device</p>
        </Button>
        
        <div class="my-4 relative">
          <div class="absolute inset-0 flex items-center">
            <span class="w-full border-t" ></span>
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-background px-2 text-muted-foreground">Or use existing Nostr Identity</span>
          </div>
        </div>
        
        <!-- Nostr Extension Login -->
        <Button 
          variant="outline" 
          class="w-full max-w-full h-auto flex-col items-start justify-start p-4 gap-1 text-left" 
          onclick={() => handleUserMenuAction('extension-login')}>
          <div class="flex items-center w-full">
            <Zap class="mr-2 shrink-0" />
            <span class="font-semibold">Continue with Nostr extension</span>
          </div>
          <p class="text-sm text-muted-foreground pl-6 break-words">Connect using your browser's Nostr extension.</p>
        </Button>
        
        <!-- Private Key Login -->
        <Button 
          variant="outline" 
          class="w-full max-w-full h-auto flex-col items-start justify-start p-4 gap-1 text-left" 
          onclick={() => handleUserMenuAction('private-key')}>
          <div class="flex items-center w-full">
            <Key class="mr-2 shrink-0" />
            <span class="font-semibold">Sign in with Private Key</span>
          </div>
          <p class="text-sm text-muted-foreground pl-6 break-words">Import your existing Nostr private key.</p>
        </Button>
      </div>
      
      <Dialog.Footer class="flex flex-row justify-end gap-2">
        <Button variant="outline" onclick={prevStep}>Previous</Button>
      </Dialog.Footer>
    {/if}
  </Dialog.Content>
</Dialog.Root>
