// @ts-check

const _ = require('lodash')

/** @type { jest.ProjectConfig } */
module.exports = {
  clearMocks: true,
  coverageDirectory: 'coverage',
  transform: {
    '^.+\\.(js|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: ['/node_modules/(?!(chalk)/)'],
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node'],
  moduleNameMapper: {
    '^views/(.*)': '<rootDir>/views/$1',
  },
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/app_compiled/'],
  setupFilesAfterEnv: ['./setup-tests.ts'],
  collectCoverageFrom: ['lib', 'views', 'build'].map((dir) => `./${dir}/**/*.[jt]s?(x)`),
  collectCoverage: _.toLower(process.env.CI) === 'true',
}
