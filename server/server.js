require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(morgan('dev'));

// Servir arquivos estáticos do projeto (frontend) a partir da raiz do workspace
app.use(express.static(path.join(__dirname, '..')));

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

// Servir favicon requisitado automaticamente pelos navegadores
app.get('/favicon.ico', (req, res) => {
  try {
    const favPath = path.join(__dirname, '..', 'assets', 'Logo1.png');
    if (fs.existsSync(favPath)) return res.sendFile(favPath);
  } catch (e) {}
  res.status(204).end();
});

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
const APP_DATA_FILE = path.join(DATA_DIR, 'app-data.json');

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

function getDefaultAppData() {
  return {
    orcamentos: [],
    ordensServico: [],
    clientes: [],
    estoque: [],
    financeiro: {
      contasReceber: [],
      contasPagar: [],
      caixa: []
    }
  };
}

function normalizeAppData(input) {
  const base = getDefaultAppData();
  const data = input && typeof input === 'object' ? input : {};

  base.orcamentos = Array.isArray(data.orcamentos) ? data.orcamentos : [];
  base.ordensServico = Array.isArray(data.ordensServico) ? data.ordensServico : [];
  base.clientes = Array.isArray(data.clientes) ? data.clientes : [];
  base.estoque = Array.isArray(data.estoque) ? data.estoque : [];

  const financeiro = data.financeiro && typeof data.financeiro === 'object' ? data.financeiro : {};
  base.financeiro = {
    contasReceber: Array.isArray(financeiro.contasReceber) ? financeiro.contasReceber : [],
    contasPagar: Array.isArray(financeiro.contasPagar) ? financeiro.contasPagar : [],
    caixa: Array.isArray(financeiro.caixa) ? financeiro.caixa : []
  };

  return base;
}

function loadAppData() {
  try {
    if (fs.existsSync(APP_DATA_FILE)) {
      const raw = fs.readFileSync(APP_DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      const normalized = normalizeAppData(parsed);
      console.log(`✅ Dados do app carregados de ${APP_DATA_FILE}`);
      return normalized;
    }
  } catch (err) {
    console.error('⚠️ Erro ao carregar dados do app:', err.message);
  }
  console.log('📝 Iniciando com base de dados do app vazia');
  return getDefaultAppData();
}

function saveAppData(appData) {
  try {
    const normalized = normalizeAppData(appData);
    fs.writeFileSync(APP_DATA_FILE, JSON.stringify(normalized, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('❌ Erro ao salvar dados do app:', err.message);
    return false;
  }
}

// Carrega dados ao iniciar
const users = loadUsers();
let appData = loadAppData();

// GET /api/data - retorna base de dados principal do sistema
app.get('/api/data', (req, res) => {
  try {
    return res.json({ ok: true, data: appData });
  } catch (err) {
    console.error('Erro em GET /api/data:', err);
    return res.status(500).json({ ok: false, error: 'Erro ao carregar dados' });
  }
});

// POST /api/data - salva base de dados principal do sistema
app.post('/api/data', (req, res) => {
  try {
    const incoming = req.body && req.body.data;
    const normalized = normalizeAppData(incoming);
    appData = normalized;
    const ok = saveAppData(appData);
    if (!ok) {
      return res.status(500).json({ ok: false, error: 'Erro ao salvar dados' });
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error('Erro em POST /api/data:', err);
    return res.status(500).json({ ok: false, error: 'Erro ao salvar dados' });
  }
});

// POST /api/auth/register - Registrar novo usuário (Local)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, recoveryQuestion, recoveryAnswer } = req.body;
    
    if (!username || !password || !email) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Campos obrigatórios: username, email, password' 
      });
    }

    // Verifica se usuário já existe
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
    console.log(`✅ Novo usuário registrado: ${username} (ID: ${userId})`);

    return res.status(201).json({ 
      ok: true, 
      user: { id: userId, username, email: user.email } 
    });
  } catch (err) {
    console.error('Erro em /api/auth/register:', err);
    return res.status(500).json({ ok: false, error: 'Erro ao registrar usuário' });
  }
});

// POST /api/auth/login - Login (Local)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;
    
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ ok: false, error: 'username e password são obrigatórios' });
    }

    // Busca usuário no armazenamento local
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

    console.log(`✅ Login bem-sucedido: ${user.username}`);
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
  console.log(`✅ Servidor rodando na porta ${port}`);
  console.log(`📁 Usuários armazenados em: ${USERS_FILE}`);
  console.log(`📁 Dados do app armazenados em: ${APP_DATA_FILE}`);
});
