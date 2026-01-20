const { getAdminClient, sha256 } = require('../_supabase.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Método não permitido' });
  try {
    const { usernameOrEmail, recoveryAnswer, newPassword } = req.body || {};
    if (!usernameOrEmail || !recoveryAnswer || !newPassword) {
      return res.status(400).json({ ok: false, error: 'usernameOrEmail, recoveryAnswer e newPassword são obrigatórios' });
    }

    const supabase = getAdminClient();

    // Resolve email: tentar profiles se for username
    let email = usernameOrEmail;
    if (!String(usernameOrEmail).includes('@')) {
      const { data: prof } = await supabase.from('profiles').select('email').eq('username', usernameOrEmail).maybeSingle();
      if (prof?.email) email = prof.email;
    }

    // Carrega usuários e encontra pelo email
    const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 100 });
    if (listErr) return res.status(500).json({ ok: false, error: listErr.message });
    const user = (list?.users || []).find(u => (u.email || '').toLowerCase() === email.toLowerCase());
    if (!user) return res.status(404).json({ ok: false, error: 'Usuário não encontrado' });

    const storedHash = user.user_metadata?.recoveryAnswerHash || '';
    const inputHash = sha256(String(recoveryAnswer).toLowerCase().trim());
    if (!storedHash || storedHash !== inputHash) {
      return res.status(401).json({ ok: false, error: 'Resposta de recuperação incorreta' });
    }

    // Atualizar senha via Admin API
    const { error: updErr } = await supabase.auth.admin.updateUserById(user.id, { password: newPassword });
    if (updErr) return res.status(500).json({ ok: false, error: updErr.message || 'Erro ao atualizar senha' });

    return res.json({ ok: true, message: 'Senha atualizada com sucesso' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || 'Erro ao resetar senha' });
  }
}
