// @ts-check
import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import astroPlugin from 'eslint-plugin-astro';

/**
 * ESLint flat config – zachování konzistence kódu napříč Astro
 * komponentami, TypeScript moduly a JavaScript skripty.
 */
export default [
  eslint.configs.recommended,

  // Globální browser/Node globals (Response, URL, fetch, console …)
  {
    languageOptions: {
      globals: {
        // Browser
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        console: 'readonly',
        // Web Fetch API (dostupné i v Node 18+ a Astro endpointech)
        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        fetch: 'readonly',
        // Timers
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        // DOM
        HTMLElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLInputElement: 'readonly',
        Element: 'readonly',
        Event: 'readonly',
        // Node-like
        process: 'readonly',
      },
    },
  },

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // env.d.ts používá triple-slash reference (Astro standard)
  {
    files: ['**/env.d.ts'],
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },

  ...astroPlugin.configs.recommended,

  {
    files: ['**/*.astro'],
    rules: {
      // V Astro komponentách občas máme dynamické proměnné
      'no-unused-vars': 'off',
    },
  },

  {
    ignores: [
      'dist/**',
      '.astro/**',
      'node_modules/**',
      'public/**',
      'screenshots/**',
      'package-lock.json',
    ],
  },
];
