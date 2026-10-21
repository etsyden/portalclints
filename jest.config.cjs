module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/apps/api/src/**/*.spec.ts'],
  transform: {
    '^.+\\.tsx?$': [
      '@swc/jest',
      {
        jsc: {
          target: 'es2022',
          parser: {
            syntax: 'typescript',
            decorators: true,
          },
          transform: {
            legacyDecorator: true,
            decoratorMetadata: true,
          },
        },
        module: {
          type: 'es6',
        },
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts'],
  clearMocks: true,
};
