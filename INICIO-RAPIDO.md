# 🚀 Início Rápido - Testes Locais

## Testando o Sistema de Autenticação Localmente

### 1. Inicie o Servidor

```bash
cd server
npm install
node server.js
```

Você verá mensagem de servidor rodando na porta 3000.

### 2. Abra o Frontend

O frontend já é servido pelo próprio servidor Node.

### 3. Teste a Autenticação

Abra no navegador: **http://localhost:3000/login.html**

Você pode:
- ✅ Cadastrar usuários
- ✅ Fazer login
- ✅ Resetar senhas

### 4. Teste o Sistema Real

Acesse: **http://localhost:3000/login.html**

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

### Rede Local

1. Descubra seu IP local:
   ```bash
   # Windows
   ipconfig
   # Procure por "Endereço IPv4" (ex: 192.168.1.100)
   
   # Mac/Linux
   ifconfig
   # Procure por "inet" (ex: 192.168.1.100)
   ```

2. No celular/tablet (mesma rede WiFi):
   - Acesse: `http://192.168.1.100:3000/login.html`

---

## 🎯 Checklist de Testes

Antes de fazer deploy, confirme:

- [ ] ✅ Servidor rodando (`node server.js`)
- [ ] ✅ Frontend acessível (`http://localhost:3000/login.html`)
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
2. Confirme que você abriu o sistema via `http://localhost:3000` (ou `http://IP-DO-SERVIDOR:3000`)
3. Veja os logs do servidor

### Erro: "CORS policy blocked"
**Solução**: 
1. Verifique se a porta 3000 está liberada no firewall do Windows
2. Reinicie o servidor

### Porta 3000 já em uso
**Solução**: 
```bash
# Inicie em outra porta temporária
$env:PORT=3001; node server.js

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

1. 📖 Leia o [DEPLOY.md](./DEPLOY.md) para instalação no cliente
2. 📦 Use `instalador-cliente.bat` para automatizar setup
3. 💾 Configure rotina de backup de `server/data/users.json` e `server/data/app-data.json`

---

## 💡 Dicas

- Use o Chrome DevTools (F12) → Network para ver as requisições
- Verifique o Console para erros JavaScript
- Os logs do servidor mostram todas as requisições recebidas
- Limpe o cache se algo não funcionar: `localStorage.clear()`
