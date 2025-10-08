<script lang="ts">
	import type { menuItem } from './objects/types';

	export let hasIngredients: boolean;
	export let item: menuItem;
</script>

<span
	class="text-warning tooltip tooltip-content tooltip-left tooltip-primary duration-75"
	data-tip={hasIngredients
		? ''
		: `Missing ${Object.keys(item.ingredients).join(', ')}`}
>
	{hasIngredients ? '' : '⚠️'}
</span>
