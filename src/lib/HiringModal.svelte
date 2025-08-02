<script lang="ts">
	import { databaseStore, showHiringModal } from './store';
	import { searchForEmployee } from './utils';

	let availableEmployees = searchForEmployee();

	function getHappinessEmoji(happiness: number, short: boolean = true): string {
		if (!happiness) return short ? '🙂' : '🙂 Fine';
		else if (happiness >= 1.2) return short ? '😍' : '😍 Happy';
		else if (happiness >= 1) return short ? '🙂' : '🙂 Fine';
		else if (happiness >= 0.8) return short ? '🫤' : '🫤 Iffy';
		else if (happiness >= 0.5) return short ? '😡' : '😡 Bad';
		else return short ? '🤬' : '🤬 Terrible';
	}
</script>

<dialog id="my_modal_1" class="modal {$showHiringModal ? 'modal-open' : ''}">
	<div
		class="modal-box bg-modalBackground/95 backdrop-blur-md text-textPrimary min-w-[40vw] max-w-[40vw] flex flex-col border-2 border-info/60 shadow-2xl"
	>
		<!-- Fixed Header -->
		<div class="flex items-center justify-between mb-6 flex-shrink-0">
			<h3 class="text-2xl font-bold text-accent flex items-center gap-2">
				👥 Hire Staff
			</h3>
			<div class="text-right">
				<div class="text-sm text-textSecondary">Current Staff</div>
				<div class="text-xl font-bold text-interactive">
					{$databaseStore.staff.length}
				</div>
			</div>
		</div>

		<!-- Scrollable Content -->
		<div class="flex-1 overflow-y-auto pr-2">
			<div class="mb-6">
				<h4
					class="text-lg font-semibold mb-2 text-lightAccent flex items-center gap-2"
				>
					🎯 Available Candidates
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

		<!-- Fixed Footer -->
		<div class="modal-action pt-4 border-t border-info/50 flex-shrink-0">
			<button
				class="btn btn-secondary bg-interactive/80 hover:bg-interactive text-textPrimary border-interactive/50"
				on:click={() => {
					if ($databaseStore.cash < 100) {
						alert('You do not have enough money');
						return;
					}
					$databaseStore.cash -= 100;
					availableEmployees = searchForEmployee();
				}}
			>
				🔄 Search again ($100)
			</button>
			<form method="dialog">
				<button
					class="btn btn-primary bg-info/80 hover:bg-info text-textPrimary border-info/50"
					on:click={() => {
						$showHiringModal = false;
					}}
				>
					Close Hiring
				</button>
			</form>
		</div>
	</div>
</dialog>
