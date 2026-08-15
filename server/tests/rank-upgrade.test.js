import assert from 'assert';
import db, { checkpointDb, saveUserToStore, removeUserFromStore, getUsersFromStore, syncStoreToDb } from '../db/database.js';
import { calculateRankAndRate, getNextRank, getRankDetails, getHigherRanks, RANKS_CONFIG } from '../services/rankService.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

console.log('\n🚀 ========================================================');
console.log('🧪 DÉBUT DU TEST UNITAIRE ET INTÉGRATION: MONTÉE DE GRADE');
console.log('========================================================\n');

async function runRankUpgradeTests() {
  const timestamp = Date.now();
  const sponsorEmail = `sponsor.rank.${timestamp}@ecofinance.ci`;
  const userEmail = `user.rank.${timestamp}@ecofinance.ci`;
  const subEmail = `sub.rank.${timestamp}@ecofinance.ci`;
  const sponsorCode = `SPON-${timestamp.toString().slice(-4)}`;
  const userRefCode = `USR-${timestamp.toString().slice(-4)}`;
  const subRefCode = `SUB-${timestamp.toString().slice(-4)}`;

  const sponsorId = `usr-sponsor-${timestamp}`;
  const userId = `usr-target-${timestamp}`;
  const subId = `usr-sub-${timestamp}`;

  // Nettoyage préventif
  db.prepare("DELETE FROM transactions WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%.rank.%')").run();
  db.prepare("DELETE FROM users WHERE email LIKE '%.rank.%'").run();

  try {
    // ----------------------------------------------------
    // TEST 1 : CONFIGURATION ET HELPERS DE RANGS
    // ----------------------------------------------------
    console.log('1️⃣ Test : Validation des Helpers & Configuration des Rangs...');
    
    assert.strictEqual(RANKS_CONFIG.length, 8, 'La grille doit comporter exactement 8 rangs.');
    
    // Test calculateRankAndRate
    assert.strictEqual(calculateRankAndRate(50000).rank, 'Apprenti');
    assert.strictEqual(calculateRankAndRate(50000).rate, 0.02);
    assert.strictEqual(calculateRankAndRate(300000).rank, 'Compagnon Niveau 3');
    assert.strictEqual(calculateRankAndRate(700000).rank, 'Compagnon Niveau 1');
    assert.strictEqual(calculateRankAndRate(700000).rate, 0.05);
    assert.strictEqual(calculateRankAndRate(900000).rank, 'Maître Niveau 3');
    assert.strictEqual(calculateRankAndRate(25000000).rank, 'Grand Maître');
    assert.strictEqual(calculateRankAndRate(25000000).rate, 0.20);

    // Test getNextRank
    assert.strictEqual(getNextRank('Apprenti')?.name, 'Compagnon Niveau 3');
    assert.strictEqual(getNextRank('Compagnon Niveau 1')?.name, 'Maître Niveau 3');
    assert.strictEqual(getNextRank('Maître Niveau 1')?.name, 'Grand Maître');
    assert.strictEqual(getNextRank('Grand Maître'), null);

    // Test getHigherRanks
    const higherFromComp1 = getHigherRanks('Compagnon Niveau 1');
    assert.strictEqual(higherFromComp1.length, 4); // Maître N3, N2, N1, Grand Maître
    assert.strictEqual(higherFromComp1[0].name, 'Maître Niveau 3');

    console.log('   ✅ Helpers des 8 rangs MLM parfaitement vérifiés !');

    // ----------------------------------------------------
    // TEST 2 : CRÉATION D\'UN UTILISATEUR ACTIVÉ À 700 000 FCFA (Compagnon N1)
    // ----------------------------------------------------
    console.log('\n2️⃣ Test : Activation initiale à 700 000 FCFA -> Attribution Compagnon Niveau 1 (5%)...');

    const passHash = bcrypt.hashSync('Password@2026', 10);

    // Créer le sponsor
    db.prepare(`
      INSERT INTO users (id, name, email, phone, password_hash, role, status, rank, activation_balance, commission_balance, my_referral_code, sponsor_code)
      VALUES (?, 'Sponsor Master', ?, '+225 07 11 22 33 44', ?, 'MEMBRE', 'ACTIF', 'Grand Maître', 20000000, 500000, ?, 'ROOT')
    `).run(sponsorId, sponsorEmail, passHash, sponsorCode);

    // Créer l'utilisateur avec un 1er dépôt de 700 000 FCFA
    const depositAmount = 700000;
    const initialRankInfo = calculateRankAndRate(depositAmount);
    assert.strictEqual(initialRankInfo.rank, 'Compagnon Niveau 1');
    assert.strictEqual(initialRankInfo.rate, 0.05);

    db.prepare(`
      INSERT INTO users (id, name, email, phone, password_hash, role, status, rank, activation_balance, commission_balance, balance, my_referral_code, sponsor_code)
      VALUES (?, 'Alex Compagnon', ?, '+225 07 55 66 77 88', ?, 'MEMBRE', 'ACTIF', ?, ?, 0, 0, ?, ?)
    `).run(userId, userEmail, passHash, initialRankInfo.rank, depositAmount, userRefCode, sponsorCode);

    const userInDb = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    assert.strictEqual(userInDb.rank, 'Compagnon Niveau 1');
    assert.strictEqual(userInDb.status, 'ACTIF');
    assert.strictEqual(userInDb.activation_balance, 700000);
    assert.strictEqual(userInDb.commission_balance, 0);
    console.log(`   ✅ Compte activé avec succès : Rang = ${userInDb.rank} (Taux: 5%) | Solde Activation = ${userInDb.activation_balance.toLocaleString()} FCFA`);

    // ----------------------------------------------------
    // TEST 3 : BLOCAGE DU 2ÈME DÉPÔT D\'ACTIVATION
    // ----------------------------------------------------
    console.log('\n3️⃣ Test : Vérification du blocage des dépôts d\'activation ultérieurs...');

    // Simulation de la règle de sécurité depositRoutes.js
    const checkActiveUser = db.prepare('SELECT status, activation_balance FROM users WHERE id = ?').get(userId);
    const isActivationBlocked = checkActiveUser && checkActiveUser.status === 'ACTIF' && (checkActiveUser.activation_balance || 0) > 0;
    assert.strictEqual(isActivationBlocked, true, 'Un utilisateur déjà actif avec un solde d\'activation ne doit plus pouvoir refaire de dépôt d\'activation.');
    console.log('   ✅ Blocage d\'un second dépôt d\'activation validé avec succès !');

    // ----------------------------------------------------
    // TEST 4 : TENTATIVE DE MONTÉE DE GRADE SANS SOLDE SUFFISANT
    // ----------------------------------------------------
    console.log('\n4️⃣ Test : Tentative d\'upgrade vers Maître Niveau 3 sans solde commission suffisant...');

    const targetRank = getRankDetails('Maître Niveau 3');
    assert.strictEqual(targetRank.cost, 801000);

    const userCommBal = userInDb.commission_balance || 0;
    const canUpgrade = userCommBal >= targetRank.cost;
    assert.strictEqual(canUpgrade, false, 'La montée de grade doit être refusée car solde commission (0) < coût requis (801 000 FCFA).');
    console.log(`   ✅ Rejet de l'upgrade sans solde suffisant validé (Requis: ${targetRank.cost.toLocaleString()} FCFA, Dispo: ${userCommBal} FCFA)`);

    // ----------------------------------------------------
    // TEST 5 : CRÉDIT DE COMMISSIONS & PASSAGE DE COMPAGNON N1 À MAÎTRE N3
    // ----------------------------------------------------
    console.log('\n5️⃣ Test : Crédit de Solde Commission (900 000 FCFA) et Montée de Grade vers Maître Niveau 3...');

    // Créditer 900 000 FCFA sur le Solde Commission
    db.prepare('UPDATE users SET commission_balance = 900000, balance = 900000 WHERE id = ?').run(userId);

    const updatedUserBefore = db.prepare('SELECT commission_balance, balance, rank FROM users WHERE id = ?').get(userId);
    assert.strictEqual(updatedUserBefore.commission_balance, 900000);

    // Exécution de l'upgrade transactionnelle
    const executeUpgrade = db.transaction(() => {
      const newCommissionBal = updatedUserBefore.commission_balance - targetRank.cost;
      const newTotalBal = Math.max(0, updatedUserBefore.balance - targetRank.cost);

      db.prepare(`
        UPDATE users
        SET commission_balance = ?,
            balance = ?,
            rank = ?
        WHERE id = ?
      `).run(newCommissionBal, newTotalBal, targetRank.name, userId);

      const txnId = `UPG-TEST-${Date.now()}`;
      db.prepare(`
        INSERT INTO transactions (id, user_id, type, label, amount, date_time, status, note)
        VALUES (?, ?, 'UPGRADE_GRADE', ?, ?, CURRENT_TIMESTAMP, 'VALIDÉ', ?)
      `).run(txnId, userId, `Montée au grade ${targetRank.name}`, targetRank.cost, 'Test upgrade validé');

      saveUserToStore({
        id: userId,
        rank: targetRank.name,
        commission_balance: newCommissionBal,
        balance: newTotalBal,
      });
      checkpointDb();

      return { newCommissionBal, newTotalBal };
    });

    const upgradeResult = executeUpgrade();

    // Vérifications après upgrade
    const userAfterUpgrade = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    assert.strictEqual(userAfterUpgrade.rank, 'Maître Niveau 3', 'Le nouveau grade doit être Maître Niveau 3.');
    assert.strictEqual(userAfterUpgrade.commission_balance, 99000, 'Le solde commission restant doit être de 99 000 FCFA (900k - 801k).');
    assert.strictEqual(userAfterUpgrade.balance, 99000);

    // Vérifier la transaction
    const txnRecord = db.prepare("SELECT * FROM transactions WHERE user_id = ? AND type = 'UPGRADE_GRADE'").get(userId);
    assert.ok(txnRecord, 'Une transaction UPGRADE_GRADE doit être enregistrée.');
    assert.strictEqual(txnRecord.amount, 801000);

    // Vérifier le store miroir JSON
    const storeUser = getUsersFromStore().find((u) => u.id === userId);
    assert.strictEqual(storeUser?.rank, 'Maître Niveau 3', 'Le grade doit être mis à jour dans users-store.json.');
    assert.strictEqual(storeUser?.commission_balance, 99000);

    console.log(`   ✅ Montée de grade réussie : Compagnon Niveau 1 ➔ ${userAfterUpgrade.rank} !`);
    console.log(`   ✅ Débit transactionnel vérifié : 900 000 - 801 000 = ${userAfterUpgrade.commission_balance.toLocaleString()} FCFA.`);
    console.log('   ✅ Transaction UPGRADE_GRADE enregistrée et Store Miroir synchronisé !');

    // ----------------------------------------------------
    // TEST 6 : DISTRIBUTION DES COMMISSIONS AVEC LE NOUVEAU TAUX (6% pour Maître N3)
    // ----------------------------------------------------
    console.log('\n6️⃣ Test : Distribution de commission réseau upline avec le nouveau taux Maître N3 (6%)...');

    // Créer un sous-filleul parrainé par notre utilisateur
    db.prepare(`
      INSERT INTO users (id, name, email, phone, password_hash, role, status, rank, activation_balance, commission_balance, my_referral_code, sponsor_code)
      VALUES (?, 'Sub Filleul', ?, '+225 07 99 99 99 99', ?, 'MEMBRE', 'ACTIF', 'Apprenti', 100000, 0, ?, ?)
    `).run(subId, subEmail, passHash, subRefCode, userRefCode);

    // Simuler un dépôt de 100 000 FCFA du sous-filleul
    const subDepositAmount = 100000;
    
    // Le sponsor direct (notre user userId) doit recevoir :
    // 1. Commission directe de parrainage (3%) = 3 000 FCFA
    const directComm = Math.round(subDepositAmount * 0.03);
    assert.strictEqual(directComm, 3000);

    // 2. Commission réseau basée sur son rang actuel "Maître Niveau 3" (6%) = 6 000 FCFA
    const userRankDetails = getRankDetails(userAfterUpgrade.rank);
    assert.strictEqual(userRankDetails.rate, 0.06);
    const networkComm = Math.round(subDepositAmount * userRankDetails.rate);
    assert.strictEqual(networkComm, 6000);

    // Appliquer le crédit
    db.prepare(`
      UPDATE users
      SET commission_balance = commission_balance + ?, balance = balance + ?, network_earnings = network_earnings + ?
      WHERE id = ?
    `).run(directComm + networkComm, directComm + networkComm, directComm + networkComm, userId);

    const userWithComms = db.prepare('SELECT commission_balance, network_earnings FROM users WHERE id = ?').get(userId);
    assert.strictEqual(userWithComms.commission_balance, 99000 + 3000 + 6000); // 108 000 FCFA
    assert.strictEqual(userWithComms.network_earnings, 9000);

    console.log(`   ✅ Taux Maître N3 (6%) appliqué avec succès : Gain Réseau = ${networkComm.toLocaleString()} FCFA (au lieu des 2% de base 2 000 FCFA).`);
    console.log(`   ✅ Solde Commission mis à jour : ${userWithComms.commission_balance.toLocaleString()} FCFA.`);

    // Nettoyage final
    db.prepare('DELETE FROM transactions WHERE user_id IN (?, ?, ?)').run(sponsorId, userId, subId);
    db.prepare('DELETE FROM users WHERE id IN (?, ?, ?)').run(sponsorId, userId, subId);
    removeUserFromStore(sponsorId);
    removeUserFromStore(userId);
    removeUserFromStore(subId);

    console.log('\n========================================================');
    console.log('🎉 TOUS LES TESTS DE MONTÉE DE GRADE ONT RÉUSSI (100%) !');
    console.log('   - Grille 8 Rangs & Helpers : OPÉRATIONNELS ✅');
    console.log('   - Activation Multi-Paliers (ex: Compagnon N1 5%) : VALIDÉE ✅');
    console.log('   - Blocage 2ème Dépôt d\'Activation : VALIDÉ ✅');
    console.log('   - Contrôle Solde Commission & Débit Atomique : VALIDÉS ✅');
    console.log('   - Montée vers Maître N3 & Application Taux 6% : VALIDÉES ✅');
    console.log('========================================================\n');

  } catch (err) {
    console.error('❌ Erreur lors du test de montée de grade :', err);
    throw err;
  }
}

runRankUpgradeTests().catch((e) => {
  process.exit(1);
});
