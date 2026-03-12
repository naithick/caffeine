/**
 * supabaseClient.js
 *
 * Initializes the Supabase client for backend use.
 * Uses the SERVICE_ROLE key to bypass Row Level Security (RLS).
 *
 * ⚠️  NEVER expose the service role key to the frontend.
 */

const { createClient } = require("@supabase/supabase-js");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "⚠️  Supabase environment variables not set. " +
      "Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env"
  );
}

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

module.exports = supabase;
