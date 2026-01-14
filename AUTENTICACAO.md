# Autenticação Centralizada - Sincronização Multi-Dispositivos

## O que foi implementado?

O sistema de autenticação agora usa um servidor centralizado para armazenar usuários e senhas, garantindo que **a mesma senha funcione em todos os dispositivos** (celular, tablet, computador).

### Funcionalidades

✅ **Registro de usuários** - Cadastro centralizado no servidor  
✅ **Login sincronizado** - Mesma senha em todos os dispositivos  
✅ **Recuperação de senha** - Por pergunta de segurança  
✅ **Modo offline** - Fallback para localStorage quando o servidor não está disponível  
✅ **Cache local** - Mantém dados em cache para melhor performance  

## Como funciona?

### Fluxo de Autenticação

1. **Cadastro**: Quando um usuário se cadastra, os dados são enviados para o servidor via API
2. **Login**: Ao fazer login, as credenciais são verificadas no servidor
3. **Sincronização**: Todos os dispositivos consultam o mesmo servidor
4. **Cache**: Uma cópia é mantida no localStorage para acesso offline

### Arquivos Modificados

- **`server/server.js`** - Adicionados endpoints de autenticação:
  - `POST /api/auth/register` - Cadastro de novo usuário
  - `POST /api/auth/login` - Login do usuário
  - `POST /api/auth/reset-password` - Reset de senha
  - `GET /api/auth/recovery-question` - Obter pergunta de recuperação

- **`modules/auth.js`** - Migrado de localStorage para API:
  - Todas as funções agora fazem requisições HTTP para o servidor
  - Mantém fallback para localStorage em caso de falha de rede
  - Cache local para melhor performance

- **`login.html`** - Atualizado para lidar com respostas da API

## Configuração para Produção

### 1. Hospedagem do Servidor

O servidor precisa estar sempre rodando para sincronizar entre dispositivos. Opções gratuitas:

#### Opção A: Railway (Recomendado)
```bash
# 1. Crie conta em https://railway.app
# 2. Instale o CLI
npm install -g @railway/cli

# 3. Entre no diretório do servidor
cd server

# 4. Faça deploy
railway login
railway init
railway up
```

#### Opção B: Render
```bash
# 1. Crie conta em https://render.com
# 2. Conecte seu repositório GitHub
# 3. Configure:
#    - Build Command: cd server && npm install
#    - Start Command: cd server && node server.js
```

#### Opção C: Heroku
```bash
# 1. Crie conta em https://heroku.com
# 2. Instale Heroku CLI
# 3. Entre no diretório do servidor
cd server

# 4. Faça deploy
heroku login
heroku create izak-gestao-api
git subtree push --prefix server heroku main
```

### 2. Configurar URL do Servidor

Depois de fazer o deploy do servidor, você receberá uma URL (ex: `https://izak-api.railway.app`).

Atualize o arquivo **`modules/auth.js`**:

```javascript
const Auth = {
  baseUrl: 'https://izak-api.railway.app', // ← Cole sua URL aqui
  // ... resto do código
}
```

Atualize também o arquivo **`modules/boleto.js`** (se usar a funcionalidade de boletos):

```javascript
const BoletoAPI = {
  baseUrl: 'https://izak-api.railway.app', // ← Cole sua URL aqui
  // ... resto do código
}
```

### 3. Configurar CORS no Servidor

No arquivo **`server/.env`**, adicione a URL do GitHub Pages:

```env
ORIGINS=https://seu-usuario.github.io
```

Se seu GitHub Pages está em domínio personalizado:

```env
ORIGINS=https://seudominio.com.br,https://www.seudominio.com.br
```

### 4. Banco de Dados (Opcional, mas Recomendado)

Por padrão, o servidor armazena dados em memória (Map). Em produção, isso significa que **os dados serão perdidos quando o servidor reiniciar**.

Para persistência permanente, recomendo usar um banco de dados:

#### MongoDB Atlas (Grátis)

1. Crie conta em https://mongodb.com/cloud/atlas
2. Crie um cluster gratuito
3. Obtenha a connection string
4. Instale mongoose:

```bash
cd server
npm install mongoose
```

5. Atualize `server.js`:

```javascript
const mongoose = require('mongoose');

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI || 'sua-connection-string');

// Schema de usuário
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: String,
  passwordHash: String,
  recoveryQuestion: String,
  recoveryAnswerHash: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// Substitua o Map por operações no banco:
// users.set() → await User.create()
// users.get() → await User.findById()
// Array.from(users.values()) → await User.find()
```

## Testando Localmente

### 1. Inicie o servidor

```bash
cd server
npm install
node server.js
```

O servidor rodará em `http://localhost:3000`

### 2. Abra o frontend

```bash
# Em outro terminal, na pasta raiz
# Use qualquer servidor HTTP, exemplo:
npx http-server -p 8080
```

Acesse `http://localhost:8080/login.html`

### 3. Teste a sincronização

1. Cadastre um usuário
2. Abra em outro navegador (ou aba anônima)
3. Faça login com as mesmas credenciais
4. ✅ Deve funcionar!

## Modo Offline

Se o servidor estiver offline ou inacessível, o sistema automaticamente:

1. Tenta usar dados do cache (localStorage)
2. Permite cadastro/login offline
3. Exibe mensagens "(offline)" ao usuário
4. Sincroniza quando o servidor voltar

## Segurança

### Implementado
✅ Senhas hashadas com SHA-256  
✅ CORS configurado  
✅ Validação de dados  
✅ Respostas de recuperação hashadas  

### Recomendações Adicionais
⚠️ Use HTTPS em produção (automático no Railway/Render/Heroku)  
⚠️ Considere adicionar rate limiting  
⚠️ Implemente JWT para sessões mais seguras  
⚠️ Use bcrypt em vez de SHA-256 para senhas  

## Estrutura de Dados

### Usuário no Servidor
```json
{
  "id": "ABC123",
  "username": "joao",
  "email": "joao@exemplo.com",
  "passwordHash": "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
  "recoveryQuestion": "pet",
  "recoveryAnswerHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "createdAt": "2026-01-13T10:30:00.000Z"
}
```

### Sessão no Navegador (sessionStorage)
```json
{
  "id": "ABC123",
  "username": "joao",
  "email": "joao@exemplo.com"
}
```

## Troubleshooting

### "Erro de rede ao fazer login"
- Verifique se o servidor está rodando
- Confirme a URL em `modules/auth.js`
- Verifique CORS no `.env` do servidor

### "Usuário já cadastrado (offline)"
- Limpe o localStorage: `localStorage.clear()`
- Ou use outro username

### Senha não sincroniza entre dispositivos
- Verifique se ambos apontam para a mesma URL do servidor
- Confirme que o servidor está online
- Teste com `curl http://sua-url/api/auth/login`

## Próximos Passos

1. ✅ Deploy do servidor em produção
2. ✅ Configurar URL no frontend
3. ⚠️ Implementar banco de dados (MongoDB)
4. ⚠️ Adicionar JWT para sessões
5. ⚠️ Implementar 2FA (autenticação em dois fatores)

---

**Suporte**: Em caso de dúvidas, verifique os logs do servidor com `railway logs` ou consulte a documentação das plataformas de hospedagem.
