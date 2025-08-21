import { writable } from 'svelte/store';

type TutorialState = {
	active: boolean;
	step: number; // 0=name input, 1=open menu, 2=add drip, 3=open shop, 4=buy grounds, 5=watch orders
	completed: boolean;
};

const STORAGE_KEY = 'the-grind-nux';

function loadInitialState(): TutorialState {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) {
			return JSON.parse(raw);
		}
	} catch {}

	// If no tutorial state exists yet, infer fresh game by looking into the DB contents.
	try {
		const dbRaw = localStorage.getItem('the-grind-db');
		if (dbRaw) {
			const db = JSON.parse(dbRaw);
			const totalOrders = db?.stats?.totalOrders ?? 0;
			const hasStaff = Array.isArray(db?.staff) && db.staff.length > 0;
			const hasMenu = Array.isArray(db?.menu) && db.menu.length > 0;
			const looksFresh = !hasStaff && !hasMenu && totalOrders === 0;
			return {
				active: looksFresh,
				step: 0,
				completed: !looksFresh,
			};
		}
	} catch {}

	// No DB found; treat as brand new game.
	return { active: true, step: 0, completed: false };
}

export const tutorial = writable<TutorialState>(loadInitialState());

// Persist
tutorial.subscribe((value) => {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
	} catch {}
});

export function resetTutorial() {
	tutorial.set({ active: true, step: 0, completed: false });
}

// ----- Tutorial Content (copy and targeting) -----
export type TutorialStep = {
	/** zero-based step index */
	id: number;
	/** data-nux-id to highlight for this step */
	targetId: string;
	/** Tooltip copy shown to the user */
	message: string;
	/** Whether the step requires a manual Next click */
	manual?: boolean;
};

export const TUTORIAL_STEPS: TutorialStep[] = [
	{
		id: 0,
		targetId: 'name-input',
		message: 'Please enter your name to get started.',
		manual: true,
	},
	{
		id: 1,
		targetId: 'open-menu',
		message: 'First, we need to add an item to the menu. Click on Manage Menu.',
	},
	{
		id: 2,
		targetId: 'add-drip',
		message: 'Add Drip Coffee. This is a simple beverage to get you started.',
	},
	{
		id: 3,
		targetId: 'open-shop',
		message: 'Now, we need to buy coffee grounds. Click on Shop.',
	},
	{
		id: 4,
		targetId: 'buy-grounds',
		message:
			'Buy some Coffee Grounds. \n\nIn the shop, you can also buy equipment. We already have a Drip Coffee Machine, as you can see below.',
	},
	{
		id: 5,
		targetId: 'orders-header',
		message:
			"Now that you have your first item and some grounds, let's watch your first customers come in.",
	},
	{
		id: 6,
		targetId: 'stats',
		message:
			'Now that you have some customers, you have to keep an idea on your business health. \nPopularity and demand is vital for attracting more customers, while cash is vital for staying in business.',
		manual: true,
	},
	{
		id: 7,
		targetId: 'open-hiring',
		message: 'When things start to get busy, you can hire more staff.',
	},
	{
		id: 8,
		targetId: 'hiring-intro',
		message:
			'Here, you can hire employees & managers. \n\nEmployees will work on orders.\n\nManagers unlock new capabilities after your shop is more established.',
		manual: true,
	},
	{
		id: 9,
		targetId: 'cafe-settings',
		message:
			"Finally, customize your Café. Upgrades improve your shop's vibe, which boosts demand and customer enjoyment.",
		manual: true,
	},
];

export const TUTORIAL_WELCOME_TITLE = 'Welcome to The Grind';
export const TUTORIAL_WELCOME_BODY =
	'Run your own coffee shop, craft your menu, manage staff, and grow your business. This quick tutorial will get you brewing.';

export const TUTORIAL_FINAL_TITLE = 'Good luck ☕️';
