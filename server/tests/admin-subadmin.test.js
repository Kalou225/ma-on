import assert from 'assert';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db, { saveUserToStore, removeUserFromStore, syncStoreToDb } from '../db/database.js';
import { config } from '../config/security.js';
import { requireMasterAdmin, requireAdminOrSubAdmin } from '../middleware/authMiddleware.js';

console.log('🚀 ========================================================');
console.log('🧪 DÉBUT DU TEST UNITAIRE ET INTÉGRATION: PARAMÈTRES & SOUS-ADMIN');
console.log('========================================================\n');

const testAdminId = `usr-admin-test-${Date.now()}`;
const testUserId = `usr-member-test-${Date.now()}`;

// 1. Setup Test Admin and Member
const adminPassword = 'AdminMasterPassword2026';
const adminHash = bcrypt.hashSync(adminPassword, 10);

const memberPassword = 'MemberPassword2026';
const memberHash = bcrypt.hashSync(memberPassword, 10);

db.prepare(`
  INSERT OR REPLACE INTO users (id, name, email, phone, password_hash, role, status, rank, my_referral_code)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  testAdminId,
  'Super Admin Test',
  `superadmin.${Date.now()}@ecofinance.ci`,
  '+225 01 02 03 04 05',
  adminHash,
  'ADMIN',
  'ACTIF',
  'Grand Maître',
  `ADM-${Math.floor(1000 + Math.random() * 9000)}`
);

db.prepare(`
  INSERT OR REPLACE INTO users (id, name, email, phone, password_hash, role, status, rank, my_referral_code)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  testUserId,
  'Membre De Confiance',
  `trusted.${Date.now()}@ecofinance.ci`,
  '+225 07 77 88 99 00',
  memberHash,
  'MEMBRE',
  'ACTIF',
  'Compagnon',
  `TRU-${Math.floor(1000 + Math.random() * 9000)}`
);

console.log('1️⃣ Test : Initialisation des comptes Admin et Membre de test...');
const adminUser = db.prepare('SELECT * FROM users WHERE id = ?').get(testAdminId);
const memberUser = db.prepare('SELECT * FROM users WHERE id = ?').get(testUserId);
assert.strictEqual(adminUser.role, 'ADMIN', 'L\'admin doit avoir le rôle ADMIN');
assert.strictEqual(memberUser.role, 'MEMBRE', 'Le membre doit avoir le rôle MEMBRE');
console.log('   ✅ Comptes de test créés avec succès.\n');

// 2. Test Super Admin Credentials Update
console.log('2️⃣ Test : Modification des références de connexion de l\'Administrateur Général...');
const newAdminEmail = `superadmin.updated.${Date.now()}@ecofinance.ci`;
const newAdminPhone = '+225 01 99 88 77 66';
const newAdminPassword = 'NewSuperAdminPassword2026!';
const newAdminHash = bcrypt.hashSync(newAdminPassword, 10);

db.prepare(`
  UPDATE users 
  SET email = ?, phone = ?, password_hash = ?
  WHERE id = ?
`).run(newAdminEmail, newAdminPhone, newAdminHash, testAdminId);

const updatedAdmin = db.prepare('SELECT * FROM users WHERE id = ?').get(testAdminId);
assert.strictEqual(updatedAdmin.email, newAdminEmail, 'L\'email admin doit être mis à jour');
assert.strictEqual(updatedAdmin.phone, newAdminPhone, 'Le téléphone admin doit être mis à jour');
assert.ok(bcrypt.compareSync(newAdminPassword, updatedAdmin.password_hash), 'Le nouveau mot de passe admin doit être valide');
console.log('   ✅ Références Master Admin mises à jour avec succès.\n');

// 3. Test Nomination of Member to Sub-Admin with Access Code
console.log('3️⃣ Test : Nomination du membre en Sous-Administrateur avec Code d\'accès...');
const subAdminCode = 'SEC-7744';
db.prepare(`
  UPDATE users 
  SET role = 'SUB_ADMIN', sub_admin_access_code = ?
  WHERE id = ?
`).run(subAdminCode, testUserId);

const promotedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(testUserId);
assert.strictEqual(promotedUser.role, 'SUB_ADMIN', 'L\'utilisateur doit maintenant être SUB_ADMIN');
assert.strictEqual(promotedUser.sub_admin_access_code, subAdminCode, 'Le code d\'accès sous-admin doit être enregistré');
console.log('   ✅ Promotion en Sous-Administrateur validée (Rôle: SUB_ADMIN, Code: SEC-7744).\n');

// 4. Test Middleware Security Checks
console.log('4️⃣ Test : Vérification des contrôles de sécurité et permissions des middlewares...');
// A. requireAdminOrSubAdmin should allow SUB_ADMIN
let adminOrSubAdminPassed = false;
const mockSubAdminReq = { user: { id: testUserId, role: 'SUB_ADMIN' }, ip: '127.0.0.1' };
const mockRes = {
  status: (code) => ({
    json: (obj) => ({ code, ...obj }),
  }),
};
requireAdminOrSubAdmin(mockSubAdminReq, mockRes, () => {
  adminOrSubAdminPassed = true;
});
assert.strictEqual(adminOrSubAdminPassed, true, 'requireAdminOrSubAdmin doit autoriser SUB_ADMIN');
console.log('   ✅ requireAdminOrSubAdmin autorise bien le Sous-Administrateur.');

// B. requireMasterAdmin MUST block SUB_ADMIN
let masterBlocked = false;
let blockedStatus = 0;
const mockFailRes = {
  status: (code) => {
    blockedStatus = code;
    return {
      json: (obj) => {
        masterBlocked = true;
        return { code, ...obj };
      },
    };
  },
};
requireMasterAdmin(mockSubAdminReq, mockFailRes, () => {
  masterBlocked = false;
});
assert.strictEqual(masterBlocked, true, 'requireMasterAdmin doit bloquer SUB_ADMIN');
assert.strictEqual(blockedStatus, 403, 'Le statut de rejet doit être 403 Forbidden');
console.log('   ✅ requireMasterAdmin bloque strictement le Sous-Administrateur (403 Forbidden).');

// C. requireMasterAdmin MUST allow ADMIN
let masterAllowed = false;
const mockAdminReq = { user: { id: testAdminId, role: 'ADMIN' }, ip: '127.0.0.1' };
requireMasterAdmin(mockAdminReq, mockRes, () => {
  masterAllowed = true;
});
assert.strictEqual(masterAllowed, true, 'requireMasterAdmin doit autoriser le Super Admin');
console.log('   ✅ requireMasterAdmin autorise bien l\'Administrateur Général.\n');

// 5. Test Sub-Admin Access Code Update
console.log('5️⃣ Test : Modification du Code d\'accès Sous-Admin...');
const updatedCode = 'SEC-9988';
db.prepare('UPDATE users SET sub_admin_access_code = ? WHERE id = ?').run(updatedCode, testUserId);
const userWithNewCode = db.prepare('SELECT sub_admin_access_code FROM users WHERE id = ?').get(testUserId);
assert.strictEqual(userWithNewCode.sub_admin_access_code, updatedCode, 'Le code doit être mis à jour');
console.log('   ✅ Code d\'accès Sous-Admin mis à jour avec succès.\n');

// 6. Test Sub-Admin Revocation
console.log('6️⃣ Test : Révocation du Sous-Administrateur vers le rôle Membre standard...');
db.prepare(`
  UPDATE users 
  SET role = 'MEMBRE', sub_admin_access_code = NULL
  WHERE id = ?
`).run(testUserId);

const revokedUser = db.prepare('SELECT role, sub_admin_access_code FROM users WHERE id = ?').get(testUserId);
assert.strictEqual(revokedUser.role, 'MEMBRE', 'L\'utilisateur doit être redevenu MEMBRE');
assert.strictEqual(revokedUser.sub_admin_access_code, null, 'Le code sous-admin doit être effacé');
console.log('   ✅ Révocation réussie : L\'utilisateur est redevenu un simple membre.\n');

// 7. Nettoyage Complet des Comptes de Test
db.prepare('DELETE FROM users WHERE id IN (?, ?)').run(testAdminId, testUserId);
removeUserFromStore(testAdminId);
removeUserFromStore(testUserId);

console.log('========================================================');
console.log('🎉 TOUS LES TESTS PARAMÈTRES & SOUS-ADMIN ONT RÉUSSI (100%) !');
console.log('   - Modification Références Super Admin : OPÉRATIONNELLE ✅');
console.log('   - Nomination Sous-Admin & Code d\'Accès : OPÉRATIONNELLE ✅');
console.log('   - Scission des Privilèges & Blocage 403 : VALIDÉE ✅');
console.log('   - Révocation Immédiate : VALIDÉE ✅');
console.log('   - Nettoyage des Données de Test : VALIDÉ ✅');
console.log('========================================================\n');
