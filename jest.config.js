// @ts-check

const _ = require('lodash')

/** @type { jest.ProjectConfig } */
module.exports = {
  clearMocks: true,
  coverageDirectory: 'coverage',
  transform: {
    '^.+\\.(js|es|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: ['/node_modules/(?!(chalk)/)'],
  moduleFileExtensions: ['js', 'es', 'json', 'jsx', 'ts', 'tsx', 'node'],
  moduleNameMapper: {
    '^views/(.*)': '<rootDir>/views/$1',
  },
  testMatch: ['**/__tests__/**/*.[ejt]s?(x)', '**/?(*.)+(spec|test).[ejt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/app_compiled/'],
  setupFilesAfterEnv: ['./setup-tests.ts'],
  collectCoverageFrom: ['lib', 'views', 'build'].map((dir) => `./${dir}/**/*.[ejt]s?(x)`),
  collectCoverage: _.toLower(process.env.CI) === 'true',
}
