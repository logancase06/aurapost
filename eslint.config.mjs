import next from 'eslint-config-next';

// eslint-config-next (v16) exporte directement un tableau flat config — on le spread
// sans FlatCompat (qui provoque un crash « circular structure » avec @eslint/eslintrc).
const eslintConfig = [
  ...next,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    ignores: ['.next/**', 'node_modules/**', 'drizzle/**'],
  },
];

export default eslintConfig;
