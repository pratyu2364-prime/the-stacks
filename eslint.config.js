import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** Layer rules from the design spec, section 3. */
const layerRules = {
  'src/domain': ['three', 'react', 'react-dom', '@supabase/*', '**/data/*', '**/world/*', '**/ui/*'],
  'src/data': ['three', 'react', 'react-dom', '**/world/*', '**/ui/*'],
  'src/world': ['@supabase/*', 'react', 'react-dom', '**/data/*', '**/ui/*'],
};

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'coverage'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.es2022 } },
  },
  ...Object.entries(layerRules).map(([dir, patterns]) => ({
    files: [`${dir}/**/*.{ts,tsx}`],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: patterns.map((p) => ({ group: [p], message: `${dir} may not import ${p} — see spec section 3.` })) },
      ],
    },
  })),
);
