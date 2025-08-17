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
	<div slot="headerExtra" class="text-right" data-nux-id="hiring-intro">
		<div class="text-sm text-textSecondary">Current Staff</div>
		<div class="text-xl font-bold text-interactive">
			{$databaseStore.staff.length}
		</div>
	</div>

	<div slot="content" class="space-y-8">
		<!-- Managers Section -->
		<div>
			<div class="flex items-center gap-2 mb-3">
				<div class="text-lg">👔</div>
				<h2 class="text-lg font-bold text-lightAccent">Available Managers</h2>
			</div>
			<p class="text-sm text-textSecondary mb-4">
				Managers provide special bonuses and can unlock new features based on
				their trait.
			</p>
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-borderColor/30">
							<th class="text-left py-2 px-2 font-medium text-textSecondary"
								>Name</th
							>
							<th class="text-left py-2 px-2 font-medium text-textSecondary"
								>Trait</th
							>
							<th class="text-center py-2 px-2 font-medium text-textSecondary"
								>Experience</th
							>
							<th class="text-center py-2 px-2 font-medium text-textSecondary"
								>Daily Wage</th
							>
							<th class="text-center py-2 px-2 font-medium text-textSecondary"
								>Happiness</th
							>
							<th class="text-center py-2 px-2 font-medium text-textSecondary"
								>Action</th
							>
						</tr>
					</thead>
					<tbody class="divide-y divide-borderColor/20">
						{#each availableManagers as manager}
							<tr
								class="hover:bg-mainBackground/30 transition-colors cursor-pointer"
								on:click={() => {
									$databaseStore.managers.push(manager);
									availableManagers = availableManagers.filter(
										(m) => m.name !== manager.name,
									);
								}}
							>
								<td class="py-2 px-2 font-medium text-textPrimary"
									>{manager.name}</td
								>
								<td class="py-2 px-2 text-textSecondary text-xs"
									>{manager.trait}</td
								>
								<td class="py-2 px-2 text-center">
									<span
										class="bg-success/80 text-textPrimary text-xs font-medium px-2 py-1 rounded-full"
									>
										{manager.experience}xp
									</span>
								</td>
								<td class="py-2 px-2 text-center font-bold text-warning"
									>${manager.dailyWage}/day</td
								>
								<td class="py-2 px-2 text-center text-lightAccent"
									>{getHappinessEmoji(manager.happiness, true)}</td
								>
								<td class="py-2 px-2 text-center">
									<button
										class="btn btn-xs bg-special hover:bg-special/80 text-textPrimary border-special/50"
									>
										Hire
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<!-- Employees Section -->
		<div>
			<div class="flex items-center gap-2 mb-3">
				<div class="text-lg">🎯</div>
				<h2 class="text-lg font-bold text-lightAccent">Available Employees</h2>
			</div>
			<p class="text-sm text-textSecondary mb-4">
				High XP employees want to work on more complex orders, but they move
				much faster overall.
			</p>
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-borderColor/30">
							<th class="text-left py-2 px-2 font-medium text-textSecondary"
								>Name</th
							>
							<th class="text-center py-2 px-2 font-medium text-textSecondary"
								>Experience</th
							>
							<th class="text-center py-2 px-2 font-medium text-textSecondary"
								>Daily Wage</th
							>
							<th class="text-center py-2 px-2 font-medium text-textSecondary"
								>Happiness</th
							>
							<th class="text-center py-2 px-2 font-medium text-textSecondary"
								>Action</th
							>
						</tr>
					</thead>
					<tbody class="divide-y divide-borderColor/20">
						{#each availableEmployees as employee}
							<tr
								class="hover:bg-mainBackground/30 transition-colors cursor-pointer"
								on:click={() => {
									$databaseStore.staff.push(employee);
									availableEmployees = availableEmployees.filter(
										(e) => e.name !== employee.name,
									);
								}}
							>
								<td class="py-2 px-2 font-medium text-textPrimary"
									>{employee.name}</td
								>
								<td class="py-2 px-2 text-center">
									<span
										class="bg-success/80 text-textPrimary text-xs font-medium px-2 py-1 rounded-full"
									>
										{employee.experience}xp
									</span>
								</td>
								<td class="py-2 px-2 text-center font-bold text-warning"
									>${employee.dailyWage}/day</td
								>
								<td class="py-2 px-2 text-center text-lightAccent"
									>{getHappinessEmoji(employee.happiness, true)}</td
								>
								<td class="py-2 px-2 text-center">
									<button
										class="btn btn-xs bg-special hover:bg-special/80 text-textPrimary border-special/50"
									>
										Hire
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
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
