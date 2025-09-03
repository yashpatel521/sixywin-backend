/**
 * Application Version Information
 * Update this file on every release/deployment
 */

export const APP_VERSION = {
  // Semantic versioning: MAJOR.MINOR.PATCH
  VERSION: "1.3.0",

  // Build information
  BUILD_DATE: "2025-08-03",
  BUILD_NUMBER: "20250803-002",

  // Git information (update manually or via CI/CD)
  COMMIT_HASH: "latest", // Will be updated after push
  BRANCH: "development",

  // Environment
  ENVIRONMENT: process.env.NODE_ENV || "development",

  // Feature flags/compatibility
  WEBSOCKET_VERSION: "2.0", // Updated message type system
  API_VERSION: "v1",
  DATABASE_VERSION: "1.0",

  // Display helpers
  get FULL_VERSION() {
    return `${this.VERSION}-${this.BUILD_NUMBER}`;
  },

  get VERSION_INFO() {
    return {
      version: this.VERSION,
      buildDate: this.BUILD_DATE,
      environment: this.ENVIRONMENT,
      commit: this.COMMIT_HASH,
      websocketVersion: this.WEBSOCKET_VERSION,
      apiVersion: this.API_VERSION,
      databaseVersion: this.DATABASE_VERSION,
    };
  },
} as const;

// Console log version info on server start
// console.log("🚀 SixyWin Backend", APP_VERSION.VERSION_INFO);
