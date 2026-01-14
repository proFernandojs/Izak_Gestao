# 🔒 Segurança - Sistema de Autenticação

## ⚠️ IMPORTANTE: Considerações de Segurança

### ✅ O que está implementado

1. **Hashing de Senhas**: SHA-256 para senhas e respostas de recuperação
2. **CORS Configurável**: Permite apenas origens autorizadas
3. **Validação de Entrada**: Validação básica de dados no servidor
4. **Sessões**: Uso de sessionStorage para sessões temporárias
5. **Fallback Offline**: Sistema funciona mesmo sem servidor

### ⚠️ Limitações Atuais (MVP)

1. **Armazenamento em Memória**: 
   - Os dados são perdidos quando o servidor reinicia
   - **Recomendação**: Implementar MongoDB para produção

2. **SHA-256 em vez de bcrypt**: 
   - SHA-256 é rápido demais para senhas (facilita ataques de força bruta)
   - **Recomendação**: Migrar para bcrypt/argon2 em produção

3. **Sem Rate Limiting**: 
   - Possível realizar muitas tentativas de login
   - **Recomendação**: Implementar limite de requisições

4. **Sem JWT/Tokens**: 
   - Sessões são apenas em sessionStorage
   - **Recomendação**: Implementar JWT para sessões mais seguras

5. **Sem HTTPS Forçado**: 
   - Em localhost usa HTTP
   - **Recomendação**: Sempre usar HTTPS em produção

---

## 🚀 Melhorias para Produção

### 1. Implementar bcrypt

```bash
cd server
npm install bcrypt
```

```javascript
const bcrypt = require('bcrypt');

// No registro
const passwordHash = await bcrypt.hash(password, 10);

// No login
const isValid = await bcrypt.compare(password, user.passwordHash);
```

### 2. Adicionar JWT

```bash
npm install jsonwebtoken
```

```javascript
const jwt = require('jsonwebtoken');

// Ao fazer login
const token = jwt.sign(
  { id: user.id, username: user.username }, 
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// Middleware de autenticação
function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
}
```

### 3. Rate Limiting

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas
  message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' }
});

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  // ...
});
```

### 4. Helmet para Segurança de Headers

```bash
npm install helmet
```

```javascript
const helmet = require('helmet');
app.use(helmet());
```

### 5. Validação com Joi

```bash
npm install joi
```

```javascript
const Joi = require('joi');

const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  recoveryQuestion: Joi.string().required(),
  recoveryAnswer: Joi.string().required()
});

// No endpoint
const { error } = registerSchema.validate(req.body);
if (error) return res.status(400).json({ error: error.details[0].message });
```

### 6. MongoDB com Mongoose

```bash
npm install mongoose
```

```javascript
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI);

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true },
  passwordHash: { type: String, required: true },
  recoveryQuestion: { type: String, required: true },
  recoveryAnswerHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date
});

const User = mongoose.model('User', UserSchema);

// Uso
const user = await User.findOne({ username: usernameOrEmail });
```

### 7. Bloqueio de Conta

```javascript
// Adicionar ao schema do MongoDB
loginAttempts: { type: Number, default: 0 },
lockUntil: Date

// No login
if (user.lockUntil && user.lockUntil > Date.now()) {
  return res.status(423).json({ 
    error: 'Conta bloqueada. Tente novamente mais tarde.' 
  });
}

if (!isPasswordValid) {
  user.loginAttempts += 1;
  
  if (user.loginAttempts >= 5) {
    user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min
  }
  
  await user.save();
  return res.status(401).json({ error: 'Senha incorreta' });
}

// Reset ao login bem-sucedido
user.loginAttempts = 0;
user.lockUntil = null;
user.lastLogin = new Date();
await user.save();
```

### 8. Auditoria e Logs

```javascript
const logAuth = (action, username, success, ip) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    action,
    username,
    success,
    ip,
    userAgent: req.headers['user-agent']
  }));
};

// No login
logAuth('login', usernameOrEmail, true, req.ip);
```

### 9. Sanitização de Entrada

```bash
npm install validator express-validator
```

```javascript
const { body, validationResult } = require('express-validator');

app.post('/api/auth/register', [
  body('username').trim().escape().isAlphanumeric().isLength({ min: 3, max: 30 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // ...
});
```

### 10. HTTPS Forçado

```javascript
// Middleware para forçar HTTPS
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});
```

---

## 🔐 Boas Práticas

### Para Desenvolvedores

1. ✅ Nunca commite `.env` no git
2. ✅ Use senhas fortes em produção
3. ✅ Rotacione secrets regularmente
4. ✅ Mantenha dependências atualizadas
5. ✅ Faça backup dos dados regularmente

### Para Usuários

1. ✅ Use senhas únicas e fortes (mín. 8 caracteres)
2. ✅ Não compartilhe sua senha
3. ✅ Faça logout em dispositivos compartilhados
4. ✅ Mantenha sua pergunta de recuperação em local seguro

---

## 📋 Checklist de Segurança para Produção

Antes de colocar em produção:

- [ ] ✅ Migrar de SHA-256 para bcrypt
- [ ] ✅ Implementar JWT para tokens
- [ ] ✅ Adicionar rate limiting
- [ ] ✅ Usar MongoDB em vez de memória
- [ ] ✅ Implementar bloqueio de conta (5 tentativas)
- [ ] ✅ Configurar HTTPS
- [ ] ✅ Adicionar helmet para headers de segurança
- [ ] ✅ Validar e sanitizar todas as entradas
- [ ] ✅ Implementar logs de auditoria
- [ ] ✅ Configurar backups automáticos
- [ ] ✅ Testar recuperação de desastres
- [ ] ✅ Adicionar monitoramento (ex: Sentry)
- [ ] ✅ Configurar alertas para tentativas suspeitas
- [ ] ✅ Revisar CORS para permitir apenas origens confiáveis

---

## 🚨 GDPR e Privacidade

Se você atender usuários na Europa:

1. **Direito ao Esquecimento**: Permitir que usuários deletem suas contas
2. **Consentimento**: Obter consentimento explícito para armazenar dados
3. **Transparência**: Informar quais dados são coletados
4. **Portabilidade**: Permitir exportação de dados do usuário

Exemplo de endpoint de exclusão:

```javascript
app.delete('/api/auth/delete-account', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  await User.findByIdAndDelete(userId);
  // Também deletar dados relacionados (boletos, etc)
  res.json({ ok: true, message: 'Conta excluída com sucesso' });
});
```

---

## 📞 Reportar Vulnerabilidades

Se você encontrar uma vulnerabilidade de segurança:

1. **NÃO** abra uma issue pública
2. Entre em contato diretamente (configure um email de segurança)
3. Descreva o problema em detalhes
4. Aguarde confirmação antes de divulgar

---

## 📚 Recursos Adicionais

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://github.com/goldbergyoni/nodebestpractices#security)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

**⚠️ AVISO**: Este sistema é um MVP para testes. Implemente as melhorias de segurança acima antes de usar em produção com dados reais!
