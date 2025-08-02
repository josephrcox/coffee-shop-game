<script lang="ts">
	import { databaseStore, showMenuPage, paused } from './store';
	import { possibleMenuItems } from './objects/types';

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

{#if $showMenuPage}
	<!-- Fullscreen Menu Management Page -->
	<div class="fixed inset-0 bg-mainBackground z-50 flex flex-col">
		<!-- Header -->
		<div
			class="bg-gradient-to-r from-cardBackground to-modalBackground shadow-2xl px-8 py-6 border-b-2 border-accent/30"
		>
			<div class="flex items-center justify-between max-w-7xl mx-auto">
				<div class="flex items-center gap-4">
					<div class="text-5xl">🍽️</div>
					<div>
						<h1 class="text-3xl font-bold text-accent">Menu Management</h1>
						<p class="text-textSecondary">Craft your perfect menu</p>
					</div>
				</div>
				<button
					class="btn bg-special hover:bg-special/80 text-textPrimary border-special/50 gap-2 text-lg px-6 py-3"
					on:click={() => {
						$paused = false;
						$showMenuPage = false;
					}}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 19l-7-7m0 0l7-7m-7 7h18"
						/>
					</svg>
					Back to Game
				</button>
			</div>
		</div>

		<!-- Main Content -->
		<div class="flex-1 p-8 overflow-y-auto">
			<div class="max-w-7xl mx-auto space-y-8">
				<!-- Current Menu Section -->
				{#if $databaseStore.menu.length > 0}
					<div class="space-y-4">
						<div class="flex items-center gap-3">
							<div class="text-2xl">✨</div>
							<h2 class="text-2xl font-bold text-success">Active Menu Items</h2>
						</div>
						<div
							class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
						>
							{#each $databaseStore.menu as menuItem}
								<div
									class="bg-gradient-to-br from-success/20 to-success/10 border-2 border-success/40 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300"
								>
									<div class="flex items-center justify-between mb-3">
										<h3 class="font-bold text-textPrimary">{menuItem.name}</h3>
										<button
											class="btn btn-sm btn-circle bg-error hover:bg-error/80 text-textPrimary border-error/50"
											on:click={() => {
												$databaseStore.menu = $databaseStore.menu.filter(
													(item) => item.name !== menuItem.name,
												);
											}}
										>
											✕
										</button>
									</div>
									<div class="flex items-center justify-between">
										<div
											class="bg-success/80 text-textPrimary px-3 py-1 rounded-full font-bold"
										>
											${menuItem.price}
										</div>
										<div class="text-success text-xl">✓</div>
									</div>
								</div>
							{/each}
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
					<div class="space-y-4">
						<div class="flex items-center gap-3">
							<div class="text-2xl">🎯</div>
							<h2 class="text-2xl font-bold text-accent">Available Recipes</h2>
						</div>
						<div
							class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
						>
							{#each availableItems as item}
								{@const missingIngredients = Object.entries(
									item.ingredients,
								).filter(([ingredient, quantity]) => {
									const inventoryItem = $databaseStore.inventory.find(
										(inv) => inv.name === ingredient,
									);
									return !inventoryItem || inventoryItem.quantity < quantity;
								})}

								<div
									class="bg-gradient-to-br from-cardBackground to-modalBackground border-2 border-interactive/40 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-interactive/60"
								>
									<div class="flex items-center justify-between mb-3">
										<h3 class="font-bold text-textPrimary">{item.name}</h3>
										<div
											class="bg-accent/80 text-mainBackground px-3 py-1 rounded-full font-bold"
										>
											${item.price}
										</div>
									</div>

									{#if missingIngredients.length > 0}
										<div class="mb-3 space-y-1">
											<div class="text-xs text-warning font-medium">
												Need ingredients:
											</div>
											{#each missingIngredients.slice(0, 2) as [ingredient, quantity]}
												<div class="text-xs text-textSecondary">
													• {ingredient} ({quantity})
												</div>
											{/each}
											{#if missingIngredients.length > 2}
												<div class="text-xs text-textSecondary">
													• +{missingIngredients.length - 2} more...
												</div>
											{/if}
										</div>
									{/if}

									<button
										class="btn w-full bg-special hover:bg-special/80 text-textPrimary border-special/50 gap-2"
										on:click={() => {
											$databaseStore.menu = [...$databaseStore.menu, item];
										}}
									>
										<div class="text-lg">+</div>
										Add to Menu
									</button>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Locked Items Section -->
				{#if lockedItems.length > 0}
					<div class="space-y-4">
						<div class="flex items-center gap-3">
							<div class="text-2xl">🔒</div>
							<h2 class="text-2xl font-bold text-textSecondary">
								Locked Recipes
							</h2>
						</div>
						<div
							class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
						>
							{#each lockedItems as item}
								{@const missingEquipment = item.requires
									? item.requires.filter(
											(equipment) =>
												!$databaseStore.ownedEquipment.some(
													(e) => e.name === equipment,
												),
										)
									: []}

								<div
									class="bg-gradient-to-br from-borderColor/20 to-borderColor/10 border-2 border-borderColor/40 rounded-xl p-4 shadow-lg opacity-60"
								>
									<div class="flex items-center justify-between mb-3">
										<h3 class="font-bold text-textSecondary">{item.name}</h3>
										<div
											class="bg-borderColor text-textSecondary px-3 py-1 rounded-full font-bold"
										>
											${item.price}
										</div>
									</div>

									{#if missingEquipment.length > 0}
										<div class="mb-3 space-y-1">
											<div class="text-xs text-error font-medium">
												Missing equipment:
											</div>
											{#each missingEquipment.slice(0, 2) as equipment}
												<div class="text-xs text-textSecondary">
													• {equipment}
												</div>
											{/each}
											{#if missingEquipment.length > 2}
												<div class="text-xs text-textSecondary">
													• +{missingEquipment.length - 2} more...
												</div>
											{/if}
										</div>
									{/if}

									<div
										class="btn w-full bg-borderColor/50 text-textSecondary border-borderColor/50 cursor-not-allowed gap-2"
									>
										<div class="text-lg">🔒</div>
										Equipment Needed
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
