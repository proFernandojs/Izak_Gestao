const { getAdminClient } = require('../_supabase.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Método não permitido' });
  try {
    const { usernameOrEmail, password } = req.body || {};
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ ok: false, error: 'usernameOrEmail e password são obrigatórios' });
    }

    const supabase = getAdminClient();

    // Resolve email: se não contiver @, tenta buscar em profiles
    let email = usernameOrEmail;
    if (!String(usernameOrEmail).includes('@')) {
      const { data: prof, error: profErr } = await supabase.from('profiles').select('email').eq('username', usernameOrEmail).maybeSingle();
      if (profErr) {
        // prossegue tentando como email
      }
      if (prof?.email) email = prof.email;
    }

    // Para login, usamos client público (anon) — criamos um client público só para este fluxo
    const { createClient } = require('@supabase/supabase-js');
    const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
    if (!publicUrl || !publicKey) {
      return res.status(500).json({ ok: false, error: 'Chaves públicas do Supabase ausentes (NEXT_PUBLIC_SUPABASE_*)' });
    }
    const publicClient = createClient(publicUrl, publicKey);

    const { data, error } = await publicClient.auth.signInWithPassword({ email, password });
    if (error || !data?.user) {
      return res.status(401).json({ ok: false, error: 'Usuário ou senha incorretos' });
    }

    const user = data.user;
    return res.json({ ok: true, user: { id: user.id, username: user.user_metadata?.username || '', email: user.email || email } });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || 'Erro ao fazer login' });
  }
}
