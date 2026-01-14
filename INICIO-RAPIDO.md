# 🚀 Início Rápido - Testes Locais

## Testando o Sistema de Autenticação Localmente

### 1. Inicie o Servidor

```bash
cd server
npm install
node server.js
```

Você verá:
```
Boleto server listening on port 3000
PROVIDER: MOCK
```

### 2. Abra o Frontend

Em **outro terminal**, na pasta raiz do projeto:

```bash
# Usando http-server (recomendado)
npx http-server -p 8080

# OU usando Python
python -m http.server 8080

# OU usando PHP
php -S localhost:8080
```

### 3. Teste a Autenticação

Abra no navegador: **http://localhost:8080/test-auth.html**

Este é um painel de testes completo onde você pode:
- ✅ Testar conexão com o servidor
- ✅ Cadastrar usuários
- ✅ Fazer login
- ✅ Resetar senhas
- ✅ Ver resultados detalhados

### 4. Teste o Sistema Real

Acesse: **http://localhost:8080/login.html**

1. Cadastre um novo usuário
2. Faça login
3. Será redirecionado para o sistema

### 5. Teste Multi-Dispositivos (Simulado)

Para simular múltiplos dispositivos:

1. **Aba Normal**: Cadastre um usuário
2. **Aba Anônima** (Ctrl+Shift+N): Faça login com o mesmo usuário
3. ✅ Deve funcionar! Isso simula um dispositivo diferente

---

## 📱 Para Testar em Dispositivos Reais

### Opção 1: Rede Local

1. Descubra seu IP local:
   ```bash
   # Windows
   ipconfig
   # Procure por "Endereço IPv4" (ex: 192.168.1.100)
   
   # Mac/Linux
   ifconfig
   # Procure por "inet" (ex: 192.168.1.100)
   ```

2. Atualize `modules/auth.js`:
   ```javascript
   baseUrl: 'http://192.168.1.100:3000', // use seu IP local
   ```

3. No celular/tablet (mesma rede WiFi):
   - Acesse: `http://192.168.1.100:8080/login.html`

### Opção 2: Túnel Ngrok

1. Instale ngrok: https://ngrok.com/download

2. Exponha o servidor:
   ```bash
   ngrok http 3000
   ```

3. Copie a URL gerada (ex: `https://abc123.ngrok.io`)

4. Atualize `modules/auth.js`:
   ```javascript
   baseUrl: 'https://abc123.ngrok.io',
   ```

5. Faça o mesmo para o frontend:
   ```bash
   ngrok http 8080
   ```

6. Acesse a URL do frontend no celular

---

## 🎯 Checklist de Testes

Antes de fazer deploy, confirme:

- [ ] ✅ Servidor rodando (`node server.js`)
- [ ] ✅ Frontend acessível (`http://localhost:8080`)
- [ ] ✅ Página de testes funcionando (`/test-auth.html`)
- [ ] ✅ Cadastro de usuário OK
- [ ] ✅ Login funcionando
- [ ] ✅ Recuperação de senha OK
- [ ] ✅ Teste em aba anônima OK

---

## 🐛 Troubleshooting

### Erro: "Cannot GET /api/auth/login"
**Solução**: O servidor não está rodando. Execute `node server.js` no diretório `server/`

### Erro: "Erro de rede ao fazer login"
**Solução**: 
1. Verifique se o servidor está rodando
2. Confirme que a URL em `modules/auth.js` está correta
3. Veja os logs do servidor

### Erro: "CORS policy blocked"
**Solução**: 
1. Adicione a origem no arquivo `server/.env`:
   ```
   ORIGINS=http://localhost:8080,http://127.0.0.1:8080
   ```
2. Reinicie o servidor

### Porta 3000 já em uso
**Solução**: 
```bash
# Mude a porta no .env
PORT=3001

# Ou mate o processo na porta 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <numero> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

---

## 📚 Próximos Passos

Depois de testar localmente:

1. 📖 Leia o [DEPLOY.md](./DEPLOY.md) para fazer deploy em produção
2. 📊 Configure um banco de dados para persistência (veja [AUTENTICACAO.md](./AUTENTICACAO.md))
3. 🔒 Considere implementar HTTPS em produção

---

## 💡 Dicas

- Use o Chrome DevTools (F12) → Network para ver as requisições
- Verifique o Console para erros JavaScript
- Os logs do servidor mostram todas as requisições recebidas
- Limpe o cache se algo não funcionar: `localStorage.clear()`
