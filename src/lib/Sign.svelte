<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	// Props
	export let title: string = '';
	export let showButton: boolean = false;
	export let buttonText: string = 'Action';
	export let buttonClass: string =
		'btn btn-xs bg-info/80 text-white hover:bg-info border-info/50';
	export let onButtonClick: (() => void) | undefined = undefined;
	export let maxHeight: string = 'max-h-48';
	export let className: string = 'w-96';

	const dispatch = createEventDispatcher();

	function handleButtonClick() {
		if (onButtonClick) {
			onButtonClick();
		}
		dispatch('buttonClick');
	}
</script>

<div class="relative {className}">
	<img src="/sign.svg" alt="sign" class="w-full h-auto" />
	<!-- Content positioned on top of sign -->
	<div class="absolute top-6 left-6 right-10 bottom-8 flex flex-col">
		{#if title || showButton}
			<div class="flex flex-row gap-2 mb-2 items-center">
				{#if title}
					<span class="text-white">{title}</span>
				{/if}
				{#if showButton}
					<button class={buttonClass} on:click={handleButtonClick}>
						{buttonText}
					</button>
				{/if}
			</div>
		{/if}
		<div class="flex flex-col gap-1 overflow-y-auto {maxHeight}">
			<slot />
		</div>
	</div>
</div>
