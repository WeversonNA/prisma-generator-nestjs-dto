export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{ts,js,jsx}', '!**/*.d.ts'],
  coveragePathIgnorePatterns: ['dist/', 'node_modules/', 'src/@generated'],
  modulePathIgnorePatterns: ['dist/', 'node_modules/', 'src/@generated'],
  testPathIgnorePatterns: ['dist/', 'node_modules/', 'src/@generated'],
};
