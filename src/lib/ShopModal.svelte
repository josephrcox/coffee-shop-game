<script lang="ts">
	import { databaseStore, showShopModal } from './store';
	import { purchasableItems, purchasableEquipment } from './objects/types';
	import { purchaseItem } from './utils';

	let activeShopTab: 'items' | 'equipment' = 'items';

	function purchaseUpgrade(equipmentName: string, upgradeIndex: number) {
		const equipment = $databaseStore.ownedEquipment.find(
			(e) => e.name === equipmentName,
		);
		if (equipment && equipment.upgrades) {
			const upgrade = equipment.upgrades[upgradeIndex];
			if (!upgrade.purchased && $databaseStore.cash >= upgrade.cost) {
				$databaseStore.cash -= upgrade.cost;
				$databaseStore.stats.expensesToday += upgrade.cost;
				upgrade.purchased = true;
				$databaseStore.ownedEquipment = $databaseStore.ownedEquipment; // Trigger reactivity
			}
		}
	}
</script>

<dialog id="my_modal_2" class="modal {$showShopModal ? 'modal-open' : ''}">
	<div
		class="modal-box !p-0 bg-mainBackground/95 backdrop-blur-md text-textPrimary min-w-[70vw] max-w-[75vw] h-[85vh] flex flex-col border-2 border-accent/60 shadow-2xl rounded-xl overflow-hidden"
	>
		<!-- Enhanced Header -->
		<div
			class="bg-gradient-to-r from-cardBackground/80 to-modalBackground/80 p-3 border-b-2 border-accent/30 flex-shrink-0"
		>
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="text-2xl">🛒</div>
					<div>
						<h3 class="text-xl font-bold text-accent">Market & Equipment</h3>
						<p class="text-sm text-textSecondary">Upgrade your restaurant</p>
					</div>
				</div>
				<div
					class="bg-gradient-to-br from-success/20 to-success/10 border border-success/40 rounded-lg p-3"
				>
					<div class="text-xs text-textSecondary mb-1">Available Cash</div>
					<div class="text-lg font-bold text-success flex items-center gap-2">
						💰 ${$databaseStore.cash}
					</div>
				</div>
			</div>
		</div>

		<!-- Game-like Tabs -->
		<div class="flex gap-1 p-3 flex-shrink-0">
			<button
				class="flex-1 btn {activeShopTab === 'items'
					? 'bg-interactive hover:bg-interactive/80 text-textPrimary border-interactive/50'
					: 'bg-cardBackground/60 hover:bg-cardBackground text-textSecondary border-borderColor/50'} 
				gap-2 text-sm py-3 transition-all duration-300"
				on:click={() => (activeShopTab = 'items')}
			>
				<div class="text-lg">📦</div>
				<div class="flex flex-col items-start">
					<span class="font-bold">Ingredients</span>
				</div>
			</button>
			<button
				class="flex-1 btn {activeShopTab === 'equipment'
					? 'bg-interactive hover:bg-interactive/80 text-textPrimary border-interactive/50'
					: 'bg-cardBackground/60 hover:bg-cardBackground text-textSecondary border-borderColor/50'} 
				gap-2 text-sm py-3 transition-all duration-300"
				on:click={() => (activeShopTab = 'equipment')}
			>
				<div class="text-lg">⚙️</div>
				<div class="flex flex-col items-start">
					<span class="font-bold">Equipment</span>
				</div>
			</button>
		</div>

		<!-- Scrollable Content -->
		<div class="flex-1 overflow-y-auto px-3 pb-3">
			{#if activeShopTab === 'items'}
				<!-- Items Section -->
				<div class="space-y-3">
					<div class="flex items-center gap-2 mb-3">
						<div class="text-lg">🥬</div>
						<h2 class="text-lg font-bold text-accent">Fresh Ingredients</h2>
					</div>
					<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
						{#each purchasableItems as item}
							{@const canAfford = $databaseStore.cash >= item.cost}
							{@const requires = purchasableEquipment.find((e) =>
								item.requires?.includes(e.name),
							)}
							{@const hasRequired =
								requires &&
								$databaseStore.ownedEquipment.some(
									(e) => e.name === requires.name,
								)}
							{@const currentQuantity =
								$databaseStore.inventory.find((i) => i.name === item.name)
									?.quantity || 0}
							{@const canPurchase = canAfford && (!requires || hasRequired)}

							<!-- svelte-ignore a11y-click-events-have-key-events -->
							<!-- svelte-ignore a11y-no-static-element-interactions -->
							<div
								class="bg-gradient-to-br from-cardBackground to-modalBackground border-2 rounded-lg p-3 shadow-lg transition-all duration-300 {canPurchase
									? 'border-interactive/40 hover:border-interactive/70 hover:shadow-xl cursor-pointer hover:scale-105'
									: !hasRequired && requires
										? 'border-error/40 opacity-60'
										: 'border-borderColor/40 opacity-60'}"
								on:click={() => {
									if (!hasRequired && requires) {
										alert(`You need ${requires.name} to purchase this item!`);
										return;
									}
									if (canAfford) {
										const success = purchaseItem(
											item.name,
											item.quantity,
											item.cost,
											item.description,
										);
										if (!success) {
											alert('You do not have enough money');
										}
									} else {
										alert('You do not have enough money');
									}
								}}
							>
								<div class="flex items-start justify-between mb-2">
									<div class="flex-1">
										<h4 class="font-bold text-sm text-textPrimary mb-1">
											{item.name}
										</h4>
										<p class="text-xs text-textSecondary line-clamp-2 mb-1">
											{item.description}
										</p>
										{#if currentQuantity > 0}
											<div
												class="bg-accent/20 text-accent px-1.5 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1"
											>
												📦 {currentQuantity}
											</div>
										{/if}
									</div>
									<div
										class="bg-success/80 text-textPrimary px-2 py-1 rounded-full font-bold text-xs"
									>
										+{item.quantity}
									</div>
								</div>

								{#if !hasRequired && requires}
									<div
										class="bg-error/20 border border-error/40 rounded p-1.5 mb-2"
									>
										<div class="text-xs text-error font-medium">
											⚠️ Requires: {requires.name}
										</div>
									</div>
								{/if}

								<div class="flex items-center justify-between">
									<div
										class="text-lg font-bold {canAfford
											? 'text-success'
											: 'text-error'}"
									>
										${item.cost}
									</div>
									{#if canPurchase}
										<div
											class="bg-special/80 text-textPrimary px-3 py-1 rounded font-medium text-xs"
										>
											Buy Now
										</div>
									{:else if !canAfford}
										<div class="text-error text-xs font-medium">No cash</div>
									{:else}
										<div class="text-warning text-xs font-medium">
											Need equip
										</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<!-- Equipment Section -->
				<div class="space-y-3">
					<div class="flex items-center gap-2 mb-3">
						<div class="text-lg">🔧</div>
						<h2 class="text-lg font-bold text-accent">
							Professional Equipment
						</h2>
					</div>
					<div class="grid grid-cols-1 md:grid-cols-5 gap-3">
						{#each purchasableEquipment as item}
							{@const ownedItem = $databaseStore.ownedEquipment.find(
								(e) => e.name === item.name,
							)}
							{@const canAfford = $databaseStore.cash >= item.cost}

							<div
								class="bg-gradient-to-br {ownedItem
									? 'from-success/20 to-success/10 border-success/60'
									: canAfford
										? 'from-cardBackground to-modalBackground border-interactive/40 hover:border-interactive/70 hover:shadow-xl'
										: 'from-borderColor/20 to-borderColor/10 border-borderColor/40 opacity-60'} 
							border-2 rounded-lg p-3 shadow-lg transition-all duration-300 {canAfford &&
								!ownedItem
									? 'hover:scale-105'
									: ''}"
							>
								<!-- svelte-ignore a11y-click-events-have-key-events -->
								<!-- svelte-ignore a11y-no-static-element-interactions -->
								<div
									class={!ownedItem && canAfford ? 'cursor-pointer' : ''}
									on:click={() => {
										if (ownedItem || !canAfford) return;
										$databaseStore.cash -= item.cost;
										$databaseStore.stats.expensesToday += item.cost;
										$databaseStore.ownedEquipment = [
											...$databaseStore.ownedEquipment,
											{
												name: item.name,
												quality: item.quality,
												durability: item.durability,
												failureChance: item.failureChance,
												cost: item.cost,
												upgrades: JSON.parse(JSON.stringify(item.upgrades)),
											},
										];
									}}
								>
									<div class="flex items-start justify-between mb-2">
										<h4 class="font-bold text-textPrimary text-sm">
											{item.name}
										</h4>
										{#if ownedItem}
											<div
												class="bg-success text-textPrimary px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"
											>
												Owned
											</div>
										{/if}
									</div>

									<div class="flex items-center justify-between mb-3">
										<div
											class="text-xl font-bold {ownedItem || canAfford
												? 'text-success'
												: 'text-error'}"
										>
											${item.cost}
										</div>
										{#if !ownedItem}
											{#if canAfford}
												<div
													class="bg-special/80 text-textPrimary px-3 py-1 rounded font-medium text-xs"
												>
													Purchase
												</div>
											{:else}
												<div class="text-error text-xs font-medium">
													No cash
												</div>
											{/if}
										{/if}
									</div>
								</div>

								<!-- Upgrades Section -->
								{#if ownedItem && ownedItem.upgrades && ownedItem.upgrades.length > 0}
									<div class="border-t border-success/30 pt-3 space-y-2">
										<div class="flex items-center gap-1.5 mb-2">
											<div class="text-sm">⬆️</div>
											<h5 class="font-bold text-accent text-sm">Upgrades</h5>
										</div>
										{#each ownedItem.upgrades as upgrade, i}
											<div
												class="bg-mainBackground/50 border border-info/30 rounded p-2"
											>
												<div class="flex items-center justify-between">
													<div class="flex-1">
														<div
															class="text-xs font-medium text-lightAccent mb-1"
														>
															{upgrade.description}
														</div>
														{#if !upgrade.purchased}
															{@const canAffordUpgrade =
																$databaseStore.cash >= upgrade.cost}
															<div
																class="text-sm font-bold {canAffordUpgrade
																	? 'text-success'
																	: 'text-error'}"
															>
																${upgrade.cost}
															</div>
														{/if}
													</div>
													{#if upgrade.purchased}
														<div
															class="bg-success/20 text-success px-2 py-1 rounded text-xs font-bold flex items-center gap-1"
														>
															Done
														</div>
													{:else}
														{@const canAffordUpgrade =
															$databaseStore.cash >= upgrade.cost}
														<button
															class="btn btn-xs {canAffordUpgrade
																? 'bg-info hover:bg-info/80 text-textPrimary border-info/50'
																: 'bg-borderColor/50 text-textSecondary cursor-not-allowed border-borderColor/30 opacity-50'} 
															px-2 py-1 font-medium"
															on:click|stopPropagation={() => {
																if (canAffordUpgrade) {
																	purchaseUpgrade(ownedItem.name, i);
																}
															}}
														>
															{canAffordUpgrade ? 'Buy' : 'Poor'}
														</button>
													{/if}
												</div>
											</div>
										{/each}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Enhanced Footer -->
		<div
			class="border-t-2 border-accent/30 bg-gradient-to-r from-cardBackground/60 to-modalBackground/60 p-3 flex-shrink-0"
		>
			<div class="flex justify-between items-center">
				<div class="text-textSecondary text-xs">
					💡 Tip: Better equipment unlocks new menu items!
				</div>
				<button
					class="btn bg-special hover:bg-special/80 text-textPrimary border-special/50 gap-2 px-4 py-2"
					on:click={() => {
						$showShopModal = false;
					}}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
					Close Shop
				</button>
			</div>
		</div>
	</div>
</dialog>
