// Auth module (API-based for cross-device sync)
const Auth = {
  baseUrl: 'http://localhost:3000', // ajuste conforme seu deploy
  
  // Fallback localStorage para cache/offline
  _getUsers() {
    try { return JSON.parse(localStorage.getItem('izakUsers')) || []; } catch { return []; }
  },
  _setUsers(users) { localStorage.setItem('izakUsers', JSON.stringify(users)); },
  
  async _hash(text) {
    try {
      const enc = new TextEncoder().encode(String(text));
      const buf = await crypto.subtle.digest('SHA-256', enc);
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      // Fallback (non-crypto, weak) — only if WebCrypto fails
      let h = 0; const s = String(text);
      for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
      return String(h);
    }
  },
  
  _findUser(usernameOrEmail) {
    const q = String(usernameOrEmail || '').trim().toLowerCase();
    const users = this._getUsers();
    return users.find(u => (u.username || '').toLowerCase() === q || (u.email || '').toLowerCase() === q) || null;
  },

  async register({ username, email, password, recoveryQuestion, recoveryAnswer }) {
    if (!username || !password || !email) {
      return { ok: false, error: 'Username, email e senha são obrigatórios' };
    }
    
    try {
      console.log('📝 Tentando registrar no Supabase:', { username, email, baseUrl: this.baseUrl });
      const response = await fetch(`${this.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, recoveryQuestion, recoveryAnswer })
      });
      
      const data = await response.json();
      console.log('📨 Resposta do servidor:', { status: response.status, data });
      
      if (!response.ok) {
        console.error('❌ Erro no registro:', data);
        return { ok: false, error: data.error || 'Falha ao registrar' };
      }
      
      // Salva sessão se o servidor retornar
      if (data.session) {
        sessionStorage.setItem('izakSession', JSON.stringify(data.session));
      }
      
      // Cache local para offline (opcional)
      const users = this._getUsers();
      const passwordHash = await this._hash(password);
      const recoveryHash = await this._hash(recoveryAnswer);
      users.push({ 
        id: data.user.id, 
        username, 
        email: email || '', 
        passwordHash, 
        recoveryQuestion, 
        recoveryAnswerHash: recoveryHash,
        createdAt: new Date().toISOString() 
      });
      this._setUsers(users);
      
      return { ok: true, user: data.user };
    } catch (error) {
      console.error('Erro de rede ao registrar:', error);
      // Fallback para localStorage se servidor estiver offline
      return this._registerOffline({ username, email, password, recoveryQuestion, recoveryAnswer });
    }
  },

  async _registerOffline({ username, email, password, recoveryQuestion, recoveryAnswer }) {
    const users = this._getUsers();
    const exists = users.some(u => 
      u.username.toLowerCase() === username.toLowerCase() || 
      (!!email && u.email && u.email.toLowerCase() === email.toLowerCase())
    );
    if (exists) return { ok: false, error: 'Usuário já existe (offline)' };
    
    const passwordHash = await this._hash(password);
    const recoveryHash = await this._hash(recoveryAnswer);
    const id = String(Date.now());
    users.push({ 
      id, username, email: email || '', passwordHash, 
      recoveryQuestion, recoveryAnswerHash: recoveryHash, 
      createdAt: new Date().toISOString(),
      offline: true // marca como criado offline
    });
    this._setUsers(users);
    return { ok: true, user: { id, username, email: email || '' } };
  },

  async login(usernameOrEmail, password) {
    try {
      console.log('🔐 Tentando login:', { usernameOrEmail, baseUrl: this.baseUrl });
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail, password })
      });
      
      const data = await response.json();
      console.log('📨 Resposta do servidor:', { status: response.status, data });
      
      if (!response.ok) {
        console.error('❌ Erro no login:', data);
        return { ok: false, error: data.error || 'Falha no login' };
      }
      
      // Salva sessão
      sessionStorage.setItem('izakCurrentUser', JSON.stringify(data.user));
      
      // Salva token de sessão se fornecido (Supabase)
      if (data.session) {
        sessionStorage.setItem('izakSession', JSON.stringify(data.session));
      }
      
      // Atualiza cache local
      const users = this._getUsers();
      const existingIdx = users.findIndex(u => u.id === data.user.id);
      const passwordHash = await this._hash(password);
      
      if (existingIdx >= 0) {
        users[existingIdx] = { ...users[existingIdx], ...data.user, passwordHash };
      } else {
        users.push({ ...data.user, passwordHash });
      }
      this._setUsers(users);
      
      return { ok: true, user: data.user };
    } catch (error) {
      console.error('Erro de rede ao fazer login:', error);
      // Fallback para localStorage se servidor estiver offline
      return this._loginOffline(usernameOrEmail, password);
    }
  },

  async _loginOffline(usernameOrEmail, password) {
    const user = this._findUser(usernameOrEmail);
    if (!user) return { ok: false, error: 'Usuário não encontrado (offline)' };
    
    const hash = await this._hash(password);
    if (hash !== user.passwordHash) return { ok: false, error: 'Senha incorreta (offline)' };
    
    sessionStorage.setItem('izakCurrentUser', JSON.stringify({ id: user.id, username: user.username }));
    return { ok: true, user: { id: user.id, username: user.username, email: user.email } };
  },

  async getRecoveryQuestion(usernameOrEmail) {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/recovery-question?usernameOrEmail=${encodeURIComponent(usernameOrEmail)}`);
      const data = await response.json();
      
      if (!response.ok) {
        return { ok: false, error: data.error || 'Usuário não encontrado' };
      }
      
      return { ok: true, recoveryQuestion: data.recoveryQuestion };
    } catch (error) {
      console.error('Erro ao buscar pergunta de recuperação:', error);
      // Fallback offline
      const user = this._findUser(usernameOrEmail);
      if (!user) return { ok: false, error: 'Usuário não encontrado (offline)' };
      return { ok: true, recoveryQuestion: user.recoveryQuestion };
    }
  },

  async resetPassword(usernameOrEmail, recoveryAnswer, newPassword) {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail, recoveryAnswer, newPassword })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return { ok: false, error: data.error || 'Falha ao resetar senha' };
      }
      
      // Atualiza cache local
      const users = this._getUsers();
      const user = this._findUser(usernameOrEmail);
      if (user) {
        const idx = users.findIndex(u => u.id === user.id);
        if (idx >= 0) {
          users[idx].passwordHash = await this._hash(newPassword);
          this._setUsers(users);
        }
      }
      
      return { ok: true, message: data.message };
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      // Fallback offline
      return this._resetPasswordOffline(usernameOrEmail, recoveryAnswer, newPassword);
    }
  },

  async _resetPasswordOffline(usernameOrEmail, recoveryAnswer, newPassword) {
    const user = this._findUser(usernameOrEmail);
    if (!user) return { ok: false, error: 'Usuário não encontrado (offline)' };
    
    const ansHash = await this._hash(recoveryAnswer);
    if (ansHash !== user.recoveryAnswerHash) return { ok: false, error: 'Resposta incorreta (offline)' };
    
    const newHash = await this._hash(newPassword);
    const users = this._getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx < 0) return { ok: false, error: 'Erro ao atualizar (offline)' };
    
    users[idx].passwordHash = newHash;
    this._setUsers(users);
    return { ok: true, message: 'Senha atualizada (offline)' };
  },

  // Email-based recovery: generate code, store hash with expiry, try to send
  async requestRecoveryCode(usernameOrEmail, opts = {}) {
    // Esta funcionalidade pode ser implementada no servidor se necessário
    // Por enquanto, mantém fallback local para compatibilidade
    const user = this._findUser(usernameOrEmail);
    if (!user || !user.email) return { ok: false, reason: 'user-or-email-not-found' };
    
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await this._hash(code);
    const expiresAt = Date.now() + (opts.ttlMs || 15 * 60 * 1000);
    const users = this._getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx < 0) return { ok: false, reason: 'user-not-found' };
    users[idx].recoveryCodeHash = codeHash;
    users[idx].recoveryCodeExpiresAt = expiresAt;
    this._setUsers(users);

    const subject = 'Código de recuperação • Izak Gestão';
    const body = `Seu código de recuperação é: ${code}\n\nEle expira em 15 minutos.`;
    let sent = false;
    try {
      if (window.emailjs && window.EMAILJS_SERVICE_ID && window.EMAILJS_TEMPLATE_ID && window.EMAILJS_PUBLIC_KEY) {
        await window.emailjs.send(window.EMAILJS_SERVICE_ID, window.EMAILJS_TEMPLATE_ID, {
          to_email: user.email,
          to_name: user.username,
          subject,
          message: body
        });
        sent = true;
      }
    } catch (e) {
      sent = false;
    }
    if (!sent) {
      try {
        const mailto = `mailto:${encodeURIComponent(user.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailto, '_blank');
        sent = true;
      } catch (e) {}
    }
    return { ok: true, code, sent };
  },

  async resetPasswordWithCode(usernameOrEmail, code, newPassword) {
    const user = this._findUser(usernameOrEmail);
    if (!user || !code || !newPassword) return { ok: false, error: 'Dados incompletos' };
    const now = Date.now();
    if (!user.recoveryCodeHash || !user.recoveryCodeExpiresAt || now > user.recoveryCodeExpiresAt) {
      return { ok: false, error: 'Código expirado ou inexistente' };
    }
    const codeHash = await this._hash(code);
    if (codeHash !== user.recoveryCodeHash) return { ok: false, error: 'Código incorreto' };
    
    const newHash = await this._hash(newPassword);
    const users = this._getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx < 0) return { ok: false, error: 'Usuário não encontrado' };
    
    users[idx].passwordHash = newHash;
    delete users[idx].recoveryCodeHash;
    delete users[idx].recoveryCodeExpiresAt;
    this._setUsers(users);
    return { ok: true, message: 'Senha atualizada com sucesso' };
  },

  isAuthenticated() {
    try { return !!JSON.parse(sessionStorage.getItem('izakCurrentUser')); } catch { return false; }
  },
  
  getCurrentUser() {
    try { return JSON.parse(sessionStorage.getItem('izakCurrentUser')); } catch { return null; }
  },
  
  logout() {
    sessionStorage.removeItem('izakCurrentUser');
  }
};
