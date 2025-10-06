<script lang="ts">
	import { databaseStore, paused } from './store';
	import {
		formatTickAsTime,
		getCashDisplay,
		getProfitDisplay,
		getOrdersDisplay,
		getPopularityDisplay,
		formatSignedDelta,
	} from './utils';

	$: cashDisplay = getCashDisplay($databaseStore);
	$: profitDisplay = getProfitDisplay($databaseStore);
	$: ordersDisplay = getOrdersDisplay($databaseStore);
	$: popularityDisplay = getPopularityDisplay($databaseStore);
</script>

<div class="flex flex-col text-sm gap-1.5">
	<div
		class="text-textPrimary mt-2 text-2xl text-center flex flex-row items-center justify-center"
	>
		{#if $databaseStore.tick === 1000}
			<span>Your first day!</span>
		{:else if $databaseStore.tick % 1000 === 0}
			<span
				class="italic font-bold underline underline-offset-2 transition-all duration-100 animate-pulse"
				>End of Day {Math.floor($databaseStore.tick / 1000) - 1}</span
			>
		{:else}
			<span class="w-1/2">
				Day {Math.floor($databaseStore.tick / 1000)}
			</span>

			<span class="w-1/2">
				{formatTickAsTime($databaseStore.tick)}
			</span>
		{/if}
	</div>
	{#if $databaseStore.tick % 1000 === 0}
		<button
			class="btn btn-secondary btn-sm text-center"
			on:click={() => {
				$databaseStore.tick += 1;
				$paused = false;
			}}>Open Café (6am - 6pm)</button
		>
	{/if}
	<div class="text-textPrimary pt-2">
		Cash: ${cashDisplay.value}
		<span class="opacity-80">({formatSignedDelta(cashDisplay.delta)})</span>
	</div>
	<div class="text-textPrimary">
		Profit: ${profitDisplay.value}
		<span class="opacity-80">({formatSignedDelta(profitDisplay.delta)})</span>
	</div>
	<div class="text-textPrimary">
		Orders: {ordersDisplay.value}
		<span class="opacity-80">({formatSignedDelta(ordersDisplay.delta)})</span>
	</div>
	<div class="text-textPrimary">
		Popularity: {popularityDisplay.value}%
		<span class="opacity-80"
			>({formatSignedDelta(popularityDisplay.delta)}%)</span
		>
	</div>
	<div class="flex-row flex items-center justify-between">
		<div class="text-textPrimary">
			Demand: {Math.floor($databaseStore.totalDemand)}
		</div>
		<div class="flex flex-row items-center gap-1 text-textPrimary">
			Vibe:
			{#each Array(Math.floor($databaseStore.vibe)) as _}
				<img src="/star.svg" alt="star" class="w-4 h-4 brightness-0 invert" />
			{/each}
			{#if $databaseStore.vibe % 1 >= 0.5}
				<img
					src="/halfstar.svg"
					alt="half star"
					class="w-4 h-4 brightness-0 invert"
				/>
			{/if}
		</div>
	</div>
</div>
