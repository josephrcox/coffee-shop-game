<script lang="ts">
	import Body from './lib/Body.svelte';
	import Header from './lib/Header.svelte';
	import DeveloperModal from './lib/DeveloperModal.svelte';
	import Chalkboard from './lib/Chalkboard.svelte';
	import StatsSection from './lib/StatsSection.svelte';
	import {
		paused,
		showDeveloperModal,
		showEndOfDay,
		showHiringModal,
		showMenuPage,
		showPriceAdjustmentModal,
		showQuestConfetti,
		showShopModal,
		showStaffDetailModal,
		initializeBackgroundMusic,
		prepareClickSfxPool,
		playClickSfx,
		resumeAudioContext,
		databaseStore,
		selectedMenuItem,
		isInMenu,
	} from './lib/store';
	import { hasManager, calculateNetProfitToday } from './lib/utils';
	import {
		Equipment,
		purchasableEquipment,
		Trait,
		type menuItem,
	} from './lib/objects/types';
	import Pill from './lib/Pill.svelte';
	import TutorialOverlay from './lib/TutorialOverlay.svelte';

	function handlePriceAdjustment(item: menuItem) {
		$selectedMenuItem = item;
		$showPriceAdjustmentModal = true;
		$paused = true;
	}

	// Custom cursor functionality
	let cursorX = 0;
	let cursorY = 0;
	let isCustomCursorActive = false; // Start as active
	let isPointerMode = false;

	// Initialize background music when component mounts
	import { onMount } from 'svelte';
	import { confetti } from '@neoconfetti/svelte';
	import ShopModal from './lib/ShopModal.svelte';
	import MenuManagement from './lib/MenuManagement.svelte';
	import { start } from './lib/loop';
	onMount(() => {
		initializeBackgroundMusic();
		start();

		// Prepare low-latency click buffer and resume context on first pointer
		prepareClickSfxPool();
		const handlePointerDownOnce = () => resumeAudioContext();
		document.addEventListener('pointerdown', handlePointerDownOnce, {
			once: true,
		});

		// Play click on any pointerdown for instant response
		const handlePointerDown = () => {
			if (isPointerMode) {
				playClickSfx();
			}
		};
		document.addEventListener('pointerdown', handlePointerDown);

		// Custom cursor mouse tracking
		const handleMouseMove = (e: MouseEvent) => {
			cursorX = e.clientX;
			cursorY = e.clientY;

			// Only check pointer mode occasionally to reduce overhead
			if (e.movementX !== 0 || e.movementY !== 0) {
				const target = e.target as HTMLElement;
				const computedStyle = window.getComputedStyle(target);
				const newPointerMode =
					computedStyle.cursor === 'pointer' ||
					target.tagName === 'BUTTON' ||
					target.tagName === 'A' ||
					target.closest('button') !== null ||
					target.closest('a') !== null;

				// Only update if state actually changed
				if (newPointerMode !== isPointerMode) {
					isPointerMode = newPointerMode;
				}
			}
		};

		// Activate custom cursor immediately
		// document.body.classList.add('custom-cursor-active');

		document.addEventListener('mousemove', handleMouseMove);

		// Global keyboard shortcuts - use window to capture all events regardless of focus
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === '\\') {
				e.preventDefault();
				showDeveloperModal.set(true);
			} else if (e.key === 'p' || e.key === 'P') {
				if ($databaseStore.tick > 0) {
					return;
				}
				e.preventDefault();
				paused.set(!$paused);
			} else if (e.key === 'Escape') {
				e.preventDefault();
				// Close all modal stores.
				showDeveloperModal.set(false);
				showEndOfDay.set(false);
				showQuestConfetti.set(false);
				showMenuPage.set(false);
				showHiringModal.set(false);
				showShopModal.set(false);
				showStaffDetailModal.set(false);
				showPriceAdjustmentModal.set(false);
				paused.set(false);
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('pointerdown', handlePointerDown);
			document.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('keydown', handleKeyDown);
			document.body.classList.remove('custom-cursor-active');
		};
	});

	$: hasEspressoMachine = $databaseStore.ownedEquipment.some(
		(e) => e.name === Equipment.ESPRESSO_MACHINE,
	);
	$: hasGrinder = $databaseStore.ownedEquipment.some(
		(e) => e.name === Equipment.COFFEE_GRINDER,
	);
	let hoveringOn: 'grinder' | 'espresso' | null = null;
</script>

<DeveloperModal />
<ShopModal />
<MenuManagement />
<div
	class="flex flex-row items-center text-textPrimary absolute w-screen h-screen overflow-hidden justify-center"
>
	<div class="relative">
		<img src="/background.png" alt="bg" class="max-h-[95vh] border-2" />
		<!-- Overlay elements can be placed here with absolute positioning -->
		<div
			class="absolute top-[10%] left-[18%] w-[75%] h-[36%] overflow-scroll z-20"
		>
			<Chalkboard />
		</div>
		<!-- show cash in the bottom right -->
		{#if $databaseStore.staff.length > 0}
			<div
				class="absolute bottom-0 pb-4 left-[37%] flex flex-col gap-6 w-[24%]"
			>
				<StatsSection />
			</div>
		{/if}
		<div
			class="transition-opacity duration-800 {$isInMenu
				? 'opacity-5 z-10'
				: 'opacity-100'}"
		>
			<img
				src="/drip.gif"
				class="absolute top-[40.5%] right-[17%] w-[13%]"
				alt=""
			/>
			<img
				src="/kettle.png"
				class="absolute top-[47%] left-[25%] w-[8%]"
				alt=""
			/>
			<img
				src="/sink.gif"
				class="absolute top-[40.5%] left-[35%] w-[13%]"
				alt=""
			/>
			<img
				src="/plant1.png"
				class="absolute bottom-[0.5%] right-[8%] w-[13%]"
				alt=""
			/>
			<img
				src="/plant1.png"
				class="absolute top-[40.5%] left-[10%] scale-x-[-1] w-[13%]"
				alt=""
			/>
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div
				class="absolute top-[40.5%] right-[28%] w-[13%] z-50"
				on:mouseenter={() => (hoveringOn = 'grinder')}
				on:mouseleave={() => (hoveringOn = null)}
			>
				<img
					src="/grinder.png"
					class={hasGrinder ? 'opacity-100' : 'opacity-20 blur-sm'}
					alt=""
				/>
				{#if hoveringOn === 'grinder' && !hasGrinder && !$isInMenu}
					{@const canAfford =
						$databaseStore.cash >=
						(purchasableEquipment.find(
							(e) => e.name === Equipment.COFFEE_GRINDER,
						)?.cost ?? Infinity)}
					<div
						class="absolute top-0 left-0 text-sm rounded-lg p-2 text-center w-full h-full flex flex-col items-center justify-center gap-2 bg-black/50"
						on:mouseenter={() => (hoveringOn = 'grinder')}
					>
						<span>Coffee Grinder</span>
						<button
							class="btn btn-xs {canAfford
								? 'btn-primary'
								: 'btn-error cursor-not-allowed opacity-50'}"
							on:click={() => {
								if (!canAfford) return;
								const item = purchasableEquipment.find(
									(e) => e.name === Equipment.COFFEE_GRINDER,
								);
								if (item && canAfford) {
									$databaseStore.cash -= item.cost;
									$databaseStore.stats.expensesToday += item.cost;
									$databaseStore.ownedEquipment = [
										...$databaseStore.ownedEquipment,
										{
											name: item.name,
											quality: item.quality,
											durability: item.durability,
											failureChance: item.failureChance,
											cost: item.cost,
											upgrades: JSON.parse(JSON.stringify(item.upgrades)),
										},
									];
								}
							}}
						>
							Buy for ${purchasableEquipment.find(
								(e) => e.name === Equipment.COFFEE_GRINDER,
							)?.cost}
						</button>
					</div>
				{/if}
			</div>
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div
				class="absolute top-[40.5%] right-[39%] w-[11%] z-50"
				on:mouseenter={() => (hoveringOn = 'espresso')}
				on:mouseleave={() => (hoveringOn = null)}
			>
				<img
					src="/espresso.png"
					class={hasEspressoMachine ? 'opacity-100' : 'opacity-20 blur-sm'}
					alt=""
				/>
				{#if hoveringOn === 'espresso' && !hasEspressoMachine && !$isInMenu}
					{@const canAfford =
						$databaseStore.cash >=
						(purchasableEquipment.find(
							(e) => e.name === Equipment.ESPRESSO_MACHINE,
						)?.cost ?? Infinity)}
					<div
						class="absolute top-0 text-sm rounded-lg p-2 w-full text-center h-full flex flex-col items-center justify-center gap-2 bg-black/50"
					>
						<span>Espresso Machine</span>
						<button
							class="btn btn-xs {canAfford
								? 'btn-primary'
								: 'btn-error cursor-not-allowed opacity-50'}"
							on:click={() => {
								const item = purchasableEquipment.find(
									(e) => e.name === Equipment.ESPRESSO_MACHINE,
								);
								if (item && canAfford) {
									$databaseStore.cash -= item.cost;
									$databaseStore.stats.expensesToday += item.cost;
									$databaseStore.ownedEquipment = [
										...$databaseStore.ownedEquipment,
										{
											name: item.name,
											quality: item.quality,
											durability: item.durability,
											failureChance: item.failureChance,
											cost: item.cost,
											upgrades: JSON.parse(JSON.stringify(item.upgrades)),
										},
									];
								}
							}}
						>
							Buy ${purchasableEquipment.find(
								(e) => e.name === Equipment.ESPRESSO_MACHINE,
							)?.cost}
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
