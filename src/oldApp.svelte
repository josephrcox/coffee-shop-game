<div
	class="opacity-0 flex flex-row min-h-screen bg-mainBackground h-screen overflow-hidden"
>
	<!-- Left side: Header on top, Body below -->
	<div class="flex-1 flex flex-col min-h-0">
		<Header />
		<div class="flex-1 min-h-0">
			<Body />
		</div>
	</div>

	<!-- Right sidebar: Full height from top to bottom -->
	<div class="w-64 bg-cardBackground/90 border-l border-info/30 flex flex-col">
		<div class="flex-1 overflow-y-auto p-2 pt-6 flex flex-col gap-4">
			<!-- Menu Section -->
			<div class="flex flex-col">
				<div class="flex flex-row gap-2 mb-3">
					<span class="font-semibold text-subheading">Menu</span>
					<button
						class="btn btn-xs bg-info/80 text-white hover:bg-info border-info/50"
						data-nux-id="open-menu"
						on:click={() => {
							showMenuPage.set(true);
							paused.set(true);
						}}
					>
						Manage Menu
					</button>
				</div>
				<div class="flex flex-col gap-1">
					{#each $databaseStore.menu as item}
						<div
							class="flex flex-row items-center text-textPrimary justify-between gap-1 w-full"
						>
							<span>{item.name}</span>
							<Pill
								variant={'success'}
								normalContent={`$${item.price.toFixed(2)}`}
								hoverContent={'Adjust price'}
								tooltip={!hasManager(Trait.FINANCIAL, $databaseStore)
									? 'You need a financial manager to adjust prices'
									: undefined}
								disabled={!hasManager(Trait.FINANCIAL, $databaseStore)}
								onClick={() => handlePriceAdjustment(item)}
							/>
						</div>
					{/each}
				</div>
			</div>

			<!-- Stats cards -->
			<div class=" p-1 pt-4 border-t-2 border-info/10">
				<h3 class="text-sm font-semibold text-subheading">
					Today vs Yesterday
				</h3>
				<div class="mt-2 flex flex-row items-center justify-between gap-2">
					<span class="text-sm text-textPrimary"
						>Profit: {`$${calculateNetProfitToday($databaseStore)}`}</span
					>
					<span
						class={'text-xs px-1.5 rounded-md ' +
							(calculateNetProfitToday($databaseStore) -
								$databaseStore.stats.profitYesterday >
							0
								? 'bg-success/20 text-success'
								: calculateNetProfitToday($databaseStore) -
											$databaseStore.stats.profitYesterday <
									  0
									? 'bg-error/20 text-error'
									: 'bg-borderColor/40 text-textSecondary')}
					>
						{calculateNetProfitToday($databaseStore) -
							$databaseStore.stats.profitYesterday >
						0
							? `+${calculateNetProfitToday($databaseStore) - $databaseStore.stats.profitYesterday}`
							: calculateNetProfitToday($databaseStore) -
								$databaseStore.stats.profitYesterday}
					</span>
				</div>
				<div class="mt-1 flex flex-row items-center justify-between gap-2">
					<span class="text-sm text-textPrimary"
						>Orders: {`${$databaseStore.stats.ordersToday}`}</span
					>
					<span
						class={'text-xs px-1.5 rounded-md ' +
							($databaseStore.stats.ordersToday -
								$databaseStore.stats.ordersYesterday >
							0
								? 'bg-success/20 text-success'
								: $databaseStore.stats.ordersToday -
											$databaseStore.stats.ordersYesterday <
									  0
									? 'bg-error/20 text-error'
									: 'bg-borderColor/40 text-textSecondary')}
					>
						{$databaseStore.stats.ordersToday -
							$databaseStore.stats.ordersYesterday >
						0
							? `+${$databaseStore.stats.ordersToday - $databaseStore.stats.ordersYesterday}`
							: $databaseStore.stats.ordersToday -
								$databaseStore.stats.ordersYesterday}
					</span>
				</div>
				<div class="mt-1 text-xs text-textSecondary/80">
					Lifetime: {$databaseStore.stats.totalOrders}
				</div>
			</div>

			{#if $showQuestConfetti}
				<div use:confetti={{ particleCount: 200, force: 0.3 }} />
			{/if}

			<!-- Quests -->
			{#if $databaseStore.quests.find((quest) => quest.showingCompletion) || $databaseStore.quests.length > 0}
				<div class="  p-1 pt-4 border-t-2 border-info/10">
					{#if $databaseStore.quests.find((quest) => quest.showingCompletion)}
						{@const completedQuest = $databaseStore.quests.find(
							(quest) => quest.showingCompletion,
						)}
						{#if completedQuest}
							<h3 class="text-lg font-bold text-success">Quest Completed!</h3>
							<div class="text-sm text-textPrimary flex flex-col">
								<span class="font-semibold text-success"
									>{completedQuest.name}</span
								>
								{#if completedQuest.description}
									<span class="text-xs text-lightAccent"
										>{completedQuest.description}</span
									>
								{/if}
								{#if completedQuest.reward.popularity > 0 && completedQuest.reward.cash > 0}
									<span class="text-xs text-info mt-1"
										>Reward: ${completedQuest.reward.cash} + {completedQuest
											.reward.popularity} popularity</span
									>
								{:else if completedQuest.reward.popularity > 0}
									<span class="text-xs text-info mt-1"
										>Reward: {completedQuest.reward.popularity} popularity</span
									>
								{:else}
									<span class="text-xs text-info mt-1"
										>Reward: ${completedQuest.reward.cash}</span
									>
								{/if}
							</div>
						{/if}
					{:else}
						<div class="flex-row flex justify-between items-center">
							<h3 class="text-sm font-semibold text-subheading">Quests</h3>
							<p class="text-xs text-textSecondary/80">Hover to see reward</p>
						</div>
						{@const incompleteQuests = $databaseStore.quests.filter(
							(quest) => !quest.completed,
						)}
						{@const completedQuests = $databaseStore.quests.filter(
							(quest) => quest.completed,
						)}
						{@const allQuests = [...incompleteQuests, ...completedQuests]}

						{#if allQuests.length > 0}
							<div class="text-sm text-textPrimary flex flex-col gap-1 mt-2">
								{#each allQuests as quest}
									<div
										class="flex flex-row items-start gap-2 tooltip tooltip-top"
										data-tip={`${quest.reward.cash > 0 ? `$${quest.reward.cash}` : ''}${quest.reward.cash > 0 && quest.reward.popularity > 0 ? ' + ' : ''}${quest.reward.popularity > 0 ? `${quest.reward.popularity} popularity` : ''}`}
									>
										<div
											class="w-4 h-4 border border-textPrimary {quest.completed
												? 'opacity-20'
												: ''} rounded-sm bg-cardBackground/40 flex items-center justify-center flex-shrink-0 ml-1 mt-0.5"
										>
											{#if quest.completed}
												<span class="text-xs text-success">✓</span>
											{/if}
										</div>
										<div class="flex flex-col">
											<span
												class=" text-xs font-medium text-start {quest.completed
													? 'line-through text-success/80 opacity-50'
													: 'text-textPrimary'}">{quest.name}</span
											>
											{#if quest.description}
												<span
													class="text-xs text-textSecondary/80 leading-tight {quest.completed
														? 'line-through'
														: ''}">{quest.description}</span
												>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						{/if}
					{/if}
				</div>
			{/if}
		</div>
	</div>

	<TutorialOverlay />
	<DeveloperModal />

	<!-- Custom cursor -->
	{#if isCustomCursorActive}
		<div
			class="custom-cursor {isPointerMode ? 'pointer' : ''}"
			style="left: {cursorX}px; top: {cursorY}px;"
		></div>
	{/if}
</div>
