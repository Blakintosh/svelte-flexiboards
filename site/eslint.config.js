import prettier from 'eslint-config-prettier';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

export default ts.config(
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs['flat/recommended'],
	prettier,
	...svelte.configs['flat/prettier'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		rules: {
			// Underscore-prefixed names are deliberate placeholders (snippet params, `_` in map callbacks).
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }
			]
		}
	},
	{
		files: ['**/*.svelte'],

		languageOptions: {
			parserOptions: {
				parser: ts.parser
			}
		},
		rules: {
			// svelte-check already reports compiler warnings; here only compile errors fail.
			'svelte/valid-compile': ['error', { ignoreWarnings: true }],
			// DOM types such as ParentNode come from TypeScript, which handles undefined names.
			'no-undef': 'off'
		}
	},
	{
		ignores: [
			'build/',
			'.svelte-kit/',
			'.vercel/',
			'dist/',
			'src/lib/generated/',
			'static/r/',
			'playwright-report/',
			'test-results/'
		]
	}
);
