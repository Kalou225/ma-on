import db from '../db/database.js';
import { createNotification } from '../services/notificationService.js';

console.log('🧪 Lancement des vérifications automatisées de la base de données et des services Eco-Finance...');

try {
  // 1. Check DB Users Table
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  console.log(`✅ Base SQLite accessible : ${userCount} utilisateurs enregistrés.`);

  // 2. Test Notification Creation
  const notifId = createNotification('usr-admin-01', 'Test Notification', 'Vérification automatisée OK', 'SUCCESS');
  if (notifId) {
    console.log(`✅ Création de notification réussie : ${notifId}`);
  } else {
    throw new Error('Échec création notification');
  }

  // 3. Verify Admin Payment Numbers
  const numbers = db.prepare('SELECT * FROM admin_payment_numbers').all();
  console.log(`✅ ${numbers.length} numéros de paiement Mobile Money configurés.`);

  // 4. Verify Transactions Structure
  const txns = db.prepare('SELECT COUNT(*) as count FROM transactions').get().count;
  console.log(`✅ Table transactions opérationnelle (${txns} enregistrées).`);

  console.log('🎉 Tous les tests automatisés du backend Eco-Finance sont PASSED avec SUCCÈS !');
} catch (err) {
  console.error('❌ ERREUR lors des tests :', err.message);
  process.exit(1);
}
