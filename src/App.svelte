<script lang="ts">
	import Body from './lib/Body.svelte';
	import Header from './lib/Header.svelte';
	import DeveloperModal from './lib/DeveloperModal.svelte';
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
	} from './lib/store';
	import TutorialOverlay from './lib/TutorialOverlay.svelte';

	// Custom cursor functionality
	let cursorX = 0;
	let cursorY = 0;
	let isCustomCursorActive = true; // Start as active
	let isPointerMode = false;

	// Initialize background music when component mounts
	import { onMount } from 'svelte';
	onMount(() => {
		initializeBackgroundMusic();

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
		document.body.classList.add('custom-cursor-active');

		document.addEventListener('mousemove', handleMouseMove);

		return () => {
			document.removeEventListener('pointerdown', handlePointerDown);
			document.removeEventListener('mousemove', handleMouseMove);
			document.body.classList.remove('custom-cursor-active');
		};
	});

	document.addEventListener('keydown', (e) => {
		if (e.key === '\\') {
			showDeveloperModal.set(true);
		} else if (e.key === 'p') {
			paused.set(!$paused);
		} else if (e.key == 'Escape') {
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
	});
</script>

<div
	class="flex flex-col min-h-screen bg-mainBackground h-screen overflow-hidden"
>
	<Header />
	<Body />
	<TutorialOverlay />
	<DeveloperModal />

	<!-- Custom cursor -->
	{#if isCustomCursorActive}
		<div
			class="custom-cursor {isPointerMode ? 'pointer' : ''}"
			style="left: {cursorX}px; top: {cursorY}px;"
		></div>
	{/if}
</div>
