import { get } from 'svelte/store';
import {
	databaseStore,
	paused,
	showEndOfDay,
	endOfDayMessages,
	showQuestConfetti,
	gameSpeed,
} from './store';
import {
	generateOrder,
	startGame,
	workOnOrder,
	calculateTotalDemand,
	checkWageHealth,
	updateMarketPrices,
	autoRestockInventory,
	calculateDailyCafeCosts,
} from './utils';
import type { db, quest } from './objects/types';
import { quests, Trait } from './objects/types';

let intervalId: NodeJS.Timeout | null = null;
let musicInitialized = false;

export function gameLoop() {
	if (get(showEndOfDay)) return;
	if (get(paused)) return;

	// Initialize background music on first game tick
	if (!musicInitialized) {
		import('./store').then(({ initializeBackgroundMusic }) => {
			initializeBackgroundMusic();
			musicInitialized = true;
		});
	}

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
	// Both factors contribute linearly and multiplicatively
	const popularityFactor = db.popularity / 100; // Linear 0-1 scale
	const demandFactor = Math.max(0.5, db.totalDemand / 100); // Minimum 0.5, baseline at 1
	const baseChance = 0.1; // 8% base chance when both are at good levels
	let finalOrderChance = baseChance * popularityFactor * demandFactor * db.vibe;

	// if db.orders.length < 3, override chance to 20%
	if (db.orders.length < 3) {
		finalOrderChance = 0.2;
	}

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

	// Auto-restock inventory if inventory manager is present
	db = autoRestockInventory(db);

	// 3. Progress work for each employee with a current order
	db.staff.forEach((employee) => {
		if (employee.currentOrder !== null) {
			const order = db.orders.find((o) => o.id === employee.currentOrder);
			if (order) {
				order.ticksToComplete += 1;
				db = workOnOrder(order, db);
			}
		}
		if (employee.dailyWage > 0) {
			const wageIncrease = checkWageHealth(employee);
			if (wageIncrease > 0) {
				console.log(employee.name + ' wants a raise of ' + wageIncrease);
			}
		}
	});

	// Legacy weekly cafe cost billing removed; handled daily at rollover

	if (db.tick % 1000 === 0) {
		// Start of day! :)

		// Update market prices for menu items
		db = updateMarketPrices(db);

		const staffWages = db.staff.reduce(
			(sum, employee) => sum + employee.dailyWage,
			0,
		);
		const managerWages = db.managers.reduce(
			(sum, manager) => sum + manager.dailyWage,
			0,
		);
		const totalWages = staffWages + managerWages;

		// Calculate changes from yesterday
		db.stats.popularityChange = db.popularity - db.stats.popularityYesterday;
		db.stats.ordersChange = db.stats.totalOrders - db.stats.ordersYesterday;

		// Yesterday's net profit = revenue - expenses - wages - cafe daily costs
		const dailyCafeCosts = calculateDailyCafeCosts(db);
		db.stats.profitYesterday =
			db.stats.revenueToday -
			db.stats.expensesToday -
			totalWages -
			dailyCafeCosts;
		db.stats.ordersYesterday = db.orders.filter(
			(o) => o.completion >= 100,
		).length;

		// --- Happiness Calculation ---
		const happinessMessages: string[] = [];
		db.staff.forEach((employee) => {
			if (employee.dailyWage == 0) {
				return;
			}
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
					`${employee.name}: I am feeling under-challenged.`,
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

		db.managers.forEach((manager) => {
			if (
				manager.trait === Trait.GENERAL ||
				manager.trait === Trait.FINANCIAL
			) {
				manager.experience += Math.floor(Math.random() * 5);
			}
		});

		// Pay staff wages and cafe daily costs
		db.cash -= totalWages;
		db.cash -= dailyCafeCosts;

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
			// play ding sound
			const ding = new Audio('/ding.mp3');
			ding.volume = 0.5;
			ding.play();
			showQuestConfetti.set(true);
			// Track when quest completion started (safer than setTimeout)
			if (!q.completionStartTick) {
				q.completionStartTick = db.tick;
			}
		}

		// Handle quest completion after 5 seconds (5 ticks at normal speed)
		if (
			q.showingCompletion &&
			q.completionStartTick &&
			db.tick - q.completionStartTick >= 30
		) {
			q.completed = true;
			q.showingCompletion = false;
			q.completionStartTick = undefined;
			db.cash += q.reward.cash;
			db.popularity += q.reward.popularity;
			showQuestConfetti.set(false);
			if (originalQuest?.onCompleted) {
				originalQuest.onCompleted(db);
			}
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

	// fix game stats profits
	game.stats.profitToday = Math.round(game.stats.profitToday);
	game.stats.profitYesterday = Math.round(game.stats.profitYesterday);
	game.stats.revenueToday = Math.round(game.stats.revenueToday);
	game.stats.expensesToday = Math.round(game.stats.expensesToday);

	// Limit employee happiness to 100
	game.staff.forEach((employee) => {
		employee.happiness = Math.min(2.0, Math.max(0.1, employee.happiness));
	});

	return game;
}

export function start() {
	gameLoop();

	// Clear any existing interval
	if (intervalId) {
		clearInterval(intervalId);
	}

	// Start with current speed
	intervalId = setInterval(gameLoop, get(gameSpeed));

	// Subscribe to speed changes and restart interval
	gameSpeed.subscribe((speed) => {
		if (intervalId) {
			clearInterval(intervalId);
		}
		intervalId = setInterval(gameLoop, speed);
	});
}
