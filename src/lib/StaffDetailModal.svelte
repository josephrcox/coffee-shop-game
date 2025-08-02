<script lang="ts">
	import {
		databaseStore,
		showStaffDetailModal,
		selectedEmployee,
	} from './store';

	function getProficiencyMultiplier(
		proficiencyCount: number | undefined,
	): number {
		if (proficiencyCount === undefined) proficiencyCount = 0;
		const multiplier = Math.min(
			2.5,
			0.022 * Math.pow(proficiencyCount, 0.68) + 0.5,
		);
		// return it formatted to 2 decimal places
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
</script>

<dialog
	id="staff_detail_modal"
	class="modal {$showStaffDetailModal ? 'modal-open' : ''}"
>
	<div
		class="modal-box bg-modalBackground/95 backdrop-blur-md text-textPrimary min-w-[40vw] max-w-[60vw] h-fit flex flex-col border border-buttonPrimary/60 shadow-2xl"
	>
		{#if $selectedEmployee}
			<!-- Fixed Header -->
			<div class="flex items-center justify-between flex-shrink-0">
				<h3 class="text-3xl font-bold text-textHighlight">
					{$selectedEmployee.name}
				</h3>
				<div class="text-right">
					<div class="text-sm text-borderColor">Experience</div>
					<div class="text-xl font-bold text-special">
						{$selectedEmployee.experience}xp
					</div>
				</div>
				<!-- fire button	 -->
				<button
					class="btn btn-xs bg-error/80 text-textPrimary hover:bg-error border-error/50"
					on:click={() => {
						if (!$selectedEmployee) return;
						const employeeToFire = $selectedEmployee;
						$databaseStore.staff = $databaseStore.staff.filter(
							(e) => e.name !== employeeToFire.name,
						);
						$databaseStore.stats.expensesToday += employeeToFire.dailyWage;
						$selectedEmployee = null;
						$showStaffDetailModal = false;
					}}
				>
					Fire
				</button>
			</div>
			<div>
				<span class="text-sm"
					>{getHappinessEmoji($selectedEmployee.happiness, false)}</span
				>
			</div>

			<!-- Scrollable Content -->
			<div class="flex-1 overflow-y-auto pr-2 mt-8">
				<div class="mb-6">
					<h4
						class="text-lg font-semibold mb-4 text-borderColor flex items-center gap-2"
					>
						🍽️ Proficiency
					</h4>
					{#if $selectedEmployee.menuItemProficiency && Object.keys($selectedEmployee.menuItemProficiency).length > 0}
						<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
							{#each Object.entries($selectedEmployee.menuItemProficiency) as [name, count]}
								<div
									class="bg-cardBackground/60 backdrop-blur-sm rounded-lg p-3 border border-buttonPrimary/50"
								>
									<div class="font-semibold text-textPrimary">{name}</div>
									<div class="text-sm text-borderColor">
										{count} made
									</div>
									<div class="text-sm text-special font-bold">
										Speed: x{getProficiencyMultiplier(count)}
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div
							class="text-center p-4 bg-cardBackground/40 backdrop-blur-sm rounded-lg text-textHighlight"
						>
							No specific experience yet. Keep working!
						</div>
					{/if}
				</div>
			</div>
		{/if}
		<!-- Fixed Footer -->
		<div
			class="modal-action pt-4 border-t border-buttonPrimary/50 flex-shrink-0"
		>
			<form method="dialog">
				<button
					class="btn btn-primary bg-special/80 hover:bg-special text-mainBackground border-special/50"
					on:click={() => {
						$showStaffDetailModal = false;
						$selectedEmployee = null;
					}}
				>
					Close
				</button>
			</form>
		</div>
	</div>
</dialog>
