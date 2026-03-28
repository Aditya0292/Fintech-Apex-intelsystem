export const calcDecay = (eventTime: Date): number => {
  const mins = (Date.now() - eventTime.getTime()) / 60000;
  // Using half-life of 90 minutes
  const rawDecay = Math.exp(-(Math.LN2 / 90) * mins);
  return Math.max(0, Math.round(rawDecay * 100) / 100);
};
