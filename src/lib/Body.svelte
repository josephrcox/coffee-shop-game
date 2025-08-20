<script lang="ts">
	import {
		databaseStore,
		showEndOfDay,
		currentTip,
		endOfDayMessages,
		showQuestConfetti,
		paused,
		selectedEmployee,
	} from './store';
	import type { menuItem } from './objects/types';
	import { confetti } from '@neoconfetti/svelte';
	import { slide, fade, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	function groupItems(items: menuItem[]) {
		if (!items) return [];
		const grouped = new Map<string, { item: menuItem; quantity: number }>();
		for (const item of items) {
			if (grouped.has(item.name)) {
				grouped.get(item.name)!.quantity++;
			} else {
				grouped.set(item.name, { item, quantity: 1 });
			}
		}
		return Array.from(grouped.values());
	}
</script>

<!-- Orders content only -->
<div class="h-full bg-mainBackground text-textPrimary px-8 pt-4">
	<span
		class="text-[64px] text-accent font-semibold"
		data-nux-id="orders-header">Orders</span
	>

	<!-- svelte-ignore a11y-no-static-element-interactions -->
	{#if $currentTip}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div
			in:slide={{ duration: 500, easing: quintOut, axis: 'y' }}
			out:slide={{ duration: 300, easing: quintOut, axis: 'y' }}
			class="bg-error border border-warning/60 rounded-lg p-2 z-20 cursor-pointer backdrop-blur-sm w-fit mt-2 mb-4 fixed bottom-4 left-4"
			on:click={() => currentTip.set('')}
		>
			<p class="text-sm text-white">
				{$currentTip}
				<br />
				<span class="text-xs text-white underline"> Click to dismiss </span>
			</p>
		</div>
	{/if}

	{#each $databaseStore.orders
		.filter((order) => order.items && order.items.length > 0)
		.slice(0, 10) as order, index (order.id)}
		<div
			in:slide={{ duration: 400, easing: quintOut, delay: index * 100 }}
			out:slide={{ duration: 300, easing: quintOut }}
			class="flex flex-row gap-1 items-center p-3 pl-4 mb-4 w-fit pr-8 duration-200 border-l-2 backdrop-blur-sm shadow-lg"
		>
			{#if $databaseStore.staff.find((employee) => employee.currentOrder === order.id)?.name}
				<span class="text-textPrimary">{order.customer} wants</span>
				{#each groupItems(order.originalItems || order.items) as groupedItem, i}
					<span class="font-semibold text-interactive"
						>{groupedItem.quantity > 1 ? `${groupedItem.quantity}x` : ''}
						{groupedItem.item.name}{i <
						groupItems(order.originalItems || order.items).length - 1
							? ','
							: ''}</span
					>
				{/each}
			{:else}
				<span class="text-textPrimary">{order.customer} is in line. </span>
			{/if}

			{#if $databaseStore.staff.find((employee) => employee.currentOrder === order.id)?.name}
				<span
					in:fade={{ duration: 300, delay: 100 }}
					class="text-sm bg-success/70 text-textPrimary px-2 ml-2 rounded-md transition-all duration-200"
				>
					{$databaseStore.staff.find(
						(employee) => employee.currentOrder === order.id,
					)?.name}'s on it! ({order.completion.toFixed(0)}%)
					{#if (order.originalItems || order.items).length > 1}
						<span class="text-xs opacity-80"
							>(item {(order.originalItems || order.items).length -
								order.items.length +
								1} of {(order.originalItems || order.items).length})</span
						>
					{/if}
				</span>
			{/if}
		</div>
	{/each}

	{#if $databaseStore.orders.filter((order) => order.items && order.items.length > 0).length > 10}
		<div class="text-sm text-gray-500 mt-2 text-center">
			{$databaseStore.orders.filter(
				(order) => order.items && order.items.length > 0,
			).length - 10} more orders...
		</div>
	{/if}
</div>

<dialog id="endOfDayModal" class="modal {$showEndOfDay ? 'modal-open' : ''}">
	<div
		class="modal-box bg-cardBackground/95 text-textPrimary border-2 border-info/60 backdrop-blur-md"
	>
		<h3 class="text-lg text-accent font-semibold">New day!</h3>
		<div class="space-y-2">
			<p class="text-textPrimary">
				You made {Math.floor($databaseStore.stats.profitYesterday) > 0
					? `$${Math.floor($databaseStore.stats.profitYesterday)}`
					: `-$${Math.floor($databaseStore.stats.profitYesterday)}`}
				yesterday.
			</p>

			<!-- Popularity Change -->
			<p class="text-sm text-textPrimary">
				Popularity:
				<span class="font-medium text-lightAccent">
					{$databaseStore.stats.popularityChange > 0
						? `+${$databaseStore.stats.popularityChange}`
						: $databaseStore.stats.popularityChange}
				</span>
				({$databaseStore.popularity} total)
			</p>

			<!-- Orders Change -->
			<p class="text-sm text-textPrimary">
				Orders completed:
				<span class="font-medium text-interactive">
					{$databaseStore.stats.ordersChange > 0
						? `+${$databaseStore.stats.ordersChange}`
						: $databaseStore.stats.ordersChange}
				</span>
				({$databaseStore.stats.totalOrders} total)
			</p>
		</div>

		{#if $endOfDayMessages.length > 0}
			<div class="mt-4 p-3 bg-warning/20 rounded-lg border border-warning/40">
				<h4 class="font-bold text-warning">Staff Feedback:</h4>
				<ul class="list-disc list-inside text-textPrimary text-sm">
					{#each $endOfDayMessages as message}
						<li>{message}</li>
					{/each}
				</ul>
			</div>
		{/if}
		<div class="text-sm text-textPrimary">
			Some of your inventory has gone bad. You lost {Math.floor(
				$databaseStore.inventory.reduce((acc, item) => acc + item.quantity, 0) *
					0.1,
			)} items.
		</div>

		<div class="modal-action">
			<form method="dialog">
				<button
					class="btn bg-info/80 text-textPrimary hover:bg-info border-info/50"
					on:click={() => {
						showEndOfDay.set(false);
						endOfDayMessages.set([]);
					}}
				>
					Close
				</button>
			</form>
		</div>
	</div>
</dialog>
