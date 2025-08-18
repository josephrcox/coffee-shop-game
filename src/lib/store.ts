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

// Background audio and SFX system
let backgroundAudio: HTMLAudioElement | null = null;
let ambientAudio: HTMLAudioElement | null = null;
let musicInitialized = false;
let autoplayHooked = false;
const backgroundTracks = ['/jazz1.mp3', '/jazz2.mp3'];
let currentBackgroundIndex = Math.random() < 0.5 ? 0 : 1;
let backgroundSwitchTimeoutId: number | null = null;
let coffeeTimeoutId: number | null = null;
let espressoTimeoutId: number | null = null;
let genericSfxTimeoutId: number | null = null;

// Auto-discovered short SFX clips. Drop files into src/assets/sfx/ and they are picked up at build time.
// Supported formats: wav, mp3, ogg
// Vite will turn these into asset URLs at build time.
const discoveredSfxModules: Record<string, string> = import.meta.glob(
	'../assets/sfx/**/*.{wav,mp3,ogg}',
	{ as: 'url', eager: true },
);
const discoveredSfxUrls: string[] = Object.values(discoveredSfxModules);

function randomBetween(minSeconds: number, maxSeconds: number): number {
	return Math.random() * (maxSeconds - minSeconds) + minSeconds;
}

function clearTimeoutSafe(id: number | null) {
	if (id !== null) {
		window.clearTimeout(id);
	}
}

function scheduleNextBackgroundAfterRandomDelay() {
	clearTimeoutSafe(backgroundSwitchTimeoutId);
	const delayMs = Math.floor(randomBetween(8, 20) * 1000);
	backgroundSwitchTimeoutId = window.setTimeout(() => {
		const nextIndex = 1 - currentBackgroundIndex;
		playBackgroundTrack(nextIndex);
	}, delayMs);
}

function ensureBackgroundAudio() {
	if (!backgroundAudio) {
		backgroundAudio = new Audio();
		backgroundAudio.volume = 0.3;
		backgroundAudio.loop = false;
		backgroundAudio.addEventListener('ended', () => {
			// Switch after a random delay when a jazz track ends
			scheduleNextBackgroundAfterRandomDelay();
		});
	}
}

function hookAutoplayFallbackOnce() {
	if (autoplayHooked) return;
	autoplayHooked = true;
	const resume = () => {
		if (backgroundAudio) {
			backgroundAudio.play().catch(console.warn);
		}
		if (ambientAudio) {
			ambientAudio.play().catch(console.warn);
		}
		document.removeEventListener('click', resume);
		document.removeEventListener('keydown', resume);
		autoplayHooked = false;
	};
	document.addEventListener('click', resume);
	document.addEventListener('keydown', resume);
}

function playBackgroundTrack(index: number) {
	ensureBackgroundAudio();
	if (!backgroundAudio) return;

	currentBackgroundIndex = index;
	clearTimeoutSafe(backgroundSwitchTimeoutId);

	try {
		backgroundAudio.pause();
	} catch {}
	backgroundAudio.currentTime = 0;
	backgroundAudio.src = backgroundTracks[currentBackgroundIndex];

	backgroundAudio.play().catch(() => {
		// Likely autoplay blocked; hook a one-time user interaction
		hookAutoplayFallbackOnce();
	});
}

function scheduleGenericSfxNext() {
	clearTimeoutSafe(genericSfxTimeoutId);
	if (discoveredSfxUrls.length === 0) {
		return; // nothing to schedule
	}
	// Random interval window; tune as needed
	const delayMs = Math.floor(randomBetween(5, 15) * 1000);
	genericSfxTimeoutId = window.setTimeout(() => {
		// Pick a random discovered clip
		const url =
			discoveredSfxUrls[Math.floor(Math.random() * discoveredSfxUrls.length)];
		const s = new Audio(url);
		// Keep volume low by default so it layers well
		s.volume = 0.25;
		s.play()
			.catch(() => {
				// ignore pre-interaction block
			})
			.finally(() => {
				scheduleGenericSfxNext();
			});
	}, delayMs);
}

export function initializeBackgroundMusic() {
	if (typeof window === 'undefined') return;
	if (musicInitialized) return;
	musicInitialized = true;

	// Start with a random jazz track, then alternate after random delays
	playBackgroundTrack(currentBackgroundIndex);

	// Start continuous ambient layer
	if (!ambientAudio) {
		ambientAudio = new Audio('/background.mp3');
		ambientAudio.volume = 0.7;
		ambientAudio.loop = true;
	}
	ambientAudio.play().catch(() => {
		// If blocked, ensure autoplay fallback will start both
		hookAutoplayFallbackOnce();
	});

	scheduleGenericSfxNext();
}

// --- Low-latency UI click sound ---
let audioCtx: AudioContext | null = null;
let clickGain: GainNode | null = null;
let clickBuffer: AudioBuffer | null = null;
let clickBufferLoading: Promise<void> | null = null;

// Fallback HTMLAudio pool if WebAudio not available
let clickPool: HTMLAudioElement[] = [];
let clickPoolPrepared = false;
let clickPoolIndex = 0;
const CLICK_POOL_SIZE = 6;

function ensureAudioContext() {
	if (typeof window === 'undefined') return;
	if (audioCtx) return;
	const CtxCtor: any =
		(window as any).AudioContext || (window as any).webkitAudioContext;
	if (CtxCtor) {
		audioCtx = new CtxCtor();
		if (audioCtx) {
			clickGain = audioCtx.createGain();
			clickGain.gain.value = 0.12;
			clickGain.connect(audioCtx.destination);
		}
	}
}

async function loadClickBuffer() {
	if (!audioCtx) return;
	if (clickBuffer) return;
	if (clickBufferLoading) return clickBufferLoading;
	clickBufferLoading = (async () => {
		const res = await fetch('/click.wav');
		const arr = await res.arrayBuffer();
		// decodeAudioData returns a Promise in modern browsers
		clickBuffer = await audioCtx!.decodeAudioData(arr);
	})();
	return clickBufferLoading;
}

export function prepareClickSfxPool() {
	if (typeof window === 'undefined') return;
	// Prefer WebAudio
	ensureAudioContext();
	if (audioCtx) {
		// Start loading buffer
		void loadClickBuffer();
		return;
	}
	// Fallback HTMLAudio pool
	if (clickPoolPrepared) return;
	clickPoolPrepared = true;
	for (let i = 0; i < CLICK_POOL_SIZE; i++) {
		const a = new Audio('/click.wav');
		a.volume = 0.12;
		a.preload = 'auto';
		clickPool.push(a);
	}
}

export function playClickSfx() {
	try {
		ensureAudioContext();
		if (audioCtx && clickGain) {
			if (audioCtx.state === 'suspended') {
				// Do not await; resume is fast and synchronous in user gesture
				void audioCtx.resume();
			}
			if (!clickBuffer) {
				// Fire-and-forget load; if not loaded yet, skip this click
				void loadClickBuffer();
				return;
			}
			const src = audioCtx.createBufferSource();
			src.buffer = clickBuffer;
			src.connect(clickGain);
			src.start(0);
			return;
		}

		// Fallback
		if (!clickPoolPrepared) {
			prepareClickSfxPool();
		}
		if (clickPool.length === 0) return;
		const a = clickPool[clickPoolIndex % clickPool.length];
		clickPoolIndex = (clickPoolIndex + 1) % clickPool.length;
		a.currentTime = 0;
		a.play().catch(() => {});
	} catch {}
}

export function resumeAudioContext() {
	try {
		if (!audioCtx) return;
		void audioCtx.resume();
	} catch {}
}

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
	initialTutorial.active && (initialTutorial.step ?? 0) < 5 ? true : false,
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

// Load player name from storage
function loadPlayerNameFromStorage(): string {
	try {
		const stored = localStorage.getItem('the-grind-player-name');
		if (stored) return stored;
	} catch {}
	return '';
}

const uiInitial = loadUiStateFromStorage();
// Detect if UI state existed before; if not, avoid auto-opening modals on first load
export const hadPreviousUiState = !!localStorage.getItem(UI_STATE_KEY);

// Load initial player name
export const playerName = writable<string>('');

// Load initial player name
playerName.set(loadPlayerNameFromStorage());

// Persist player name
playerName.subscribe((name) => {
	try {
		localStorage.setItem('the-grind-player-name', name);
	} catch {}
});

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
		// Keep paused only for early steps (< 5). From step 5 onwards, auto-unpause.
		const shouldPause = t.active && (t.step ?? 0) < 5;
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
		if (t.active && (t.step ?? 0) < 5 && !isPaused) {
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
