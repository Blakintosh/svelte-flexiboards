import { defineConfig } from 'vitest/config';

export default defineConfig({
	esbuild: { jsx: 'automatic' },
	define: { 'process.env.NODE_ENV': '"test"' },
	test: {
		// Component tests mount real components against a DOM. This is the layer
		// where the adapter meets core: React's render/commit phases and
		// StrictMode double-invocation on one side, core's synchronous signal
		// effects on the other. Bugs there are invisible to core's own suite.
		environment: 'happy-dom',
		setupFiles: ['tests/setup.ts'],
		include: ['tests/**/*.{test,spec}.{ts,tsx}', 'src/**/*.{test,spec}.{ts,tsx}']
	}
});
