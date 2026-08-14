import db from '../db/database.js';

console.log('🧪 Lancement des tests CRUD des numéros d\'encaissement admin...\n');

// 1. Initial State Check
const initialNumbers = db.prepare('SELECT * FROM admin_payment_numbers').all();
console.log(`1. Nombre initial de numéros d'encaissement : ${initialNumbers.length}`);

// 2. Add New Test Number
console.log('\n2. Ajout d\'un nouveau numéro de test (Wave)...');
const insertStmt = db.prepare(`
  INSERT INTO admin_payment_numbers (provider, number, holder, icon, active)
  VALUES (?, ?, ?, ?, 1)
`);
const addRes = insertStmt.run('Wave Test', '+225 01 23 45 67 89', 'Eco-Finance Wave Trésorerie', '🌊');
const testId = addRes.lastInsertRowid;
console.log(`✅ Numéro inséré avec l'ID : ${testId}`);

// Verify insertion
let inserted = db.prepare('SELECT * FROM admin_payment_numbers WHERE id = ?').get(testId);
if (!inserted || inserted.provider !== 'Wave Test' || inserted.number !== '+225 01 23 45 67 89') {
  console.error('❌ Échec de vérification après insertion !', inserted);
  process.exit(1);
}
console.log('✅ Vérification insertion réussie :', inserted.provider, inserted.number);

// 3. Update / Modify Payment Number
console.log('\n3. Modification du numéro de test...');
db.prepare(`
  UPDATE admin_payment_numbers
  SET provider = ?, number = ?, holder = ?, icon = ?, active = ?
  WHERE id = ?
`).run('Orange Money Test', '+225 07 00 99 88 77', 'Eco-Finance Orange Trésorerie', '🟠', 0, testId);

let updated = db.prepare('SELECT * FROM admin_payment_numbers WHERE id = ?').get(testId);
if (!updated || updated.provider !== 'Orange Money Test' || updated.active !== 0) {
  console.error('❌ Échec de modification du numéro !', updated);
  process.exit(1);
}
console.log('✅ Numéro modifié avec succès :', updated.provider, updated.number, 'Actif =', updated.active);

// 4. Toggle Active Status
console.log('\n4. Basculement du statut (Toggle)...');
const newActive = updated.active === 1 ? 0 : 1;
db.prepare('UPDATE admin_payment_numbers SET active = ? WHERE id = ?').run(newActive, testId);
let toggled = db.prepare('SELECT * FROM admin_payment_numbers WHERE id = ?').get(testId);
if (!toggled || toggled.active !== 1) {
  console.error('❌ Échec de basculement du statut !', toggled);
  process.exit(1);
}
console.log('✅ Statut basculé avec succès : Actif =', toggled.active);

// 5. Delete Payment Number
console.log('\n5. Suppression du numéro de test...');
db.prepare('DELETE FROM admin_payment_numbers WHERE id = ?').run(testId);
let deleted = db.prepare('SELECT * FROM admin_payment_numbers WHERE id = ?').get(testId);
if (deleted) {
  console.error('❌ Le numéro n\'a pas été supprimé !', deleted);
  process.exit(1);
}
console.log('✅ Numéro supprimé avec succès !');

console.log('\n🎉 TOUS LES TESTS CRUD NUMÉROS D\'ENCAISSEMENT ONT RÉUSSI AVEC SUCCÈS !');
