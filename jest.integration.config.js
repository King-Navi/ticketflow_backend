import config from './jest.config.js'; 

export default {
  ...config,testMatch: ["**/*.int.test.js"],
  testPathIgnorePatterns: ["/node_modules/"],
  verbose: true
};