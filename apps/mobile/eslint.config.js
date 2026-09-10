import globals from 'globals';
import root from '../../eslint.config.js';

export default [
  ...root,
  {
    files: ['metro.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: globals.node,
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];