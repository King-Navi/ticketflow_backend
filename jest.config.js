export default {
  testEnvironment: "node",
  transform: {},
  testMatch: ["**/__test__/**/*.test.js", "**/?(*.)+(spec|test).js"],
  moduleNameMapper: { "^(\\.{1,2}/.*)\\.js$": "$1" }
};
