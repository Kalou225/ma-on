import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'ma-on-secure.db');
const db = new Database(dbPath);

// Enable WAL mode & foreign keys for performance and safety
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'MEMBRE',
    status TEXT NOT NULL DEFAULT 'INACTIF',
    rank TEXT NOT NULL DEFAULT 'Apprenti',
    balance REAL NOT NULL DEFAULT 0,
    network_earnings REAL NOT NULL DEFAULT 0,
    my_referral_code TEXT UNIQUE NOT NULL,
    sponsor_code TEXT,
    mfa_secret TEXT,
    mfa_enabled INTEGER NOT NULL DEFAULT 0,
    avatar_url TEXT,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    lockout_until DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admin_payment_numbers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider TEXT NOT NULL,
    number TEXT NOT NULL,
    holder TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '📱',
    active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    label TEXT NOT NULL,
    amount REAL NOT NULL,
    provider TEXT,
    recipient_number TEXT,
    sender_number TEXT,
    txn_id TEXT UNIQUE,
    date_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    note TEXT,
    reviewed_by TEXT,
    reviewed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    revoked INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

try {
  db.exec(`ALTER TABLE users ADD COLUMN avatar_url TEXT;`);
} catch (e) {
  // Column already exists
}

// Seed default Admin & User if database is empty
const checkUser = db.prepare('SELECT count(*) as count FROM users').get();
if (checkUser.count === 0) {
  const adminPasswordHash = bcrypt.hashSync('Admin@Illuminati2026', 12);
  const userPasswordHash = bcrypt.hashSync('Alex@2026Password', 12);

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, phone, password_hash, role, status, rank, balance, network_earnings, my_referral_code, sponsor_code)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(
    'usr-admin-01',
    'Administrateur Général',
    'admin@illuminati-mlm.com',
    '+225 01 00 00 00 00',
    adminPasswordHash,
    'ADMIN',
    'ACTIF',
    'Grand Maître',
    1500000,
    5000000,
    'ADMIN-0001',
    null
  );

  insertUser.run(
    'usr-alex-02',
    'Alexandre Kouassi',
    'alex.kouassi@illuminati-mlm.com',
    '+225 07 12 34 56 78',
    userPasswordHash,
    'MEMBRE',
    'ACTIF',
    'Compagnon',
    485000,
    310000,
    'ALEX-9912',
    'ILL-88392'
  );

  // Seed default payment numbers
  const insertNumber = db.prepare(`
    INSERT INTO admin_payment_numbers (provider, number, holder, icon) VALUES (?, ?, ?, ?)
  `);
  insertNumber.run('Wave', '+225 07 00 11 22 33', 'Eco-Finance Treasury Wave', '🌊');
  insertNumber.run('Orange Money', '+225 07 88 77 66 55', 'Eco-Finance Pay OM CI', '🟠');
  insertNumber.run('MTN MoMo', '+225 05 44 33 22 11', 'Eco-Finance MoMo CI', '🟡');
  insertNumber.run('Moov Money', '+225 01 99 00 11 22', 'Eco-Finance Treasury Moov', '🟢');
}

export default db;
