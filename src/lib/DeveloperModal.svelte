<script lang="ts">
	import {
		databaseStore,
		showDeveloperModal,
		paused,
		DEFAULT_DB,
	} from './store';
	import { startGame } from './utils';

	let jsonText = '';
	let parseError = '';
	let isInitialized = false;

	// Auto-pause the game when modal opens and restore JSON (only once)
	$: if ($showDeveloperModal && !isInitialized) {
		paused.set(true);
		jsonText = JSON.stringify($databaseStore, null, 2);
		parseError = '';
		isInitialized = true;
	}

	// Reset when modal closes
	$: if (!$showDeveloperModal) {
		isInitialized = false;
	}

	function saveChanges() {
		try {
			const parsedData = JSON.parse(jsonText);
			// Update the store with the new data
			databaseStore.set(parsedData);
			parseError = '';
			alert('Database updated successfully!');
		} catch (e) {
			parseError = `Invalid JSON: ${e instanceof Error ? e.message : 'Unknown error'}`;
		}
	}

	function resetGame() {
		if (
			confirm(
				'Are you sure you want to reset the game? This will clear all progress.',
			)
		) {
			// Reset to DEFAULT_DB and properly initialize the game
			let freshGame = { ...DEFAULT_DB };
			freshGame = startGame(freshGame);
			databaseStore.set(freshGame);

			// Unpause the game and close the modal
			paused.set(false);
			showDeveloperModal.set(false);
			alert('Game reset successfully!');
		}
	}

	function closeModal() {
		showDeveloperModal.set(false);
		// Optionally resume the game when closing
		// paused.set(false);
	}
</script>

<dialog
	id="developer_modal"
	class="modal {$showDeveloperModal ? 'modal-open' : ''}"
>
	<div
		class="modal-box bg-modalBackground/95 backdrop-blur-md text-textPrimary min-w-[80vw] max-w-[80vw] h-[85vh] flex flex-col border-2 border-warning/60 shadow-2xl"
	>
		<!-- Header -->
		<div class="flex items-center justify-between mb-4 flex-shrink-0">
			<h3 class="text-2xl font-bold text-warning flex items-center gap-2">
				🛠️ Developer Console
			</h3>
			<div class="text-right">
				<div class="text-sm text-textSecondary">Game Status</div>
				<div class="text-xl font-bold text-error">⏸️ PAUSED</div>
			</div>
		</div>

		<!-- Error display -->
		{#if parseError}
			<div
				class="bg-error/20 border border-error/40 rounded p-3 mb-4 text-error"
			>
				<strong>Parse Error:</strong>
				{parseError}
			</div>
		{/if}

		<!-- JSON Editor -->
		<div class="flex-1 overflow-hidden flex flex-col">
			<label
				class="text-sm font-semibold text-lightAccent mb-2"
				for="json-editor"
			>
				Database JSON (edit carefully):
			</label>
			<textarea
				id="json-editor"
				bind:value={jsonText}
				class="flex-1 w-full p-4 bg-cardBackground/60 border border-borderColor/50 rounded-lg font-mono text-sm text-textPrimary resize-none focus:border-interactive/70 focus:outline-none"
				placeholder="Loading..."
			></textarea>
		</div>

		<!-- Footer buttons -->
		<div
			class="modal-action pt-4 border-t border-warning/50 flex-shrink-0 gap-2"
		>
			<!-- button to clear local storage and refresh the page -->
			<button
				class="btn bg-error/80 hover:bg-error text-white border-error/50"
				on:click={() => {
					localStorage.clear();
					location.reload();
				}}
			>
				🗑️ Clear Local Storage
			</button>
			<button
				class="btn bg-error/80 hover:bg-error text-white border-error/50"
				on:click={resetGame}
			>
				🗑️ Reset Game
			</button>

			<button
				class="btn bg-success/80 hover:bg-success text-white border-success/50"
				on:click={saveChanges}
				disabled={parseError !== ''}
			>
				💾 Save Changes
			</button>

			<button
				class="btn bg-interactive/80 hover:bg-interactive text-white border-interactive/50"
				on:click={closeModal}
			>
				❌ Close
			</button>
		</div>
	</div>
</dialog>
