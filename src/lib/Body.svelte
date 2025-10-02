<script lang="ts">
	import {
		databaseStore,
		showEndOfDay,
		currentTip,
		endOfDayMessages,
		showQuestConfetti,
		paused,
		currentView,
		selectedEmployee,
	} from './store';
	import type { menuItem } from './objects/types';
	import { confetti } from '@neoconfetti/svelte';
	import { slide, fade, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	// View state moved to store: currentView

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

<!-- Main content with navigation -->
<div
	class="h-full bg-mainBackground text-textPrimary px-6 pt-1 flex flex-col"
	data-nux-id="orders-header"
>
	<!-- Navigation tabs -->
	<div class="flex items-center gap-8 mb-6 flex-shrink-0">
		<button
			class="text-[64px] font-semibold transition-colors duration-200 {$currentView ===
			'orders'
				? 'text-accent'
				: 'text-textSecondary/50 hover:text-textSecondary'}"
			on:click={() => currentView.set('orders')}
		>
			Orders
		</button>
		<button
			class="text-[64px] font-semibold transition-colors duration-200 {$currentView ===
			'cafe'
				? 'text-accent'
				: 'text-textSecondary/50 hover:text-textSecondary'}"
			on:click={() => currentView.set('cafe')}
		>
			Café
		</button>
	</div>

	<!-- Content area -->
	<div class="flex-1 overflow-y-auto min-h-0">
		{#if $currentView === 'orders'}
			<!-- Orders View -->
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			{#if $currentTip}
				<div
					in:slide={{ duration: 500, easing: quintOut, axis: 'y' }}
					out:slide={{ duration: 300, easing: quintOut, axis: 'y' }}
					class="bg-error border border-warning/60 rounded-lg p-2 z-20 backdrop-blur-sm w-fit mt-2 mb-4 fixed bottom-4 left-4"
				>
					<p class="text-sm text-white">
						{$currentTip}
					</p>
				</div>
			{/if}

			{#each $databaseStore.orders
				.filter((order) => order.items && order.items.length > 0)
				.slice(0, 10) as order, index (order.id)}
				<div
					in:slide={{ duration: 400, easing: quintOut, delay: index * 100 }}
					out:slide={{ duration: 300, easing: quintOut }}
					class="flex text-lg flex-row gap-1 items-center p-3 pl-4 mb-4 w-fit pr-8 duration-200 border-l-2 backdrop-blur-sm shadow-lg"
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
		{:else if $currentView === 'cafe'}
			<!-- Café Customization View -->
			<div class="max-w-4xl pb-8" data-nux-id="cafe-settings">
				{#if $databaseStore.cafeSettings && $databaseStore.cafeSettings.length > 0}
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
						{#each $databaseStore.cafeSettings as setting, idx}
							{@const current = setting.levels[setting.level]}
							{@const next = setting.levels[setting.level + 1]}
							{@const affordable = next
								? $databaseStore.cash >= next.cost
								: false}
							<div
								class="bg-cardBackground/40 border border-info/20 rounded-lg p-4 backdrop-blur-sm"
							>
								<div
									class="flex flex-row items-center justify-between gap-2 mb-3"
								>
									<span class="text-lg font-semibold text-accent"
										>{setting.name}</span
									>
									<div class="flex gap-2">
										<!-- Downgrade button for monthly cost settings -->
										{#if setting.level > 0 && current && current.weeklyCost !== undefined && current.weeklyCost > 0}
											<div
												class="tooltip tooltip-bottom"
												data-tip="Downgrade to previous level"
											>
												<button
													class="btn btn-xs bg-warning/70 hover:bg-warning text-textPrimary border-warning/50"
													on:click={() => {
														const prevLevel = setting.levels[setting.level - 1];
														if (prevLevel) {
															// Adjust vibe back (divide by current effect)
															$databaseStore.vibe /= current.vibeEffect || 1;
															// Apply previous level's effect
															if (prevLevel.vibeEffect > 0) {
																$databaseStore.vibe *= prevLevel.vibeEffect;
															}
															setting.level--;
														}
													}}
												>
													↓
												</button>
											</div>
										{/if}

										<!-- Upgrade button -->
										<div
											class="tooltip tooltip-bottom"
											data-tip={next
												? `${next.description}`
												: 'Max level reached'}
										>
											<button
												class={`btn btn-xs ${next && (next.cost === 0 || affordable) ? 'bg-success/70 hover:bg-success text-textPrimary border-success/50' : 'bg-borderColor/30 text-error border-borderColor/40 cursor-not-allowed hover:bg-borderColor/30'}`}
												on:click={() => {
													if (next && (next.cost === 0 || affordable)) {
														$databaseStore.cash -= next.cost;
														$databaseStore.stats.expensesToday += next.cost;
														if (next.vibeEffect > 0) {
															$databaseStore.vibe *= next.vibeEffect;
														}
														setting.level++;
													}
												}}
											>
												{#if next}
													{#if next.weeklyCost && next.weeklyCost > 0}
														${next.weeklyCost}/wk
													{:else}
														Upgrade ${next.cost}
													{/if}
												{:else}
													Max
												{/if}
											</button>
										</div>
									</div>
								</div>
								<div class="text-sm text-textPrimary mb-2">
									{current.description}
								</div>
								{#if current.weeklyCost && current.weeklyCost > 0}
									<div class="text-xs text-warning">
										Weekly cost: ${current.weeklyCost}/wk
									</div>
								{/if}
								<!-- Level indicator -->
								<div class="flex items-center gap-1 mt-3">
									{#each setting.levels as level, levelIdx}
										<div
											class="w-3 h-3 rounded-full border-2 {levelIdx <=
											setting.level
												? 'bg-accent border-accent'
												: 'border-textSecondary/30'}"
										></div>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>
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
