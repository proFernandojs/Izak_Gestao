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

## Configuração Recomendada (Local)

Este projeto foi ajustado para rodar em rede local, sem depender de serviços em nuvem.

### 1. Computador servidor

Escolha um computador fixo da empresa para ser o servidor local. Ele precisa ficar ligado durante o período de uso.

### 2. Iniciar o servidor

```bash
cd server
npm install
node server.js
```

Ou use o atalho pronto `iniciar-servidor.bat` na raiz do projeto.

### 3. Acessar pela rede local

- No próprio servidor: `http://localhost:3000/login.html`
- Nos outros computadores/celulares da mesma rede: `http://IP-DO-SERVIDOR:3000/login.html`

Não é necessário editar `modules/auth.js` para trocar URL, pois ele já usa o mesmo domínio automaticamente.

### 4. Persistência de dados

Os dados não ficam só em memória. Eles são persistidos em arquivo local:

- Usuários: `server/data/users.json`
- Dados do sistema (clientes, estoque, OS, financeiro): `server/data/app-data.json`

Faça backup desses dois arquivos com frequência.

## Testando Localmente

### 1. Inicie o servidor

```bash
cd server
npm install
node server.js
```

O servidor rodará em `http://localhost:3000`

### 2. Abra o frontend

Acesse diretamente no navegador:

`http://localhost:3000/login.html`

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
⚠️ Mantenha o acesso restrito à rede local quando possível  
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
- Abra o sistema pelo endereço do próprio servidor (`localhost:3000` ou `IP:3000`)
- Verifique se a porta 3000 está liberada no firewall

### "Usuário já cadastrado (offline)"
- Limpe o localStorage: `localStorage.clear()`
- Ou use outro username

### Senha não sincroniza entre dispositivos
- Verifique se todos os dispositivos usam o mesmo endereço (`IP-DO-SERVIDOR:3000`)
- Confirme que o servidor está online
- Teste com `curl http://IP-DO-SERVIDOR:3000/api/auth/login`

## Próximos Passos

1. ✅ Definir computador servidor na empresa
2. ✅ Ativar inicialização automática do servidor no Windows
3. ✅ Configurar rotina de backup dos arquivos `users.json` e `app-data.json`
4. ⚠️ Adicionar JWT para sessões
5. ⚠️ Implementar 2FA (autenticação em dois fatores)

---

**Suporte**: Em caso de dúvidas, verifique os logs no terminal onde o `node server.js` está rodando e valide o acesso via `http://localhost:3000/login.html`.
