/**
 * Verifies the Supabase JWT sent by the client in the Authorization header
 * (Authorization: Bearer <access_token>).
 *
 * On success it attaches:
 *   req.user          -> the authenticated Supabase user
 *   req.supabase      -> a request-scoped Supabase client authenticated AS
 *                         that user, so all queries respect RLS policies.
 */
const { createClient } = require('@supabase/supabase-js');
const { supabaseAdmin } = require('../config/supabase');

const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    req.user = data.user;

    req.supabase = createClient(supabaseUrl, anonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
      auth: { persistSession: false },
    });

    next();
  } catch (err) {
    console.error('[authMiddleware] error:', err.message);
    return res.status(500).json({ error: 'Authentication check failed' });
  }
}

module.exports = authMiddleware;
