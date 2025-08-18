<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		tutorial,
		TUTORIAL_STEPS,
		TUTORIAL_WELCOME_BODY,
		TUTORIAL_WELCOME_TITLE,
		TUTORIAL_FINAL_TITLE,
	} from './tutorial';
	import {
		databaseStore,
		showMenuPage,
		showShopModal,
		showDeveloperModal,
		showEndOfDay,
		showHiringModal,
		showStaffDetailModal,
		showPriceAdjustmentModal,
		showQuestConfetti,
		paused,
		playerName,
	} from './store';
	import { get } from 'svelte/store';
	import { Ingredient, MenuItem } from './objects/types';

	let rect: DOMRect | null = null;
	let tooltipX = 0;
	let tooltipY = 0;
	let tooltipEl: HTMLElement | null = null;
	let currentTargetId: string = '';
	let initialInventoryCount: number | null = null;
	let showWelcome = false;
	let welcomeShown = false;
	let playerNameInput = '';

	// Padded highlight rectangle
	let highlightLeft = 0;
	let highlightTop = 0;
	let highlightWidth = 0;
	let highlightHeight = 0;

	function findTargetForStep(step: number): string {
		const def = TUTORIAL_STEPS.find((s) => s.id === step);
		return def?.targetId || '';
	}

	function updateRect() {
		const element = currentTargetId
			? (document.querySelector(
					`[data-nux-id="${currentTargetId}"]`,
				) as HTMLElement | null)
			: null;
		rect = element ? element.getBoundingClientRect() : null;
		if (rect) {
			const margin = 24;
			const scrollX = window.scrollX;
			const scrollY = window.scrollY;
			const viewportWidth = window.innerWidth;
			const viewportHeight = window.innerHeight;

			// Compute padded highlight rectangle and clamp to viewport
			const highlightPadding = 16;
			const rawLeft = rect.left + scrollX - highlightPadding;
			const rawTop = rect.top + scrollY - highlightPadding;
			const rawWidth = rect.width + highlightPadding * 2;
			const rawHeight = rect.height + highlightPadding * 2;
			highlightLeft = Math.max(rawLeft, scrollX + 2);
			highlightTop = Math.max(rawTop, scrollY + 2);
			highlightWidth = Math.min(
				rawWidth - (highlightLeft - rawLeft),
				scrollX + viewportWidth - highlightLeft - 2,
			);
			highlightHeight = Math.min(
				rawHeight - (highlightTop - rawTop),
				scrollY + viewportHeight - highlightTop - 2,
			);

			const tooltipWidth = tooltipEl?.offsetWidth || 280;
			const tooltipHeight = tooltipEl?.offsetHeight || 140;

			// Candidate placements: right, left, below, above. Build individually to allow custom order per target
			const placeRight = () => ({
				x: rect!.right + scrollX + margin,
				y: Math.min(
					Math.max(rect!.top + scrollY, scrollY + margin),
					scrollY + viewportHeight - margin - tooltipHeight,
				),
				fits:
					rect!.right + tooltipWidth + margin <=
					scrollX + viewportWidth - margin,
			});
			const placeLeft = () => ({
				x: rect!.left + scrollX - margin - tooltipWidth,
				y: Math.min(
					Math.max(rect!.top + scrollY, scrollY + margin),
					scrollY + viewportHeight - margin - tooltipHeight,
				),
				fits: rect!.left - tooltipWidth - margin >= scrollX + margin,
			});
			const placeBelow = () => ({
				x: Math.min(
					Math.max(
						rect!.left + scrollX + (rect!.width - tooltipWidth) / 2,
						scrollX + margin,
					),
					scrollX + viewportWidth - margin - tooltipWidth,
				),
				y: rect!.bottom + scrollY + margin,
				fits:
					rect!.bottom + tooltipHeight + margin <=
					scrollY + viewportHeight - margin,
			});
			const placeAbove = () => ({
				x: Math.min(
					Math.max(
						rect!.left + scrollX + (rect!.width - tooltipWidth) / 2,
						scrollX + margin,
					),
					scrollX + viewportWidth - margin - tooltipWidth,
				),
				y: rect!.top + scrollY - margin - tooltipHeight,
				fits: rect!.top - tooltipHeight - margin >= scrollY + margin,
			});

			const placements =
				currentTargetId === 'orders-header'
					? [placeAbove, placeRight, placeLeft, placeBelow]
					: [placeRight, placeLeft, placeBelow, placeAbove];

			let placed = false;
			for (const place of placements) {
				const candidate = place();
				if (candidate.fits) {
					tooltipX = candidate.x;
					tooltipY = candidate.y;
					placed = true;
					break;
				}
			}

			if (!placed) {
				// Fallback: clamp to viewport on the right side.
				tooltipX = Math.min(
					Math.max(rect.left + scrollX + rect.width + margin, scrollX + margin),
					scrollX + viewportWidth - margin - tooltipWidth,
				);
				tooltipY = Math.min(
					Math.max(rect.top + scrollY, scrollY + margin),
					scrollY + viewportHeight - margin - tooltipHeight,
				);
			}
		}
	}

	function nextStep() {
		tutorial.update((t) => ({ ...t, step: t.step + 1 }));
	}

	function startTutorial() {
		if (playerNameInput.trim()) {
			playerName.set(playerNameInput.trim());
			showWelcome = false;
			nextStep();
		}
	}

	function closeAllModals(andUnpause: boolean = true) {
		try {
			showDeveloperModal.set(false);
			showEndOfDay.set(false);
			showQuestConfetti.set(false);
			showMenuPage.set(false);
			showHiringModal.set(false);
			showShopModal.set(false);
			showStaffDetailModal.set(false);
			showPriceAdjustmentModal.set(false);
			if (andUnpause) paused.set(false);
		} catch {}
	}

	let unsubscribes: Array<() => void> = [];

	onMount(() => {
		const unsubTutorial = tutorial.subscribe((t) => {
			currentTargetId = findTargetForStep(t.step);
			if (t.active && t.step === 0 && !welcomeShown) {
				showWelcome = true;
				welcomeShown = true;
			}
			if (t.active && t.step === 4 && initialInventoryCount === null) {
				const db = get(databaseStore);
				initialInventoryCount = db.inventory.reduce(
					(sum, i) => sum + (i?.quantity || 0),
					0,
				);
			}
			// Auto-unpause when reaching orders-list step
			if (t.active && t.step === 5) {
				paused.set(false);
			}
			updateRect();
			// Recalculate after DOM updates to account for tooltip dimensions
			setTimeout(updateRect, 0);
		});
		const unsubDb = databaseStore.subscribe((db) => {
			const t = get(tutorial);
			if (!t.active) return;
			// Step 2 completion: add any menu item
			if (t.step === 2) {
				if (Array.isArray(db.menu) && db.menu.length > 0) {
					nextStep();
					closeAllModals(true);
				}
			}
			// Step 4 completion: buy any ingredient (detect inventory count increase)
			if (t.step === 4) {
				const totalQty = db.inventory.reduce(
					(sum, i) => sum + (i?.quantity || 0),
					0,
				);
				if (
					initialInventoryCount !== null &&
					totalQty > initialInventoryCount
				) {
					nextStep();
					closeAllModals(false);
					initialInventoryCount = null;
				}
			}
			// Step 5: orders incoming
			if (t.step === 5) {
				if (db.orders.filter((order) => order.completion >= 100).length > 3) {
					nextStep();
					closeAllModals(true);
				}
			}
		});
		const unsubShop = showShopModal.subscribe((open) => {
			const t = get(tutorial);
			if (t.active && t.step === 3 && open) {
				nextStep();
			}
		});
		const unsubMenu = showMenuPage.subscribe((open) => {
			const t = get(tutorial);
			if (t.active && t.step === 1 && open) {
				nextStep();
			}
		});
		const unsubHiring = showHiringModal.subscribe((open) => {
			const t = get(tutorial);
			if (t.active && t.step === 7 && open) {
				nextStep();
			}
		});
		// If the page was refreshed mid-step, re-open any needed modal based on the step target
		// Only do this if we detect previously persisted UI state; after a full reset (no localStorage), don't auto-open
		const hadUiState = !!localStorage.getItem('the-grind-ui');
		const tNow = get(tutorial);
		if (hadUiState && tNow.active && !showWelcome) {
			if (tNow.step === 1) {
				paused.set(true);
				showMenuPage.set(true);
			}
			if (tNow.step === 3 || tNow.step === 4) {
				paused.set(true);
				showShopModal.set(true);
			}
			if (tNow.step === 7 || tNow.step === 8) {
				paused.set(true);
				showHiringModal.set(true);
			}
		}
		unsubscribes = [unsubTutorial, unsubDb, unsubShop, unsubMenu, unsubHiring];
		window.addEventListener('resize', updateRect);
		window.addEventListener('scroll', updateRect, { passive: true });
		updateRect();
	});

	onDestroy(() => {
		unsubscribes.forEach((u) => u());
		window.removeEventListener('resize', updateRect);
		window.removeEventListener('scroll', updateRect);
	});
</script>

{#if $tutorial.active}
	<div class="fixed inset-0 z-[1000] pointer-events-none">
		<!-- Dimmer -->
		<div class="absolute inset-0 bg-black/40"></div>

		{#if rect && !showWelcome}
			<!-- Highlight box -->
			<div
				class="absolute border-2 border-accent rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] pointer-events-none"
				style="left: {highlightLeft}px; top: {highlightTop}px; width: {highlightWidth}px; height: {highlightHeight}px;"
			/>
		{/if}

		<!-- Tooltip -->
		{#if $tutorial.step <= 8 && !showWelcome}
			<div
				class="absolute max-w-xs bg-cardBackground/95 text-textPrimary border border-info/60 rounded-lg p-3 shadow-2xl pointer-events-auto"
				style="left: {tooltipX}px; top: {tooltipY}px;"
				bind:this={tooltipEl}
			>
				<div class="text-sm space-y-2">
					<div class="whitespace-pre-line">
						{TUTORIAL_STEPS.find((s) => s.id === $tutorial.step)?.message}
					</div>
					{#if TUTORIAL_STEPS.find((s) => s.id === $tutorial.step)?.manual}
						<div class="text-right">
							<button
								class="btn btn-xs bg-info/80 text-textPrimary hover:bg-info border-info/50"
								on:click={() => {
									if ($tutorial.step === 8) {
										closeAllModals(true);
									}
									nextStep();
								}}
							>
								Next
							</button>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		{#if showWelcome}
			<div
				class="absolute inset-0 flex items-center justify-center pointer-events-auto"
			>
				<div
					class="bg-cardBackground/95 text-textPrimary border border-info/60 rounded-lg p-6 shadow-2xl text-center max-w-md"
				>
					<div class="text-2xl font-semibold mb-2">
						{TUTORIAL_WELCOME_TITLE}
					</div>
					<p class="text-sm text-textSecondary mb-4">{TUTORIAL_WELCOME_BODY}</p>

					<div class="flex-row flex gap-4 items-center justify-center">
						<div class="">
							<input
								id="player-name"
								type="text"
								autofocus
								bind:value={playerNameInput}
								placeholder="Your name"
								class="w-full px-3 py-2 bg-mainBackground border border-info/60 rounded-md text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-info/60 focus:border-transparent"
								on:keydown={(e) => {
									if (e.key === 'Enter' && playerNameInput.trim()) {
										startTutorial();
									}
								}}
							/>
						</div>

						<button
							class="btn {playerNameInput.trim()
								? 'btn hover:bg-interactive border-interactive/50 bg-interactive/80 text-white'
								: 'opacity-25 cursor-not-allowed '}  text-gray-800 disabled:cursor-not-allowed"
							on:click={startTutorial}
						>
							Start
						</button>
					</div>
				</div>
			</div>
		{/if}

		{#if $tutorial.step === 9}
			<div
				class="absolute inset-0 flex items-center justify-center pointer-events-auto"
			>
				<div
					class="bg-cardBackground/95 text-textPrimary border border-info/60 rounded-lg p-6 shadow-2xl text-center"
				>
					<div class="text-2xl mb-3">{TUTORIAL_FINAL_TITLE}</div>
					<button
						class="btn bg-success/80 text-textPrimary hover:bg-success border-success/50"
						on:click={() =>
							tutorial.set({ active: false, step: 10, completed: true })}
					>
						Finish
					</button>
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	/* no-op: styles handled by utility classes */
</style>
