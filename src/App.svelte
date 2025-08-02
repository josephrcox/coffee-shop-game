<script lang="ts">
	import Body from './lib/Body.svelte';
	import Header from './lib/Header.svelte';
	import { paused } from './lib/store';
	document.addEventListener('keydown', (e) => {
		// \ key
		if (e.key === '\\') {
			localStorage.clear();
			window.location.reload();
		} else if (e.key === 'p') {
			paused.set(!$paused);
		}
	});
</script>

<div
	class="flex flex-col min-h-screen bg-mainBackground h-screen overflow-hidden"
>
	<Header />
	<Body />
</div>
