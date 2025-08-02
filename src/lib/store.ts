import { writable } from 'svelte/store';
import {
	quests,
	type db,
	type employee,
	type ownedEquipmentItem,
	Ingredient,
	Equipment,
} from './objects/types';

const DB_NAME = 'the-grind-db';

const DEFAULT_DB: db = {
	tick: 1000,
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

export const databaseStore = writable<db>(
	localStorage.getItem(DB_NAME)
		? JSON.parse(localStorage.getItem(DB_NAME) as string)
		: DEFAULT_DB,
);

databaseStore.subscribe((value) => {
	localStorage.setItem(DB_NAME, JSON.stringify(value));
});

export const showEndOfDay = writable<boolean>(false);
export const paused = writable<boolean>(false);
export const currentTip = writable<string>('');
export const endOfDayMessages = writable<string[]>([]);
export const showQuestConfetti = writable<boolean>(false);

// Modal visibility stores
export const showHiringModal = writable<boolean>(false);
export const showShopModal = writable<boolean>(false);
export const showMenuPage = writable<boolean>(false);
export const showStaffDetailModal = writable<boolean>(false);

// Modal data stores
export const selectedEmployee = writable<employee | null>(null);
