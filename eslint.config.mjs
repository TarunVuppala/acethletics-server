import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';

export default {
  env: {
    node: true,
    es6: true,
    jest: true,
  },
  files: ['/*.js', '**/*.js'],
  languageOptions: {
    parserOptions: {
      ecmaVersion: 2021,
      sourceType: 'module'
    }
  },
  extends: [
    eslint.configs.recommended,
    eslintConfigPrettier
  ],
  rules: {
    'no-console': 'error',
    quotes: ['error', 'single', { allowTemplateLiterals: true }],
    'no-useless-catch': 0
  },
  plugins: ['prettier']
};
