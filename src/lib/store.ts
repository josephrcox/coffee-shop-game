import { writable, get as getStore } from 'svelte/store';
import { tutorial } from './tutorial';
import {
	quests,
	type db,
	type employee,
	type ownedEquipmentItem,
	type menuItem,
	Ingredient,
	Equipment,
} from './objects/types';
import { calculateTotalDemand } from './utils';

const DB_NAME = 'the-grind-db';

export const DEFAULT_DB: db = {
	tick: 1000,
	managers: [],
	staff: [],
	cash: 500,
	orders: [],
	popularity: 25, // 0-100
	totalDemand: 0, // Starting with drip coffee baseline
	inventory: [],
	quests: quests,
	menu: [],
	ownedEquipment: [
		{
			name: Equipment.DRIP_COFFEE_MACHINE,
			cost: 200,
			quality: 100,
			durability: 0.08,
			failureChance: 0.005,
			upgrades: [
				{
					cost: 2000,
					speedMultiplier: 1.25,
					purchased: false,
					description: 'Hot-plate. 25% faster to pour.',
				},
			],
		},
	],
	stats: {
		totalOrders: 0,
		ordersYesterday: 0,
		ordersToday: 0,
		profitToday: 0,
		profitYesterday: 0,
		revenueToday: 0,
		expensesToday: 0,
		popularityYesterday: 50,
		popularityChange: 0,
		ordersChange: 0,
	},
	startingCash: 0,
};

// Migration function to fix old saves
function migrateDatabase(loadedDb: any): db {
	// Create a complete database by merging with defaults
	const migratedDb: db = {
		...DEFAULT_DB,
		...loadedDb,
		// Ensure managers array exists
		managers: loadedDb.managers || [],
		// Ensure all stats fields exist
		stats: {
			...DEFAULT_DB.stats,
			...loadedDb.stats,
		},
	};

	// Apply the same fixes as in loop.ts
	if (migratedDb.totalDemand === undefined || migratedDb.totalDemand === null) {
		migratedDb.totalDemand = calculateTotalDemand(migratedDb.menu);
	}

	migratedDb.cash = Math.round(migratedDb.cash);
	migratedDb.popularity = Math.min(100, Math.max(0, migratedDb.popularity));

	return migratedDb;
}

function loadDatabaseFromStorage(): db {
	const stored = localStorage.getItem(DB_NAME);
	if (stored) {
		try {
			const parsed = JSON.parse(stored);
			return migrateDatabase(parsed);
		} catch (e) {
			console.warn('Failed to parse localStorage, using default database');
			return DEFAULT_DB;
		}
	}
	return DEFAULT_DB;
}

export const databaseStore = writable<db>(loadDatabaseFromStorage());

// Prevent multiple localStorage subscriptions during HMR
let storeUnsubscribe: (() => void) | null = null;

function setupStoreSubscription() {
	// Clean up existing subscription
	if (storeUnsubscribe) {
		storeUnsubscribe();
	}

	// Create new subscription
	storeUnsubscribe = databaseStore.subscribe((value) => {
		localStorage.setItem(DB_NAME, JSON.stringify(value));
	});
}

// Setup initial subscription
setupStoreSubscription();

// Cleanup when the module is hot-reloaded
if (import.meta.hot) {
	import.meta.hot.dispose(() => {
		if (storeUnsubscribe) {
			storeUnsubscribe();
			storeUnsubscribe = null;
		}
	});

	// Re-setup subscription after HMR
	import.meta.hot.accept(() => {
		setupStoreSubscription();
	});
}

export const showEndOfDay = writable<boolean>(false);
const initialTutorial = getStore(tutorial);
export const paused = writable<boolean>(
	initialTutorial.active && (initialTutorial.step ?? 0) < 4 ? true : false,
);
export const currentTip = writable<string>('');
export const endOfDayMessages = writable<string[]>([]);
export const showQuestConfetti = writable<boolean>(false);

// Game speed setting (in milliseconds)
export const gameSpeed = writable<number>(200);

// UI state persistence for modal visibility
const UI_STATE_KEY = 'the-grind-ui';
type UiState = {
	showHiringModal?: boolean;
	showShopModal?: boolean;
	showMenuPage?: boolean;
	showStaffDetailModal?: boolean;
	showDeveloperModal?: boolean;
	showPriceAdjustmentModal?: boolean;
};

function loadUiStateFromStorage(): UiState {
	try {
		const stored = localStorage.getItem(UI_STATE_KEY);
		if (stored) return JSON.parse(stored);
	} catch {}
	return {};
}

const uiInitial = loadUiStateFromStorage();
// Detect if UI state existed before; if not, avoid auto-opening modals on first load
export const hadPreviousUiState = !!localStorage.getItem(UI_STATE_KEY);

// Modal visibility stores
export const showHiringModal = writable<boolean>(!!uiInitial.showHiringModal);
export const showShopModal = writable<boolean>(!!uiInitial.showShopModal);
export const showMenuPage = writable<boolean>(!!uiInitial.showMenuPage);
export const showStaffDetailModal = writable<boolean>(
	!!uiInitial.showStaffDetailModal,
);
export const showDeveloperModal = writable<boolean>(
	!!uiInitial.showDeveloperModal,
);
export const showPriceAdjustmentModal = writable<boolean>(
	!!uiInitial.showPriceAdjustmentModal,
);

// Modal data stores
export const selectedEmployee = writable<employee | null>(null);
export const selectedMenuItem = writable<menuItem | null>(null);

// Keep the game paused while the tutorial is active; unpause when it finishes
let tutorialPauseUnsubscribe: (() => void) | null = null;
let pausedEnforceUnsubscribe: (() => void) | null = null;

function setupTutorialPauseSubscription() {
	if (tutorialPauseUnsubscribe) {
		tutorialPauseUnsubscribe();
	}
	// When tutorial is active, force paused = true; when inactive, default to false
	tutorialPauseUnsubscribe = tutorial.subscribe((t) => {
		// Keep paused only for early steps (< 4). From step 4 onwards, auto-unpause.
		const shouldPause = t.active && (t.step ?? 0) < 4;
		paused.set(shouldPause);
	});
}

setupTutorialPauseSubscription();

function setupPausedEnforceSubscription() {
	if (pausedEnforceUnsubscribe) {
		pausedEnforceUnsubscribe();
	}
	pausedEnforceUnsubscribe = paused.subscribe((isPaused) => {
		// If tutorial is active and still in early steps, ensure paused stays true
		const t = getStore(tutorial);
		if (t.active && (t.step ?? 0) < 4 && !isPaused) {
			paused.set(true);
		}
	});
}

setupPausedEnforceSubscription();

// Persist UI modal states
let uiUnsubscribes: Array<() => void> = [];

function writeUiState() {
	const value: UiState = {
		showHiringModal: getStore(showHiringModal),
		showShopModal: getStore(showShopModal),
		showMenuPage: getStore(showMenuPage),
		showStaffDetailModal: getStore(showStaffDetailModal),
		showDeveloperModal: getStore(showDeveloperModal),
		showPriceAdjustmentModal: getStore(showPriceAdjustmentModal),
	};
	try {
		localStorage.setItem(UI_STATE_KEY, JSON.stringify(value));
	} catch {}
}

function setupUiStateSubscriptions() {
	// Cleanup existing subscriptions
	uiUnsubscribes.forEach((u) => u());
	uiUnsubscribes = [];

	uiUnsubscribes.push(
		showHiringModal.subscribe(() => writeUiState()),
		showShopModal.subscribe(() => writeUiState()),
		showMenuPage.subscribe(() => writeUiState()),
		showStaffDetailModal.subscribe(() => writeUiState()),
		showDeveloperModal.subscribe(() => writeUiState()),
		showPriceAdjustmentModal.subscribe(() => writeUiState()),
	);
}

setupUiStateSubscriptions();

if (import.meta.hot) {
	import.meta.hot.dispose(() => {
		if (tutorialPauseUnsubscribe) {
			tutorialPauseUnsubscribe();
			tutorialPauseUnsubscribe = null;
		}
		if (pausedEnforceUnsubscribe) {
			pausedEnforceUnsubscribe();
			pausedEnforceUnsubscribe = null;
		}
		uiUnsubscribes.forEach((u) => u());
		uiUnsubscribes = [];
	});

	import.meta.hot.accept(() => {
		setupTutorialPauseSubscription();
		setupPausedEnforceSubscription();
		setupUiStateSubscriptions();
	});
}
