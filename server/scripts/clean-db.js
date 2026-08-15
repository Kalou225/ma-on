import db, { checkpointDb, getUsersFromStore } from '../db/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const usersStorePath = path.join(__dirname, '../data/users-store.json');

console.log('🧹 Nettoyage de la base de données et initialisation de production...');

// 1. Get current Admin user from SQLite
const adminUser = db.prepare("SELECT * FROM users WHERE role = 'ADMIN' LIMIT 1").get();

if (!adminUser) {
  console.error('❌ Aucun compte Administrateur Général trouvé !');
  process.exit(1);
}

console.log(`👤 Compte Administrateur conservé : ${adminUser.name} (${adminUser.email})`);

// 2. Delete all other users and dummy data
const deletedTxns = db.prepare('DELETE FROM transactions WHERE user_id != ?').run(adminUser.id);
const deletedNotifs = db.prepare('DELETE FROM notifications WHERE user_id != ?').run(adminUser.id);
const deletedTokens = db.prepare('DELETE FROM refresh_tokens WHERE user_id != ?').run(adminUser.id);
const deletedUsers = db.prepare('DELETE FROM users WHERE id != ?').run(adminUser.id);
db.prepare('DELETE FROM otp_verifications').run();
db.prepare('DELETE FROM phone_verifications').run();

console.log(`   - Utilisateurs supprimés : ${deletedUsers.changes}`);
console.log(`   - Transactions de test supprimées : ${deletedTxns.changes}`);
console.log(`   - Notifications de test supprimées : ${deletedNotifs.changes}`);

// 3. Reset mirror users-store.json to ONLY the Admin user
const cleanStore = [
  {
    id: adminUser.id,
    name: adminUser.name,
    email: adminUser.email,
    phone: adminUser.phone,
    password_hash: adminUser.password_hash,
    role: adminUser.role,
    status: adminUser.status,
    rank: adminUser.rank,
    balance: adminUser.balance || 0,
    activation_balance: adminUser.activation_balance || 0,
    commission_balance: adminUser.commission_balance || 0,
    network_earnings: adminUser.network_earnings || 0,
    my_referral_code: adminUser.my_referral_code,
    sponsor_code: adminUser.sponsor_code,
    mfa_secret: adminUser.mfa_secret,
    mfa_enabled: adminUser.mfa_enabled,
    failed_attempts: 0,
    lockout_until: null,
    created_at: adminUser.created_at,
    avatar_url: adminUser.avatar_url,
    default_payment_provider: adminUser.default_payment_provider || 'Orange Money',
    default_payment_number: adminUser.default_payment_number,
    default_payment_holder: adminUser.default_payment_holder,
    preferred_otp_channel: adminUser.preferred_otp_channel || 'EMAIL',
    sub_admin_access_code: adminUser.sub_admin_access_code || null,
  },
];

fs.writeFileSync(usersStorePath, JSON.stringify(cleanStore, null, 2), 'utf8');
checkpointDb();

// 4. Verify Final State
const finalUsersCount = db.prepare('SELECT count(*) as count FROM users').get().count;
const storeCount = JSON.parse(fs.readFileSync(usersStorePath, 'utf8')).length;

console.log('\n========================================================');
console.log(`✅ Base de données initialisée avec succès !`);
console.log(`   - Utilisateurs en BDD SQLite : ${finalUsersCount} (Administrateur Général uniquement)`);
console.log(`   - Utilisateurs dans users-store.json : ${storeCount} (Administrateur Général uniquement)`);
console.log('========================================================\n');
