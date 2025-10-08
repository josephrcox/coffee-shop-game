<script lang="ts">
	export let title: string;
	export let onButtonClick: (() => void) | undefined = undefined;

	let hoveringOnButton = false;
</script>

<div class="w-auto text-sm">
	<div
		class="font-bold text-lg flex flex-row items-center gap-2 itespace-nowrap pb-2"
	>
		{title}
		<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
		{#if onButtonClick}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<img
				src={hoveringOnButton ? '/person_chalkboard.svg' : '/pencil.svg'}
				alt="shop"
				class="w-[1.5vw] h-[1.5vw] cursor-pointer hover:scale-105 duration-200"
				on:mouseenter={() => (hoveringOnButton = true)}
				on:mouseleave={() => (hoveringOnButton = false)}
				on:click={onButtonClick}
			/>
		{/if}
	</div>
</div>
