const { createClient } = require('@supabase/supabase-js');

function getAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error('Supabase não configurado: defina SUPABASE_URL e SUPABASE_SERVICE_KEY');
  }
  return createClient(url, key);
}

function sha256(text) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(String(text)).digest('hex');
}

module.exports = { getAdminClient, sha256 };
