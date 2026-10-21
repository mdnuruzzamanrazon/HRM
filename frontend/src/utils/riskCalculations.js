/**
 * CBDP Risk Register Calculation Utilities
 * 
 * Approved Formula:
 * Score = (Likelihood x Impact) + Impact
 * 
 * RAG Ratings:
 * - High Risk (Red): Score >= 15
 * - Medium Risk (Amber): 8 <= Score < 15
 * - Low Risk (Green): Score < 8
 * 
 * Variance:
 * Variance = Current Score - Target Score (or Current Score if Target Score is omitted)
 */

export const calculateRiskScore = (likelihood, impact) => {
  const l = Number(likelihood);
  const i = Number(impact);
  if (!l || !i || isNaN(l) || isNaN(i) || l <= 0 || i <= 0) {
    return 0;
  }
  return (l * i) + i;
};

export const getRiskRating = (score) => {
  const s = Number(score);
  if (isNaN(s) || s < 8) return 'LOW';
  if (s < 15) return 'MEDIUM';
  return 'HIGH';
};

export const calculateVariance = (currentScore, targetScore) => {
  const current = Number(currentScore) || 0;
  if (targetScore === null || targetScore === undefined || targetScore === '' || isNaN(Number(targetScore))) {
    return current;
  }
  return current - Number(targetScore);
};

export const LIKELIHOOD_LEVELS = [
  { value: 1, label: '1 - Very unlikely', short: 'Very unlikely' },
  { value: 2, label: '2 - Quite unlikely', short: 'Quite unlikely' },
  { value: 3, label: '3 - Possible', short: 'Possible' },
  { value: 4, label: '4 - Likely', short: 'Likely' },
  { value: 5, label: '5 - Very likely', short: 'Very likely' }
];

export const IMPACT_LEVELS = [
  { value: 1, label: '1 - Almost none', short: 'Almost none' },
  { value: 2, label: '2 - Some small impact', short: 'Some small impact' },
  { value: 3, label: '3 - Considerable impact', short: 'Considerable impact' },
  { value: 4, label: '4 - Serious effects', short: 'Serious effects' },
  { value: 5, label: '5 - Catastrophic effects', short: 'Catastrophic effects' }
];
