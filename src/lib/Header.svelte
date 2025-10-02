<script lang="ts">
	import { onMount } from 'svelte';
	import { start } from './loop';
	import {
		databaseStore,
		paused,
		showHiringModal,
		showShopModal,
		showMenuPage,
		showStaffDetailModal,
		selectedEmployee,
		gameSpeed,
		showPriceAdjustmentModal,
		selectedMenuItem,
	} from './store';
	import {
		searchForEmployee,
		purchaseItem,
		repairEquipment,
		hasManager,
		calculateNetProfitToday,
		calculateTotalWages,
	} from './utils';
	import {
		type ownedEquipmentItem,
		type employee,
		Trait,
	} from './objects/types';
	import { purchasableItems } from './objects/types';

	// Import modal components
	import HiringModal from './HiringModal.svelte';
	import ShopModal from './ShopModal.svelte';
	import MenuManagement from './MenuManagement.svelte';
	import StaffDetailModal from './StaffDetailModal.svelte';
	import PriceAdjustmentModal from './PriceAdjustmentModal.svelte';
	import Pill from './Pill.svelte';
	import { tutorial } from './tutorial';

	onMount(() => {
		start();
	});

	// Drag and drop functionality
	let draggedIndex: number | null = null;
	let draggedOverIndex: number | null = null;

	let helpMenuOpen = false;

	// Hover state for fire button
	let hoveredEmployeeIndex: number | null = null;

	function getHappinessEmoji(happiness: number, short: boolean = true): string {
		if (!happiness) return short ? '🙂' : '🙂 Fine';
		else if (happiness >= 1.2) return short ? '😍' : '😍 Happy';
		else if (happiness >= 1) return short ? '🙂' : '🙂 Fine';
		else if (happiness >= 0.8) return short ? '🫤' : '🫤 Iffy';
		else if (happiness >= 0.5) return short ? '😡' : '😡 Bad';
		else return short ? '🤬' : '🤬 Terrible';
	}

	function handleDragStart(e: DragEvent, index: number) {
		draggedIndex = index;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
		}
	}

	function handleDragOver(e: DragEvent, index: number) {
		e.preventDefault();
		draggedOverIndex = index;
	}

	function handleDragEnter(e: DragEvent, index: number) {
		e.preventDefault();
		draggedOverIndex = index;
	}

	function handleDrop(e: DragEvent, index: number) {
		e.preventDefault();
		if (draggedIndex !== null && draggedIndex !== index) {
			// Reorder staff in the database
			const staff = [...$databaseStore.staff];
			const [draggedEmployee] = staff.splice(draggedIndex, 1);
			staff.splice(index, 0, draggedEmployee);
			$databaseStore.staff = staff;
		}
		draggedIndex = null;
		draggedOverIndex = null;
	}

	function handleDragEnd() {
		draggedIndex = null;
		draggedOverIndex = null;
	}

	function getProficiencyMultiplier(
		proficiencyCount: number | undefined,
	): number {
		if (proficiencyCount === undefined) proficiencyCount = 0;
		const multiplier = Math.min(
			2.5,
			0.022 * Math.pow(proficiencyCount, 0.68) + 0.5,
		);
		// return it formatted to 2 decimal places
		return Math.round(multiplier * 100) / 100;
	}

	function getTotalDailyWages(): number {
		return $databaseStore.staff.reduce(
			(sum, employee) => sum + employee.dailyWage,
			0,
		);
	}

	function getInventoryLines(quantity: number): {
		count: number;
		color: string;
	} {
		if (quantity >= 250) return { count: 5, color: 'bg-textPrimary' };
		if (quantity >= 100) return { count: 4, color: 'bg-textPrimary' };
		if (quantity >= 50) return { count: 3, color: 'bg-textPrimary' };
		if (quantity >= 25) return { count: 2, color: 'bg-textPrimary' };
		if (quantity > 0 && quantity < 15)
			return { count: 1, color: 'bg-textPrimary' };
		return { count: 0, color: '' };
	}

	let netProfitToday = 0;
	let profitDelta = 0;

	function getDeltaBadgeClass(delta: number): string {
		if (delta > 0) return 'bg-success/20 text-success';
		if (delta < 0) return 'bg-error/20 text-error';
		return 'bg-borderColor/40 text-textSecondary';
	}

	$: {
		netProfitToday = calculateNetProfitToday($databaseStore);
		profitDelta = netProfitToday - $databaseStore.stats.profitYesterday;
	}

	function handleInventoryClick(itemName: string) {
		const purchasableItem = purchasableItems.find((p) => p.name === itemName);
		if (purchasableItem) {
			const success = purchaseItem(
				purchasableItem.name,
				purchasableItem.quantity,
				purchasableItem.cost,
				purchasableItem.description,
			);
			if (!success) {
				alert('You do not have enough money');
			}
		}
	}

	function handleEquipmentRepair(equipmentName: string) {
		const success = repairEquipment(equipmentName);
		if (!success) {
			alert('You do not have enough money');
		}
	}

	function handlePriceAdjustment(item: import('./objects/types').menuItem) {
		$selectedMenuItem = item;
		$showPriceAdjustmentModal = true;
		$paused = true;
	}
</script>

<div
	class="flex flex-row w-full {$paused
		? 'bg-error/40 text-textPrimary border-interactive'
		: 'bg-cardBackground/80 text-textPrimary'} px-6 py-6 h-fit'}"
>
	<!-- Game Controls & Stats Column (Left) -->
	<div class="flex flex-col w-64">
		<div class="flex flex-row items-center gap-2">
			<button
				class="btn btn-sm w-min pr-0 pl-0 {$paused
					? 'bg-yellow-300 translate-y-[-2px] rotate-12 duration-200 hover:bg-yellow-600'
					: 'bg-cardBackground/60 opacity-40 text-textSecondary hover:bg-cardBackground/80'} border-none"
				on:click={() => ($paused = !$paused)}
			>
				<kbd class="kbd m-0 min-w-0"
					><span class="font-bold underline">P</span>ause</kbd
				>
			</button>

			<button
				class="btn btn-sm px-3 duration-150 border-none transition-all {!$paused &&
				$gameSpeed === 200
					? 'bg-info/80 text-textPrimary hover:bg-info'
					: !$paused && $gameSpeed === 50
						? 'bg-red-500/80 text-textPrimary hover:bg-red-500 rounded-2xl'
						: 'bg-cardBackground/60 text-textSecondary hover:bg-cardBackground/80'} "
				on:click={() => {
					$paused = false;
					$gameSpeed = $gameSpeed === 200 ? 50 : 200;
				}}
			>
				{#if $gameSpeed === 200}
					<img src="/normal_speed.svg" alt="normal speed" class="w-4 h-4" />
				{:else}
					<img src="/fast_speed.svg" alt="fast speed" class="w-4 h-4" />
				{/if}
			</button>
		</div>
		<div class="flex items-center gap-2 mt-2">
			<span class="text-textSecondary">Day</span>
			<span class="font-medium"
				>{Math.floor($databaseStore.tick / 1000)} ({Math.floor(
					($databaseStore.tick % 1000) / 10,
				)}%)</span
			>
		</div>

		<!-- Stats Section -->
		<div class="flex flex-col mt-2" data-nux-id="stats">
			<div class="flex items-center gap-2">
				<span class="text-textSecondary">Cash</span>
				<span class="font-semibold">${$databaseStore.cash}</span>
			</div>
			<div class="flex items-center gap-2">
				<span class="text-textSecondary">Profit</span>
				<span class="text-sm">{netProfitToday}</span>
			</div>
			<div class="flex items-center gap-2">
				<span class="text-textSecondary">Popularity</span>
				<span class="font-medium">{Math.floor($databaseStore.popularity)}%</span
				>
				<span
					class={'text-xs px-1.5 rounded-md ' +
						getDeltaBadgeClass($databaseStore.stats.popularityChange || 0)}
				>
					{($databaseStore.stats.popularityChange || 0) > 0
						? `+${$databaseStore.stats.popularityChange}`
						: $databaseStore.stats.popularityChange || 0}
				</span>
			</div>
			<div class="flex flex-row items-center gap-2">
				<span class="text-textSecondary">Demand</span>
				<span class="font-medium">{Math.floor($databaseStore.totalDemand)}</span
				>
			</div>
			<div class="flex flex-row items-center gap-2">
				<span class="text-textSecondary">Vibe</span>
				<div class="flex items-center gap-0.5">
					{#each Array(Math.floor($databaseStore.vibe)) as _}
						<img
							src="/star.svg"
							alt="star"
							class="w-4 h-4 brightness-0 invert"
						/>
					{/each}
					{#if $databaseStore.vibe % 1 >= 0.5}
						<img
							src="/halfstar.svg"
							alt="half star"
							class="w-4 h-4 brightness-0 invert"
						/>
					{/if}
				</div>
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<kbd
					class="kbd kbd-xs w-fit bg-yellow-800 opacity-50 hover:opacity-100 text-white cursor-pointer"
					on:click={() => (helpMenuOpen = !helpMenuOpen)}
				>
					💡
				</kbd>
			</div>
		</div>
	</div>
	<div class="grid grid-cols-3 gap-8 w-full">
		<!-- Staff Column -->
		<div class="flex flex-col">
			<div class="flex flex-row gap-2">
				<span class="font-semibold pb-2 text-accent">Staff</span>
				<button
					class="btn btn-xs bg-info/80 text-textPrimary hover:bg-info border-info/50"
					data-nux-id="open-hiring"
					on:click={() => {
						$paused = true;
						$showHiringModal = true;
					}}
				>
					Hire
				</button>
			</div>
			<div class="pb-4 flex flex-col gap-1">
				{#each $databaseStore.staff as employee, index}
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<div
						class="flex flex-row gap-1 cursor-pointer duration-200 rounded {draggedOverIndex ===
						index
							? 'bg-info/30'
							: ''}"
						draggable="true"
						on:dragstart={(e) => handleDragStart(e, index)}
						on:dragover={(e) => handleDragOver(e, index)}
						on:dragenter={(e) => handleDragEnter(e, index)}
						on:drop={(e) => handleDrop(e, index)}
						on:dragend={handleDragEnd}
						on:mouseenter={() => (hoveredEmployeeIndex = index)}
						on:mouseleave={() => (hoveredEmployeeIndex = null)}
						on:click={() => {
							$selectedEmployee = employee;
							$paused = true;
							$showStaffDetailModal = true;
						}}
					>
						<div class="flex flex-row items-center gap-2 w-full">
							<div class="flex flex-row items-center w-full gap-1">
								<span class="text-xs"
									>{getHappinessEmoji(employee.happiness, true)}</span
								>
								<div class=" text-sm">{employee.name}</div>
							</div>
							<div
								class="text-xs bg-success/70 text-textPrimary px-1.5 rounded-md"
							>
								{employee.experience}xp
							</div>
						</div>
					</div>
				{/each}
			</div>
			{#if $databaseStore.managers.length > 0}
				<div class="flex flex-col gap-1">
					<span class="font-semibold text-accent">Managers</span>
					{#each $databaseStore.managers as manager, index}
						<div
							class="flex flex-row items-center justify-between gap-1 w-full"
						>
							<div
								class="flex flex-row items-center justify-between w-full gap-1"
							>
								<div class="flex flex-row items-center w-full gap-1">
									<span class="text-xs"
										>{getHappinessEmoji(manager.happiness, true)}</span
									>
									<span>{manager.name}</span>
								</div>
								<div
									class="text-xs bg-success/70 text-textPrimary px-1.5 rounded-md"
								>
									{manager.experience}xp
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Equipment Column (Center) -->
		<div class="flex flex-col">
			<div class="flex flex-row gap-2">
				<span class="font-semibold pb-2 text-accent">Equipment</span>
				<button
					class="btn btn-xs bg-info/80 text-textPrimary hover:bg-info border-info/50"
					on:click={() => {
						$paused = true;
						$showShopModal = true;
					}}
				>
					Shop
				</button>
			</div>
			{#each $databaseStore.ownedEquipment as equipment, index}
				<div class="flex flex-row items-center justify-between gap-1 w-full">
					<span class="overflow-hidden text-ellipsis whitespace-nowrap">
						{equipment.name}
					</span>
					<div
						class="flex flex-row items-center gap-1 relative group"
						title="Quality: {equipment.quality}%"
					>
						{#if equipment.quality >= 30}
							<div
								class="text-xs bg-success/70 text-textPrimary px-1.5 rounded-md"
							>
								Good
							</div>
						{:else}
							<Pill
								variant={equipment.quality > 0 ? 'error' : 'interactive'}
								normalContent={equipment.quality > 0 ? 'Poor' : 'Repair'}
								hoverContent="Repair (${Math.floor(equipment.cost / 8)})"
								onClick={() => handleEquipmentRepair(equipment.name)}
							/>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<!-- Inventory Column (Right) -->
		<div class="flex flex-col">
			<div class="flex flex-row gap-2">
				<span class="font-semibold pb-2 text-accent">Inventory</span>
				<button
					class="btn btn-xs bg-info/80 text-textPrimary hover:bg-info border-info/50"
					data-nux-id="open-shop"
					on:click={() => {
						$paused = true;
						$showShopModal = true;
					}}
				>
					Shop
				</button>
			</div>

			{#each $databaseStore.inventory as item, index}
				{@const purchasableItem = purchasableItems.find(
					(p) => p.name === item.name,
				)}
				<div class="flex flex-row items-center justify-between pb-1">
					<span>{item.name}</span>
					<Pill
						variant={item.quantity > 25 ? 'success' : 'warning'}
						normalContent={item.quantity.toString()}
						hoverContent={purchasableItem
							? `${item.quantity} +($${purchasableItem.cost})`
							: item.quantity.toString()}
						onClick={() => handleInventoryClick(item.name)}
					>
						<div slot="visual">
							{#if getInventoryLines(item.quantity).count > 0}
								<div class="flex flex-row gap-0.5 opacity-50">
									{#each Array(getInventoryLines(item.quantity).count) as _}
										<div
											class="w-0.5 h-3 {getInventoryLines(item.quantity).color}"
										></div>
									{/each}
								</div>
							{/if}
						</div>
					</Pill>
				</div>
			{/each}
		</div>
	</div>
</div>

{#if helpMenuOpen}
	<dialog id="help_modal" class="modal modal-open modal-middle">
		<div
			class="modal-box bg-modalBackground/70 backdrop-blur-md min-w-[50vw] text-textPrimary flex flex-col border-2 shadow-2xl"
		>
			<!-- Header -->
			<div class="flex flex-col justify-between mb-4 flex-shrink-0">
				<h3 class="text-2xl font-bold text-textPrimary flex items-center gap-2">
					💡 Info
				</h3>
				<p class="text-black bg-white rounded-lg p-4 text-center my-4">
					All of these stats greatly impact your business performance. Improve
					popularity & demand to get more customers, and improve vibe to make
					those customers happier.
					<br />
					<br />
					For example, if you have high popularity + high demand but low vibe, then
					you will get tons of customers, but they will expect the fastest orders
					ever as the café's environment is not very appealing.
					<br />
					<br />
					You can also choose to keep your shop niche with only a couple menu items
					and high popularity + vibe. This setup can be quite successful as fewer
					menu items are easier to manage.
					<br />
					<br />
					It's up to you!
				</p>
			</div>
			<div class="flex flex-row justify-end">
				<button
					class="btn btn-md bg-success/80 w-fit text-textPrimary hover:bg-success border-success/50"
					on:click={() => (helpMenuOpen = false)}
				>
					Got it!
				</button>
			</div>
		</div>
	</dialog>
{/if}

<!-- Modal Components -->
<HiringModal />
<ShopModal />
<MenuManagement />
<StaffDetailModal />
<PriceAdjustmentModal />

<style>
	.rainbow {
		animation: rainbow 1s ease-in-out infinite;
	}

	@keyframes rainbow {
	}
</style>
