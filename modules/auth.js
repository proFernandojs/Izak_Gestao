// Auth module (localStorage-based)
const Auth = {
  // Internal helpers
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
    if (!username || !password || !recoveryQuestion || !recoveryAnswer) return false;
    const users = this._getUsers();
    const exists = users.some(u => u.username.toLowerCase() === username.toLowerCase() || (!!email && u.email && u.email.toLowerCase() === email.toLowerCase()));
    if (exists) return false;
    const passwordHash = await this._hash(password);
    const recoveryHash = await this._hash(recoveryAnswer);
    const id = String(Date.now());
    users.push({ id, username, email: email || '', passwordHash, recoveryQuestion, recoveryAnswerHash: recoveryHash, createdAt: new Date().toISOString() });
    this._setUsers(users);
    return true;
  },

  async login(usernameOrEmail, password) {
    const user = this._findUser(usernameOrEmail);
    if (!user) return false;
    const hash = await this._hash(password);
    if (hash !== user.passwordHash) return false;
    sessionStorage.setItem('izakCurrentUser', JSON.stringify({ id: user.id, username: user.username }));
    return true;
  },

  async resetPassword(usernameOrEmail, recoveryAnswer, newPassword) {
    const user = this._findUser(usernameOrEmail);
    if (!user) return false;
    const ansHash = await this._hash(recoveryAnswer);
    if (ansHash !== user.recoveryAnswerHash) return false;
    const newHash = await this._hash(newPassword);
    const users = this._getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx < 0) return false;
    users[idx].passwordHash = newHash;
    this._setUsers(users);
    return true;
  },

  // Email-based recovery: generate code, store hash with expiry, try to send
  async requestRecoveryCode(usernameOrEmail, opts = {}) {
    const user = this._findUser(usernameOrEmail);
    if (!user || !user.email) return { ok: false, reason: 'user-or-email-not-found' };
    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await this._hash(code);
    const expiresAt = Date.now() + (opts.ttlMs || 15 * 60 * 1000); // 15 min
    const users = this._getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx < 0) return { ok: false, reason: 'user-not-found' };
    users[idx].recoveryCodeHash = codeHash;
    users[idx].recoveryCodeExpiresAt = expiresAt;
    this._setUsers(users);

    // Try to send email via EmailJS if configured; else fallback to mailto
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
        // Must be user-initiated; UI should call this from a click
        window.open(mailto, '_blank');
        sent = true;
      } catch (e) {}
    }
    return { ok: true, code, sent };
  },

  async resetPasswordWithCode(usernameOrEmail, code, newPassword) {
    const user = this._findUser(usernameOrEmail);
    if (!user || !code || !newPassword) return false;
    const now = Date.now();
    if (!user.recoveryCodeHash || !user.recoveryCodeExpiresAt || now > user.recoveryCodeExpiresAt) return false;
    const codeHash = await this._hash(code);
    if (codeHash !== user.recoveryCodeHash) return false;
    const newHash = await this._hash(newPassword);
    const users = this._getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx < 0) return false;
    users[idx].passwordHash = newHash;
    // Invalidate code
    delete users[idx].recoveryCodeHash;
    delete users[idx].recoveryCodeExpiresAt;
    this._setUsers(users);
    return true;
  },

  isAuthenticated() {
    try { return !!JSON.parse(sessionStorage.getItem('izakCurrentUser')); } catch { return false; }
  },
  logout() {
    sessionStorage.removeItem('izakCurrentUser');
  }
};
