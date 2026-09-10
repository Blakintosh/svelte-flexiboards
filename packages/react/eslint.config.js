import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
	globalIgnores(['dist']),
	{
		files: ['**/*.{ts,tsx}'],
		extends: [
			js.configs.recommended,
			tseslint.configs.recommended,
			reactHooks.configs.flat.recommended
		],
		languageOptions: {
			globals: globals.browser
		},
		rules: {
			// Underscore-prefixed names mark deliberate exclusions (e.g. destructuring
			// a prop out so it stays off a rest spread), matching tsc's convention.
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					destructuredArrayIgnorePattern: '^_'
				}
			]
		}
	},
	{
		// Test fixtures hand their state setters out through module variables so
		// a test can drive a mounted component; that is the point, not a leak.
		files: ['tests/**/*.{ts,tsx}'],
		rules: { 'react-hooks/globals': 'off' }
	}
]);
