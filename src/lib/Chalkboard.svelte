<script lang="ts">
	import {
		databaseStore,
		showMenuPage,
		showShopModal,
		paused,
		isInMenu,
		currentView,
		View,
	} from './store';
	import ListHeader from './ListHeader.svelte';
	import {
		possibleMenuItems,
		purchasableEquipment,
		purchasableItems,
		type employee,
		type manager,
	} from './objects/types';
	import {
		purchaseItem,
		searchForEmployee,
		searchForManagers,
		startGame,
	} from './utils';
	import IngredientCheck from './IngredientCheck.svelte';

	let availableEmployees: employee[] = $databaseStore.availableEmployees;
	let availableManagers: manager[] = $databaseStore.availableManagers;

	function handleMenuClick() {
		$isInMenu = true;
		$currentView = View.MENU;
	}

	function handleShopClick() {
		$isInMenu = true;
		$currentView = View.SHOP;
	}

	function handleStaffClick() {
		$isInMenu = true;
		$currentView = View.STAFF;
	}

	// Create a local copy of possibleMenuItems to avoid mutation from MenuManagement.svelte
	$: localPossibleMenuItems = [...possibleMenuItems];

	// Transform data for List component
	$: menuItems = $databaseStore.menu;
	$: if ($currentView === View.NEW_GAME) {
		$isInMenu = true;
	}

	$: staffItems = $databaseStore.staff;

	$: inventoryItems = $databaseStore.inventory;

	function getHappinessEmoji(happiness: number, short: boolean = true): string {
		if (!happiness) return short ? '🙂' : '🙂 Fine';
		else if (happiness >= 1.2) return short ? '😍' : '😍 Happy';
		else if (happiness >= 1) return short ? '🙂' : '🙂 Fine';
		else if (happiness >= 0.8) return short ? '🫤' : '🫤 Iffy';
		else if (happiness >= 0.5) return short ? '😡' : '😡 Bad';
		else return short ? '🤬' : '🤬 Terrible';
	}

	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') {
			$isInMenu = false;
			$currentView = View.DEFAULT;
		}
	});
</script>

<div
	class="flex flex-row items-start justify-start overflow-hidden w-full px-2 pt-1"
>
	{#if $currentView === View.DEFAULT}
		<div class="flex flex-row items-start justify-evenly w-full gap-4">
			<div class="w-1/3 text-sm">
				<ListHeader
					title="What we're servin'"
					onButtonClick={handleMenuClick}
				/>
				{#if menuItems.length === 0}
					<div class="text-error/90">No items on the menu</div>
				{/if}
				{#each menuItems as item, i}
					<div
						class="flex flex-row items-center justify-between w-full text-lg"
					>
						<div class="text-textPrimary/90">
							{item.name}
							{#if item.price}
								(${item.price})
							{/if}
						</div>
						{#if item.ingredients}
							{@const hasIngredients = Object.keys(item.ingredients).every(
								(ingredient) =>
									$databaseStore.inventory.some(
										(i) => i.name === ingredient && i.quantity > 0,
									),
							)}
							<IngredientCheck {hasIngredients} {item} />
						{/if}
					</div>
				{/each}
			</div>
			<div class="text-xs w-1/3">
				<ListHeader title="Who's workin'" onButtonClick={handleStaffClick} />
				{#if staffItems.length === 0}
					<div class="text-error/90">No staff working</div>
				{/if}
				<div class="flex flex-col w-full gap-2">
					{#each staffItems as item, i}
						<div
							class="flex flex-row items-center justify-between w-full text-sm gap-2 h-4"
						>
							<div class="text-textPrimary/90">
								{item.name}
								{#if item.currentOrder}
									<span>
										{$databaseStore.orders
											.find((order) => order.id === item.currentOrder)
											?.items.map((item) => item.name.slice(0, 3))
											.join(', ')}
									</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
			<div class="w-1/3 text-sm">
				<ListHeader title="What we've got" onButtonClick={handleShopClick} />
				{#if inventoryItems.length === 0}
					<div class="text-error/90">No inventory</div>
				{/if}
				<div class="flex flex-col w-full gap-2">
					{#each inventoryItems as item, i}
						{@const costToRestock =
							purchasableItems.find((i) => i.name === item.name)?.cost ?? 0}
						<div
							class="flex flex-row items-center justify-between w-full text-sm gap-4"
						>
							<div class="text-textPrimary/90">
								{item.name}
								({item.quantity})
							</div>
							<!-- button to restock -->
							<button
								class="btn btn-xs text-xs {item.quantity < 10
									? 'btn-error animate-pulse duration-75'
									: ''}"
								on:click={() => {
									if ($databaseStore.cash >= costToRestock) {
										$databaseStore.cash -= costToRestock;
										const inventoryItem = $databaseStore.inventory.find(
											(i) => i.name === item.name,
										);
										if (inventoryItem) {
											inventoryItem.quantity +=
												purchasableItems.find((i) => i.name === item.name)
													?.quantity ?? 0;
										}
									}
								}}
							>
								+ ${costToRestock}
							</button>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
	{#if $currentView === View.MENU}
		<div class="flex flex-col items-start w-full overflow-hidden">
			<ListHeader title="What we're servin'" />
			<div class="grid lg:grid-cols-2 w-full gap-2 overflow-hidden text-lg">
				{#each localPossibleMenuItems as item}
					{@const hasIngredients = Object.keys(item.ingredients).every(
						(ingredient) =>
							$databaseStore.inventory.some(
								(i) => i.name === ingredient && i.quantity > 0,
							),
					)}
					<div class="flex flex-row items-center justify-between pr-8">
						<span class="text-textPrimary">{item.name}</span>
						<div class="flex flex-row items-center gap-2">
							<IngredientCheck {hasIngredients} {item} />
							<button
								class="btn lg:btn-xs btn-sm btn-primary"
								on:click={() => {
									if (
										$databaseStore.menu.some(
											(menuItem) => menuItem.name === item.name,
										)
									) {
										$databaseStore.menu = $databaseStore.menu.filter(
											(menuItem) => menuItem.name !== item.name,
										);
									} else {
										$databaseStore.menu = [...$databaseStore.menu, item];
									}
								}}
							>
								{$databaseStore.menu.find(
									(menuItem) => menuItem.name === item.name,
								)
									? 'Remove'
									: 'Add'}
							</button>
						</div>
					</div>
					<!-- toggle to add/remove from menu -->
				{/each}
			</div>
		</div>
	{/if}
	{#if $currentView === View.SHOP}
		<div class="flex flex-col items-start w-full overflow-hidden">
			<ListHeader title="What we've got" />
			<div
				class="flex flex-col w-full gap-2 overflow-hidden chalkboard-scroll text-lg"
			>
				{#each purchasableItems as item}
					{@const canAfford = $databaseStore.cash >= item.cost}
					{@const hasRequiredEquipment =
						!item.requires ||
						item.requires.every((equipment) =>
							$databaseStore.ownedEquipment.some((e) => e.name === equipment),
						)}
					{@const canPurchase = canAfford && hasRequiredEquipment}
					<div class="flex flex-row items-start justify-between max-w-[80%]">
						{item.name}
						({$databaseStore.inventory.find((i) => i.name === item.name)
							?.quantity || 0})
						<span>
							{#if !hasRequiredEquipment}
								<span
									class="text-warning text-xs tooltip tooltip-content tooltip-left tooltip-primary"
									data-tip={'You need ' + item.requires?.join(', ')}
								>
									⚠️
								</span>
							{/if}
							<button
								class="btn btn-xs {canPurchase
									? 'btn-primary'
									: 'btn-error cursor-not-allowed opacity-50'}"
								on:click={() => {
									if (!canPurchase || !hasRequiredEquipment) return;
									const success = purchaseItem(
										item.name,
										item.quantity,
										item.cost,
										item.description,
									);
									if (!success) alert('Purchase failed');
								}}
							>
								Buy {item.quantity} for ${item.cost}
							</button>
						</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
	{#if $currentView === View.STAFF}
		{@const cost = 100}
		<div class="flex flex-col items-start justify-between w-full gap-8">
			<div class="flex flex-col items-start w-full">
				<ListHeader title="Who's workin'" />
				<div class="flex flex-col w-full gap-2 overscroll-y-auto">
					{#each $databaseStore.staff as employee}
						<div class="flex flex-row items-center justify-between w-full h-8">
							<div class="flex flex-row gap-2 items-center text-md">
								<span class="text-lightAccent">
									{getHappinessEmoji(employee.happiness)}
								</span>
								<span class="text-textPrimary">
									{employee.name}
								</span>
							</div>
							<div class="flex flex-row gap-2 items-center text-xs">
								<span
									class="text-textPrimary bg-blue-800/50 px-2 py-1 rounded-md"
								>
									{employee.experience}xp
								</span>
								<span
									class="text-textPrimary bg-orange-500/20 px-2 py-1 rounded-md text-xs"
								>
									${employee.dailyWage}/day
								</span>
								{#if $databaseStore.staff.length > 1 && employee.id !== 0}
									<button
										class="btn btn-sm btn-error"
										on:click={() => {
											$databaseStore.staff = $databaseStore.staff.filter(
												(e) => e.id !== employee.id,
											);
										}}
									>
										Fire
									</button>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
			<div class="flex flex-col items-start w-full gap-2 max-h-[28vh]">
				<div class="flex flex-row gap-4 items-center text-sm">
					<ListHeader title="Hiring" />
					{#if $databaseStore.availableEmployees.length < 5}
						<button
							class="btn btn-xs {$databaseStore.cash >= cost
								? 'btn-primary'
								: 'btn-warning cursor-not-allowed '}"
							on:click={() => {
								if ($databaseStore.cash < cost) {
									alert('You do not have enough money');
									return;
								}
								$databaseStore.cash -= cost;
								$databaseStore = searchForEmployee($databaseStore);
							}}
						>
							Headhunt for ${cost}
						</button>
					{/if}
				</div>

				{#each $databaseStore.availableEmployees as employee}
					<div class="flex flex-row items-center justify-between w-full">
						<div class="flex flex-row gap-2 items-center text-md">
							<span class="text-lightAccent">
								{getHappinessEmoji(employee.happiness)}
							</span>
							<span class="text-textPrimary">
								{employee.name}
							</span>
						</div>
						<div class="flex flex-row gap-2 items-center">
							<span
								class="text-textPrimary bg-blue-800/50 px-2 py-1 rounded-md"
							>
								{employee.experience}xp
							</span>
							<span
								class="text-textPrimary bg-orange-500/20 px-2 py-1 rounded-md text-xs"
							>
								${employee.dailyWage}/day
							</span>
							<button
								class="btn btn-sm bg-gray-200"
								on:click={() => {
									$databaseStore.availableEmployees =
										$databaseStore.availableEmployees.filter(
											(e) => e.id !== employee.id,
										);
								}}
							>
								Dismiss
							</button>
							<button
								class="btn btn-sm btn-primary"
								on:click={() => {
									$databaseStore.staff.push(employee);
									// reoder employees based on experience
									$databaseStore.staff = $databaseStore.staff.sort(
										(a, b) => b.experience - a.experience,
									);
									$databaseStore.availableEmployees =
										$databaseStore.availableEmployees.filter(
											(e) => e.id !== employee.id,
										);
								}}
							>
								Hire
							</button>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
	{#if $currentView === View.NEW_GAME}
		<div class="flex flex-col items-start w-full gap-2">
			<div class="flex flex-row justify-between w-full">
				<ListHeader title="The Grind" />
				<button
					class="btn btn-primary mt-4 btn-sm inset-x-0 mx-auto"
					on:click={() => {
						$isInMenu = false;
						$currentView = View.DEFAULT;
						$paused = false;
						if ($databaseStore.staff.length === 0) {
							$databaseStore = startGame($databaseStore);
						}
					}}
				>
					Continue
				</button>
			</div>
			<p>
				Welcome to your new coffee shop! After years in office jobs, you've
				taken the leap into entrepreneurship.
			</p>
			<p>
				You've got basic equipment and decor, but only a few bucks left. Time to
				start brewing!
			</p>
			<br class="my-2" />
			<p>
				Add items to your menu, stock ingredients, then open your café and serve
				customers!
			</p>
		</div>
	{/if}
	{#if $currentView !== View.DEFAULT && $currentView !== View.NEW_GAME}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			class="flex flex-row items-center gap-2 cursor-pointer"
			on:click={() => {
				$isInMenu = false;
				$currentView = View.DEFAULT;
			}}
		>
			<span class="text-textPrimary"> Back </span>
			<kbd class="kbd kbd-sm">esc</kbd>
		</div>
	{/if}
</div>

<style>
	p {
		font-size: 2.5vh;
		line-height: 1;
	}
</style>
