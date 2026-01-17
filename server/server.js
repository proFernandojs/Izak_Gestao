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

// Carrega dados ao iniciar
const users = loadUsers();

// Util IDs (compatível com CommonJS)
const genId = () => crypto.randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase();

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
});
