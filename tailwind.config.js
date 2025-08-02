/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: false,
	theme: {
		extend: {
			colors: {
				// Main backgrounds - high contrast dark theme
				mainBackground: '#0f0f0f', // true black background
				cardBackground: '#1a1a1a', // dark gray for cards
				modalBackground: '#262626', // lighter gray for modals

				// Text colors - high contrast
				textPrimary: '#ffffff', // pure white text
				textSecondary: '#a3a3a3', // light gray secondary text
				textHighlight: '#f3f4f6', // very light gray for highlights

				// Interactive elements
				buttonPrimary: '#2563eb', // strong blue for primary buttons
				buttonSecondary: '#4b5563', // gray for secondary buttons
				interactive: '#3b82f6', // bright blue for interactive elements
				hover: '#1d4ed8', // darker blue for hover states

				// Status colors - high contrast
				success: '#10b981', // bright green
				positive: '#059669', // darker green
				warning: '#f59e0b', // bright orange
				error: '#ef4444', // bright red
				info: '#0ea5e9', // bright cyan

				// Accent colors
				accent: '#fbbf24', // bright yellow/gold
				special: '#8b5cf6', // purple for special items
				lightAccent: '#60a5fa', // light blue accent

				// Utility colors
				borderColor: '#374151', // gray border
				brightHighlight: '#f9fafb', // brightest highlight
				darkDepth: '#111827', // very dark for depth
			},
			fontFamily: {
				sans: [
					'Outfit',
					'system-ui',
					'-apple-system',
					'BlinkMacSystemFont',
					'Segoe UI',
					'Roboto',
					'Oxygen',
					'Ubuntu',
					'Cantarell',
					'Open Sans',
					'Helvetica Neue',
					'sans-serif',
				],
			},
			fontWeight: {
				light: 300,
				normal: 400,
				medium: 500,
				semibold: 600,
				bold: 700,
			},
			fontSize: {
				xs: '0.875rem', // 14px (was 12px)
				sm: '1rem', // 16px (was 14px)
				md: '1.125rem', // 18px (our custom size)
				base: '1.25rem', // 20px (was 16px)
				lg: '1.375rem', // 22px (was 18px)
				xl: '1.5rem', // 24px (was 20px)
				'2xl': '1.75rem', // 28px (was 24px)
				'3xl': '2rem', // 32px (was 30px)
				'4xl': '2.5rem', // 40px (was 36px)
				'5xl': '3rem', // 48px (was 48px)
			},
		},
	},
	plugins: [require('daisyui')],
	daisyui: {
		themes: false,
		darkTheme: false,
	},
};
