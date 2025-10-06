<script lang="ts">
	import { databaseStore, showMenuPage } from './store';
	import { possibleMenuItems } from './objects/types';
	import FullscreenModal from './FullscreenModal.svelte';

	// Sorted menu items - reactive to database changes
	$: sortedMenuItems = possibleMenuItems.sort((a, b) => {
		const aIsOnMenu = $databaseStore.menu.some(
			(menuItem) => menuItem.name === a.name,
		);
		const bIsOnMenu = $databaseStore.menu.some(
			(menuItem) => menuItem.name === b.name,
		);

		const aHasRequiredEquipment =
			!a.requires ||
			a.requires.every((equipment) =>
				$databaseStore.ownedEquipment.some((e) => e.name === equipment),
			);
		const aCanAdd = aHasRequiredEquipment && !aIsOnMenu;

		const bHasRequiredEquipment =
			!b.requires ||
			b.requires.every((equipment) =>
				$databaseStore.ownedEquipment.some((e) => e.name === equipment),
			);
		const bCanAdd = bHasRequiredEquipment && !bIsOnMenu;

		// Already on menu items first
		if (aIsOnMenu && !bIsOnMenu) return -1;
		if (!aIsOnMenu && bIsOnMenu) return 1;

		// Then items that can be added
		if (aCanAdd && !bCanAdd) return -1;
		if (!aCanAdd && bCanAdd) return 1;

		// Alphabetical for same category
		return a.name.localeCompare(b.name);
	});

	// Group items by category for better organization
	$: availableItems = sortedMenuItems.filter((item) => {
		const isOnMenu = $databaseStore.menu.some(
			(menuItem) => menuItem.name === item.name,
		);
		const hasRequiredEquipment =
			!item.requires ||
			item.requires.every((equipment) =>
				$databaseStore.ownedEquipment.some((e) => e.name === equipment),
			);
		return hasRequiredEquipment && !isOnMenu;
	});

	$: lockedItems = sortedMenuItems.filter((item) => {
		const isOnMenu = $databaseStore.menu.some(
			(menuItem) => menuItem.name === item.name,
		);
		const hasRequiredEquipment =
			!item.requires ||
			item.requires.every((equipment) =>
				$databaseStore.ownedEquipment.some((e) => e.name === equipment),
			);
		return !hasRequiredEquipment && !isOnMenu;
	});
</script>

<FullscreenModal
	show={$showMenuPage}
	title="Menu"
	icon="🍽️"
	onClose={() => ($showMenuPage = false)}
>
	<div slot="content" class="space-y-12">
		<!-- Current Menu Section -->
		{#if $databaseStore.menu.length > 0}
			<div>
				<div class="flex items-center gap-2 mb-3">
					<div class="text-lg">✨</div>
					<h2 class="text-lg font-bold text-success">Active Menu Items</h2>
				</div>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-borderColor/30">
								<th class="text-left py-2 px-2 font-medium text-textSecondary"
									>Item</th
								>
								<th class="text-center py-2 px-2 font-medium text-textSecondary"
									>Price</th
								>
								<th
									class="text-center py-2 px-2 font-medium text-textSecondary w-24"
									>Action</th
								>
							</tr>
						</thead>
						<tbody class="divide-y divide-borderColor/20">
							{#each $databaseStore.menu as menuItem}
								<tr class="hover:bg-mainBackground/30 transition-colors">
									<td class="py-2 px-2 font-medium text-textPrimary"
										>{menuItem.name}</td
									>
									<td class="py-2 px-2 text-center">
										<span
											class="bg-success/80 text-white px-3 py-1 rounded-full font-bold text-xs"
										>
											${menuItem.price}
										</span>
									</td>
									<td class="py-2 px-2 text-center w-24">
										<button
											class="btn btn-xs bg-error hover:bg-error/80 text-white border-error/50 w-28"
											on:click={() => {
												$databaseStore.menu = $databaseStore.menu.filter(
													(item) => item.name !== menuItem.name,
												);
											}}
										>
											Remove
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{:else}
			<div
				class="bg-gradient-to-br from-warning/20 to-warning/10 border-2 border-warning/40 rounded-xl p-8 text-center"
			>
				<div class="text-6xl mb-4">🍽️</div>
				<h2 class="text-2xl font-bold text-warning mb-2">
					Your menu is empty!
				</h2>
				<p class="text-textSecondary">
					Add some delicious items to get started
				</p>
			</div>
		{/if}

		<!-- Available Items Section -->
		{#if availableItems.length > 0}
			<div>
				<div class="flex items-center gap-2 mb-3">
					<div class="text-lg">🎯</div>
					<h2 class="text-lg font-bold text-subheading">Available Recipes</h2>
				</div>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-borderColor/30">
								<th class="text-left py-2 px-2 font-medium text-textSecondary"
									>Item</th
								>
								<th class="text-center py-2 px-2 font-medium text-textSecondary"
									>Price</th
								>
								<th class="text-center py-2 px-2 font-medium text-textSecondary"
									>Ingredients Status</th
								>
								<th
									class="text-center py-2 px-2 font-medium text-textSecondary w-24"
									>Action</th
								>
							</tr>
						</thead>
						<tbody class="divide-y divide-borderColor/20">
							{#each availableItems as item}
								{@const missingIngredients = Object.entries(
									item.ingredients,
								).filter(([ingredient, quantity]) => {
									const inventoryItem = $databaseStore.inventory.find(
										(inv) => inv.name === ingredient,
									);
									return !inventoryItem || inventoryItem.quantity < quantity;
								})}

								<tr
									class="hover:bg-mainBackground/30 transition-colors"
									data-nux-id={item.name === '☕️ Drip coffee' ? 'add-drip' : ''}
								>
									<td class="py-2 px-2 font-medium text-textPrimary"
										>{item.name}</td
									>
									<td class="py-2 px-2 text-center">
										<span
											class="bg-accent/80 text-textPrimary px-3 py-1 rounded-full font-bold text-xs"
										>
											${item.price}
										</span>
									</td>
									<td class="py-2 px-2 text-center">
										{#if missingIngredients.length > 0}
											<div class="text-xs text-warning">
												⚠️ {missingIngredients.map(
													([ingredient]) => ingredient,
												)}
												missing
											</div>
										{:else}
											<span
												class="bg-success/20 text-success px-2 py-1 rounded text-xs"
												>✓ Ready</span
											>
										{/if}
									</td>
									<td class="py-2 px-2 text-center w-32">
										<button
											class="btn btn-xs bg-special hover:bg-special/80 text-white border-special/50 w-26"
											on:click={() => {
												$databaseStore.menu = [...$databaseStore.menu, item];
											}}
										>
											Add to Menu
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}

		<!-- Locked Items Section -->
		{#if lockedItems.length > 0}
			<div>
				<div class="flex items-center gap-2 mb-3">
					<div class="text-lg">🔒</div>
					<h2 class="text-lg font-bold text-textSecondary">Locked Recipes</h2>
				</div>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-borderColor/30">
								<th class="text-left py-2 px-2 font-medium text-textSecondary"
									>Item</th
								>
								<th class="text-center py-2 px-2 font-medium text-textSecondary"
									>Price</th
								>
								<th class="text-left py-2 px-2 font-medium text-textSecondary"
									>Missing Equipment</th
								>
								<th
									class="text-center py-2 px-2 font-medium text-textSecondary w-28"
									>Status</th
								>
							</tr>
						</thead>
						<tbody class="divide-y divide-borderColor/20">
							{#each lockedItems as item}
								{@const missingEquipment = item.requires
									? item.requires.filter(
											(equipment) =>
												!$databaseStore.ownedEquipment.some(
													(e) => e.name === equipment,
												),
										)
									: []}

								<tr
									class="hover:bg-mainBackground/30 transition-colors opacity-60"
								>
									<td class="py-2 px-2 font-medium text-textSecondary"
										>{item.name}</td
									>
									<td class="py-2 px-2 text-center">
										<span
											class="bg-borderColor text-textSecondary px-3 py-1 rounded-full font-bold text-xs"
										>
											${item.price}
										</span>
									</td>
									<td class="py-2 px-2 text-textSecondary">
										{#if missingEquipment.length > 0}
											<div class="text-xs">
												{missingEquipment.slice(0, 3).join(', ')}
												{#if missingEquipment.length > 3}
													+{missingEquipment.length - 3} more
												{/if}
											</div>
										{/if}
									</td>
									<td class="py-2 px-2 text-center w-24">
										<span
											class="bg-borderColor/50 text-textSecondary px-2 py-1 rounded text-xs w-24 inline-block"
											>🔒 Locked</span
										>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	</div>
</FullscreenModal>
