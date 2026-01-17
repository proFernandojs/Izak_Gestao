require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const crypto = require('crypto');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());
app.use(morgan('dev'));

// Inicializa Supabase (se configurado)
let supabase = null;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  console.log('✅ Supabase conectado:', SUPABASE_URL);
} else {
  console.log('⚠️  Supabase não configurado - usando armazenamento local');
}

// CORS básico (permite arquivo local/origin null e lista do .env)
const origins = (process.env.ORIGINS || '').split(',').filter(Boolean);
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // file:// ou apps locais
    if (!origins.length) return callback(null, true);
    if (origins.includes(origin)) return callback(null, true);
    return callback(null, true); // libera geral por simplicidade
  }
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Util IDs (compatível com CommonJS)
const genId = () => crypto.randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase();
const makeLinhaDigitavel = () => {
  // Linha digitável dummy (apenas formato visual)
  const seq = Array.from({ length: 47 }, () => Math.floor(Math.random() * 10)).join('');
  return `${seq.slice(0,5)}.${seq.slice(5,10)} ${seq.slice(10,15)}.${seq.slice(15,21)} ${seq.slice(21,26)}.${seq.slice(26,32)} ${seq.slice(32,33)} ${seq.slice(33)}`;
};

// Arquivo para persistência de dados
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const STORE_FILE = path.join(DATA_DIR, 'boletos.json');

// Garante que o diretório existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log('📁 Diretório de dados criado:', DATA_DIR);
}

// Funções para salvar/carregar usuários
function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      const usersArray = JSON.parse(data);
      const map = new Map();
      usersArray.forEach(u => map.set(u.id, u));
      console.log(`✅ ${map.size} usuários carregados de ${USERS_FILE}`);
      return map;
    }
  } catch (err) {
    console.error('⚠️ Erro ao carregar usuários:', err.message);
  }
  console.log('📝 Iniciando com banco de usuários vazio');
  return new Map();
}

function saveUsers() {
  try {
    const usersArray = Array.from(users.values());
    fs.writeFileSync(USERS_FILE, JSON.stringify(usersArray, null, 2), 'utf8');
    console.log(`💾 ${usersArray.length} usuários salvos em ${USERS_FILE}`);
  } catch (err) {
    console.error('❌ Erro ao salvar usuários:', err.message);
  }
}

// Funções para salvar/carregar boletos
function loadStore() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const data = fs.readFileSync(STORE_FILE, 'utf8');
      const storeArray = JSON.parse(data);
      const map = new Map();
      storeArray.forEach(item => map.set(item.id, item));
      console.log(`✅ ${map.size} boletos carregados de ${STORE_FILE}`);
      return map;
    }
  } catch (err) {
    console.error('⚠️ Erro ao carregar boletos:', err.message);
  }
  return new Map();
}

function saveStore() {
  try {
    const storeArray = Array.from(store.values());
    fs.writeFileSync(STORE_FILE, JSON.stringify(storeArray, null, 2), 'utf8');
  } catch (err) {
    console.error('❌ Erro ao salvar boletos:', err.message);
  }
}

// Carrega dados ao iniciar
const users = loadUsers();
const store = loadStore();

// Provider selection
const PROVIDER = (process.env.PROVIDER || 'MOCK').toUpperCase();
const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN || '';
const PAGBANK_SECRET = process.env.PAGBANK_SECRET || '';

// Helper: decide headers for PagBank
const pagbankHeaders = () => ({
  'Authorization': `Bearer ${PAGBANK_TOKEN}`,
  'Content-Type': 'application/json'
});

const fallbackAddress = {
  street: process.env.PAGADOR_STREET || 'Av. Paulista',
  number: process.env.PAGADOR_NUMBER || '1000',
  locality: process.env.PAGADOR_DISTRICT || 'Centro',
  city: process.env.PAGADOR_CITY || 'Sao Paulo',
  region: process.env.PAGADOR_UF || 'SP',
  postal: (process.env.PAGADOR_CEP || '01000000').replace(/\D/g, '')
};

// Cria payload para PagBank charge (boleto)
function buildPagBankPayload(body) {
  try {
    const { valor, vencimento, pagador, instrucoes, referencia, nossoNumero } = body;
    
    // Validações básicas
    if (!valor || !vencimento || !pagador) {
      throw new Error('Campos obrigatórios faltando: valor, vencimento, pagador');
    }
    
    const payload = {
      reference_id: referencia || nossoNumero || genId(),
      description: 'Boleto Izak',
      amount: {
        value: Math.round(Number(valor || 0) * 100),
        currency: 'BRL'
      },
      payment_method: {
        type: 'BOLETO',
        boleto: {
          due_date: vencimento,
          instruction_lines: {
            line_1: (instrucoes || '').slice(0, 100),
            line_2: ''
          },
          holder: {
            name: pagador?.nome,
            tax_id: (pagador?.documento || '').replace(/\D/g, ''),
            email: pagador?.email || undefined,
            address: {
              country: 'BRA',
              region_code: pagador?.endereco?.uf || fallbackAddress.region,
              city: pagador?.endereco?.cidade || fallbackAddress.city,
              postal_code: (pagador?.endereco?.cep || fallbackAddress.postal).replace(/\D/g, ''),
              street: pagador?.endereco?.logradouro || fallbackAddress.street,
              number: pagador?.endereco?.numero || fallbackAddress.number,
              locality: pagador?.endereco?.bairro || fallbackAddress.locality
            }
          }
        }
      }
    };
    
    return payload;
  } catch (err) {
    console.error('Erro em buildPagBankPayload:', err.message);
    throw err;
  }
}

async function emitWithPagBank(body) {
  try {
    if (!PAGBANK_TOKEN) {
      throw new Error('PAGBANK_TOKEN não configurado');
    }
    const payload = buildPagBankPayload(body);
    console.log('Payload PagBank:', JSON.stringify(payload, null, 2));
    
    const resp = await fetch('https://api.pagseguro.com/charges', {
      method: 'POST',
      headers: pagbankHeaders(),
      body: JSON.stringify(payload)
    });
    
    const txt = await resp.text();
    console.log('Resposta PagBank status:', resp.status);
    console.log('Resposta PagBank body:', txt);
    
    if (!resp.ok) {
      throw new Error(`PagBank falhou (${resp.status}): ${txt}`);
    }
    
    const data = JSON.parse(txt);
    const boleto = data?.payment_method?.boleto || {};
    return {
      id: data.id,
      status: data.status || 'emitido',
      linhaDigitavel: boleto.digitable_line || boleto.barcode || 'N/A',
      barcode: boleto.barcode || (boleto.digitable_line || '').replace(/\D/g, ''),
      pdfUrl: boleto.pdf || boleto.download_link || '',
      createdAt: data.created_at || new Date().toISOString(),
      provider: 'PAGBANK'
    };
  } catch (err) {
    console.error('Erro em emitWithPagBank:', err.message);
    throw err;
  }
}

async function consultWithPagBank(id) {
  if (!PAGBANK_TOKEN) throw new Error('PAGBANK_TOKEN não configurado');
  const resp = await fetch(`https://api.pagseguro.com/charges/${id}`, {
    method: 'GET',
    headers: pagbankHeaders()
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`PagBank consulta falhou (${resp.status}): ${txt}`);
  }
  const data = await resp.json();
  const boleto = data?.payment_method?.boleto || {};
  return {
    id: data.id,
    status: data.status,
    linhaDigitavel: boleto.digitable_line || boleto.barcode || 'N/A',
    barcode: boleto.barcode || (boleto.digitable_line || '').replace(/\D/g, ''),
    pdfUrl: boleto.pdf || boleto.download_link || '',
    createdAt: data.created_at || new Date().toISOString(),
    provider: 'PAGBANK'
  };
}

async function cancelWithPagBank(id) {
  if (!PAGBANK_TOKEN) throw new Error('PAGBANK_TOKEN não configurado');
  const resp = await fetch(`https://api.pagseguro.com/charges/${id}/cancel`, {
    method: 'POST',
    headers: pagbankHeaders()
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`PagBank cancel falhou (${resp.status}): ${txt}`);
  }
  const data = await resp.json();
  return { id: data.id, status: data.status || 'cancelado' };
}

// POST /api/boletos -> emite boleto (PagBank ou mock)
app.post('/api/boletos', async (req, res) => {
  try {
    const { valor, vencimento, pagador } = req.body || {};
    if (!valor || !vencimento || !pagador?.nome || !pagador?.documento) {
      return res.status(400).json({ error: 'Campos obrigatórios: valor, vencimento, pagador.nome, pagador.documento' });
    }

    let boleto;
    if (PROVIDER === 'PAGBANK') {
      console.log('Tentando emitir com PagBank...', req.body);
      boleto = await emitWithPagBank(req.body);
      console.log('Boleto PagBank emitido:', boleto);
    } else {
      // Mock
      const id = genId();
      const linhaDigitavel = makeLinhaDigitavel();
      const barcode = linhaDigitavel.replace(/\D/g, '');
      const pdfUrl = `https://via.placeholder.com/1200x1700.png?text=Boleto+${id}`;
      boleto = {
        id,
        status: 'emitido',
        valor,
        vencimento,
        pagador,
        instrucoes: req.body?.instrucoes || '',
        nossoNumero: req.body?.nossoNumero || id,
        referencia: req.body?.referencia || null,
        linhaDigitavel,
        barcode,
        pdfUrl,
        createdAt: new Date().toISOString(),
        provider: 'MOCK'
      };
    }

    // Armazena no store para consultas/cancelamentos locais
    store.set(boleto.id, boleto);
    saveStore(); // Salva no arquivo
    return res.status(201).json(boleto);
  } catch (err) {
    console.error('Erro ao emitir boleto:');
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    console.error('Body recebido:', req.body);
    return res.status(500).json({ error: err.message || 'Falha ao emitir boleto', details: err.stack });
  }
});

// GET /api/boletos/:id -> consulta boleto (provider + cache)
app.get('/api/boletos/:id', async (req, res) => {
  const cached = store.get(req.params.id);
  try {
    if (PROVIDER === 'PAGBANK') {
      const remote = await consultWithPagBank(req.params.id);
      const merged = { ...cached, ...remote };
      store.set(req.params.id, merged);
      return res.json(merged);
    }
  } catch (err) {
    console.warn('Consulta PagBank falhou, retornando cache se existir:', err.message);
  }
  if (!cached) return res.status(404).json({ error: 'Boleto não encontrado' });
  return res.json(cached);
});

// POST /api/boletos/:id/cancel -> cancela boleto
app.post('/api/boletos/:id/cancel', async (req, res) => {
  const cached = store.get(req.params.id);
  if (!cached) return res.status(404).json({ error: 'Boleto não encontrado' });
  if (cached.status === 'pago') return res.status(400).json({ error: 'Boleto já pago' });
  try {
    if (PROVIDER === 'PAGBANK') {
      const remote = await cancelWithPagBank(req.params.id);
      const merged = { ...cached, ...remote, canceledAt: new Date().toISOString() };
      store.set(cached.id, merged);
      return res.json(merged);
    }
  } catch (err) {
    console.error('Cancel PagBank falhou:', err.message);
    return res.status(500).json({ error: err.message || 'Falha ao cancelar' });
  }
  // Mock cancel
  cached.status = 'cancelado';
  cached.canceledAt = new Date().toISOString();
  store.set(cached.id, cached);
  saveStore(); // Salva no arquivo
  return res.json(cached);
});

// Webhook de confirmação de pagamento (PagBank ou mock)
// Configure a URL deste endpoint no painel do PagBank.
app.post('/webhooks/boletos', (req, res) => {
  const { id, status } = req.body || {};
  if (!id) return res.status(400).json({ error: 'id ausente' });
  const b = store.get(id) || { id, status: 'desconhecido' };
  if (status === 'PAID' || status === 'paid') {
    b.status = 'pago';
    b.paidAt = new Date().toISOString();
  }
  store.set(id, b);
  saveStore(); // Salva no arquivo
  return res.json({ ok: true });
});

// ==================== AUTENTICAÇÃO ====================

// POST /api/auth/register - Registrar novo usuário (Supabase)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, recoveryQuestion, recoveryAnswer } = req.body;
    
    if (!username || !password || !email) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Campos obrigatórios: username, email, password' 
      });
    }

    // Se Supabase está configurado, usa a autenticação nativa
    if (supabase) {
      // Registra o usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            recovery_question: recoveryQuestion || '',
            recovery_answer: recoveryAnswer ? crypto.createHash('sha256').update(recoveryAnswer.toLowerCase().trim()).digest('hex') : ''
          }
        }
      });

      if (authError) {
        console.error('Erro Supabase Auth:', authError);
        return res.status(400).json({ ok: false, error: authError.message });
      }

      console.log(`✅ Novo usuário registrado no Supabase: ${username} (${email})`);
      return res.status(201).json({ 
        ok: true, 
        user: { 
          id: authData.user.id, 
          username, 
          email: authData.user.email 
        } 
      });
    }

    // Fallback: armazenamento local (se Supabase não configurado)
    const exists = Array.from(users.values()).some(u => 
      u.username.toLowerCase() === username.toLowerCase() || 
      (email && u.email && u.email.toLowerCase() === email.toLowerCase())
    );

    if (exists) {
      return res.status(409).json({ ok: false, error: 'Usuário ou email já cadastrado' });
    }

    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    const recoveryAnswerHash = recoveryAnswer ? crypto.createHash('sha256').update(recoveryAnswer.toLowerCase().trim()).digest('hex') : '';

    const userId = genId();
    const user = {
      id: userId,
      username,
      email: email || '',
      passwordHash,
      recoveryQuestion: recoveryQuestion || '',
      recoveryAnswerHash,
      createdAt: new Date().toISOString()
    };

    users.set(userId, user);
    saveUsers();
    console.log(`✅ Novo usuário registrado localmente: ${username} (ID: ${userId})`);

    return res.status(201).json({ 
      ok: true, 
      user: { id: userId, username, email: user.email } 
    });
  } catch (err) {
    console.error('Erro em /api/auth/register:', err);
    return res.status(500).json({ ok: false, error: 'Erro ao registrar usuário' });
  }
});

// POST /api/auth/login - Login (Supabase)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;
    
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ ok: false, error: 'username e password são obrigatórios' });
    }

    // Se Supabase está configurado
    if (supabase) {
      // Tenta login com email
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: usernameOrEmail,
        password
      });

      if (authError) {
        // Se falhar, pode ser porque o usuário passou username ao invés de email
        // Busca o email pelo username nos metadados
        console.log('Tentando buscar usuário por username...');
        
        // Fallback: tenta buscar na tabela de profiles (se existir)
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', usernameOrEmail)
          .single();

        if (!profileError && profiles?.email) {
          // Tenta login novamente com o email encontrado
          const { data: retryAuth, error: retryError } = await supabase.auth.signInWithPassword({
            email: profiles.email,
            password
          });

          if (retryError) {
            return res.status(401).json({ ok: false, error: 'Usuário ou senha incorretos' });
          }

          const username = retryAuth.user.user_metadata?.username || usernameOrEmail;
          console.log(`✅ Login bem-sucedido no Supabase: ${username}`);
          
          return res.json({ 
            ok: true, 
            user: { 
              id: retryAuth.user.id, 
              username,
              email: retryAuth.user.email 
            },
            session: retryAuth.session
          });
        }

        return res.status(401).json({ ok: false, error: 'Usuário ou senha incorretos' });
      }

      const username = authData.user.user_metadata?.username || usernameOrEmail;
      console.log(`✅ Login bem-sucedido no Supabase: ${username}`);
      
      return res.json({ 
        ok: true, 
        user: { 
          id: authData.user.id, 
          username,
          email: authData.user.email 
        },
        session: authData.session
      });
    }

    // Fallback: armazenamento local
    const q = usernameOrEmail.toLowerCase().trim();
    const user = Array.from(users.values()).find(u => 
      u.username.toLowerCase() === q || 
      (u.email && u.email.toLowerCase() === q)
    );

    if (!user) {
      return res.status(401).json({ ok: false, error: 'Usuário ou senha incorretos' });
    }

    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    if (passwordHash !== user.passwordHash) {
      return res.status(401).json({ ok: false, error: 'Usuário ou senha incorretos' });
    }

    console.log(`✅ Login bem-sucedido localmente: ${user.username}`);
    return res.json({ 
      ok: true, 
      user: { id: user.id, username: user.username, email: user.email } 
    });
  } catch (err) {
    console.error('Erro em /api/auth/login:', err);
    return res.status(500).json({ ok: false, error: 'Erro ao fazer login' });
  }
});

// POST /api/auth/reset-password - Resetar senha com pergunta de recuperação
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { usernameOrEmail, recoveryAnswer, newPassword } = req.body;
    
    if (!usernameOrEmail || !recoveryAnswer || !newPassword) {
      return res.status(400).json({ 
        ok: false, 
        error: 'usernameOrEmail, recoveryAnswer e newPassword são obrigatórios' 
      });
    }

    // Busca usuário
    const q = usernameOrEmail.toLowerCase().trim();
    const user = Array.from(users.values()).find(u => 
      u.username.toLowerCase() === q || 
      (u.email && u.email.toLowerCase() === q)
    );

    if (!user) {
      return res.status(404).json({ ok: false, error: 'Usuário não encontrado' });
    }

    // Verifica resposta de recuperação
    const answerHash = crypto.createHash('sha256').update(recoveryAnswer.toLowerCase().trim()).digest('hex');
    if (answerHash !== user.recoveryAnswerHash) {
      return res.status(401).json({ ok: false, error: 'Resposta de recuperação incorreta' });
    }

    // Atualiza senha
    const newPasswordHash = crypto.createHash('sha256').update(newPassword).digest('hex');
    user.passwordHash = newPasswordHash;
    user.passwordUpdatedAt = new Date().toISOString();
    saveUsers(); // Salva no arquivo

    console.log(`✅ Senha resetada para: ${user.username}`);
    return res.json({ ok: true, message: 'Senha atualizada com sucesso' });
  } catch (err) {
    console.error('Erro em /api/auth/reset-password:', err);
    return res.status(500).json({ ok: false, error: 'Erro ao resetar senha' });
  }
});

// GET /api/auth/recovery-question - Obter pergunta de recuperação
app.get('/api/auth/recovery-question', async (req, res) => {
  try {
    const { usernameOrEmail } = req.query;
    
    if (!usernameOrEmail) {
      return res.status(400).json({ ok: false, error: 'usernameOrEmail é obrigatório' });
    }

    const q = usernameOrEmail.toLowerCase().trim();
    const user = Array.from(users.values()).find(u => 
      u.username.toLowerCase() === q || 
      (u.email && u.email.toLowerCase() === q)
    );

    if (!user) {
      return res.status(404).json({ ok: false, error: 'Usuário não encontrado' });
    }

    return res.json({ ok: true, recoveryQuestion: user.recoveryQuestion });
  } catch (err) {
    console.error('Erro em /api/auth/recovery-question:', err);
    return res.status(500).json({ ok: false, error: 'Erro ao obter pergunta de recuperação' });
  }
});

const port = process.env.PORT || 3000;

// Handler global de erros não tratados
process.on('uncaughtException', (err) => {
  console.error('ERRO NÃO TRATADO:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('PROMISE REJEITADA:', reason);
});

app.listen(port, () => {
  console.log(`Boleto server listening on port ${port}`);
  console.log(`PROVIDER: ${PROVIDER}`);
  console.log(`PAGBANK_TOKEN configurado: ${PAGBANK_TOKEN ? 'SIM' : 'NÃO'}`);
});
