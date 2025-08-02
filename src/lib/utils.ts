import { databaseStore, currentTip } from './store';
import { get } from 'svelte/store';
import {
	possibleMenuItems,
	purchasableEquipment,
	type db,
	type employee,
	type order,
	type menuItem,
	purchasableItems,
	quests,
} from './objects/types';

let randomFirstNames = [
	'Alex',
	'Jordan',
	'Taylor',
	'Casey',
	'Morgan',
	'Riley',
	'Quinn',
	'Avery',
	'Blake',
	'Dakota',
	'Parker',
	'Hayden',
	'Reese',
	'Sage',
	'Rowan',
];
let randomLastNames = [
	'Smith',
	'Johnson',
	'Williams',
	'Brown',
	'Jones',
	'Garcia',
	'Miller',
	'Davis',
	'Rodriguez',
	'Martinez',
	'Anderson',
	'Taylor',
	'Thomas',
	'Hernandez',
	'Moore',
];

export function generateCustomerName(): string {
	return randomFirstNames[Math.floor(Math.random() * randomFirstNames.length)];
}

export function calculateTotalDemand(menu: menuItem[]): number {
	return menu.reduce((total, item) => total + item.demand, 0);
}

export function updateTotalDemand(game: db): db {
	game.totalDemand = calculateTotalDemand(game.menu);
	return game;
}

export function startGame(game: db): db {
	const name = prompt('Enter your name');
	if (name) {
		const firstEmployee = {
			name: name,
			dailyWage: 0,
			experience: Math.floor(Math.random() * 250 + 250),
			currentOrder: null,
			menuItemProficiency: {},
			happiness: 1.0,
			dailyMenuItemsMade: [],
		};
		game.staff.push(firstEmployee);
	}
	for (const item of possibleMenuItems) {
		if (item.default) {
			game.menu.push(item);
		}
	}
	// Calculate initial total demand from menu items
	game.totalDemand = calculateTotalDemand(game.menu);

	// Initialize profit tracking
	game.stats.profitToday = 0;
	game.stats.profitYesterday = 0;
	game.stats.popularityYesterday = game.popularity;
	game.stats.popularityChange = 0;
	game.stats.ordersChange = 0;
	game.startingCash = game.cash;
	game.quests = quests;
	return game;
}

export function workOnOrder(order: order, game: db): db {
	// Find the employee working on this order
	const employee = game.staff.find((e) => e.currentOrder === order.id);
	if (!employee) return game;

	const currentItem = order.items[0];
	if (!currentItem) return game; // Should not happen if order is managed correctly

	// Check for required equipment
	let totalSpeedMultiplier = 1.0;
	if (currentItem.requires) {
		for (const req of currentItem.requires) {
			const ownedEquipment = game.ownedEquipment.find((eq) => eq.name === req);
			if (!ownedEquipment) {
				return game; // Missing equipment
			}

			let equipmentFailureChanceMultiplier = 1.0;
			if (ownedEquipment.upgrades) {
				for (const upgrade of ownedEquipment.upgrades) {
					if (upgrade.purchased) {
						if (upgrade.speedMultiplier) {
							totalSpeedMultiplier *= upgrade.speedMultiplier;
						}
						if (upgrade.failureChance) {
							equipmentFailureChanceMultiplier *= upgrade.failureChance;
						}
					}
				}
			}

			const equipmentSpec = purchasableEquipment.find((e) => e.name === req);
			if (equipmentSpec && equipmentSpec.failureChance) {
				if (
					Math.random() <
					equipmentSpec.failureChance * equipmentFailureChanceMultiplier
				) {
					return game; // Equipment failed, no progress
				}
			}
		}
	}

	const requiredIngredients = currentItem.ingredients;
	// Check if all required ingredients are available
	for (const ingredient in requiredIngredients) {
		const inv = game.inventory.find((item) => item.name === ingredient);
		if (
			!inv ||
			inv.quantity <
				requiredIngredients[ingredient as keyof typeof requiredIngredients]
		) {
			return game;
		}
	}

	// Progress work on the current item
	if (order.completion < 100) {
		// Progress calculation - adjusted for faster completion times
		const baseProgress = (employee.experience / 100) * 5.2;
		const complexityPenalty = 1 - (currentItem.complexity - 1) * 0.1;
		const proficiencyCount =
			employee.menuItemProficiency?.[currentItem.name] || 0;
		const proficiencyMultiplier = Math.min(
			2.5,
			0.012 * Math.pow(proficiencyCount, 0.68) + 0.5,
		);
		const happinessMultiplier = employee.happiness || 1.0;
		const progress =
			baseProgress *
			complexityPenalty *
			proficiencyMultiplier *
			happinessMultiplier *
			totalSpeedMultiplier;
		order.completion =
			Math.round(Math.min(100, order.completion + progress) * 10) / 10;

		// Sync order completion in db.orders
		const dbOrder = game.orders.find((o) => o.id === order.id);
		if (dbOrder) dbOrder.completion = order.completion;

		return game;
	}

	// Current item is completed!
	if (order.completion >= 100) {
		// Consume ingredients for the completed item
		for (const ingredient in requiredIngredients) {
			const numRequired =
				requiredIngredients[ingredient as keyof typeof requiredIngredients];
			const inv = game.inventory.find((item) => item.name === ingredient);
			if (inv) {
				inv.quantity -= numRequired;
			}
		}
		game.cash += currentItem.price;
		game.stats.revenueToday += currentItem.price;

		if (Math.random() < 0.2) {
			employee.experience += currentItem.complexity * 0.5;
		}

		// Update proficiency
		if (!employee.menuItemProficiency) {
			employee.menuItemProficiency = {};
		}
		employee.menuItemProficiency[currentItem.name] =
			(employee.menuItemProficiency[currentItem.name] || 0) + 1;

		// Track item made for happiness calculation
		if (!employee.dailyMenuItemsMade) {
			employee.dailyMenuItemsMade = [];
		}
		employee.dailyMenuItemsMade.push(currentItem.name);

		// Degrade equipment
		const requiredEquipment = currentItem.requires;
		if (requiredEquipment) {
			for (const equipmentName of requiredEquipment) {
				const ownedEquipment = game.ownedEquipment.find(
					(eq) => eq.name === equipmentName,
				);
				if (
					ownedEquipment &&
					ownedEquipment.quality > 0 &&
					Math.random() < ownedEquipment.durability
				) {
					ownedEquipment.quality -= 1;
				}
			}
		}

		// Remove completed item from the queue
		order.items.shift();

		// If there are more items, reset completion and continue
		if (order.items.length > 0) {
			order.completion = 0;
			return game;
		}

		// --- ENTIRE ORDER IS COMPLETE ---
		const originalOrderItems = order.originalItems || [currentItem]; // Fallback for old saves

		// Calculate customer satisfaction based on total completion time
		const employeeProgress = (employee.experience / 100) * 7.5;
		const totalExpectedTicks = originalOrderItems.reduce((total, item) => {
			const complexityPenalty = 1 - (item.complexity - 1) * 0.1;
			const expectedProgress = employeeProgress * complexityPenalty;
			return total + Math.ceil(100 / expectedProgress);
		}, 0);

		const timeRatio = order.ticksToComplete / totalExpectedTicks;
		const patienceFactor = order.customerPatience / 250;
		let popularityExpectationMultiplier;
		if (game.popularity < 65) {
			popularityExpectationMultiplier = 0.6 + (game.popularity / 50) * 0.55;
		} else {
			popularityExpectationMultiplier =
				0.85 + ((game.popularity - 50) / 50) * 0.45;
		}

		const experienceBonus = Math.min(0.3, (employee.experience - 100) / 900);
		const baseFastThreshold =
			(0.8 + experienceBonus) * popularityExpectationMultiplier;
		const baseSlowThreshold =
			(1.5 + experienceBonus) * popularityExpectationMultiplier;

		const fastThreshold = baseFastThreshold * patienceFactor;
		const slowThreshold = baseSlowThreshold * patienceFactor;

		if (timeRatio <= fastThreshold) {
			const experienceRatio = employee.experience / 500;
			const baseChance = Math.min(0.4, 0.1 + experienceRatio * 0.15);

			let popularityModifier;
			if (game.popularity < 50) {
				const lowPopularityBonus = (50 - game.popularity) * 0.4;
				popularityModifier = 1 + lowPopularityBonus / 100;
			} else {
				const popularityPenalty = Math.pow((game.popularity - 50) / 50, 1.5);
				popularityModifier = 1 - popularityPenalty * 0.4;
			}
			const finalChance = baseChance * popularityModifier;

			const complexityBonus =
				(originalOrderItems.reduce((sum, i) => sum + i.complexity, 0) /
					originalOrderItems.length -
					1) *
				0.03;
			const patienceBonus = ((order.customerPatience - 400) / 600) * 0.05;
			const totalChance = Math.max(
				0.05,
				finalChance + complexityBonus + patienceBonus,
			);

			if (Math.random() < totalChance) {
				game.popularity += 1;
			}
		} else if (timeRatio > slowThreshold) {
			const experienceRatio = employee.experience / 500;
			const baseChance = Math.max(0.3, 0.6 - experienceRatio * 0.2);

			let popularityBonus;
			if (game.popularity < 50) {
				popularityBonus = (50 - game.popularity) * 1.2;
			} else {
				popularityBonus = ((100 - game.popularity) / 100) * 0.3;
			}
			const finalChance = baseChance - popularityBonus;

			if (Math.random() < finalChance) {
				game.popularity -= 1;
				currentTip.set(
					`${order.customer} got their order too slowly. Consider hiring more staff!`,
				);
			}
		} else {
			const neutralChance = 0.05;
			if (Math.random() < neutralChance) {
				if (Math.random() < 0.4) {
					game.popularity += 1;
				} else {
					game.popularity -= 1;
				}
			}
		}

		employee.currentOrder = null;
		game.stats.totalOrders += 1;
		game.stats.ordersToday += 1;
		return game;
	}

	return game;
}

export function generateOrder(): order | null {
	const db = get(databaseStore);
	const menuItems = db.menu;

	// Filter for items we have equipment and ingredients for
	const availableMenuItems = menuItems.filter((menuItem) => {
		if (menuItem.requires) {
			if (
				!menuItem.requires.every((req) =>
					db.ownedEquipment.some((eq) => eq.name === req),
				)
			) {
				return false;
			}
		}
		for (const ingredient in menuItem.ingredients) {
			const requiredAmount =
				menuItem.ingredients[ingredient as keyof typeof menuItem.ingredients];
			const invItem = db.inventory.find((item) => item.name === ingredient);
			if (!invItem || invItem.quantity < requiredAmount) {
				return false;
			}
		}
		return true;
	});

	if (availableMenuItems.length === 0) {
		return null;
	}

	const popularity = db.popularity;
	const multiItemChance = popularity / 200; // Max 50% at 100 popularity
	let orderItems: menuItem[] = [];

	if (Math.random() < multiItemChance) {
		const numItems = Math.floor(Math.random() * 2) + 2; // 2-3 items
		let tempInventory = JSON.parse(JSON.stringify(db.inventory));

		for (let i = 0; i < numItems; i++) {
			let eligibleItems = availableMenuItems.filter((menuItem) => {
				for (const ingredient in menuItem.ingredients) {
					const required =
						menuItem.ingredients[
							ingredient as keyof typeof menuItem.ingredients
						];
					const available =
						tempInventory.find((inv: any) => inv.name === ingredient)
							?.quantity || 0;
					if (available < required) return false;
				}
				return true;
			});

			if (eligibleItems.length === 0) break;

			const menuItem =
				eligibleItems[Math.floor(Math.random() * eligibleItems.length)];
			orderItems.push(menuItem);

			for (const ingredient in menuItem.ingredients) {
				const required =
					menuItem.ingredients[ingredient as keyof typeof menuItem.ingredients];
				let invItem = tempInventory.find((inv: any) => inv.name === ingredient);
				if (invItem) invItem.quantity -= required;
			}
		}
	}

	// If no multi-item order was created, create a single one
	if (orderItems.length === 0) {
		const menuItem =
			availableMenuItems[Math.floor(Math.random() * availableMenuItems.length)];
		orderItems.push(menuItem);
	}

	// Adjust customer patience based on popularity
	const currentPopularity = db.popularity;
	let patienceRange = 1000 - 400; // Default range
	let patienceMin = 400;

	if (currentPopularity < 50) {
		const patienceBoost = (50 - currentPopularity) * 8; // 0-200 boost
		patienceMin = 400 + patienceBoost;
		patienceRange = 1000 - patienceMin;
	}

	return {
		id: db.orders.length + Date.now(), // More unique ID
		customer: generateCustomerName(),
		items: [...orderItems],
		originalItems: [...orderItems],
		completion: 0,
		ticksToComplete: 0,
		customerPatience: Math.floor(Math.random() * patienceRange) + patienceMin,
	};
}

export function searchForEmployee(): employee[] {
	let availableEmployees: employee[] = [];
	for (let i = 0; i < 3; i++) {
		let experience = Math.floor(Math.random() * 1000 + 10);
		if (experience > 1000) experience = 1000;

		// Calculate salary based on experience with exponential scaling
		// Base salary: 50-80 for low experience
		// High experience (750+) should cost 300+
		const baseSalary = 50 + Math.floor(Math.random() * 31); // 50-80
		const experienceMultiplier = Math.pow(experience / 1000, 1.5); // Exponential scaling
		const experienceBonus = Math.floor(experienceMultiplier * 250); // Max 250 bonus at 1000 XP

		let employee = {
			name: generateCustomerName(),
			dailyWage: baseSalary + experienceBonus,
			experience: experience,
			currentOrder: null,
			menuItemProficiency: {},
			happiness: Math.random() * 1.2 + 0.4,
			dailyMenuItemsMade: [],
		};
		availableEmployees.push(employee);
	}

	return availableEmployees;
}

export function purchaseItem(
	itemName: string,
	quantity: number,
	cost: number,
	description: string,
): boolean {
	const db = get(databaseStore);

	// Check if player has enough money
	if (db.cash < cost) {
		return false;
	}

	// Deduct money and add to expenses
	db.cash -= cost;
	db.stats.expensesToday += cost;

	// Find existing inventory item or create new one
	const existing = db.inventory.find((i) => i.name === itemName);
	if (existing) {
		existing.quantity += quantity;
	} else {
		db.inventory = [
			...db.inventory,
			{
				name: itemName,
				description: description,
				quantity: quantity,
			},
		];
	}

	// Update the store to trigger reactivity
	databaseStore.set(db);
	return true;
}

export function repairEquipment(equipmentName: string): boolean {
	const db = get(databaseStore);

	// Find the equipment to repair
	const equipment = db.ownedEquipment.find((e) => e.name === equipmentName);
	if (!equipment) {
		return false;
	}

	const repairCost = equipment.cost / 8;

	// Check if player has enough money
	if (db.cash < repairCost) {
		return false;
	}

	// Deduct money and add to expenses
	db.cash -= repairCost;
	db.stats.expensesToday += repairCost;

	// Repair the equipment to full quality
	equipment.quality = 100;

	// Update the store to trigger reactivity
	databaseStore.set(db);
	return true;
}
