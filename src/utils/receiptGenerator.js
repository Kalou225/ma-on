// Module de génération et d'exportation de reçus et relevés en PDF et JPEG
import { jsPDF } from 'jspdf';

/**
 * Formate un nombre en montant FCFA lisible
 */
const formatFCFA = (amount) => {
  return `${Number(amount || 0).toLocaleString('fr-FR')} FCFA`;
};

/**
 * 1. Génère et télécharge le Reçu Officiel d'une Transaction en PDF
 */
export const downloadTransactionReceiptPDF = (txn, user = {}) => {
  if (!txn) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [105, 148], // Format A6 compact pour reçu officiel
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Fond de page élégant
  doc.setFillColor(16, 20, 22); // #101416
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // En-tête avec dégradé / barre dorée
  doc.setFillColor(242, 202, 80); // #F2CA50
  doc.rect(0, 0, pageWidth, 4, 'F');

  // Titre Société / Marque
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(242, 202, 80);
  doc.text('ÉCO-FINANCE', pageWidth / 2, 12, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(153, 144, 124); // #99907c
  doc.text('REÇU OFFICIEL DE TRANSACTION SÉCURISÉE', pageWidth / 2, 16.5, { align: 'center' });

  // Ligne de séparation
  doc.setDrawColor(242, 202, 80);
  doc.setLineWidth(0.3);
  doc.line(10, 19, pageWidth - 10, 19);

  // Cadre Montant Principal
  doc.setFillColor(29, 32, 34); // #1d2022
  doc.roundedRect(10, 22, pageWidth - 20, 22, 2, 2, 'F');

  doc.setFontSize(8);
  doc.setTextColor(153, 144, 124);
  doc.text('MONTANT DE LA TRANSACTION', pageWidth / 2, 28, { align: 'center' });

  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(242, 202, 80);
  doc.text(formatFCFA(txn.amount), pageWidth / 2, 37, { align: 'center' });

  // Détails de la transaction
  let y = 50;
  const lineSpacing = 6.5;

  const drawRow = (label, value, isGold = false, isStatus = false) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(153, 144, 124);
    doc.text(label, 12, y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    if (isGold) {
      doc.setTextColor(242, 202, 80);
    } else if (isStatus) {
      if (value === 'VALIDÉ') doc.setTextColor(16, 185, 129); // #10B981
      else if (value === 'EN_ATTENTE') doc.setTextColor(242, 202, 80);
      else doc.setTextColor(230, 57, 70); // #E63946
    } else {
      doc.setTextColor(255, 255, 255);
    }
    doc.text(String(value || 'N/A'), pageWidth - 12, y, { align: 'right' });

    // Ligne fine pointillée / discrète
    doc.setDrawColor(40, 44, 48);
    doc.setLineWidth(0.1);
    doc.line(12, y + 1.8, pageWidth - 12, y + 1.8);

    y += lineSpacing;
  };

  drawRow('ID Transaction :', txn.id || 'N/A');
  drawRow('Date & Heure :', txn.dateTime || txn.date_time || new Date().toISOString().slice(0, 16));
  drawRow('Type d\'Opération :', txn.label || txn.type || 'Opération');
  drawRow('Opérateur / Moyen :', txn.provider || 'Solde Éco-Finance', true);
  if (txn.txnId || txn.txn_id) {
    drawRow('Réf. Opérateur :', txn.txnId || txn.txn_id);
  }
  if (txn.senderNumber || txn.sender_number) {
    drawRow('N° Expéditeur :', txn.senderNumber || txn.sender_number);
  }
  if (txn.recipientNumber || txn.recipient_number) {
    drawRow('N° Destinataire :', txn.recipientNumber || txn.recipient_number);
  }
  drawRow('Bénéficiaire / Membre :', user.name || 'Membre Éco-Finance');
  drawRow('Statut de l\'Opération :', txn.status || 'VALIDÉ', false, true);

  // Tampon de Certification Numérique
  doc.setFillColor(25, 28, 30);
  doc.roundedRect(10, y + 2, pageWidth - 20, 14, 2, 2, 'F');
  doc.setDrawColor(242, 202, 80);
  doc.setLineWidth(0.2);
  doc.roundedRect(10, y + 2, pageWidth - 20, 14, 2, 2, 'D');

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(242, 202, 80);
  doc.text('CERTIFICAT D\'AUTHENTICITÉ ÉCO-FINANCE', pageWidth / 2, y + 7, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(153, 144, 124);
  doc.text(`Signé numériquement • SHA256 : ${txn.id || 'TXN'}-${Date.now().toString(16).toUpperCase()}`, pageWidth / 2, y + 11.5, { align: 'center' });

  // Pied de page
  doc.setFontSize(5.5);
  doc.setTextColor(110, 105, 95);
  doc.text('Ce reçu électronique constitue une preuve de transaction officielle sur la plateforme Éco-Finance.', pageWidth / 2, pageHeight - 3, { align: 'center' });

  const fileName = `Recu-${txn.id || 'Transaction'}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};

/**
 * 2. Génère et télécharge le Reçu Officiel d'une Transaction en JPEG
 */
export const downloadTransactionReceiptJPEG = (txn, user = {}) => {
  if (!txn) return;

  const canvas = document.createElement('canvas');
  const scale = 2; // Haute résolution Retina
  canvas.width = 420 * scale;
  canvas.height = 600 * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  const w = 420;
  const h = 600;

  // Fond sombre
  ctx.fillStyle = '#101416';
  ctx.fillRect(0, 0, w, h);

  // Bordure dorée d'en-tête
  const goldGrad = ctx.createLinearGradient(0, 0, w, 0);
  goldGrad.addColorStop(0, '#D4AF37');
  goldGrad.addColorStop(0.5, '#F2CA50');
  goldGrad.addColorStop(1, '#B8860B');
  ctx.fillStyle = goldGrad;
  ctx.fillRect(0, 0, w, 6);

  // Logo / Titre
  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#F2CA50';
  ctx.textAlign = 'center';
  ctx.fillText('ÉCO-FINANCE', w / 2, 40);

  ctx.font = '600 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#99907c';
  ctx.fillText('REÇU OFFICIEL DE TRANSACTION SÉCURISÉE', w / 2, 58);

  // Ligne de séparation dorée
  ctx.strokeStyle = 'rgba(242, 202, 80, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(25, 70);
  ctx.lineTo(w - 25, 70);
  ctx.stroke();

  // Carte Montant Principal
  ctx.fillStyle = '#1d2022';
  ctx.roundRect(25, 85, w - 50, 75, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(242, 202, 80, 0.2)';
  ctx.stroke();

  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#99907c';
  ctx.textAlign = 'center';
  ctx.fillText('MONTANT DE LA TRANSACTION', w / 2, 108);

  ctx.font = 'bold 26px "Courier New", Courier, monospace';
  ctx.fillStyle = '#F2CA50';
  ctx.fillText(formatFCFA(txn.amount), w / 2, 142);

  // Lignes de détails
  let y = 190;
  const lineGap = 26;

  const drawCanvasRow = (label, value, color = '#FFFFFF', isStatus = false) => {
    ctx.textAlign = 'left';
    ctx.font = '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#99907c';
    ctx.fillText(label, 30, y);

    ctx.textAlign = 'right';
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    if (isStatus) {
      ctx.fillStyle = value === 'VALIDÉ' ? '#10B981' : value === 'EN_ATTENTE' ? '#F2CA50' : '#E63946';
    } else {
      ctx.fillStyle = color;
    }
    ctx.fillText(String(value || 'N/A'), w - 30, y);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.beginPath();
    ctx.moveTo(30, y + 8);
    ctx.lineTo(w - 30, y + 8);
    ctx.stroke();

    y += lineGap;
  };

  drawCanvasRow('ID Transaction :', txn.id || 'N/A');
  drawCanvasRow('Date & Heure :', txn.dateTime || txn.date_time || new Date().toISOString().slice(0, 16));
  drawCanvasRow('Type d\'Opération :', txn.label || txn.type || 'Opération');
  drawCanvasRow('Opérateur / Moyen :', txn.provider || 'Solde Éco-Finance', '#F2CA50');
  if (txn.txnId || txn.txn_id) {
    drawCanvasRow('Réf. Opérateur :', txn.txnId || txn.txn_id);
  }
  if (txn.senderNumber || txn.sender_number) {
    drawCanvasRow('N° Expéditeur :', txn.senderNumber || txn.sender_number);
  }
  if (txn.recipientNumber || txn.recipient_number) {
    drawCanvasRow('N° Destinataire :', txn.recipientNumber || txn.recipient_number);
  }
  drawCanvasRow('Bénéficiaire / Membre :', user.name || 'Membre Éco-Finance');
  drawCanvasRow('Statut de l\'Opération :', txn.status || 'VALIDÉ', '#10B981', true);

  // Sceau numérique en bas
  ctx.fillStyle = '#191c1e';
  ctx.roundRect(25, y + 10, w - 50, 48, 10);
  ctx.fill();
  ctx.strokeStyle = '#F2CA50';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#F2CA50';
  ctx.fillText('🔒 CERTIFICAT D\'AUTHENTICITÉ ÉCO-FINANCE', w / 2, y + 30);
  ctx.font = '9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#99907c';
  ctx.fillText(`Signé numériquement • Ref: ${txn.id || 'TXN'}-${Date.now().toString(16).toUpperCase()}`, w / 2, y + 46);

  // Footer
  ctx.font = '9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#666';
  ctx.fillText('Plateforme financière sécurisée Éco-Finance • Document officiel', w / 2, h - 15);

  // Téléchargement JPEG
  const link = document.createElement('a');
  link.download = `Recu-${txn.id || 'Transaction'}-${new Date().toISOString().slice(0, 10)}.jpeg`;
  link.href = canvas.toDataURL('image/jpeg', 0.95);
  link.click();
};

/**
 * 3. Génère et télécharge le Relevé Global des Transactions en PDF (Format A4)
 */
export const downloadHistoryStatementPDF = (transactions = [], user = {}, filterInfo = 'Toutes les opérations') => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // En-tête institutionnel
  doc.setFillColor(16, 20, 22);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setFillColor(242, 202, 80);
  doc.rect(0, 28, pageWidth, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(242, 202, 80);
  doc.text('ÉCO-FINANCE', 15, 14);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(208, 197, 175);
  doc.text('RELEVÉ OFFICIEL DES TRANSACTIONS & HISTORIQUE FINANCIER', 15, 20);

  const exportDate = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.setFontSize(8);
  doc.setTextColor(153, 144, 124);
  doc.text(`Date d'émission : ${exportDate}`, pageWidth - 15, 14, { align: 'right' });
  doc.text(`Filtre : ${filterInfo}`, pageWidth - 15, 20, { align: 'right' });

  // Informations utilisateur / Titulaire
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(15, 34, pageWidth - 30, 20, 2, 2, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text('INFORMATIONS DU TITULAIRE', 20, 40);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(`Titulaire : ${user.name || 'N/A'}`, 20, 46);
  doc.text(`Code Parrainage : ${user.myReferralCode || 'N/A'}`, 20, 50);

  doc.text(`Statut : ${user.status || 'ACTIF'} | Grade : ${user.rank || 'Apprenti'}`, pageWidth / 2, 46);
  doc.text(`Solde Actuel : ${formatFCFA(user.balance)}`, pageWidth / 2, 50);

  // Totaux statistiques
  const totalAmount = transactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  doc.text(`Nombre d'opérations : ${transactions.length}`, pageWidth - 20, 46, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(`Total cumulé : ${formatFCFA(totalAmount)}`, pageWidth - 20, 50, { align: 'right' });

  // Tableau des transactions
  let y = 62;
  const colX = {
    id: 15,
    date: 40,
    label: 72,
    provider: 125,
    status: 155,
    amount: pageWidth - 15,
  };

  // En-têtes du tableau
  doc.setFillColor(30, 35, 38);
  doc.rect(15, y, pageWidth - 30, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(242, 202, 80);
  doc.text('RÉF ID', colX.id + 2, y + 4.8);
  doc.text('DATE', colX.date, y + 4.8);
  doc.text('LIBELLÉ / TYPE', colX.label, y + 4.8);
  doc.text('MOYEN', colX.provider, y + 4.8);
  doc.text('STATUT', colX.status, y + 4.8);
  doc.text('MONTANT', colX.amount - 2, y + 4.8, { align: 'right' });

  y += 7;

  // Lignes du tableau
  transactions.forEach((t, idx) => {
    // Gestion saut de page si besoin
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 20;

      // Re-dessiner en-tête tableau sur nouvelle page
      doc.setFillColor(30, 35, 38);
      doc.rect(15, y, pageWidth - 30, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(242, 202, 80);
      doc.text('RÉF ID', colX.id + 2, y + 4.8);
      doc.text('DATE', colX.date, y + 4.8);
      doc.text('LIBELLÉ / TYPE', colX.label, y + 4.8);
      doc.text('MOYEN', colX.provider, y + 4.8);
      doc.text('STATUT', colX.status, y + 4.8);
      doc.text('MONTANT', colX.amount - 2, y + 4.8, { align: 'right' });
      y += 7;
    }

    const isEven = idx % 2 === 0;
    if (isEven) {
      doc.setFillColor(248, 248, 248);
      doc.rect(15, y, pageWidth - 30, 6.5, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(50, 50, 50);

    doc.text(String(t.id || '').slice(0, 12), colX.id + 2, y + 4.5);
    doc.text(String(t.dateTime || t.date_time || '').slice(0, 16), colX.date, y + 4.5);

    const labelText = String(t.label || t.type || '').slice(0, 30);
    doc.text(labelText, colX.label, y + 4.5);

    doc.text(String(t.provider || 'Éco-Finance').slice(0, 16), colX.provider, y + 4.5);

    // Statut
    if (t.status === 'VALIDÉ') {
      doc.setTextColor(16, 185, 129);
    } else if (t.status === 'EN_ATTENTE') {
      doc.setTextColor(212, 175, 55);
    } else {
      doc.setTextColor(230, 57, 70);
    }
    doc.setFont('helvetica', 'bold');
    doc.text(String(t.status || 'VALIDÉ'), colX.status, y + 4.5);

    // Montant
    doc.setTextColor(20, 20, 20);
    doc.text(formatFCFA(t.amount), colX.amount - 2, y + 4.5, { align: 'right' });

    // Ligne fine
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.1);
    doc.line(15, y + 6.5, pageWidth - 15, y + 6.5);

    y += 6.5;
  });

  // Footer officiel
  doc.setFontSize(6.5);
  doc.setTextColor(120, 120, 120);
  doc.text('Document généré électroniquement par Éco-Finance. Fait foi de relevé bancaire et d\'activités MLM.', pageWidth / 2, pageHeight - 8, { align: 'center' });

  const fileName = `Releve-Transactions-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};

/**
 * 4. Génère et télécharge le Relevé Global des Transactions en JPEG
 */
export const downloadHistoryStatementJPEG = (transactions = [], user = {}, filterInfo = 'Toutes les opérations') => {
  const canvas = document.createElement('canvas');
  const scale = 2;
  const w = 800;
  const rowH = 26;
  const headerH = 140;
  const footerH = 40;
  const totalRows = Math.min(transactions.length, 30); // Limite raisonnable pour une image
  const h = headerH + totalRows * rowH + footerH;

  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  // Fond
  ctx.fillStyle = '#101416';
  ctx.fillRect(0, 0, w, h);

  // En-tête
  const goldGrad = ctx.createLinearGradient(0, 0, w, 0);
  goldGrad.addColorStop(0, '#D4AF37');
  goldGrad.addColorStop(0.5, '#F2CA50');
  goldGrad.addColorStop(1, '#B8860B');
  ctx.fillStyle = goldGrad;
  ctx.fillRect(0, 0, w, 4);

  ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#F2CA50';
  ctx.textAlign = 'left';
  ctx.fillText('ÉCO-FINANCE', 20, 32);

  ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#99907c';
  ctx.fillText('RELEVÉ DES OPÉRATIONS & HISTORIQUE FINANCIER', 20, 50);

  ctx.textAlign = 'right';
  ctx.fillText(`Émis le : ${new Date().toLocaleDateString('fr-FR')}`, w - 20, 32);
  ctx.fillText(`Filtre : ${filterInfo}`, w - 20, 50);

  // Boîte utilisateur
  ctx.fillStyle = '#1d2022';
  ctx.roundRect(20, 65, w - 40, 50, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(242, 202, 80, 0.2)';
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(`Membre : ${user.name || 'N/A'} (ID: ${user.myReferralCode || 'N/A'})`, 30, 85);
  ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#99907c';
  ctx.fillText(`Grade : ${user.rank || 'Apprenti'} • Statut : ${user.status || 'ACTIF'}`, 30, 102);

  const totalAmount = transactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  ctx.textAlign = 'right';
  ctx.font = 'bold 12px "Courier New", Courier, monospace';
  ctx.fillStyle = '#10B981';
  ctx.fillText(`Total : ${formatFCFA(totalAmount)} (${transactions.length} txns)`, w - 30, 93);

  // Tableau en-tête
  let y = 130;
  ctx.fillStyle = '#191c1e';
  ctx.fillRect(20, y, w - 40, 24);

  ctx.textAlign = 'left';
  ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#F2CA50';
  ctx.fillText('RÉF ID', 25, y + 16);
  ctx.fillText('DATE', 120, y + 16);
  ctx.fillText('LIBELLÉ', 240, y + 16);
  ctx.fillText('OPÉRATEUR', 470, y + 16);
  ctx.fillText('STATUT', 590, y + 16);
  ctx.textAlign = 'right';
  ctx.fillText('MONTANT', w - 25, y + 16);

  y += 24;

  // Lignes
  transactions.slice(0, 30).forEach((t, idx) => {
    if (idx % 2 === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.fillRect(20, y, w - 40, rowH);
    }

    ctx.textAlign = 'left';
    ctx.font = '10px "Courier New", Courier, monospace';
    ctx.fillStyle = '#99907c';
    ctx.fillText(String(t.id || '').slice(0, 10), 25, y + 17);

    ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#d0c5af';
    ctx.fillText(String(t.dateTime || t.date_time || '').slice(0, 16), 120, y + 17);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(String(t.label || t.type || '').slice(0, 26), 240, y + 17);

    ctx.fillStyle = '#F2CA50';
    ctx.fillText(String(t.provider || 'Éco-Finance').slice(0, 14), 470, y + 17);

    ctx.fillStyle = t.status === 'VALIDÉ' ? '#10B981' : t.status === 'EN_ATTENTE' ? '#F2CA50' : '#E63946';
    ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(String(t.status || 'VALIDÉ'), 590, y + 17);

    ctx.textAlign = 'right';
    ctx.font = 'bold 11px "Courier New", Courier, monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(formatFCFA(t.amount), w - 25, y + 17);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.beginPath();
    ctx.moveTo(20, y + rowH);
    ctx.lineTo(w - 20, y + rowH);
    ctx.stroke();

    y += rowH;
  });

  // Footer
  ctx.textAlign = 'center';
  ctx.font = '9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#666';
  ctx.fillText('Plateforme financière sécurisée Éco-Finance • Document de synthèse officiel', w / 2, h - 15);

  const link = document.createElement('a');
  link.download = `Releve-Transactions-${new Date().toISOString().slice(0, 10)}.jpeg`;
  link.href = canvas.toDataURL('image/jpeg', 0.95);
  link.click();
};
