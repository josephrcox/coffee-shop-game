import { writable } from 'svelte/store';
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
	totalDemand: 100, // Starting with drip coffee baseline
	inventory: [
		{
			name: Ingredient.COFFEE_GROUNDS,
			description: 'For drip coffee',
			quantity: 10,
		},
	],
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
export const paused = writable<boolean>(false);
export const currentTip = writable<string>('');
export const endOfDayMessages = writable<string[]>([]);
export const showQuestConfetti = writable<boolean>(false);

// Game speed setting (in milliseconds)
export const gameSpeed = writable<number>(200);

// Modal visibility stores
export const showHiringModal = writable<boolean>(false);
export const showShopModal = writable<boolean>(false);
export const showMenuPage = writable<boolean>(false);
export const showStaffDetailModal = writable<boolean>(false);
export const showDeveloperModal = writable<boolean>(false);
export const showPriceAdjustmentModal = writable<boolean>(false);

// Modal data stores
export const selectedEmployee = writable<employee | null>(null);
export const selectedMenuItem = writable<menuItem | null>(null);
