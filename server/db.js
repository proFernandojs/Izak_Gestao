const postgres = require('postgres');

// String de conexão via variável de ambiente
const connectionString = process.env.DATABASE_URL || '';

// Cria cliente Postgres (usa DEFAULTS se connectionString for vazio)
const sql = postgres(connectionString);

module.exports = sql;
