import { databaseStore, currentTip, playerName } from './store';
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
	type manager,
	Trait,
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

export function generateName(trait?: Trait): string {
	let prefix = '';
	if (trait) {
		switch (trait) {
			case Trait.GENERAL:
				prefix = '👔 ';
				break;
			case Trait.FINANCIAL:
				prefix = '💰 ';
				break;
			case Trait.INVENTORY:
				prefix = '📦 ';
				break;
		}
	}
	return (
		prefix +
		randomFirstNames[Math.floor(Math.random() * randomFirstNames.length)]
	);
}

export function calculateTotalDemand(menu: menuItem[]): number {
	return menu.reduce((total, item) => {
		// Calculate demand adjustment based on price vs market price
		let adjustedDemand = item.demand;

		if (item.marketPrice > 0) {
			// Price ratio: how much current price differs from market price
			const priceRatio = item.price / item.marketPrice;

			// Inverse relationship: higher price = lower demand
			// If price is double market price (ratio = 2), demand becomes 50% (1/2)
			// Cap the adjustment to prevent extreme values
			const demandMultiplier = Math.max(0.1, Math.min(3.0, 1 / priceRatio));
			adjustedDemand = item.demand * demandMultiplier;
		}

		return total + adjustedDemand;
	}, 0);
}

export function updateTotalDemand(game: db): db {
	game.totalDemand = calculateTotalDemand(game.menu);
	return game;
}

export function hasManager(trait: Trait, game: db): boolean {
	return game.managers.some((manager) => manager.trait === trait);
}

export function startGame(game: db): db {
	const name = get(playerName) || 'You';
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
	game.managers = [];
	game.tick = 1001;
	return game;
}

export function workOnOrder(order: order, game: db): db {
	// Find the employee working on this order
	const employee = game.staff.find((e) => e.currentOrder === order.id);
	if (!employee) return game;

	const currentItem = order.items[0];
	if (!currentItem) return game; // Should not happen if order is managed correctly

	let hasGeneralManager = game.managers.some((m) => m.trait === Trait.GENERAL);

	// Check for required equipment
	let totalSpeedMultiplier = 1.0;
	if (hasGeneralManager) {
		// Get general manager's XP
		const generalManager = game.managers.find((m) => m.trait === Trait.GENERAL);
		if (generalManager) {
			if (generalManager.experience < 2000) {
				totalSpeedMultiplier *= 1.1;
			} else if (generalManager.experience < 4000) {
				totalSpeedMultiplier *= 1.3;
			} else if (generalManager.experience < 6000) {
				totalSpeedMultiplier *= 1.5;
			} else if (generalManager.experience < 8000) {
				totalSpeedMultiplier *= 1.7;
			} else {
				totalSpeedMultiplier *= 2.0;
			}
		}
	}
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
			employee.experience += currentItem.complexity * 0.1;
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
			if (game.popularity < 35) {
				const lowPopularityBonus = (35 - game.popularity) * 0.4;
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
			const patienceBonus = ((order.customerPatience - 400) / 600) * 0.04;
			const totalChance = Math.max(
				0.04,
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
				let rand = Math.random();
				const mehSound =
					rand < 0.25
						? new Audio('/meh1.mp3')
						: rand < 0.5
						? new Audio('/meh2.wav')
						: rand < 0.75
						? new Audio('/meh3.mp3')
						: new Audio('/meh4.wav');
				mehSound.currentTime = 0;
				mehSound.volume = 0.4;
				mehSound.play();
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
		// for (const ingredient in menuItem.ingredients) {
		// 	const requiredAmount =
		// 		menuItem.ingredients[ingredient as keyof typeof menuItem.ingredients];
		// 	const invItem = db.inventory.find((item) => item.name === ingredient);
		// 	if (!invItem || invItem.quantity < requiredAmount) {
		// 		return false;
		// 	}
		// }
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
	let patienceRange = 800 - 800; // Default range
	let patienceMin = 200;

	if (currentPopularity < 50) {
		const patienceBoost = (50 - currentPopularity) * 8; // 0-200 boost
		patienceMin = 400 + patienceBoost;
		patienceRange = 1000 - patienceMin;
	}

	return {
		id: db.orders.length + Date.now(), // More unique ID
		customer: generateName(),
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
		const baseSalary = 60 + Math.floor(Math.random() * 31);
		const experienceMultiplier = Math.pow(experience / 1000, 1.6); // Exponential scaling
		const experienceBonus = Math.floor(experienceMultiplier * 400); // Max 400 bonus at 1000 XP

		let employee = {
			name: generateName(),
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

export function searchForManagers(): manager[] {
	const db = get(databaseStore);
	const hiredTraits = db.managers.map((m) => m.trait);
	const availableTraits = Object.values(Trait).filter(
		(trait) => !hiredTraits.includes(trait),
	);

	if (availableTraits.length === 0) return [];

	const shuffledTraits = [...availableTraits].sort(() => Math.random() - 0.5);
	const numToGenerate = Math.min(3, availableTraits.length);

	return Array.from({ length: numToGenerate }, (_, i) => {
		const experience = Math.floor(Math.random() * 1000 + 10);
		const wage = Math.floor(
			Math.random() * 200 + Math.pow(experience / 1000, 1.5) * 400 + 100,
		);

		return {
			name: generateName(shuffledTraits[i]),
			dailyWage: wage,
			experience,
			happiness: Math.random() * 1.2 + 0.4,
			trait: shuffledTraits[i],
		};
	});
}

export function checkWageHealth(employee: employee): number {
	// This function checks if the wage of the employee and their experience is fair.
	// Calculate what their wage should be based on current experience level
	// Only suggest an increase if the difference is >15% of their current wage

	// Use the same formula as when hiring employees
	const baseSalary = 60 + 15; // Use middle of range (60-90) for consistency
	const experienceMultiplier = Math.pow(employee.experience / 1000, 1.6); // Match hiring formula
	const experienceBonus = Math.floor(experienceMultiplier * 400); // Match hiring formula
	const fairWage = baseSalary + experienceBonus;

	const currentWage = employee.dailyWage;
	const difference = fairWage - currentWage;

	const threshold = currentWage * 0.15; // 15% threshold for wage increases
	if (difference > threshold) {
		// Round to nearest 2
		return Math.round(difference / 2) * 2;
	}

	return 0; // No wage increase needed
}

export function purchaseItem(
	itemName: string,
	quantity: number,
	cost: number,
	description: string,
): boolean {
	// Use update method to properly trigger reactivity
	let success = false;

	databaseStore.update((db) => {
		// Check if player has enough money
		if (db.cash < cost) {
			return db;
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

		success = true;
		return db;
	});

	return success;
}

export function repairEquipment(equipmentName: string): boolean {
	// Use update method to properly trigger reactivity
	let success = false;

	databaseStore.update((db) => {
		// Find the equipment to repair
		const equipment = db.ownedEquipment.find((e) => e.name === equipmentName);
		if (!equipment) {
			return db;
		}

		const repairCost = equipment.cost / 8;

		// Check if player has enough money
		if (db.cash < repairCost) {
			return db;
		}

		// Deduct money and add to expenses
		db.cash -= repairCost;
		db.stats.expensesToday += repairCost;

		// Repair the equipment to full quality
		equipment.quality = 100;

		success = true;
		return db;
	});

	return success;
}

export function updateMenuItemPrice(
	itemName: string,
	newPrice: number,
): boolean {
	// Use update method to properly trigger reactivity
	let success = false;

	databaseStore.update((db) => {
		// Find the menu item to update
		const menuItem = db.menu.find((item) => item.name === itemName);
		if (!menuItem) {
			return db;
		}

		// Update the price
		menuItem.price = newPrice;

		success = true;
		return db;
	});

	return success;
}

export function calculateIngredientCost(menuItem: menuItem): number {
	let totalCost = 0;

	// Iterate through each ingredient in the menu item
	for (const ingredientName in menuItem.ingredients) {
		const quantityNeeded = menuItem.ingredients[ingredientName];

		// Find the purchasable item for this ingredient
		const purchasableItem = purchasableItems.find(
			(item) => item.name === ingredientName,
		);

		if (purchasableItem) {
			// Calculate cost per unit: total cost / quantity in package
			const costPerUnit = purchasableItem.cost / purchasableItem.quantity;
			// Add to total cost: cost per unit * quantity needed
			totalCost += costPerUnit * quantityNeeded;
		}
	}

	return totalCost;
}

export function updateMarketPrices(game: db): db {
	game.menu.forEach((menuItem) => {
		// Generate fluctuation with weighted randomness
		// 70% chance of small change (0-3%), 25% chance of medium (3-7%), 5% chance of large (7-10%)
		let fluctuationMagnitude: number;
		const rand = Math.random();

		if (rand < 0.7) {
			// Small change: 0-3%
			fluctuationMagnitude = Math.random() * 0.03;
		} else if (rand < 0.95) {
			// Medium change: 3-7%
			fluctuationMagnitude = 0.03 + Math.random() * 0.04;
		} else {
			// Large change: 7-10%
			fluctuationMagnitude = 0.07 + Math.random() * 0.03;
		}

		// Random direction (up or down)
		const direction = Math.random() < 0.5 ? -1 : 1;
		const fluctuation = direction * fluctuationMagnitude;

		// Apply the change
		const newPrice = menuItem.marketPrice * (1 + fluctuation);

		// Clamp between $1 and $10
		menuItem.marketPrice = Math.max(1, Math.min(10, newPrice));

		// Round to 2 decimal places
		menuItem.marketPrice = Math.round(menuItem.marketPrice * 100) / 100;
	});

	return game;
}

export function autoRestockInventory(game: db): db {
	// Check if inventory manager is present
	if (!hasManager(Trait.INVENTORY, game)) {
		return game;
	}

	// Calculate restock chance based on manager experience
	// Target timings: 200xp=~7sec, 500xp=~5sec, 1000xp=~1.5sec at normal speed (200ms/tick)
	const inventoryManager = game.managers.find(
		(m) => m.trait === Trait.INVENTORY,
	);

	if (!inventoryManager) {
		return game;
	}

	// Formula: waitTime in ticks = 50 - (experience - 200) * 0.034375
	// This gives: 200xp=50 ticks (10sec), 500xp=39.7 ticks (~8sec), 1000xp=22.5 ticks (~4.5sec)
	const experience = Math.max(200, Math.min(1000, inventoryManager.experience));
	const waitTimeInTicks = 50 - (experience - 200) * 0.034375;
	const restockChance = 1 / waitTimeInTicks;

	if (Math.random() > restockChance) {
		return game;
	}

	// Check each inventory item for restocking
	game.inventory.forEach((inventoryItem) => {
		if (inventoryItem.quantity < 10) {
			// Find the corresponding purchasable item
			const purchasableItem = purchasableItems.find(
				(item) => item.name === inventoryItem.name,
			);

			if (purchasableItem) {
				// Check if we can afford it and have required equipment
				const canAfford = game.cash >= purchasableItem.cost;

				// Check equipment requirements if any
				let hasRequiredEquipment = true;
				if (purchasableItem.requires) {
					const requiredEquipment = purchasableEquipment.find((e) =>
						purchasableItem.requires?.includes(e.name),
					);
					if (requiredEquipment) {
						hasRequiredEquipment = game.ownedEquipment.some(
							(e) => e.name === requiredEquipment.name,
						);
					}
				}

				// Auto-purchase if we can afford it and have required equipment
				if (canAfford && hasRequiredEquipment) {
					// Calculate how many to buy to reach at least 10
					const quantityNeeded = 10 - inventoryItem.quantity;
					const purchaseQuantity = purchasableItem.quantity;

					// Buy enough packages to reach the minimum
					const packagesToBuy = Math.ceil(quantityNeeded / purchaseQuantity);
					const totalCost = purchasableItem.cost * packagesToBuy;

					// Final affordability check for multiple packages
					if (game.cash >= totalCost) {
						// Deduct money and add to expenses
						game.cash -= totalCost;
						game.stats.expensesToday += totalCost;

						// Add items to inventory
						inventoryItem.quantity += purchaseQuantity * packagesToBuy;
						game.managers.forEach((manager) => {
							if (manager.trait === Trait.INVENTORY) {
								manager.experience += Math.floor(Math.random() * 5);
							}
						});
					}
				}
			}
		}
	});

	return game;
}
