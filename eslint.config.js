import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    // Build output and dependencies are not ours to lint.
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // The parser deliberately reads user input it cannot type, so `any` at those
      // boundaries is a considered choice rather than laziness. Flag it, do not fail on it.
      '@typescript-eslint/no-explicit-any': 'warn',

      // A leading underscore is the project's marker for "intentionally unused".
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // console.warn and console.error are legitimate in a client-side app with no
      // telemetry; a stray console.log is debug residue.
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Resetting a dialog's own state when it opens is a legitimate use of an effect:
      // the trigger is a prop change from outside, and the alternative (a `key` remount)
      // would throw away focus management the Modal primitive owns. Kept visible as a
      // warning so a genuinely cascading effect still gets noticed.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },

  {
    // The export sanitizers strip control characters out of untrusted token values before
    // those values reach a stylesheet or a JS literal. Matching control characters in a
    // regex is the entire point of the module, so the generic warning is noise here.
    files: ['src/utils/exportFormats.ts', 'src/parsers/safety.ts'],
    rules: {
      'no-control-regex': 'off',
    },
  },

  {
    // Config files run in Node, not the browser.
    files: ['*.config.{js,ts}', 'eslint.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },

  // Must stay last: switches off every rule that would fight the formatter.
  prettier
);
