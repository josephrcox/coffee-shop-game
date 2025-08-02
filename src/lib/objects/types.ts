// Enums for consistent string references
export enum Ingredient {
	COFFEE_GROUNDS = '☕️ Coffee Grounds',
	COFFEE_BEANS = '☕️ Coffee Beans',
	MILK_COW = '🥛 Milk (cow)',
	BLACK_TEA = '🍵 Black Tea',
	GREEN_TEA = '🍵 Green Tea',
	CHAI_TEA = '🍵 Chai Tea',
}

export enum Equipment {
	DRIP_COFFEE_MACHINE = '☕️ Drip coffee machine',
	COFFEE_GRINDER = '☕️ Coffee grinder',
	ESPRESSO_MACHINE = '☕️ Espresso machine',
	MILK_FROTHER = '🥛 Milk frother',
	ICE_MACHINE = '🧊 Ice machine',
}

export enum MenuItem {
	DRIP_COFFEE = '☕️ Drip coffee',
	ESPRESSO_SINGLE = '☕️ Espresso (single)',
	ESPRESSO_DOUBLE = '☕️ Espresso (double)',
	AMERICANO_HOT = '☕️ Americano (hot)',
	LATTE = '☕️ Latte',
	CAPPUCCINO = '☕️ Cappuccino',
	BLACK_TEA = '🍵 Black Tea',
	GREEN_TEA = '🍵 Green Tea',
	ICED_COFFEE = '🧊 Iced Coffee',
	ICED_AMERICANO = '🧊 Iced Americano',
	ICED_LATTE = '🧊 Iced Latte',
	ICED_CAPPUCCINO = '🧊 Iced Cappuccino',
	CHAI_LATTE = '🍵 Chai latte',
}

export type db = {
	tick: number; // 1000 ticks = 1 day
	staff: employee[];
	cash: number;
	orders: order[];
	inventory: inventoryItem[];
	menu: menuItem[];
	ownedEquipment: ownedEquipmentItem[];
	popularity: number; // 0-100
	totalDemand: number; // Sum of demand from all menu items
	stats: {
		totalOrders: number;
		ordersYesterday: number;
		ordersToday: number;
		profitToday: number;
		profitYesterday: number;
		revenueToday: number;
		expensesToday: number; // Money spent on anything (inventory, etc)
		popularityYesterday: number; // Track yesterday's popularity
		popularityChange: number; // Change in popularity from yesterday
		ordersChange: number; // Change in total orders from yesterday
	};
	startingCash: number; // Cash at start of current day
	quests: quest[];
};

export type quest = {
	id: string;
	name: string;
	description?: string;
	completed: boolean;
	showingCompletion?: boolean;
	reward: {
		cash: number;
		popularity: number;
	};
	isCompleted?: (db: db) => boolean; // Optional - only exists in original definitions
	onCompleted?: (db: db) => void; // Optional - only exists in original definitions
};

export const quests: quest[] = [
	{
		id: 'first',
		name: 'Complete 5 orders',
		completed: false,
		showingCompletion: false,
		reward: {
			cash: 250,
			popularity: 15,
		},
		isCompleted: (db) => {
			const completedOrders = db.orders.filter(
				(order) => order.completion === 100,
			);
			return completedOrders.length >= 5;
		},
	},
	{
		id: 'first week',
		name: 'Be open for 7 days',
		completed: false,
		showingCompletion: false,
		reward: {
			cash: 1000,
			popularity: 100,
		},
		onCompleted: (db) => {
			alert(
				"After 1 week of doing great business, it's time for your first rush! Good luck!",
			);
		},
		isCompleted: (db) => {
			return Math.floor(db.tick / 1000) > 7;
		},
	},
	{
		id: 'hire',
		name: 'Hire an employee',
		completed: false,
		showingCompletion: false,
		reward: {
			cash: 1000,
			popularity: 5,
		},
		isCompleted: (db) => db.staff.length > 1,
	},
	{
		id: 'profitable-day',
		name: 'Have a profitable day',
		completed: false,
		showingCompletion: false,
		reward: {
			cash: 500,
			popularity: 5,
		},
		isCompleted: (db) => db.stats.profitYesterday > 0,
	},
	// Add another menu item
	{
		id: 'add-menu-item',
		name: 'Add another menu item',
		completed: false,
		showingCompletion: false,
		reward: {
			cash: 500,
			popularity: 5,
		},
		isCompleted: (db) => db.menu.length > 1,
	},
];

export type employee = {
	name: string;
	dailyWage: number; // daily
	experience: number; // higher = faster. 0 = complete newbie, 1000 = expert
	currentOrder: number | null; // order id
	menuItemProficiency: { [key: string]: number };
	happiness: number; // 1.0 is neutral
	dailyMenuItemsMade: string[];
};

export type inventoryItem = {
	name: string;
	description: string;
	quantity: number;
};

export type menuItem = {
	name: string;
	ingredients: {
		[key: string]: number; // baseItem name, quantity
	};
	price: number;
	complexity: number;
	demand: number; // How much this item attracts customers (baseline: drip coffee = 100)
	default?: boolean;
	requires?: string[];
};

export type order = {
	id: number;
	customer: string;
	items: menuItem[];
	completion: number; // 0-100
	ticksToComplete: number;
	customerPatience: number; // 250-750, represents customer's patience level
	originalItems: menuItem[];
};

export type purchasableItem = {
	name: string;
	description: string;
	quantity: number;
	cost: number;
	quality?: number; // 0-100
	requires?: string[];
};

export type purchasableEquipment = {
	name: string;
	cost: number;
	quality: number; // 0-100
	durability: number; // Number of uses before breaking.
	upgrades: equipmentUpgrade[];
	failureChance: number; // 0-1
};

export type equipmentUpgrade = {
	cost: number;
	speedMultiplier: number;
	purchased: boolean;
	description: string;
	failureChance?: number; // 0-1
};

export type ownedEquipmentItem = {
	name: string;
	cost: number;
	quality: number; // 0-100
	durability: number; // Number of uses before breaking.
	failureChance: number; // 0-1
	upgrades: equipmentUpgrade[];
};

export const possibleMenuItems: menuItem[] = [
	{
		name: MenuItem.DRIP_COFFEE,
		ingredients: {
			[Ingredient.COFFEE_GROUNDS]: 1,
		},
		price: 3,
		complexity: 2,
		demand: 100, // Baseline
		default: true,
		requires: [Equipment.DRIP_COFFEE_MACHINE],
	},
	// single shot
	{
		name: MenuItem.ESPRESSO_SINGLE,
		ingredients: {
			[Ingredient.COFFEE_BEANS]: 1,
		},
		price: 3,
		complexity: 3,
		demand: 80,
		requires: [Equipment.ESPRESSO_MACHINE, Equipment.COFFEE_GRINDER],
	},
	// double shot
	{
		name: MenuItem.ESPRESSO_DOUBLE,
		ingredients: {
			[Ingredient.COFFEE_BEANS]: 2,
		},
		price: 4,
		complexity: 3,
		demand: 90,
		requires: [Equipment.ESPRESSO_MACHINE, Equipment.COFFEE_GRINDER],
	},
	{
		name: MenuItem.AMERICANO_HOT,
		ingredients: {
			[Ingredient.COFFEE_BEANS]: 2,
		},
		price: 4,
		complexity: 4,
		demand: 85,
		requires: [Equipment.ESPRESSO_MACHINE, Equipment.COFFEE_GRINDER],
	},
	{
		name: MenuItem.LATTE,
		ingredients: {
			[Ingredient.COFFEE_BEANS]: 1,
			[Ingredient.MILK_COW]: 3,
		},
		price: 5,
		complexity: 4,
		demand: 120,
		requires: [
			Equipment.ESPRESSO_MACHINE,
			Equipment.COFFEE_GRINDER,
			Equipment.MILK_FROTHER,
		],
	},
	{
		name: MenuItem.CAPPUCCINO,
		ingredients: {
			[Ingredient.COFFEE_BEANS]: 1,
			[Ingredient.MILK_COW]: 2,
		},
		price: 5,
		complexity: 5,
		demand: 110,
		requires: [
			Equipment.ESPRESSO_MACHINE,
			Equipment.COFFEE_GRINDER,
			Equipment.MILK_FROTHER,
		],
	},
	{
		name: MenuItem.BLACK_TEA,
		ingredients: {
			[Ingredient.BLACK_TEA]: 1,
		},
		price: 2,
		complexity: 1,
		demand: 40,
		requires: [],
	},
	{
		name: MenuItem.GREEN_TEA,
		ingredients: {
			[Ingredient.GREEN_TEA]: 1,
		},
		price: 2,
		complexity: 1,
		demand: 45,
		requires: [],
	},
	{
		name: MenuItem.ICED_COFFEE,
		ingredients: {
			[Ingredient.COFFEE_BEANS]: 1,
		},
		price: 4,
		complexity: 2,
		demand: 95,
		requires: [Equipment.ICE_MACHINE],
	},
	{
		name: MenuItem.ICED_AMERICANO,
		ingredients: {
			[Ingredient.COFFEE_BEANS]: 2,
		},
		price: 5,
		complexity: 3,
		demand: 75,
		requires: [
			Equipment.ICE_MACHINE,
			Equipment.ESPRESSO_MACHINE,
			Equipment.COFFEE_GRINDER,
		],
	},
	{
		name: MenuItem.ICED_LATTE,
		ingredients: {
			[Ingredient.COFFEE_BEANS]: 1,
			[Ingredient.MILK_COW]: 3,
		},
		price: 6,
		complexity: 4,
		demand: 130,
		requires: [
			Equipment.ICE_MACHINE,
			Equipment.ESPRESSO_MACHINE,
			Equipment.COFFEE_GRINDER,
			Equipment.MILK_FROTHER,
		],
	},
	{
		name: MenuItem.ICED_CAPPUCCINO,
		ingredients: {
			[Ingredient.COFFEE_BEANS]: 1,
			[Ingredient.MILK_COW]: 2,
		},
		price: 6,
		complexity: 4,
		demand: 115,
		requires: [
			Equipment.ICE_MACHINE,
			Equipment.ESPRESSO_MACHINE,
			Equipment.COFFEE_GRINDER,
			Equipment.MILK_FROTHER,
		],
	},
	// Chai latte
	{
		name: MenuItem.CHAI_LATTE,
		ingredients: {
			[Ingredient.CHAI_TEA]: 1,
			[Ingredient.MILK_COW]: 1,
		},
		price: 5,
		complexity: 4,
		demand: 115,
		requires: [],
	},
];

export const purchasableItems: purchasableItem[] = [
	{
		name: Ingredient.COFFEE_GROUNDS,
		description: 'For drip coffee',
		quantity: 100,
		cost: 75,
	},
	{
		name: Ingredient.COFFEE_BEANS,
		description: 'For espresso drinks, needs to be ground first',
		quantity: 100,
		cost: 100,
		requires: [Equipment.COFFEE_GRINDER],
	},
	{
		name: Ingredient.MILK_COW,
		description: 'For milk-based drinks',
		quantity: 20,
		cost: 4,
		requires: [],
	},
	{
		name: Ingredient.BLACK_TEA,
		description: '',
		quantity: 150,
		cost: 10,
		requires: [Ingredient.BLACK_TEA],
	},
	{
		name: Ingredient.GREEN_TEA,
		description: '',
		quantity: 150,
		cost: 10,
		requires: [Ingredient.GREEN_TEA],
	},
	{
		name: Ingredient.CHAI_TEA,
		description: '',
		quantity: 100,
		cost: 100,
		requires: [],
	},
];

export const purchasableEquipment: purchasableEquipment[] = [
	{
		name: Equipment.DRIP_COFFEE_MACHINE,
		cost: 200,
		quality: 100,
		durability: 0.2,
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
	{
		name: Equipment.COFFEE_GRINDER,
		cost: 200,
		quality: 100,
		durability: 0.2,
		failureChance: 0.0001,
		upgrades: [
			{
				cost: 2000,
				speedMultiplier: 1.25,
				purchased: false,
				description: 'Auto-grind to the right amount. 25% faster.',
			},
		],
	},
	{
		name: Equipment.ESPRESSO_MACHINE,
		cost: 1500,
		quality: 100,
		durability: 0.2,
		failureChance: 0.01,
		upgrades: [
			{
				cost: 2000,
				speedMultiplier: 1.25,
				purchased: false,
				failureChance: 0.75,
				description: 'Temperature regulator. 25% lower chance of failure.',
			},
		],
	},
	{
		name: Equipment.MILK_FROTHER,
		cost: 100,
		quality: 100,
		durability: 0.2,
		failureChance: 0.000001,
		upgrades: [],
	},
	{
		name: Equipment.ICE_MACHINE,
		cost: 1500,
		quality: 100,
		durability: 0.001,
		failureChance: 0.0000001,
		upgrades: [],
	},
];
