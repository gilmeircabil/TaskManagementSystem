/**
 * Supabase server-side client.
 *
 * Uses the SERVICE ROLE key so the server can:
 *  - verify user JWTs sent from the client (auth.getUser)
 *  - perform trusted operations if ever needed
 *
 * IMPORTANT: this client must never be exposed to the browser.
 * Row Level Security (RLS) still applies to every query we run through
 * the request-scoped client created in authMiddleware, so per-user
 * data isolation is enforced by Postgres, not just by this file.
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.warn(
    '[supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server/.env — API calls will fail until configured.'
  );
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

module.exports = { supabaseAdmin };
