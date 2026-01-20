const { getAdminClient, sha256 } = require('../_supabase.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Método não permitido' });
  try {
    const { username, email, password, recoveryQuestion, recoveryAnswer } = req.body || {};
    if (!username || !email || !password) {
      return res.status(400).json({ ok: false, error: 'Campos obrigatórios: username, email, password' });
    }

    const supabase = getAdminClient();

    // Cria usuário via Admin API; confirma email para desenvolvimento
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        recoveryQuestion: recoveryQuestion || '',
        recoveryAnswerHash: recoveryAnswer ? sha256(String(recoveryAnswer).toLowerCase().trim()) : ''
      }
    });

    if (error) {
      const msg = error.message || 'Falha ao registrar';
      const status = msg.includes('already registered') ? 409 : 400;
      return res.status(status).json({ ok: false, error: msg });
    }

    const user = data?.user;
    if (!user) return res.status(500).json({ ok: false, error: 'Usuário não retornado pelo Supabase' });

    return res.status(201).json({ ok: true, user: { id: user.id, username, email } });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || 'Erro ao registrar usuário' });
  }
}
