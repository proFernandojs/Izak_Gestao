# 🚀 Configuração do Supabase - Autenticação Nativa

## ✅ O que Foi Implementado

Seu sistema agora usa **Supabase** para autenticação - uma solução profissional e gratuita que resolve todos os problemas de sincronização entre dispositivos!

### Vantagens:
- ✅ **Banco de dados PostgreSQL na nuvem** - Dados permanentes
- ✅ **Autenticação pronta** - Sistema robusto e seguro
- ✅ **Sincronização automática** - Mesma senha em todos os dispositivos
- ✅ **Gratuito até 50.000 usuários** - Perfeito para começar
- ✅ **Sem servidor próprio necessário** - Supabase hospeda tudo
- ✅ **Backup automático** - Seus dados estão seguros

---

## 📋 Passo a Passo: Configuração Inicial

### 1️⃣ Criar Conta no Supabase (Grátis)

1. Acesse: https://supabase.com
2. Clique em **"Start your project"**
3. Entre com GitHub, Google ou Email
4. É **100% gratuito** para começar!

### 2️⃣ Criar um Novo Projeto

1. No dashboard, clique em **"New Project"**
2. Preencha:
   - **Name**: `izak-gestao` (ou nome que preferir)
   - **Database Password**: Crie uma senha forte e **ANOTE**
   - **Region**: `South America (São Paulo)` (mais rápido para Brasil)
   - **Pricing Plan**: `Free` (gratuito)
3. Clique em **"Create new project"**
4. Aguarde 2-3 minutos (preparando banco de dados)

### 3️⃣ Obter as Chaves de API

Quando o projeto estiver pronto:

1. No menu lateral, clique em **⚙️ Settings**
2. Clique em **API**
3. Você verá duas informações importantes:

```
Project URL: https://xxxxxxxxxx.supabase.co
anon public: eyJhbGc...
service_role: eyJhbGc... (clique em "Reveal" para ver)
```

4. **Copie ambas as chaves!**

### 4️⃣ Configurar as Variáveis de Ambiente

1. Abra o arquivo `server/.env` (se não existir, crie baseado no `.env.example`)
2. Adicione suas chaves do Supabase:

```env
# Supabase (Autenticação e Banco de Dados)
SUPABASE_URL=https://xxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **IMPORTANTE:** 
- Cole as chaves COMPLETAS (elas são bem longas)
- A `SUPABASE_SERVICE_KEY` é **secreta** - nunca compartilhe!

### 5️⃣ (Opcional) Criar Tabela de Profiles

Para permitir login com username (ao invés de apenas email):

1. No Supabase, vá em **Table Editor** (menu lateral)
2. Clique em **"New table"**
3. Configure:
   - **Name**: `profiles`
   - Adicione colunas:
     - `id` → `uuid` → Primary Key → Default: `auth.uid()`
     - `username` → `text` → Unique
     - `email` → `text` → Unique
     - `created_at` → `timestamptz` → Default: `now()`
4. Clique em **Save**

5. Crie uma **Database Function** para auto-criar profile ao registrar:

Vá em **SQL Editor** e execute:

```sql
-- Função para criar profile automaticamente
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, email)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.email
  );
  return new;
end;
$$;

-- Trigger que executa a função ao criar usuário
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### 6️⃣ Reiniciar o Servidor

```bash
cd server
node server.js
```

Você deve ver:

```
✅ Supabase conectado: https://xxxxxxxxxx.supabase.co
Boleto server listening on port 3000
```

---

## 🧪 Testando a Configuração

### Teste 1: Registrar Usuário

1. Abra `login.html` no navegador
2. Vá na aba **"Cadastrar"**
3. Preencha:
   - Username: `teste`
   - Email: `teste@email.com`
   - Senha: `senha123`
4. Clique em **"Cadastrar"**

✅ **Sucesso:** Você é redirecionado para o sistema

### Teste 2: Verificar no Supabase

1. No Supabase, vá em **Authentication** → **Users**
2. Você deve ver o usuário `teste@email.com` registrado!
3. Em **Table Editor** → **profiles**, veja o username

### Teste 3: Login em Outro Dispositivo

1. No **celular** (mesma rede Wi-Fi):
   - Acesse: `http://SEU-IP:3000/login.html`
   - Faça login com: `teste@email.com` / `senha123`
   - ✅ **Funciona!**

2. **Reinicie o servidor** no computador
3. Tente logar novamente
4. ✅ **Ainda funciona!** Dados estão no Supabase

---

## 🌐 Para Acessar de Qualquer Lugar (Internet)

### Opção A: Hospedar Frontend no GitHub Pages (Grátis)

1. **Faça commit dos arquivos** (exceto `server/data/` e `.env`):

```bash
git add .
git commit -m "Implementado autenticação Supabase"
git push origin main
```

2. **Ative GitHub Pages:**
   - No GitHub, vá em: **Settings** → **Pages**
   - Source: `main` branch
   - Clique em **Save**
   - URL gerada: `https://seu-usuario.github.io/GraficaHome`

3. **Acesse de qualquer dispositivo:**
   - No celular: `https://seu-usuario.github.io/GraficaHome/login.html`
   - ✅ Login funciona de qualquer lugar!

### Opção B: Hospedar Servidor no Railway (se usar boletos)

Se você usa a funcionalidade de boletos, precisa manter o servidor rodando:

1. Instale Railway CLI:
```bash
npm install -g @railway/cli
```

2. Faça deploy:
```bash
cd server
railway login
railway init
railway up
```

3. Configure as variáveis de ambiente no Railway:
   - Vá em: https://railway.app → Seu projeto → Variables
   - Adicione: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, etc.

4. Atualize `modules/auth.js`:
```javascript
const Auth = {
  baseUrl: 'https://seu-projeto.railway.app', // URL do Railway
  // ...
}
```

---

## 🔒 Segurança - Configurar RLS (Row Level Security)

Para garantir que cada usuário só veja seus próprios dados:

1. No Supabase, vá em **Table Editor** → `profiles`
2. Clique em **"RLS disabled"** → **Enable RLS**
3. Adicione políticas:

```sql
-- Usuários podem ver apenas seu próprio perfil
create policy "Users can view own profile"
  on profiles for select
  using ( auth.uid() = id );

-- Usuários podem atualizar apenas seu próprio perfil
create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );
```

---

## 📊 Monitoramento e Logs

### Ver Usuários Registrados
- Supabase → **Authentication** → **Users**

### Ver Atividade de Login
- Supabase → **Logs** → **Auth Logs**

### Ver Uso do Banco
- Supabase → **Settings** → **Usage**

---

## ❓ Troubleshooting (Resolução de Problemas)

### Problema: "Supabase não configurado"

**Solução:**
1. Verifique se o arquivo `.env` existe em `server/`
2. Confirme que as variáveis estão corretas:
   ```
   SUPABASE_URL=https://...
   SUPABASE_SERVICE_KEY=eyJ...
   ```
3. Reinicie o servidor

### Problema: "Invalid API key"

**Solução:**
- Use a chave `service_role` (não a `anon`)
- Certifique-se de copiar a chave COMPLETA
- Não tenha espaços antes/depois da chave

### Problema: "Email not confirmed"

**Solução:**
1. No Supabase: **Authentication** → **Settings** → **Email Auth**
2. Desative **"Confirm email"** (para desenvolvimento)
3. Em produção, configure um provedor de email

### Problema: "Cannot find module @supabase/supabase-js"

**Solução:**
```bash
cd server
npm install @supabase/supabase-js
```

---

## 📚 Recursos Adicionais

- **Documentação Supabase:** https://supabase.com/docs
- **Guia de Auth:** https://supabase.com/docs/guides/auth
- **Comunidade (Discord):** https://discord.supabase.com
- **YouTube Tutoriais:** https://www.youtube.com/@Supabase

---

## ✅ Checklist de Configuração

- [ ] Conta Supabase criada
- [ ] Projeto Supabase criado
- [ ] Chaves API copiadas
- [ ] Arquivo `.env` configurado
- [ ] Servidor reiniciado
- [ ] Teste de registro funcionou
- [ ] Teste de login funcionou
- [ ] Dados aparecem no Supabase Dashboard
- [ ] (Opcional) Tabela `profiles` criada
- [ ] (Opcional) RLS configurado
- [ ] (Opcional) GitHub Pages ativado

---

**🎉 Parabéns! Seu sistema agora tem autenticação profissional e escalável!**

Se tiver dúvidas, consulte a documentação oficial ou abra uma issue no GitHub.
