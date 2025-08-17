<script lang="ts">
	import { paused } from './store';

	export let show: boolean = false;
	export let title: string;
	export let subtitle: string = '';
	export let icon: string = '';
	export let onClose: () => void;
</script>

{#if show}
	<!-- Fullscreen Modal -->
	<div class="fixed inset-0 bg-mainBackground z-50 flex flex-col">
		<!-- Header -->
		<div
			class="bg-gradient-to-r from-cardBackground to-modalBackground shadow-2xl px-8 py-6 border-b-2 border-accent/30"
		>
			<div class="flex items-center justify-between max-w-7xl mx-auto">
				<div class="flex items-center gap-4">
					{#if icon}
						<div class="text-5xl">{icon}</div>
					{/if}
					<div>
						<h1 class="text-3xl font-bold text-accent">{title}</h1>
						{#if subtitle}
							<p class="text-textSecondary">{subtitle}</p>
						{/if}
					</div>
				</div>
				<div class="flex items-center gap-4">
					<!-- Header extra content slot -->
					<slot name="headerExtra" />
					<button
						class="btn bg-special hover:bg-special/80 text-textPrimary border-special/50 gap-2 text-lg px-6 py-3"
						on:click={() => {
							$paused = false;
							onClose();
						}}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10 19l-7-7m0 0l7-7m-7 7h18"
							/>
						</svg>
						Back to Game
					</button>
				</div>
			</div>
		</div>

		<!-- Tabs (optional) -->
		<slot name="tabs" />

		<!-- Main Content -->
		<div class="flex-1 p-8 overflow-y-auto">
			<div class="max-w-7xl mx-auto">
				<slot name="content" />
			</div>
		</div>

		<!-- Footer (optional) -->
		<slot name="footer" />
	</div>
{/if}
