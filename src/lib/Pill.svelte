<script lang="ts">
	export let variant: 'success' | 'warning' | 'error' | 'interactive' =
		'success';
	export let onClick: (() => void) | undefined = undefined;
	export let hoverContent: string | undefined = undefined;
	export let normalContent: string;
	export let disabled: boolean = false;
	export let tooltip: string | undefined = undefined;

	let isHovered = false;

	function getVariantClasses(variant: string): string {
		switch (variant) {
			case 'success':
				return 'bg-success/70 hover:bg-success/90';
			case 'warning':
				return 'bg-warning/70 hover:bg-warning/90';
			case 'error':
				return 'bg-error/70 hover:bg-error/90';
			case 'interactive':
				return 'bg-interactive/70 hover:bg-interactive/90';
			default:
				return 'bg-success/70 hover:bg-success/90';
		}
	}

	function handleClick() {
		if (!disabled && onClick) {
			onClick();
		}
	}
</script>

{#if tooltip}
	<div
		class="tooltip tooltip-content tooltip-secondary tooltip-left"
		data-tip={tooltip}
	>
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-mouse-events-have-key-events -->
		<div
			class="text-xs text-textPrimary px-1.5 rounded-md flex flex-row h-full items-center gap-1 transition-all duration-200 {getVariantClasses(
				variant,
			)} {disabled ? 'cursor-not-allowed' : 'cursor-pointer'}"
			on:mouseenter={() => (isHovered = true)}
			on:mouseleave={() => (isHovered = false)}
			on:click={!disabled ? handleClick : undefined}
		>
			{#if isHovered && hoverContent && !disabled}
				<span class="overflow-hidden text-ellipsis whitespace-nowrap">
					{hoverContent}
				</span>
			{:else}
				<span class="overflow-hidden text-ellipsis whitespace-nowrap">
					{normalContent}
				</span>
				<slot name="visual" />
			{/if}
		</div>
	</div>
{:else}
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-mouse-events-have-key-events -->
	<div
		class="text-xs text-textPrimary px-1.5 rounded-md flex flex-row h-full items-center gap-1 transition-all duration-200 {getVariantClasses(
			variant,
		)} {disabled ? 'cursor-not-allowed' : 'cursor-pointer'}"
		on:mouseenter={() => (isHovered = true)}
		on:mouseleave={() => (isHovered = false)}
		on:click={!disabled ? handleClick : undefined}
	>
		{#if isHovered && hoverContent && !disabled}
			<span class="overflow-hidden text-ellipsis whitespace-nowrap">
				{hoverContent}
			</span>
		{:else}
			<span class="overflow-hidden text-ellipsis whitespace-nowrap">
				{normalContent}
			</span>
			<slot name="visual" />
		{/if}
	</div>
{/if}
