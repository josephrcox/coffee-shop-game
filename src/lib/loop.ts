import { get } from 'svelte/store';
import {
	databaseStore,
	paused,
	showEndOfDay,
	endOfDayMessages,
	showQuestConfetti,
} from './store';
import {
	generateOrder,
	startGame,
	workOnOrder,
	calculateTotalDemand,
} from './utils';
import type { db, quest } from './objects/types';
import { quests } from './objects/types';

export function gameLoop() {
	if (get(showEndOfDay)) return;
	if (get(paused)) return;
	let db = get(databaseStore);
	db.tick += 1;

	if (db.staff.length === 0) {
		db = startGame(db);
		databaseStore.set(db);
		return;
	}

	// Update total demand from current menu
	db.totalDemand = calculateTotalDemand(db.menu);

	// Calculate order chance based on both popularity and demand
	const popularityFactor = Math.pow(db.popularity / 100, 6);
	const demandFactor = db.totalDemand / 100; // Normalize to drip coffee baseline (100)
	const baseDemandMultiplier = Math.min(2.0, Math.max(0.1, demandFactor)); // Cap between 0.1x and 2.0x
	const finalOrderChance =
		(0.015 + popularityFactor * 0.6) * baseDemandMultiplier;

	if (Math.random() < finalOrderChance) {
		const newOrder = generateOrder();
		if (newOrder) {
			db.orders.push(newOrder);
		}
	}

	// 1. Assign each unassigned order to a free employee, ensuring no two employees get the same order
	const assignedOrderIds = new Set(
		db.staff.map((e) => e.currentOrder).filter(Boolean),
	);
	const freeEmployees = db.staff.filter((e) => e.currentOrder === null);
	const unassignedOrders = db.orders.filter(
		(o) => o.completion < 100 && !assignedOrderIds.has(o.id),
	);

	for (
		let i = 0;
		i < Math.min(freeEmployees.length, unassignedOrders.length);
		i++
	) {
		freeEmployees[i].currentOrder = unassignedOrders[i].id;
	}

	// 2. Track wait time for all unassigned orders
	unassignedOrders.forEach((order) => {
		order.ticksToComplete += 1;
	});

	// 3. Progress work for each employee with a current order
	db.staff.forEach((employee) => {
		if (employee.currentOrder !== null) {
			const order = db.orders.find((o) => o.id === employee.currentOrder);
			if (order) {
				order.ticksToComplete += 1;
				db = workOnOrder(order, db);
			}
		}
	});

	if (db.tick % 1000 === 0) {
		// Start of day! :)
		const totalWages = db.staff.reduce(
			(sum, employee) => sum + employee.dailyWage,
			0,
		);

		// Calculate changes from yesterday
		db.stats.popularityChange = db.popularity - db.stats.popularityYesterday;
		db.stats.ordersChange = db.stats.totalOrders - db.stats.ordersYesterday;

		// Yesterday's net profit = Today's revenue - today's expenses - today's wages
		db.stats.profitYesterday =
			db.stats.revenueToday - db.stats.expensesToday - totalWages;
		db.stats.ordersYesterday = db.orders.filter(
			(o) => o.completion >= 100,
		).length;

		// --- Happiness Calculation ---
		const happinessMessages: string[] = [];
		db.staff.forEach((employee) => {
			if (!employee.dailyMenuItemsMade) {
				employee.dailyMenuItemsMade = [];
			}

			const uniqueItemsMade = new Set(employee.dailyMenuItemsMade).size;
			const desiredUniqueItems = Math.floor(employee.experience / 100);

			if (uniqueItemsMade >= desiredUniqueItems) {
				employee.happiness += 0.01;
			} else {
				const diff = desiredUniqueItems - uniqueItemsMade;
				employee.happiness -= 0.005 * diff;
				happinessMessages.push(
					`${employee.name} is feeling under-challenged and desires more variety in their daily tasks.`,
				);
			}
			employee.happiness = Math.max(0, Math.min(2, employee.happiness));
		});
		endOfDayMessages.set(happinessMessages);

		if (db.tick > 5000) {
			db.inventory.forEach((item) => {
				// if you have >1 of the item, you lose 10% of the items.
				if (item.quantity > 1) {
					const loss = Math.floor(item.quantity * 0.1);
					item.quantity -= loss;
				}
			});
		}

		// Pay staff wages
		db.cash -= totalWages;

		// Reset for new day
		db.orders = [];
		db.staff.forEach((employee) => {
			employee.currentOrder = null;
			employee.dailyMenuItemsMade = [];
		});

		// Store yesterday's popularity for next day's comparison
		db.stats.popularityYesterday = db.popularity;

		// Reset daily stats
		db.stats.revenueToday = 0;
		db.stats.expensesToday = 0;
		db.stats.profitToday = 0;
		db.stats.ordersToday = 0;

		// Set new starting cash for next day (after wages deducted)
		db.startingCash = db.cash;
		showEndOfDay.set(true);
	}

	db.quests.forEach((q: quest) => {
		console.log(JSON.stringify(q));
		// Look up the original quest definition to get the isCompleted function
		const originalQuest = quests.find((original) => original.id === q.id);
		if (
			!q.completed &&
			originalQuest &&
			originalQuest.isCompleted &&
			originalQuest.isCompleted(db) &&
			!q.showingCompletion
		) {
			q.showingCompletion = true;
			showQuestConfetti.set(true);
			setTimeout(() => {
				const currentDb = get(databaseStore);
				const currentQuest = currentDb.quests.find(
					(quest) => quest.id === q.id,
				);
				if (currentQuest) {
					currentDb.cash += currentQuest.reward.cash;
					currentDb.popularity += currentQuest.reward.popularity;
					currentQuest.completed = true;
					currentQuest.showingCompletion = false;
					databaseStore.set(currentDb);
					if (originalQuest?.onCompleted) {
						originalQuest.onCompleted(currentDb);
					}
				}
				showQuestConfetti.set(false);
			}, 5000);
		}
	});

	// Update profit today in real-time
	db.stats.profitToday = db.stats.revenueToday - db.stats.expensesToday;

	db = fixVariables(db);

	databaseStore.set(db);
}

function fixVariables(game: db) {
	// For each employee, if their experience is greater than 1000, set it to 1000
	game.staff.forEach((employee: { experience: number }) => {
		employee.experience = Math.round(Math.min(employee.experience, 1000));
	});
	game.popularity = Math.min(100, Math.max(0, game.popularity));

	// Ensure totalDemand is properly calculated for existing saves
	if (game.totalDemand === undefined || game.totalDemand === null) {
		game.totalDemand = calculateTotalDemand(game.menu);
	}
	game.cash = Math.round(game.cash);

	// Initialize ordersToday for backwards compatibility
	if (game.stats.ordersToday === undefined) {
		game.stats.ordersToday = 0;
	}

	return game;
}

export function start() {
	gameLoop();
	setInterval(gameLoop, 200);
}
