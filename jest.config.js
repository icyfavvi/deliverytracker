/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.js"],
  testMatch: ["<rootDir>/tests/**/*.test.ts?(x)"],
  testPathIgnorePatterns: ["/node_modules/", "/tests/e2e/"],
  collectCoverageFrom: [
    "src/services/**/*.ts",
    "src/hooks/**/*.ts",
    "src/constants/**/*.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "json-summary"],
  coverageThreshold: {
    "./src/services/": {
      statements: 85,
      branches: 85,
      functions: 85,
      lines: 85,
    },
    "./src/hooks/": {
      statements: 85,
      branches: 85,
      functions: 85,
      lines: 85,
    },
  },
};
