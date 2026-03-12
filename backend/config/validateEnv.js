/**
 * validateEnv.js — Fail-fast check for required environment variables.
 *
 * Import and call this at the top of server.js so the process exits
 * immediately with a clear message rather than crashing mid-request.
 */

const REQUIRED_VARS = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "PINATA_API_KEY",
  "PINATA_SECRET_KEY",
  "DEPLOYER_PRIVATE_KEY",
];

function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error("Missing required environment variables:");
    missing.forEach((key) => console.error(`  - ${key}`));
    console.error("\nAdd them to .env and restart the server.");
    process.exit(1);
  }
}

module.exports = validateEnv;
