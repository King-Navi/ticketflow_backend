export default {
  testEnvironment: "node",
  transform: {},
  testMatch: ["**/__test__/**/*.test.js", "**/?(*.)+(spec|test).js"],
  testPathIgnorePatterns: [
    "/node_modules/", 
    "\\.int\\.test\\.js$"
  ],
  moduleNameMapper: { "^(\\.{1,2}/.*)\\.js$": "$1" },
  verbose: true
};
