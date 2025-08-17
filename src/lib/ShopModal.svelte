<script lang="ts">
	import { databaseStore, showShopModal } from './store';
	import { purchasableItems, purchasableEquipment } from './objects/types';
	import { purchaseItem } from './utils';
	import FullscreenModal from './FullscreenModal.svelte';

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

<FullscreenModal
	show={$showShopModal}
	title="Shop"
	subtitle="Purchase items and equipment"
	icon="🛒"
	onClose={() => ($showShopModal = false)}
>
	<div
		slot="headerExtra"
		class="bg-gradient-to-br from-success/20 to-success/10 border border-success/40 rounded-lg p-3"
	>
		<div class="text-xs text-textSecondary mb-1">Available Cash</div>
		<div class="text-lg font-bold text-success flex items-center gap-2">
			💰 ${$databaseStore.cash}
		</div>
	</div>

	<div slot="content" class="space-y-10">
		<!-- Ingredients Section -->
		<div>
			<div class="flex items-center gap-2 mb-3">
				<div class="text-lg">🧂</div>
				<h2 class="text-lg font-bold text-accent">Ingredients</h2>
			</div>
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-borderColor/30">
							<th class="text-left py-2 px-2 font-medium text-textSecondary"
								>Item</th
							>
							<th class="text-left py-2 px-2 font-medium text-textSecondary"
								>Description</th
							>
							<th class="text-center py-2 px-2 font-medium text-textSecondary"
								>Stock</th
							>
							<th class="text-center py-2 px-2 font-medium text-textSecondary"
								>Quantity</th
							>
							<th class="text-center py-2 px-2 font-medium text-textSecondary"
								>Price</th
							>
							<th class="text-center py-2 px-2 font-medium text-textSecondary"
								>Action</th
							>
						</tr>
					</thead>
					<tbody class="divide-y divide-borderColor/20">
						{#each purchasableItems as item}
							{@const requires = purchasableEquipment.find((e) =>
								item.requires?.includes(e.name),
							)}
							{@const hasRequired =
								!requires ||
								$databaseStore.ownedEquipment.some(
									(e) => e.name === requires.name,
								)}
							{@const currentQuantity =
								$databaseStore.inventory.find((i) => i.name === item.name)
									?.quantity || 0}
							{@const canAfford = $databaseStore.cash >= item.cost}
							{@const canPurchase = canAfford && hasRequired}

							<tr
								class="hover:bg-mainBackground/30 transition-colors"
								data-nux-id={item.name.includes('Grounds') ? 'buy-grounds' : ''}
							>
								<td class="py-2 px-2 font-medium text-textPrimary"
									>{item.name}</td
								>
								<td class="py-2 px-2 text-textSecondary max-w-xs truncate"
									>{item.description}</td
								>
								<td class="py-2 px-2 text-center">
									{#if currentQuantity > 0}
										<span
											class="bg-accent/20 text-accent px-2 py-1 rounded text-xs"
											>📦 {currentQuantity}</span
										>
									{:else}
										<span class="text-textSecondary text-xs">-</span>
									{/if}
								</td>
								<td class="py-2 px-2 text-center">
									<span
										class="bg-success/20 text-success px-2 py-1 rounded text-xs"
										>+{item.quantity}</span
									>
								</td>
								<td class="py-2 px-2 text-center">
									<span
										class="font-bold {canAfford
											? 'text-success'
											: 'text-error'}">${item.cost}</span
									>
								</td>
								<td class="py-2 px-2 text-center">
									{#if !hasRequired && requires}
										<div class="text-warning text-xs">⚠️ {requires.name}</div>
									{:else if canPurchase}
										<button
											class="btn btn-xs bg-special hover:bg-special/80 text-textPrimary border-special/50 px-3 py-1"
											on:click={() => {
												const success = purchaseItem(
													item.name,
													item.quantity,
													item.cost,
													item.description,
												);
												if (!success) alert('Purchase failed');
											}}
										>
											Buy
										</button>
									{:else if !hasRequired}
										<div class="text-warning text-xs">Need equip</div>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<!-- Equipment Section -->
		<div>
			<div class="flex items-center gap-2 mb-3">
				<div class="text-lg">🔧</div>
				<h2 class="text-lg font-bold text-accent">Equipment</h2>
			</div>
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-borderColor/30">
							<th class="text-left py-2 px-2 font-medium text-textSecondary"
								>Equipment</th
							>
							<th class="text-center py-2 px-2 font-medium text-textSecondary"
								>Status</th
							>
							<th class="text-center py-2 px-2 font-medium text-textSecondary"
								>Price</th
							>
							<th class="text-center py-2 px-2 font-medium text-textSecondary"
								>Action</th
							>
							<th class="text-left py-2 px-2 font-medium text-textSecondary"
								>Available upgrades</th
							>
						</tr>
					</thead>
					<tbody class="divide-y divide-borderColor/20">
						{#each purchasableEquipment as item}
							{@const ownedItem = $databaseStore.ownedEquipment.find(
								(e) => e.name === item.name,
							)}
							{@const canAfford = $databaseStore.cash >= item.cost}

							<tr class="hover:bg-mainBackground/30 transition-colors">
								<td class="py-2 px-2 font-medium text-textPrimary"
									>{item.name}</td
								>
								<td class="py-2 px-2 text-center">
									{#if ownedItem}
										<span
											class="bg-success/20 text-success px-2 py-1 rounded text-xs"
											>✓ Owned</span
										>
									{:else}
										<span class="text-textSecondary text-xs">-</span>
									{/if}
								</td>
								<td class="py-2 px-2 text-center">
									<span
										class="font-bold {canAfford
											? 'text-success'
											: 'text-error'}">${item.cost}</span
									>
								</td>
								<td class="py-2 px-2 text-center">
									{#if !ownedItem}
										{#if canAfford}
											<button
												class="btn btn-xs bg-special hover:bg-special/80 text-textPrimary border-special/50 px-3 py-1"
												on:click={() => {
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
															upgrades: JSON.parse(
																JSON.stringify(item.upgrades),
															),
														},
													];
												}}
											>
												Buy
											</button>
										{/if}
									{/if}
								</td>
								<td class="py-2 px-2">
									{#if item.upgrades && item.upgrades.length > 0}
										<div class="space-y-1">
											{#each item.upgrades as upgrade, i}
												{@const upgradePurchased =
													ownedItem &&
													ownedItem.upgrades &&
													ownedItem.upgrades[i]?.purchased}
												{@const canAffordUpgrade =
													$databaseStore.cash >= upgrade.cost}

												<div
													class="flex items-center justify-between {ownedItem
														? 'bg-mainBackground/60 border border-info/30 rounded p-1.5'
														: 'opacity-40'} transition-opacity"
												>
													<div class="flex-1 min-w-0">
														<div
															class="text-xs {upgradePurchased
																? 'text-success'
																: ownedItem
																	? 'text-lightAccent'
																	: 'text-textSecondary'} truncate"
														>
															{upgrade.description}
														</div>
														{#if !upgradePurchased && ownedItem}
															<div
																class="text-xs {canAffordUpgrade
																	? 'text-success'
																	: 'text-error'}"
															>
																${upgrade.cost}
															</div>
														{/if}
													</div>

													{#if upgradePurchased}
														<span
															class="bg-success/20 text-success px-1.5 py-0.5 rounded text-xs"
															>✓</span
														>
													{:else if ownedItem}
														<button
															class="btn btn-xs {canAffordUpgrade
																? 'bg-info hover:bg-info/80 text-textPrimary border-info/50'
																: 'bg-borderColor/50 text-textSecondary cursor-not-allowed border-borderColor/30 opacity-50'} px-2 py-0.5 text-xs"
															on:click={() => {
																if (canAffordUpgrade && ownedItem) {
																	const equipment =
																		$databaseStore.ownedEquipment.find(
																			(e) => e.name === item.name,
																		);
																	if (equipment && equipment.upgrades) {
																		const upgrade = equipment.upgrades[i];
																		if (
																			!upgrade.purchased &&
																			$databaseStore.cash >= upgrade.cost
																		) {
																			$databaseStore.cash -= upgrade.cost;
																			$databaseStore.stats.expensesToday +=
																				upgrade.cost;
																			upgrade.purchased = true;
																			$databaseStore.ownedEquipment =
																				$databaseStore.ownedEquipment;
																		}
																	}
																}
															}}
														>
															{canAffordUpgrade ? 'Buy' : 'Buy'}
														</button>
													{:else}
														<span class="text-textSecondary text-xs opacity-60"
															>-</span
														>
													{/if}
												</div>
											{/each}
										</div>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</FullscreenModal>
