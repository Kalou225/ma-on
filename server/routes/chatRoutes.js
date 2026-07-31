import express from 'express';
import { config } from '../config/security.js';

const router = express.Router();

const SYSTEM_PROMPT = `
Tu es Eco-Bot, l'assistant virtuel IA intelligent de la plateforme Eco-Finance.
Ton rôle est de répondre aux questions des utilisateurs concernant le fonctionnement d'Eco-Finance avec courtoisie, clarté et précision en français.

Voici les informations officielles sur Eco-Finance :
1. QU'EST-CE QU'ECO-FINANCE ?
   - Une plateforme financière privée et réseau MLM sécurisé de gestion et de parrainage.
2. ACTIVATION DU COMPTE :
   - Pour activer un compte inactif, l'utilisateur doit effectuer un dépôt manuel d'activation (minimum 25 000 FCFA) par Mobile Money (Orange Money, MTN MoMo, Wave, Moov Money) vers l'un des numéros récepteurs administrateur.
   - Dès validation par l'administrateur, le compte passe en statut 'ACTIF'.
3. PARRAINAGE & COMMISSIONS :
   - Chaque membre possède un Code de Parrainage unique.
   - Lorsqu'un filleul s'inscrit avec votre code et valide son dépôt, vous recevez une commission directe de 10% créditée sur votre solde.
4. RANGS MLM & PROGRESSION :
   - Apprenti : Rang de départ.
   - Compagnon : 5+ filleuls actifs ou 100 000 FCFA de gains réseau.
   - Maître : 15+ filleuls actifs ou 500 000 FCFA de gains réseau.
   - Grand Maître : 30+ filleuls actifs ou 2 000 000 FCFA de gains réseau.
5. RETRAITS DE FONDS :
   - Montant minimum de retrait : 1 000 FCFA.
   - Transfert vers votre numéro Mobile Money après confirmation admin.
6. SUPPORT CLIENT :
   - Email officiel : ecoilluminati@gmail.com.

Réponds de manière naturelle, concise, polie et motivante en français. Utilise des émojis adaptés.
`;

router.post('/', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message requis.' });
    }

    // Format message history for Mistral AI
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(Array.isArray(history) ? history.slice(-6) : []),
      { role: 'user', content: message },
    ];

    // Call Mistral AI API
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.mistralApiKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('Mistral AI API error, switching to fallback bot:', errText);
      throw new Error(`Mistral API error (${response.status})`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Bonjour ! Je suis Eco-Bot. Comment puis-je vous aider aujourd\'hui ?';

    res.json({ reply });
  } catch (error) {
    console.error('Chatbot endpoint error:', error.message);
    
    // Intelligent fallback assistant if Mistral API fails or key reaches limit
    const userMsg = (req.body?.message || '').toLowerCase();
    let fallbackReply = "Je suis Eco-Bot, l'assistant virtuel d'Eco-Finance ! 🤖\n\nPour toute question spécifique, n'hésitez pas à nous contacter par email à **ecoilluminati@gmail.com**.";

    if (userMsg.includes('activ') || userMsg.includes('dépôt') || userMsg.includes('depot')) {
      fallbackReply = "⚡ **Activation de compte Eco-Finance :**\nEffectuez un dépôt manuel d'activation (minimum 25 000 FCFA) via Mobile Money (Orange Money, Wave, MTN MoMo, Moov) sur l'un des numéros récepteurs de l'admin. Dès validation admin, votre compte est activé !";
    } else if (userMsg.includes('parrain') || userMsg.includes('commission') || userMsg.includes('gain')) {
      fallbackReply = "💰 **Parrainage & Commissions :**\nPartagez votre Code de Parrainage avec vos proches. À chaque fois qu'un filleul active son compte, vous touchez une **commission directe de 10%** !";
    } else if (userMsg.includes('retrait') || userMsg.includes('retirer')) {
      fallbackReply = "💸 **Retrait de fonds :**\nLe retrait minimum est de **1 000 FCFA**. Allez dans le menu Retrait, entrez le montant et votre numéro Mobile Money. Votre transfert sera exécuté dès la validation admin.";
    } else if (userMsg.includes('contact') || userMsg.includes('email') || userMsg.includes('support')) {
      fallbackReply = "✉️ **Support Client Eco-Finance :**\nVous pouvez contacter notre équipe par email à : **ecoilluminati@gmail.com**.";
    }

    res.json({ reply: fallbackReply });
  }
});

export default router;
