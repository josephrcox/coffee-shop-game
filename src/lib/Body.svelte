<script lang="ts">
	import {
		databaseStore,
		showEndOfDay,
		currentTip,
		endOfDayMessages,
		showQuestConfetti,
	} from './store';
	import type { menuItem } from './objects/types';
	import { confetti } from '@neoconfetti/svelte';

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

<div
	class="flex flex-col gap-4 p-8 bg-mainBackground text-textPrimary max-h-[65vh] overflow-y-clip"
>
	<div class="flex flex-row justify-between items-start">
		<span class="text-2xl text-accent font-semibold"
			>Orders <span class="text-xs text-textSecondary"
				>({$databaseStore.orders.filter((order) => order.items.length > 0)
					.length})</span
			></span
		>
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		{#if $currentTip}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<div
				class="bg-warning/30 border border-warning/60 rounded-lg p-2 cursor-pointer backdrop-blur-sm"
				on:click={() => currentTip.set('')}
			>
				<p class="text-sm text-warning">{$currentTip}</p>
			</div>
		{/if}
	</div>
	{#each $databaseStore.orders as order}
		{#if order.items && order.items.length > 0}
			<div
				class="flex flex-row gap-1 items-center bg-cardBackground/40 p-3 rounded-lg border-l-4 border-info/60 backdrop-blur-sm shadow-lg"
			>
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

				{#if $databaseStore.staff.find((employee) => employee.currentOrder === order.id)?.name}
					<span
						class="text-sm bg-success/70 text-textPrimary px-2 ml-2 rounded-md"
					>
						{$databaseStore.staff.find(
							(employee) => employee.currentOrder === order.id,
						)?.name} is on it! ({order.completion.toFixed(0)}%)
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
		{/if}
	{/each}
</div>

{#if $databaseStore.quests.find((quest) => quest.showingCompletion) || $databaseStore.quests.filter((quest) => !quest.completed).length > 0}
	<div class="flex flex-row gap-2 fixed bottom-8 right-8 z-50">
		<div
			class="bg-cardBackground/90 backdrop-blur-md rounded-lg p-4 shadow-2xl border border-info/60"
		>
			<!-- Show completed quest if one is being shown -->
			{#if $databaseStore.quests.find((quest) => quest.showingCompletion)}
				{@const completedQuest = $databaseStore.quests.find(
					(quest) => quest.showingCompletion,
				)}
				{#if completedQuest}
					<h3 class="text-lg font-bold text-success">Quest Completed!</h3>
					<div class="text-sm text-textPrimary flex flex-col">
						<span class="font-semibold text-success">{completedQuest.name}</span
						>
						{#if completedQuest.description}
							<span class="text-xs text-lightAccent"
								>{completedQuest.description}</span
							>
						{/if}
						<span class="text-xs text-accent mt-1">
							Reward: ${completedQuest.reward.cash} + {completedQuest.reward
								.popularity} popularity
						</span>
					</div>
				{/if}
			{:else}
				<h3 class="text-lg font-bold text-accent">Quests</h3>
				<!-- Show the next 5 quests that are not completed -->
				{#if $databaseStore.quests.filter((quest) => !quest.completed).length > 0}
					<div class="text-sm text-textPrimary flex flex-col gap-2">
						<ul class="list-disc list-inside">
							{#each $databaseStore.quests
								.filter((quest) => !quest.completed)
								.slice(0, 5) as quest}
								<li class="flex flex-row list-disc list-inside gap-2">
									<!-- dot -->
									<span class="text-interactive">•</span>
									<span class="text-interactive">{quest.name}</span>
									{#if quest.description}
										<span class="text-xs text-textSecondary"
											>{quest.description}</span
										>
									{/if}
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			{/if}
		</div>
	</div>
{/if}

{#if $showQuestConfetti}
	<div use:confetti={{ particleCount: 200, force: 0.3 }} />
{/if}

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
