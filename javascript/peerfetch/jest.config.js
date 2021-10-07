/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  globals: {
    "ts-jest": {
      "babelConfig": true,
    }
  },
  rootDir: '.',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  moduleFileExtensions: ['js', 'ts', 'json'],
  transform: {
    '^.+\\.(ts|tsx)?$': 'ts-jest',
    "^.+\\.(js|jsx)$": "babel-jest",
  },  
  preset: 'ts-jest',
  testMatch: ['<rootDir>/tests/**/*.spec.ts'],
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
  ],
  cacheDirectory: '<rootDir>/.cache/unit',
  coveragePathIgnorePatterns: [
    "<rootDir>/node_modules/"
  ],
  coverageReporters: [
    "json",
    "lcov",
    "text",
    "text-summary"
  ],
}