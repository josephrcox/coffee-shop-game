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

	onMount(() => {
		start();
	});

	// Drag and drop functionality
	let draggedIndex: number | null = null;
	let draggedOverIndex: number | null = null;

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

	let profitWithWages = 0;

	$: {
		const staffWages = $databaseStore.staff.reduce(
			(sum, employee) => sum + employee.dailyWage,
			0,
		);
		const managerWages = $databaseStore.managers.reduce(
			(sum, manager) => sum + manager.dailyWage,
			0,
		);
		const totalWages = staffWages + managerWages;
		profitWithWages = $databaseStore.stats.profitToday - totalWages;
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
	class="grid grid-cols-5 gap-8 w-full {$paused
		? 'bg-error/40 text-textPrimary border-interactive'
		: 'bg-cardBackground/80 text-textPrimary'} px-8 py-4 h-fit shadow-2xl border-b-2 border-info/30"
>
	<div class="flex flex-col gap-2">
		<span class="text-accent font-medium"
			>Day: {Math.floor($databaseStore.tick / 1000)} ({Math.floor(
				($databaseStore.tick % 1000) / 10,
			)}%)</span
		>
		<!-- Speed Controls -->
		<div class="flex flex-row items-center gap-2">
			<button
				class="btn btn-xs {$paused
					? 'bg-error/80 text-textPrimary hover:bg-error/90	'
					: 'bg-cardBackground/60 text-textSecondary hover:bg-cardBackground/80'} border-none"
				on:click={() => ($paused = true)}
			>
				Paused
			</button>
			<button
				class="btn btn-xs {!$paused && $gameSpeed === 200
					? 'bg-success/80 text-textPrimary hover:bg-success/90'
					: 'bg-cardBackground/60 text-textSecondary hover:bg-cardBackground/80'} border-none"
				on:click={() => {
					$paused = false;
					$gameSpeed = 200;
				}}
			>
				Normal
			</button>
			<button
				class="btn btn-xs {!$paused && $gameSpeed === 50
					? 'bg-success/80 text-textPrimary hover:bg-success/90'
					: 'bg-cardBackground/60 text-textSecondary hover:bg-cardBackground/80'} border-none"
				on:click={() => {
					$paused = false;
					$gameSpeed = 50;
				}}
			>
				Fast
			</button>
		</div>
		<div class="flex flex-col">
			<div class="flex flex-row gap-2">
				<span>Cash: ${$databaseStore.cash}</span>
				<span class={profitWithWages > 0 ? 'text-success' : 'text-interactive'}>
					{profitWithWages > 0 ? '+' : ''}
					{profitWithWages}
				</span>
			</div>
			<span class="text-textSecondary"
				>Profit yesterday: {$databaseStore.stats.profitYesterday}</span
			>
		</div>
		<div class="flex flex-col">
			<span>Demand: {Math.floor($databaseStore.totalDemand)}</span>
			<span class="">Popularity: {Math.floor($databaseStore.popularity)}%</span>
		</div>

		<div class="flex flex-col">
			<span>Total orders: {$databaseStore.stats.totalOrders}</span>
			<span>Orders today: {$databaseStore.stats.ordersToday}</span>
			<span class="text-textSecondary"
				>Orders yesterday: {$databaseStore.stats.ordersYesterday}</span
			>
		</div>
	</div>
	<div class="flex flex-col">
		<div class="flex flex-row gap-2">
			<span class="font-semibold pb-2 text-accent">Staff</span>
			<button
				class="btn btn-xs bg-info/80 text-textPrimary hover:bg-info border-info/50"
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
					<div class="flex flex-row items-center justify-between gap-1 w-full">
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
	<div class="flex flex-col">
		<div class="flex flex-row gap-2">
			<span class="font-semibold pb-2 text-accent">Inventory</span>
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
	<div class="flex flex-col">
		<div class="flex flex-row gap-2">
			<span class="font-semibold pb-2 text-accent">Your Equipment</span>
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
	<div class="flex flex-col">
		<div class="flex flex-row gap-2">
			<span class="font-semibold pb-2 text-accent">Menu </span>
			<button
				class="btn btn-xs bg-info/80 text-textPrimary hover:bg-info border-info/50"
				on:click={() => {
					$showMenuPage = true;
					$paused = true;
				}}
			>
				Add Item
			</button>
		</div>
		<div class="flex flex-col gap-1">
			{#each $databaseStore.menu as item}
				<div class="flex flex-row items-center justify-between gap-1 w-full">
					<span>{item.name}</span>
					<Pill
						variant={'success'}
						normalContent={`$${item.price.toFixed(2)}`}
						hoverContent={'Adjust price'}
						disabled={!hasManager(Trait.FINANCIAL, $databaseStore)}
						onClick={() => handlePriceAdjustment(item)}
					/>
				</div>
			{/each}
		</div>
	</div>
</div>

<!-- Modal Components -->
<HiringModal />
<ShopModal />
<MenuManagement />
<StaffDetailModal />
<PriceAdjustmentModal />
