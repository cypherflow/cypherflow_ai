<script lang='ts' >
	import { Zap } from "lucide-svelte";
	import Button from "../ui/button/button.svelte";
	import { isUserMenuOpen, openMenuAt } from "$lib/client/stores/wallet-navigation";


  function openReceiveView() {
    openMenuAt('receive')
    isUserMenuOpen.set(true)
  }
</script>

<Button onclick={openReceiveView}>
  <Zap class="h-4 w-4" />
  
    <span>Top Up</span>
</Button>
