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
    activation_balance REAL NOT NULL DEFAULT 0,
    commission_balance REAL NOT NULL DEFAULT 0,
    last_withdrawal_date DATETIME,
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

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'INFO',
    read_status INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS phone_verifications (
    id TEXT PRIMARY KEY,
    phone TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    verified INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS otp_verifications (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'EMAIL',
    otp_code TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    verified INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

try {
  db.exec(`ALTER TABLE users ADD COLUMN avatar_url TEXT;`);
} catch (e) {}

try {
  db.exec(`ALTER TABLE users ADD COLUMN activation_balance REAL NOT NULL DEFAULT 0;`);
} catch (e) {}

try {
  db.exec(`ALTER TABLE users ADD COLUMN commission_balance REAL NOT NULL DEFAULT 0;`);
} catch (e) {}

try {
  db.exec(`ALTER TABLE users ADD COLUMN last_withdrawal_date DATETIME;`);
} catch (e) {}

try {
  db.exec(`ALTER TABLE users ADD COLUMN default_payment_provider TEXT DEFAULT 'Orange Money';`);
} catch (e) {}

try {
  db.exec(`ALTER TABLE users ADD COLUMN default_payment_number TEXT;`);
} catch (e) {}

try {
  db.exec(`ALTER TABLE users ADD COLUMN default_payment_holder TEXT;`);
} catch (e) {}

try {
  db.exec(`ALTER TABLE users ADD COLUMN preferred_otp_channel TEXT DEFAULT 'EMAIL';`);
} catch (e) {}

try {
  db.exec(`ALTER TABLE users ADD COLUMN sub_admin_access_code TEXT;`);
} catch (e) {}

const usersStorePath = path.join(dataDir, 'users-store.json');

// Helper to checkpoint WAL to disk immediately
export const checkpointDb = () => {
  try {
    db.pragma('wal_checkpoint(FULL)');
  } catch (e) {}
};

// Helper to get users from mirror JSON store
export const getUsersFromStore = () => {
  try {
    if (fs.existsSync(usersStorePath)) {
      const data = fs.readFileSync(usersStorePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {}
  return [];
};

// Helper to save or update a user in mirror JSON store
export const saveUserToStore = (user) => {
  try {
    const users = getUsersFromStore();
    const existingIndex = users.findIndex((u) => u.id === user.id || u.email?.toLowerCase() === user.email?.toLowerCase());
    if (existingIndex >= 0) {
      users[existingIndex] = { ...users[existingIndex], ...user };
    } else {
      users.push(user);
    }
    fs.writeFileSync(usersStorePath, JSON.stringify(users, null, 2), 'utf8');
  } catch (e) {}
};

// Helper to remove a user from mirror JSON store
export const removeUserFromStore = (userId) => {
  try {
    const users = getUsersFromStore();
    const filtered = users.filter((u) => u.id !== userId && u.email?.toLowerCase() !== userId?.toLowerCase());
    fs.writeFileSync(usersStorePath, JSON.stringify(filtered, null, 2), 'utf8');
  } catch (e) {}
};

// Helper to sync all database users into the JSON store
export const syncDbToStore = () => {
  try {
    const allUsers = db.prepare('SELECT * FROM users').all();
    if (allUsers && allUsers.length > 0) {
      fs.writeFileSync(usersStorePath, JSON.stringify(allUsers, null, 2), 'utf8');
    }
  } catch (e) {}
};

// Helper to sync JSON store into SQLite (auto-restore on boot)
export const syncStoreToDb = () => {
  try {
    const storeUsers = getUsersFromStore();
    if (Array.isArray(storeUsers) && storeUsers.length > 0) {
      const insertOrIgnore = db.prepare(`
        INSERT OR IGNORE INTO users (
          id, name, email, phone, password_hash, role, status, rank,
          balance, activation_balance, commission_balance, network_earnings,
          my_referral_code, sponsor_code, avatar_url, default_payment_provider,
          default_payment_number, default_payment_holder, preferred_otp_channel, sub_admin_access_code
        ) VALUES (
          @id, @name, @email, @phone, @password_hash, @role, @status, @rank,
          @balance, @activation_balance, @commission_balance, @network_earnings,
          @my_referral_code, @sponsor_code, @avatar_url, @default_payment_provider,
          @default_payment_number, @default_payment_holder, @preferred_otp_channel, @sub_admin_access_code
        )
      `);

      for (const u of storeUsers) {
        insertOrIgnore.run({
          id: u.id,
          name: u.name || 'Membre',
          email: u.email,
          phone: u.phone || '',
          password_hash: u.password_hash,
          role: u.role || 'MEMBRE',
          status: u.status || 'INACTIF',
          rank: u.rank || 'Apprenti',
          balance: u.balance || 0,
          activation_balance: u.activation_balance || 0,
          commission_balance: u.commission_balance || 0,
          network_earnings: u.network_earnings || 0,
          my_referral_code: u.my_referral_code || `ILL-${Math.floor(1000 + Math.random() * 9000)}`,
          sponsor_code: u.sponsor_code || null,
          avatar_url: u.avatar_url || null,
          default_payment_provider: u.default_payment_provider || 'Orange Money',
          default_payment_number: u.default_payment_number || u.phone || '',
          default_payment_holder: u.default_payment_holder || u.name || '',
          preferred_otp_channel: u.preferred_otp_channel || 'EMAIL',
          sub_admin_access_code: u.sub_admin_access_code || null,
        });
      }
      checkpointDb();
    }
  } catch (e) {}
};

// Seed default Admin & Payment Numbers ONLY if no admin exists
const checkAdmin = db.prepare("SELECT count(*) as count FROM users WHERE role = 'ADMIN'").get();
if (checkAdmin.count === 0) {
  const adminPasswordHash = bcrypt.hashSync('Admin@Illuminati2026', 12);

  const insertAdmin = db.prepare(`
    INSERT INTO users (id, name, email, phone, password_hash, role, status, rank, balance, network_earnings, my_referral_code, sponsor_code)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAdmin.run(
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
}

const checkNumbers = db.prepare('SELECT count(*) as count FROM admin_payment_numbers').get();
if (checkNumbers.count === 0) {
  const insertNumber = db.prepare(`
    INSERT INTO admin_payment_numbers (provider, number, holder, icon) VALUES (?, ?, ?, ?)
  `);
  insertNumber.run('Wave', '+225 07 00 11 22 33', 'Eco-Finance Treasury Wave', '🌊');
  insertNumber.run('Orange Money', '+225 07 88 77 66 55', 'Eco-Finance Pay OM CI', '🟠');
  insertNumber.run('MTN MoMo', '+225 05 44 33 22 11', 'Eco-Finance MoMo CI', '🟡');
  insertNumber.run('Moov Money', '+225 01 99 00 11 22', 'Eco-Finance Treasury Moov', '🟢');
}

// Auto-restore any users from JSON store and keep them in sync
syncStoreToDb();
syncDbToStore();
checkpointDb();

export default db;
