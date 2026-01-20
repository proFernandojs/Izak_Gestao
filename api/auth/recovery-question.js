const { getAdminClient } = require('../_supabase.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Método não permitido' });
  try {
    const usernameOrEmail = (req.query?.usernameOrEmail || req.query?.username || '').toString();
    if (!usernameOrEmail) return res.status(400).json({ ok: false, error: 'usernameOrEmail é obrigatório' });

    const supabase = getAdminClient();

    // Resolve email: tentar profiles se for username
    let email = usernameOrEmail;
    if (!String(usernameOrEmail).includes('@')) {
      const { data: prof } = await supabase.from('profiles').select('email').eq('username', usernameOrEmail).maybeSingle();
      if (prof?.email) email = prof.email;
    }

    // Percorre usuários para achar por email
    const users = [];
    let page = 1;
    // Nota: API não tem filtro por email; paginação simples
    // Para bases pequenas, uma página costuma bastar
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) return res.status(500).json({ ok: false, error: error.message });
    if (data?.users) users.push(...data.users);

    const match = users.find(u => (u.email || '').toLowerCase() === email.toLowerCase());
    const question = match?.user_metadata?.recoveryQuestion || '';
    if (!match || !question) return res.status(404).json({ ok: false, error: 'Usuário não encontrado' });

    return res.json({ ok: true, recoveryQuestion: question });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || 'Erro ao obter pergunta de recuperação' });
  }
}
