# 🚀 Guia Rápido de Deploy - Autenticação Sincronizada

## ✅ O que foi feito?

Implementei um **sistema de autenticação centralizado** que garante que a senha cadastrada pelo cliente funcione em **todos os dispositivos** (celular, tablet, computador).

### Como funciona agora:

**ANTES** (localStorage):
- ❌ Cada dispositivo tinha sua própria lista de usuários
- ❌ Senha cadastrada no celular não funcionava no computador
- ❌ Dados ficavam apenas no navegador

**AGORA** (API centralizada):
- ✅ Todos os dispositivos conectam no mesmo servidor
- ✅ Mesma senha funciona em celular, tablet e computador
- ✅ Dados sincronizados automaticamente
- ✅ Funciona offline (fallback para localStorage)

---

## 📋 Passos para Ativar

### Passo 1: Fazer Deploy do Servidor

Escolha uma das opções gratuitas abaixo:

#### 🟣 Railway (Mais Fácil - Recomendado)

1. Acesse https://railway.app e crie uma conta
2. Clique em **"New Project"** → **"Deploy from GitHub repo"**
3. Conecte este repositório
4. Configure:
   - **Root Directory**: `server`
   - **Start Command**: `node server.js`
5. Nas **Variables**, adicione:
   ```
   PORT=3000
   ORIGINS=https://seu-usuario.github.io
   ```
6. Copie a URL gerada (ex: `https://izak-api.railway.app`)

#### 🟢 Render

1. Acesse https://render.com e crie uma conta
2. Clique em **"New Web Service"**
3. Conecte seu repositório GitHub
4. Configure:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Em **Environment Variables**, adicione:
   ```
   ORIGINS=https://seu-usuario.github.io
   ```
6. Copie a URL gerada (ex: `https://izak-api.onrender.com`)

### Passo 2: Configurar o Frontend

Abra o arquivo **`modules/auth.js`** e encontre a linha 3:

```javascript
baseUrl: 'http://localhost:3000', // ajuste conforme seu deploy
```

Altere para a URL do seu servidor:

```javascript
baseUrl: 'https://izak-api.railway.app', // ← Cole sua URL aqui
```

Se você usa a funcionalidade de boletos, também atualize **`modules/boleto.js`**:

```javascript
baseUrl: 'https://izak-api.railway.app', // ← Cole a mesma URL
```

### Passo 3: Fazer Deploy do Frontend no GitHub Pages

1. Faça commit das alterações:
   ```bash
   git add .
   git commit -m "Configurar autenticação centralizada"
   git push origin main
   ```

2. No GitHub, vá em **Settings** → **Pages**
3. Em **Source**, selecione **main branch** → **/ (root)**
4. Clique em **Save**
5. Aguarde alguns minutos e acesse: `https://seu-usuario.github.io/GraficaHome`

---

## 🧪 Testando

### Teste Local (antes do deploy)

1. **Inicie o servidor**:
   ```bash
   cd server
   npm install
   node server.js
   ```

2. **Abra o frontend** em outro terminal:
   ```bash
   # Na pasta raiz
   npx http-server -p 8080
   ```

3. Acesse `http://localhost:8080/login.html`

### Teste de Sincronização Multi-Dispositivos

1. **Cadastre** um usuário no computador
2. Abra o GitHub Pages no **celular** (ou aba anônima)
3. **Faça login** com as mesmas credenciais
4. ✅ **Deve funcionar!**

---

## 🔧 Configuração Avançada (Opcional)

### Adicionar Banco de Dados (MongoDB)

Por padrão, os dados ficam em memória. Para persistência permanente:

1. Crie conta gratuita em https://mongodb.com/cloud/atlas
2. Crie um cluster e obtenha a connection string
3. No Railway/Render, adicione a variável:
   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/izak
   ```
4. No servidor, instale mongoose:
   ```bash
   cd server
   npm install mongoose
   ```

### Configurar Domínio Personalizado

Se você tem um domínio próprio (ex: `meusite.com.br`):

1. Configure o CNAME no seu provedor de domínio
2. No GitHub Pages, adicione o domínio personalizado
3. Atualize a variável `ORIGINS` no servidor:
   ```
   ORIGINS=https://meusite.com.br,https://www.meusite.com.br
   ```

---

## ❓ Problemas Comuns

### "Erro de rede ao fazer login"

**Causa**: Servidor offline ou URL incorreta

**Solução**:
1. Verifique se o servidor está rodando no Railway/Render
2. Confirme que a URL em `modules/auth.js` está correta
3. Teste a URL no navegador: `https://sua-url/api/auth/login`

### "CORS error" no console

**Causa**: GitHub Pages URL não está nas origens permitidas

**Solução**:
1. No Railway/Render, vá em **Variables**
2. Adicione/edite `ORIGINS`:
   ```
   ORIGINS=https://seu-usuario.github.io
   ```
3. Reinicie o servidor

### Senha não sincroniza entre dispositivos

**Causa**: Frontend aponta para `localhost` em vez do servidor de produção

**Solução**:
1. Abra `modules/auth.js`
2. Certifique-se que `baseUrl` aponta para a URL de produção
3. Faça commit e push novamente

---

## 📊 Estrutura da API

### Endpoints Disponíveis

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/reset-password
GET  /api/auth/recovery-question
```

### Exemplo de Uso

```javascript
// Cadastro
const response = await fetch('https://sua-url/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'joao',
    email: 'joao@email.com',
    password: 'senha123',
    recoveryQuestion: 'pet',
    recoveryAnswer: 'rex'
  })
});

// Login
const response = await fetch('https://sua-url/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    usernameOrEmail: 'joao',
    password: 'senha123'
  })
});
```

---

## 🎯 Checklist Final

- [ ] Servidor deployado no Railway/Render
- [ ] URL copiada e configurada em `modules/auth.js`
- [ ] Variável `ORIGINS` configurada no servidor
- [ ] Frontend deployado no GitHub Pages
- [ ] Teste de cadastro funcionando
- [ ] Teste de login em múltiplos dispositivos funcionando

---

## 📚 Documentação Completa

Para mais detalhes técnicos, veja [AUTENTICACAO.md](./AUTENTICACAO.md)

## 💡 Suporte

Se encontrar problemas, verifique:
1. Logs do servidor no Railway/Render
2. Console do navegador (F12)
3. Network tab para ver as requisições
