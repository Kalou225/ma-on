// Service d'attribution des rangs et calcul des taux de commission réseau

export const RANKS_CONFIG = [
  { name: 'Apprenti', min: 1000, max: 200000, rate: 0.02, label: 'Apprenti (2%)' },
  { name: 'Compagnon Niveau 3', min: 201000, max: 400000, rate: 0.03, label: 'Compagnon N3 (3%)' },
  { name: 'Compagnon Niveau 2', min: 401000, max: 600000, rate: 0.04, label: 'Compagnon N2 (4%)' },
  { name: 'Compagnon Niveau 1', min: 601000, max: 800000, rate: 0.05, label: 'Compagnon N1 (5%)' },
  { name: 'Maître Niveau 3', min: 801000, max: 1000000, rate: 0.06, label: 'Maître N3 (6%)' },
  { name: 'Maître Niveau 2', min: 1001000, max: 5000000, rate: 0.07, label: 'Maître N2 (7%)' },
  { name: 'Maître Niveau 1', min: 5001000, max: 19999999, rate: 0.08, label: 'Maître N1 (8%)' },
  { name: 'Grand Maître', min: 20000000, max: Infinity, rate: 0.20, label: 'Grand Maître (20%)' },
];

export const calculateRankAndRate = (activationBalance = 0) => {
  const balance = Number(activationBalance) || 0;

  if (balance >= 20000000) {
    return { rank: 'Grand Maître', rate: 0.20, label: 'Grand Maître (20%)' };
  } else if (balance >= 5001000) {
    return { rank: 'Maître Niveau 1', rate: 0.08, label: 'Maître N1 (8%)' };
  } else if (balance >= 1001000) {
    return { rank: 'Maître Niveau 2', rate: 0.07, label: 'Maître N2 (7%)' };
  } else if (balance >= 801000) {
    return { rank: 'Maître Niveau 3', rate: 0.06, label: 'Maître N3 (6%)' };
  } else if (balance >= 601000) {
    return { rank: 'Compagnon Niveau 1', rate: 0.05, label: 'Compagnon N1 (5%)' };
  } else if (balance >= 401000) {
    return { rank: 'Compagnon Niveau 2', rate: 0.04, label: 'Compagnon N2 (4%)' };
  } else if (balance >= 201000) {
    return { rank: 'Compagnon Niveau 3', rate: 0.03, label: 'Compagnon N3 (3%)' };
  } else {
    return { rank: 'Apprenti', rate: 0.02, label: 'Apprenti (2%)' };
  }
};
