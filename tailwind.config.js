/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: false,
	theme: {
		extend: {
			colors: {
				tooltipColor: '#000000',
				// Main backgrounds - clean light theme
				mainBackground: '#ffffff', // pure white background
				cardBackground: '#2B2404', // very light gray for cards
				modalBackground: '#2A2204', // slightly darker gray for modals

				// Text colors - high contrast on light
				textPrimary: '#e5e7eb', // dark slate for primary text
				textSecondary: '#64748b', // medium gray secondary text
				textHighlight: '#0f172a', // very dark for highlights

				// Interactive elements - using new palette
				buttonPrimary: '#6A5ACD', // medium purple/blue for primary buttons
				buttonSecondary: '#8B4513', // brown for secondary buttons
				interactive: '#6A5ACD', // medium purple/blue for interactive elements
				hover: '#5a4ac4', // darker purple for hover states

				// Status colors - using new palette
				success: '#059669', // green (keeping for success states)
				positive: '#047857', // darker green
				warning: '#FFD700', // yellow from palette
				error: '#FF4500', // orange/red from palette
				info: '#6A5ACD', // medium purple/blue from palette

				// Accent colors - using new palette
				accent: '#FFD700', // yellow from palette for highlights and accents
				special: '#6A5ACD', // medium purple/blue for special items
				lightAccent: '#F0E68C', // light yellow/cream from palette

				// Typography colors
				subheading: '#8B4513', // brown from palette for section headings
				heading: '#1e293b', // dark slate for main headings

				// Utility colors
				borderColor: '#e2e8f0', // light gray border
				brightHighlight: '#F0E68C', // light yellow/cream highlight
				darkDepth: '#f1f5f9', // light depth
			},
			fontFamily: {
				sans: ['Tiny5', 'Walter Turncoat'],
			},
			fontWeight: {
				light: 300,
				normal: 400,
				medium: 500,
				semibold: 600,
				bold: 700,
			},
			fontSize: {
				// xs: '1.125rem', // 18px (was 14px)
				// sm: '1.25rem', // 20px (was 16px)
				// md: '1.375rem', // 22px (was 18px)
				// base: '1.5rem', // 24px (was 20px)
				// lg: '1.75rem', // 28px (was 22px)
				// xl: '2rem', // 32px (was 24px)
				// '2xl': '2.25rem', // 36px (was 28px)
				// '3xl': '2.75rem', // 44px (was 32px)
				// '4xl': '3.5rem', // 56px (was 40px)
				// '5xl': '4.5rem', // 72px (was 48px)
				xs: 'calc(0.975vh + 5px)',
				sm: 'calc(1.1254vh + 5px)',
				md: 'calc(1.25vh + 5px)',
				base: 'calc(1.35vh + 5px)',
				lg: 'calc(1.475vh + 5px)',
				xl: 'calc(1.575vh + 5px)',
				'2xl': 'calc(1.625vh + 5px)',
				'3xl': 'calc(1.75vh + 5px)',
			},
		},
	},
	plugins: [require('daisyui')],
	daisyui: {
		themes: false,
		darkTheme: false,
	},
};
