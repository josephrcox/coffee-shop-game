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
	} from './lib/store';
	import TutorialOverlay from './lib/TutorialOverlay.svelte';
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
</div>
