// Configuration et utilitaires des 8 rangs MLM pour le Frontend

export const RANKS_CONFIG = [
  {
    name: 'Apprenti',
    min: 1000,
    max: 200000,
    rate: 0.02,
    cost: 0,
    rateFormatted: '2%',
    label: 'Apprenti (2%)',
    badgeColor: 'border-slate-500 text-slate-300 bg-slate-500/10',
    description: 'Grade initial attribué à l\'activation du compte.',
    icon: '🌱',
  },
  {
    name: 'Compagnon Niveau 3',
    min: 201000,
    max: 400000,
    rate: 0.03,
    cost: 201000,
    rateFormatted: '3%',
    label: 'Compagnon N3 (3%)',
    badgeColor: 'border-[#F2CA50] text-[#F2CA50] bg-[#F2CA50]/10',
    description: 'Premier niveau de maîtrise de parrainage.',
    icon: '🥉',
  },
  {
    name: 'Compagnon Niveau 2',
    min: 401000,
    max: 600000,
    rate: 0.04,
    cost: 401000,
    rateFormatted: '4%',
    label: 'Compagnon N2 (4%)',
    badgeColor: 'border-[#F2CA50] text-[#F2CA50] bg-[#F2CA50]/10',
    description: 'Croissance de réseau soutenue.',
    icon: '🥈',
  },
  {
    name: 'Compagnon Niveau 1',
    min: 601000,
    max: 800000,
    rate: 0.05,
    cost: 601000,
    rateFormatted: '5%',
    label: 'Compagnon N1 (5%)',
    badgeColor: 'border-[#F2CA50] text-[#F2CA50] bg-[#F2CA50]/10',
    description: 'Leadership d\'équipe confirmé.',
    icon: '🥇',
  },
  {
    name: 'Maître Niveau 3',
    min: 801000,
    max: 1000000,
    rate: 0.06,
    cost: 801000,
    rateFormatted: '6%',
    label: 'Maître N3 (6%)',
    badgeColor: 'border-[#10B981] text-[#10B981] bg-[#10B981]/10',
    description: 'Palier Maître : Commissions étendues.',
    icon: '💎',
  },
  {
    name: 'Maître Niveau 2',
    min: 1001000,
    max: 5000000,
    rate: 0.07,
    cost: 1001000,
    rateFormatted: '7%',
    label: 'Maître N2 (7%)',
    badgeColor: 'border-[#10B981] text-[#10B981] bg-[#10B981]/10',
    description: 'Grand volume de distribution.',
    icon: '⭐',
  },
  {
    name: 'Maître Niveau 1',
    min: 5001000,
    max: 19999999,
    rate: 0.08,
    cost: 5001000,
    rateFormatted: '8%',
    label: 'Maître N1 (8%)',
    badgeColor: 'border-[#10B981] text-[#10B981] bg-[#10B981]/10',
    description: 'Excellence réseau & haute rentabilité.',
    icon: '👑',
  },
  {
    name: 'Grand Maître',
    min: 20000000,
    max: Infinity,
    rate: 0.20,
    cost: 20000000,
    rateFormatted: '20%',
    label: 'Grand Maître (20%)',
    badgeColor: 'border-purple-500 text-purple-300 bg-purple-500/10',
    description: 'Grade suprême : 20% de commission réseau !',
    icon: '🏆',
  },
];

export const getNextRank = (currentRankName) => {
  const normalizedCurrent = (currentRankName || 'Apprenti').trim().toLowerCase();
  const currentIndex = RANKS_CONFIG.findIndex(
    (r) => r.name.toLowerCase() === normalizedCurrent
  );
  if (currentIndex === -1) {
    return RANKS_CONFIG[1];
  }
  if (currentIndex >= RANKS_CONFIG.length - 1) {
    return null; // Déjà Grand Maître
  }
  return RANKS_CONFIG[currentIndex + 1];
};

export const getRankDetails = (rankName) => {
  const normalized = (rankName || 'Apprenti').trim().toLowerCase();
  return RANKS_CONFIG.find((r) => r.name.toLowerCase() === normalized) || RANKS_CONFIG[0];
};

export const getHigherRanks = (currentRankName) => {
  const normalizedCurrent = (currentRankName || 'Apprenti').trim().toLowerCase();
  const currentIndex = RANKS_CONFIG.findIndex(
    (r) => r.name.toLowerCase() === normalizedCurrent
  );
  if (currentIndex === -1) {
    return RANKS_CONFIG.slice(1);
  }
  return RANKS_CONFIG.slice(currentIndex + 1);
};
