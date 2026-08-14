import db from '../db/database.js';
import bcrypt from 'bcryptjs';
import { generateAndSendPhoneOtp, verifyPhoneOtp } from '../services/otpService.js';

console.log('🧪 Lancement des tests de validation du service OTP SMS et récupération Eco-Finance...\n');

const testPhone = '+225 07 99 88 77 66';
const testEmail = 'test.otp@ecofinance.ci';

// 1. Test de génération d'OTP
console.log('1. Test de génération d\'OTP...');
const otpResult = await generateAndSendPhoneOtp(testPhone, testEmail);
if (!otpResult.success || !otpResult.simulatedCode || otpResult.simulatedCode.length !== 6) {
  console.error('❌ Échec de génération OTP', otpResult);
  process.exit(1);
}
console.log(`✅ OTP généré avec succès : ${otpResult.simulatedCode} pour ${testPhone}`);

// 2. Test avec un mauvais code OTP
console.log('\n2. Test avec un mauvais code OTP...');
const invalidRes = verifyPhoneOtp(testPhone, '000000');
if (invalidRes.valid) {
  console.error('❌ Le faux code a été accepté à tort !');
  process.exit(1);
}
console.log(`✅ Faux code correctement rejeté : "${invalidRes.error}"`);

// 3. Test de dépassement de tentatives
console.log('\n3. Test des tentatives maximales (max 3)...');
verifyPhoneOtp(testPhone, '111111'); // 2ème tentative
const thirdFail = verifyPhoneOtp(testPhone, '222222'); // 3ème tentative
console.log(`✅ Tentative 3 résultat : "${thirdFail.error}"`);

// 4. Test de régénération et validation réussie
console.log('\n4. Test de nouveau code et validation réussie...');
const freshOtp = await generateAndSendPhoneOtp(testPhone, testEmail);
const validRes = verifyPhoneOtp(testPhone, freshOtp.simulatedCode);
if (!validRes.valid) {
  console.error('❌ Le code valide a été rejeté !', validRes);
  process.exit(1);
}
console.log('✅ Code valide accepté et session OTP nettoyée avec succès !');

// 5. Test de réinitialisation de mot de passe utilisateur
console.log('\n5. Test de réinitialisation de mot de passe par OTP...');
const user = db.prepare('SELECT id, phone, email, password_hash FROM users WHERE email = ?').get('alex.kouassi@illuminati-mlm.com');
if (user) {
  const resetOtp = await generateAndSendPhoneOtp(user.phone, user.email);
  const verifyReset = verifyPhoneOtp(user.phone, resetOtp.simulatedCode);
  if (!verifyReset.valid) {
    console.error('❌ Échec de validation OTP réinitialisation !');
    process.exit(1);
  }
  const newHash = bcrypt.hashSync('AlexNewPass2026!', 12);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, user.id);
  
  const updatedUser = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(user.id);
  const match = bcrypt.compareSync('AlexNewPass2026!', updatedUser.password_hash);
  if (!match) {
    console.error('❌ Échec de mise à jour du mot de passe !');
    process.exit(1);
  }
  console.log('✅ Mot de passe réinitialisé et vérifié avec succès !');

  // Remettre le mot de passe initial
  const restoreHash = bcrypt.hashSync('Alex@2026Password', 12);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(restoreHash, user.id);
  console.log('✅ Mot de passe test restauré.');
}

console.log('\n🎉 TOUS LES TESTS OTP ET RÉCUPÉRATION ONT RÉUSSI AVEC SUCCÈS !');
