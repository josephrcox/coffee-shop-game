<script lang="ts">
	import {
		databaseStore,
		showStaffDetailModal,
		selectedEmployee,
		paused,
	} from './store';
	import FullscreenModal from './FullscreenModal.svelte';
	import { getProficiencySpeedMultiplier } from './utils';

	function getProficiencyMultiplier(
		proficiencyCount: number | undefined,
	): number {
		const count = proficiencyCount ?? 0;
		const multiplier = getProficiencySpeedMultiplier(count);
		return Math.round(multiplier * 100) / 100;
	}

	function getHappinessEmoji(happiness: number, short: boolean = true): string {
		if (!happiness) return short ? '🙂' : '🙂 Fine';
		else if (happiness >= 1.2) return short ? '😍' : '😍 Happy';
		else if (happiness >= 1) return short ? '🙂' : '🙂 Fine';
		else if (happiness >= 0.8) return short ? '🫤' : '🫤 Iffy';
		else if (happiness >= 0.5) return short ? '😡' : '😡 Bad';
		else return short ? '🤬' : '🤬 Terrible';
	}

	function getHappinessColor(happiness: number): string {
		if (!happiness || happiness >= 1) return 'text-success';
		else if (happiness >= 0.8) return 'text-warning';
		else return 'text-error';
	}

	function getTotalItemsMade(): number {
		if (!$selectedEmployee?.menuItemProficiency) return 0;
		return Object.values($selectedEmployee.menuItemProficiency).reduce(
			(sum, count) => sum + count,
			0,
		);
	}

	function fireEmployee() {
		if (!$selectedEmployee) return;
		const employeeToFire = $selectedEmployee;
		$databaseStore.staff = $databaseStore.staff.filter(
			(e) => e.name !== employeeToFire.name,
		);
		$selectedEmployee = null;
		$showStaffDetailModal = false;
		$paused = false;
	}
</script>

<FullscreenModal
	show={$showStaffDetailModal}
	title={$selectedEmployee ? $selectedEmployee.name : 'Staff Details'}
	subtitle="Employee information and performance"
	icon="👤"
	onClose={() => {
		$showStaffDetailModal = false;
		$selectedEmployee = null;
	}}
>
	<div slot="content" class="space-y-8">
		{#if $selectedEmployee}
			<!-- Employee Overview Cards -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<!-- Experience Card -->
				<div
					class="bg-gradient-to-br from-special/20 to-special/10 border-2 border-special/40 rounded-xl p-4 shadow-lg"
				>
					<div class="flex items-center gap-3 mb-2">
						<div class="text-2xl">⭐</div>
						<div>
							<div class="text-xs text-textSecondary font-medium">
								Experience
							</div>
							<div class="text-xl font-bold text-special">
								{$selectedEmployee.experience}xp
							</div>
						</div>
					</div>
					<div class="text-xs text-textSecondary">
						{$selectedEmployee.experience < 100
							? 'Beginner'
							: $selectedEmployee.experience < 300
								? 'Intermediate'
								: $selectedEmployee.experience < 600
									? 'Advanced'
									: 'Expert'}
					</div>
				</div>

				<!-- Wage Card -->
				<div
					class="bg-gradient-to-br from-warning/20 to-warning/10 border-2 border-warning/40 rounded-xl p-4 shadow-lg"
				>
					<div class="flex items-center gap-3 mb-2">
						<div class="text-2xl">💰</div>
						<div>
							<div class="text-xs text-textSecondary font-medium">
								Daily Wage
							</div>
							<div class="text-xl font-bold text-warning">
								${$selectedEmployee.dailyWage}
							</div>
						</div>
					</div>
					<div class="text-xs text-textSecondary">Per day salary</div>
				</div>

				<!-- Happiness Card -->
				<div
					class="bg-gradient-to-br from-success/20 to-success/10 border-2 border-success/40 rounded-xl p-4 shadow-lg"
				>
					<div class="flex items-center gap-3 mb-2">
						<div class="text-2xl">
							{getHappinessEmoji($selectedEmployee.happiness, true)}
						</div>
						<div>
							<div class="text-xs text-textSecondary font-medium">
								Happiness
							</div>
							<div
								class="text-xl font-bold {getHappinessColor(
									$selectedEmployee.happiness,
								)}"
							>
								{($selectedEmployee.happiness * 100).toFixed(0)}%
							</div>
						</div>
					</div>
					<div class="text-xs text-textSecondary">
						{getHappinessEmoji($selectedEmployee.happiness, false).split(
							' ',
						)[1] || 'Normal'}
					</div>
				</div>

				<!-- Activity Card -->
				<div
					class="bg-gradient-to-br from-interactive/20 to-interactive/10 border-2 border-interactive/40 rounded-xl p-4 shadow-lg"
				>
					<div class="flex items-center gap-3 mb-2">
						<div class="text-2xl">🎯</div>
						<div>
							<div class="text-xs text-textSecondary font-medium">
								Current Task
							</div>
							<div class="text-sm font-bold text-interactive">
								{$selectedEmployee.currentOrder
									? `Order #${$selectedEmployee.currentOrder}`
									: 'Available'}
							</div>
						</div>
					</div>
					<div class="text-xs text-textSecondary">
						{$selectedEmployee.currentOrder ? 'Working' : 'Waiting for orders'}
					</div>
				</div>
			</div>

			<!-- Proficiency Section -->
			<div class="space-y-4">
				<div class="flex items-center gap-3">
					<div class="text-2xl">🍽️</div>
					<h2 class="text-xl font-bold text-accent">Menu Item Proficiency</h2>
				</div>

				{#if $selectedEmployee.menuItemProficiency && Object.keys($selectedEmployee.menuItemProficiency).length > 0}
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{#each Object.entries($selectedEmployee.menuItemProficiency).sort(([, a], [, b]) => b - a) as [name, count]}
							{@const speedMultiplier = getProficiencyMultiplier(count)}
							{@const fromColor =
								count < 5
									? 'from-warning/10'
									: count < 15
										? 'from-info/10'
										: count < 30
											? 'from-success/10'
											: 'from-special/10'}
							{@const borderColor =
								count < 5
									? 'border-warning/40'
									: count < 15
										? 'border-info/40'
										: count < 30
											? 'border-success/40'
											: 'border-special/40'}

							<div
								class="bg-gradient-to-br {fromColor} to-cardBackground border-2 {borderColor} rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300"
							>
								<div class="flex items-center justify-between mb-3">
									<h4 class="font-bold text-textPrimary text-sm">{name}</h4>
								</div>

								<div class="space-y-2">
									<div class="flex justify-between items-center">
										<span class="text-xs text-textSecondary">Items Made:</span>
										<span class="text-sm font-bold text-textPrimary"
											>{count}</span
										>
									</div>
									<div class="flex justify-between items-center">
										<span class="text-xs text-textSecondary">Speed Bonus:</span>
										<span
											class="text-sm font-bold {speedMultiplier > 1
												? 'text-success'
												: speedMultiplier === 1
													? 'text-textPrimary'
													: 'text-error'}"
											>{((speedMultiplier - 1) * 100).toFixed(0)}%</span
										>
									</div>
								</div>

								<!-- Progress bar -->
								<div class="mt-3">
									<div class="w-full bg-borderColor/30 rounded-full h-2">
										<div
											class="bg-gradient-to-r from-success to-special h-2 rounded-full transition-all duration-500"
											style="width: {Math.min(100, (count / 50) * 100)}%"
										></div>
									</div>
									<div class="text-xs text-textSecondary mt-1 text-center">
										{count}/50 for proficiency, 200 for expert.
									</div>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div
						class="bg-gradient-to-br from-borderColor/20 to-borderColor/10 border-2 border-borderColor/40 rounded-xl p-8 text-center"
					>
						<div class="text-6xl mb-4">🌱</div>
						<h3 class="text-xl font-bold text-textSecondary mb-2">
							New Employee
						</h3>
						<p class="text-textSecondary">
							No specific experience yet. This employee will gain proficiency as
							they work on different menu items.
						</p>
					</div>
				{/if}
			</div>
		{:else}
			<div class="text-center p-8">
				<div class="text-6xl mb-4">👤</div>
				<h2 class="text-2xl font-bold text-textSecondary">
					No Employee Selected
				</h2>
			</div>
		{/if}
	</div>

	<!-- Footer with Action Buttons -->
	<div
		slot="footer"
		class="border-t-2 border-accent/30 bg-gradient-to-r from-cardBackground/60 to-modalBackground/60 p-3 flex-shrink-0"
	>
		<div class="flex justify-between items-center max-w-7xl mx-auto">
			<div class="text-textSecondary text-xs">
				💡 Tip: Higher proficiency means faster order completion!
			</div>
			<button
				class="btn bg-error/80 hover:bg-error text-textPrimary border-error/50 gap-2 px-4 py-2"
				on:click={fireEmployee}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
					/>
				</svg>
				Fire Employee
			</button>
		</div>
	</div>
</FullscreenModal>
