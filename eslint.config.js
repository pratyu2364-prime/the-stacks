import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist', '**/node_modules', '**/coverage', '**/.expo'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['packages/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['three', 'react', 'react-dom', '@supabase/*', '@stacks/*', 'expo*', 'react-native*'], message: 'domain depends on nothing — see the mobile design spec, section 3.1.' },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/data/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['three', 'react', 'react-dom', 'expo*', 'react-native*', '@stacks/web', '@stacks/mobile'], message: 'data is platform-neutral — inject platform differences, see spec section 3.1.' },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/web/src/world/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['@supabase/*', 'react', 'react-dom', '@stacks/data'], message: 'world renders a WorldModel and knows nothing else — see the V1 spec, section 3.' }] },
      ],
    },
  },
);
