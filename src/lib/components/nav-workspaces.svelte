<script lang="ts">
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import Ellipsis from 'lucide-svelte/icons/ellipsis';
	import Plus from 'lucide-svelte/icons/plus';

	let {
		workspaces
	}: {
		workspaces: {
			name: string;
			emoji: string;
			pages: {
				name: string;
				emoji: string;
			}[];
		}[];
	} = $props();
</script>

<Sidebar.Group>
	<Sidebar.GroupLabel>Workspaces</Sidebar.GroupLabel>
	<Sidebar.GroupContent>
		<Sidebar.Menu>
			{#each workspaces as workspace (workspace.name)}
				<Collapsible.Root>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton>
							{#snippet child({ props })}
								<a href="##" {...props}>
									<span>{workspace.emoji}</span>
									<span>{workspace.name}</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
						<Collapsible.Trigger>
							{#snippet child({ props })}
								<Sidebar.MenuAction
									{...props}
									class="left-2 bg-sidebar-accent text-sidebar-accent-foreground data-[state=open]:rotate-90"
									showOnHover
								>
									<ChevronRight />
								</Sidebar.MenuAction>
							{/snippet}
						</Collapsible.Trigger>
						<Sidebar.MenuAction showOnHover>
							<Plus />
						</Sidebar.MenuAction>
						<Collapsible.Content>
							<Sidebar.MenuSub>
								{#each workspace.pages as page (page.name)}
									<Sidebar.MenuSubItem>
										<Sidebar.MenuSubButton>
											{#snippet child({ props })}
												<a href="##" {...props}>
													<span>{page.emoji}</span>
													<span>{page.name}</span>
												</a>
											{/snippet}
										</Sidebar.MenuSubButton>
									</Sidebar.MenuSubItem>
								{/each}
							</Sidebar.MenuSub>
						</Collapsible.Content>
					</Sidebar.MenuItem>
				</Collapsible.Root>
			{/each}
			<Sidebar.MenuItem>
				<Sidebar.MenuButton class="text-sidebar-foreground/70">
					<Ellipsis />
					<span>More</span>
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
