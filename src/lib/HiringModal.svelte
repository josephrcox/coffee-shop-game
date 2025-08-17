<script lang="ts">
	import { databaseStore, showHiringModal } from './store';
	import { searchForEmployee, searchForManagers } from './utils';
	import type { manager } from './objects/types';
	import FullscreenModal from './FullscreenModal.svelte';

	let availableEmployees = searchForEmployee();
	let availableManagers: manager[] = searchForManagers();

	function getHappinessEmoji(happiness: number, short: boolean = true): string {
		if (!happiness) return short ? '🙂' : '🙂 Fine';
		else if (happiness >= 1.2) return short ? '😍' : '😍 Happy';
		else if (happiness >= 1) return short ? '🙂' : '🙂 Fine';
		else if (happiness >= 0.8) return short ? '🫤' : '🫤 Iffy';
		else if (happiness >= 0.5) return short ? '😡' : '😡 Bad';
		else return short ? '🤬' : '🤬 Terrible';
	}
</script>

<FullscreenModal
	show={$showHiringModal}
	title="Hire Staff"
	subtitle="Build your dream team"
	icon="👥"
	onClose={() => ($showHiringModal = false)}
>
	<div slot="headerExtra" class="text-right">
		<div class="text-sm text-textSecondary">Current Staff</div>
		<div class="text-xl font-bold text-interactive">
			{$databaseStore.staff.length}
		</div>
	</div>

	<div slot="content" class="flex flex-row gap-8">
		<!-- Managers Section -->
		<div class="flex-1">
			<h4
				class="text-lg font-semibold mb-2 text-lightAccent flex items-center gap-2"
			>
				👔 Available Managers
			</h4>
			<p class="text-sm text-textSecondary mb-4">
				Managers provide special bonuses and can unlock new features based on
				their trait.
			</p>
			<div class="flex flex-col gap-4">
				{#each availableManagers as manager}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<div
						class="bg-cardBackground/60 backdrop-blur-sm rounded-xl shadow-lg border border-buttonPrimary/50 p-2 cursor-pointer transition-all duration-200 hover:shadow-xl hover:border-interactive/70 hover:bg-cardBackground/80"
						on:click={() => {
							$databaseStore.managers.push(manager);
							availableManagers = availableManagers.filter(
								(m) => m.name !== manager.name,
							);
						}}
					>
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<h5 class="font-semibold text-lg text-textPrimary mb-1">
									{manager.name}
								</h5>
								<div class="text-xs text-textSecondary mb-2">
									{manager.trait}
								</div>
							</div>
							<div
								class="bg-success/80 text-textPrimary text-xs font-medium px-2 py-1 rounded-full"
							>
								{manager.experience}xp
							</div>
						</div>
						<div class="flex-row flex justify-between items-center">
							<span class="text-lg font-bold text-warning"
								>${manager.dailyWage}/day</span
							>
							<span class="text-sm text-lightAccent">
								{getHappinessEmoji(manager.happiness, true)}
							</span>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Employees Section -->
		<div class="flex-1">
			<h4
				class="text-lg font-semibold mb-2 text-lightAccent flex items-center gap-2"
			>
				🎯 Available Employees
			</h4>
			<p class="text-sm text-textSecondary mb-4">
				High XP employees want to work on more complex orders, but they move
				much faster overall.
			</p>
			<div class="flex flex-col gap-4">
				{#each availableEmployees as employee}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<div
						class="bg-cardBackground/60 backdrop-blur-sm rounded-xl shadow-lg border border-buttonPrimary/50 p-2 cursor-pointer transition-all duration-200 hover:shadow-xl hover:border-interactive/70 hover:bg-cardBackground/80"
						on:click={() => {
							$databaseStore.staff.push(employee);
							availableEmployees = availableEmployees.filter(
								(e) => e.name !== employee.name,
							);
						}}
					>
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<h5 class="font-semibold text-lg text-textPrimary mb-1">
									{employee.name}
								</h5>
							</div>
							<div
								class="bg-success/80 text-textPrimary text-xs font-medium px-2 py-1 rounded-full"
							>
								{employee.experience}xp
							</div>
						</div>
						<div class="flex-row flex justify-between items-center">
							<span class="text-lg font-bold text-warning"
								>${employee.dailyWage}/day</span
							>
							<span class="text-sm text-lightAccent">
								{getHappinessEmoji(employee.happiness, true)}
							</span>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<div
		slot="footer"
		class="border-t-2 border-accent/30 bg-gradient-to-r from-cardBackground/60 to-modalBackground/60 p-3 flex-shrink-0"
	>
		<div class="flex justify-between items-center max-w-7xl mx-auto">
			<div class="text-textSecondary text-xs">
				💡 Tip: Higher experience employees work faster but want variety!
			</div>
			<div class="flex gap-3">
				<button
					class="btn btn-secondary bg-interactive/80 hover:bg-interactive text-textPrimary border-interactive/50"
					on:click={() => {
						if ($databaseStore.cash < 1000) {
							alert('You do not have enough money');
							return;
						}
						$databaseStore.cash -= 1000;
						availableManagers = searchForManagers();
					}}
				>
					🔄 Find new Managers ($1000)
				</button>
				<button
					class="btn btn-secondary bg-interactive/80 hover:bg-interactive text-textPrimary border-interactive/50"
					on:click={() => {
						if ($databaseStore.cash < 500) {
							alert('You do not have enough money');
							return;
						}
						$databaseStore.cash -= 500;
						availableEmployees = searchForEmployee();
					}}
				>
					🔄 Find new Employees ($500)
				</button>
			</div>
		</div>
	</div>
</FullscreenModal>
