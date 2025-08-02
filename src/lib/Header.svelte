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
	} from './store';
	import { searchForEmployee, purchaseItem, repairEquipment } from './utils';
	import type { ownedEquipmentItem, employee } from './objects/types';
	import { purchasableItems } from './objects/types';

	// Import modal components
	import HiringModal from './HiringModal.svelte';
	import ShopModal from './ShopModal.svelte';
	import MenuManagement from './MenuManagement.svelte';
	import StaffDetailModal from './StaffDetailModal.svelte';

	onMount(() => {
		start();
	});

	// Drag and drop functionality
	let draggedIndex: number | null = null;
	let draggedOverIndex: number | null = null;

	// Hover state for fire button
	let hoveredEmployeeIndex: number | null = null;

	// Hover state for inventory items
	let hoveredInventoryIndex: number | null = null;

	// Hover state for equipment items
	let hoveredEquipmentIndex: number | null = null;

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
		const totalWages = $databaseStore.staff.reduce(
			(sum, employee) => sum + employee.dailyWage,
			0,
		);
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
</script>

<div
	class="grid grid-cols-5 gap-8 w-full {$paused
		? 'bg-success/40 text-textPrimary border-interactive'
		: 'bg-cardBackground/80 text-textPrimary'} px-8 py-4 rounded-b-2xl h-fit shadow-2xl border-b-2 border-info/30"
>
	<div class="flex flex-col gap-2">
		<span class="text-accent font-medium"
			>Day: {Math.floor($databaseStore.tick / 1000)} ({Math.floor(
				($databaseStore.tick % 1000) / 10,
			)}%)</span
		>
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
					$showHiringModal = true;
				}}
			>
				Hire
			</button>
		</div>
		{#each $databaseStore.staff as employee, index}
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<div
				class="flex flex-row gap-1 cursor-pointer duration-200 hover:bg-interactive/20 p-1 rounded {draggedOverIndex ===
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
					<div class="text-xs bg-success/70 text-textPrimary px-1.5 rounded-md">
						{employee.experience}xp
					</div>
				</div>
			</div>
		{/each}
	</div>
	<div class="flex flex-col">
		<div class="flex flex-row gap-2">
			<span class="font-semibold pb-2 text-accent">Inventory</span>
			<button
				class="btn btn-xs bg-info/80 text-textPrimary hover:bg-info border-info/50"
				on:click={() => {
					$showShopModal = true;
				}}
			>
				Shop
			</button>
		</div>

		{#each $databaseStore.inventory as item, index}
			<div class="flex flex-row items-center justify-between pb-1">
				<span>{item.name}</span>
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-mouse-events-have-key-events -->
				<div
					class="text-xs text-textPrimary px-1.5 rounded-md flex flex-row h-full items-center gap-1 cursor-pointer transition-all duration-200 {item.quantity >
					25
						? 'bg-success/70 hover:bg-success/90'
						: 'bg-warning/70 hover:bg-warning/90'}"
					on:mouseenter={() => (hoveredInventoryIndex = index)}
					on:mouseleave={() => (hoveredInventoryIndex = null)}
					on:click={() => handleInventoryClick(item.name)}
				>
					<!-- Inventory level lines -->
					<!-- Stock count -->
					{#if hoveredInventoryIndex === index}
						{@const purchasableItem = purchasableItems.find(
							(p) => p.name === item.name,
						)}
						{#if purchasableItem}
							<span>
								{item.quantity} +(${purchasableItem.cost})
							</span>
						{:else}
							<span>
								{item.quantity}
							</span>
						{/if}
					{:else}
						<span>
							{item.quantity}
						</span>
						{#if getInventoryLines(item.quantity).count > 0}
							<div class="flex flex-row gap-0.5 opacity-50">
								{#each Array(getInventoryLines(item.quantity).count) as _}
									<div
										class="w-0.5 h-3 {getInventoryLines(item.quantity).color}"
									></div>
								{/each}
							</div>
						{/if}
					{/if}
				</div>
			</div>
		{/each}
	</div>
	<div class="flex flex-col">
		<div class="flex flex-row gap-2">
			<span class="font-semibold pb-2 text-accent">Your Equipment</span>
			<button
				class="btn btn-xs bg-info/80 text-textPrimary hover:bg-info border-info/50"
				on:click={() => {
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
						<!-- svelte-ignore a11y-no-static-element-interactions -->
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<!-- svelte-ignore a11y-mouse-events-have-key-events -->
						<div
							class="text-xs text-textPrimary px-1.5 rounded-md flex flex-row h-full items-center gap-1 cursor-pointer transition-all duration-200 {equipment.quality >
							0
								? 'bg-error/70 hover:bg-error/90'
								: 'bg-interactive/70 hover:bg-interactive/90'}"
							on:mouseenter={() => (hoveredEquipmentIndex = index)}
							on:mouseleave={() => (hoveredEquipmentIndex = null)}
							on:click={() => handleEquipmentRepair(equipment.name)}
						>
							{#if hoveredEquipmentIndex === index}
								<span class="overflow-hidden text-ellipsis whitespace-nowrap">
									Repair (${Math.floor(equipment.cost / 8)})
								</span>
							{:else}
								<span class={equipment.quality > 0 ? '' : ''}>
									{equipment.quality > 0 ? 'Poor' : 'Repair'}
								</span>
							{/if}
						</div>
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
		{#each $databaseStore.menu as item}
			<div class="flex flex-row items-center justify-between gap-1 w-full">
				<span>{item.name}</span>
				<div class="text-xs bg-info/70 text-textPrimary px-1.5 rounded-md">
					${item.price}
				</div>
			</div>
		{/each}
	</div>
</div>

<!-- Modal Components -->
<HiringModal />
<ShopModal />
<MenuManagement />
<StaffDetailModal />
