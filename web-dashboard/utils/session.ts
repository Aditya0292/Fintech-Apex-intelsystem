export const getCurrentSession = (): string => {
  const d = new Date();
  const utcHour = d.getUTCHours();

  if (utcHour >= 8 && utcHour < 16) return "LONDON";
  if (utcHour >= 13 && utcHour < 21) return "NEW YORK";
  if (utcHour >= 23 || utcHour < 7) return "TOKYO";
  if (utcHour >= 21 || utcHour < 5) return "SYDNEY";

  // Fallback for overlapping hours, default to major market active
  return "LONDON";
};
