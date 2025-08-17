<script lang="ts">
	import {
		databaseStore,
		showPriceAdjustmentModal,
		selectedMenuItem,
		paused,
	} from './store';
	import { updateMenuItemPrice, calculateIngredientCost } from './utils';

	let newPrice = 0;
	let isOpen = false;

	// Only set the price once when modal first opens
	$: if ($showPriceAdjustmentModal && !isOpen && $selectedMenuItem) {
		newPrice = $selectedMenuItem.price;
		isOpen = true;
	}

	// Reset when modal closes
	$: if (!$showPriceAdjustmentModal) {
		$paused = false;
		isOpen = false;
	}

	// Calculate ingredient cost for the selected menu item
	$: ingredientCost = $selectedMenuItem
		? calculateIngredientCost($selectedMenuItem)
		: 0;

	function handleSave() {
		$paused = false;
		if ($selectedMenuItem) {
			// Clean up the input
			if (newPrice == null || newPrice == undefined) {
				newPrice = 0.1;
			}

			// Convert to number and handle decimal places
			let finalPrice = parseFloat(newPrice.toString());

			// If invalid number, default to minimum
			if (isNaN(finalPrice)) {
				finalPrice = 0.1;
			}

			// Ensure minimum price of $0.10
			finalPrice = Math.max(0.1, finalPrice);

			// Round up to nearest cent (0.01)
			finalPrice = Math.ceil(finalPrice * 100) / 100;

			updateMenuItemPrice($selectedMenuItem.name, finalPrice);
			showPriceAdjustmentModal.set(false);
		}
	}

	function handleCancel() {
		showPriceAdjustmentModal.set(false);
	}
</script>

<dialog
	id="price_adjustment_modal"
	class="modal {$showPriceAdjustmentModal ? 'modal-open' : ''}"
>
	<div
		class="modal-box bg-modalBackground/95 backdrop-blur-md text-textPrimary min-w-[30vw] max-w-[40vw] flex flex-col border-2 border-info/60 shadow-2xl"
	>
		<!-- Header -->
		<div class="flex items-center justify-between mb-6 flex-shrink-0">
			<h3 class="text-2xl font-bold text-accent flex items-center gap-2">
				💰 Adjust Price
			</h3>
			<button
				class="btn btn-sm btn-circle btn-ghost text-textSecondary hover:text-textPrimary"
				on:click={handleCancel}
			>
				✕
			</button>
		</div>

		{#if $selectedMenuItem}
			<!-- Content -->
			<div class="flex flex-col gap-4">
				<div class="flex flex-col gap-2">
					<h4 class="text-lg font-semibold text-accent">
						{$selectedMenuItem.name}
					</h4>
					<div class="text-sm text-textSecondary">
						Market Price: <span class="text-interactive font-medium"
							>${$selectedMenuItem.marketPrice.toFixed(2)}</span
						>
					</div>
					<div class="text-sm text-textSecondary">
						Current Price: <span class="text-success font-medium"
							>${$selectedMenuItem.price.toFixed(2)}</span
						>
					</div>
					<div class="text-sm text-textSecondary">
						Ingredient Cost: <span class="text-warning font-medium"
							>~${ingredientCost.toFixed(2)} per serving</span
						>
					</div>
				</div>

				<div class="form-control">
					<!-- svelte-ignore a11y-label-has-associated-control -->
					<label class="label">
						<span class="label-text text-textPrimary">New Price ($)</span>
					</label>
					<input
						type="number"
						min="0.10"
						step="0.01"
						class="input text-2xl bg-cardBackground/60 text-textPrimary h-16 rounded-md"
						bind:value={newPrice}
						placeholder="Enter new price"
					/>
				</div>
			</div>

			<!-- Footer -->
			<div class="modal-action">
				<button
					class="btn bg-cardBackground/60 text-textSecondary hover:bg-cardBackground/80 border-none"
					on:click={handleCancel}
				>
					Cancel
				</button>
				<button
					class="btn bg-success/80 text-textPrimary hover:bg-success border-none"
					on:click={handleSave}
					disabled={newPrice < 0.1}
				>
					Update
				</button>
			</div>
		{/if}
	</div>
</dialog>

<style>
	/* Chrome, Safari, Edge, Opera */
	input::-webkit-outer-spin-button,
	input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	/* Firefox */
	input[type='number'] {
		-moz-appearance: textfield;
		appearance: textfield;
	}
</style>
