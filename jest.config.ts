import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // nanoid v5 est ESM-only → shim CJS pour les tests.
    '^nanoid$': '<rootDir>/__mocks__/nanoid.ts',
    // next/font/google est une transformation au build (SWC) → mock pour les tests.
    '^next/font/google$': '<rootDir>/__mocks__/next-font-google.ts',
  },
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          moduleResolution: 'node',
          esModuleInterop: true,
          jsx: 'react-jsx',
          verbatimModuleSyntax: false,
        },
      },
    ],
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
};

export default config;
