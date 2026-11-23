import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['**/node_modules/**', '**/dist/**'] },
  { ...js.configs.recommended, files: ['backend/**/*.js', '**/*.cjs'], languageOptions: { globals: globals.node, sourceType: 'commonjs' }, rules: { ...js.configs.recommended.rules, 'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }] } },
  ...tseslint.configs.recommended.map(config => ({ ...config, files: ['frontend/src/**/*.{ts,tsx}'] })),
  { files: ['frontend/src/**/*.{ts,tsx}'], plugins: { 'react-hooks': hooks }, languageOptions: { globals: globals.browser }, rules: { ...hooks.configs.recommended.rules, '@typescript-eslint/no-explicit-any': 'off', '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }] } },
];
