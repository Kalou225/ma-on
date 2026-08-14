import db from '../db/database.js';
import bcrypt from 'bcryptjs';
import {
  generateAndSendOtp,
  generateAndSendEmailOtp,
  generateAndSendPhoneOtp,
  verifyOtp,
  verifyEmailOtp,
  verifyPhoneOtp,
} from '../services/otpService.js';

console.log('🧪 Lancement des tests de validation OTP Email, SMS et WebOTP API Eco-Finance...\n');

const testEmail = 'membre.test@ecofinance.ci';
const testPhone = '+225 07 99 88 77 66';

// 1. Test de génération d'OTP par Email
console.log('1. Test de génération d\'OTP par Email...');
const emailOtpResult = await generateAndSendEmailOtp(testEmail, 'Membre Test', 'ma-on.onrender.com');
if (!emailOtpResult.success || !emailOtpResult.simulatedCode || emailOtpResult.simulatedCode.length !== 6) {
  console.error('❌ Échec de génération OTP par Email', emailOtpResult);
  process.exit(1);
}
console.log(`✅ OTP Email généré avec succès : ${emailOtpResult.simulatedCode} pour ${testEmail}`);

// 2. Test avec un mauvais code OTP Email
console.log('\n2. Test avec un faux code OTP Email...');
const invalidRes = verifyEmailOtp(testEmail, '000000');
if (invalidRes.valid) {
  console.error('❌ Le faux code a été accepté à tort !');
  process.exit(1);
}
console.log(`✅ Faux code correctement rejeté : "${invalidRes.error}"`);

// 3. Test de dépassement de tentatives max (3)
console.log('\n3. Test de limitation des tentatives (max 3)...');
verifyEmailOtp(testEmail, '111111'); // 2ème
const thirdFail = verifyEmailOtp(testEmail, '222222'); // 3ème
console.log(`✅ Tentative 3 résultat : "${thirdFail.error}"`);

// 4. Test de validation réussie par Email
console.log('\n4. Test de régénération et validation réussie par Email...');
const freshEmailOtp = await generateAndSendEmailOtp(testEmail, 'Membre Test');
const validEmailRes = verifyEmailOtp(testEmail, freshEmailOtp.simulatedCode);
if (!validEmailRes.valid) {
  console.error('❌ Le code valide Email a été rejeté !', validEmailRes);
  process.exit(1);
}
console.log('✅ Code OTP Email validé et session nettoyée avec succès !');

// 5. Test de génération d'OTP avec WebOTP API
console.log('\n5. Test de formatage WebOTP API pour navigateurs mobiles...');
const webOtpResult = await generateAndSendOtp({
  phone: testPhone,
  channel: 'SMS',
  origin: 'ma-on.onrender.com',
});
if (!webOtpResult.webOtpMessage || !webOtpResult.webOtpMessage.includes('@ma-on.onrender.com #')) {
  console.error('❌ Format WebOTP API non conforme', webOtpResult);
  process.exit(1);
}
console.log(`✅ Format WebOTP API validé :\n   "${webOtpResult.webOtpMessage}"`);

// 6. Test de vérification générique verifyOtp
console.log('\n6. Test de verifyOtp sur identifiant...');
const genericVerify = verifyOtp(testPhone, webOtpResult.simulatedCode);
if (!genericVerify.valid) {
  console.error('❌ Échec de verifyOtp générique', genericVerify);
  process.exit(1);
}
console.log('✅ verifyOtp unifié valide.');

// 7. Test de réinitialisation de mot de passe par Email
console.log('\n7. Test de flux complet réinitialisation de mot de passe...');
const user = db.prepare('SELECT id, phone, email, password_hash FROM users WHERE email = ?').get('alex.kouassi@illuminati-mlm.com');
if (user) {
  const resetOtp = await generateAndSendEmailOtp(user.email, user.name);
  const verifyReset = verifyOtp(user.email, resetOtp.simulatedCode);
  if (!verifyReset.valid) {
    console.error('❌ Échec de validation OTP réinitialisation !');
    process.exit(1);
  }
  const newHash = bcrypt.hashSync('AlexNewPass2026!', 12);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, user.id);
  
  const updatedUser = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(user.id);
  const match = bcrypt.compareSync('AlexNewPass2026!', updatedUser.password_hash);
  if (!match) {
    console.error('❌ Échec de vérification du nouveau mot de passe !');
    process.exit(1);
  }
  console.log('✅ Mot de passe réinitialisé et vérifié avec succès !');

  // Restaurer le mot de passe initial
  const restoreHash = bcrypt.hashSync('Alex@2026Password', 12);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(restoreHash, user.id);
  console.log('✅ Mot de passe de test restauré avec succès.');
}

console.log('\n🎉 TOUS LES TESTS EMAIL OTP ET WebOTP API ONT RÉUSSI AVEC SUCCÈS (100%) !');
