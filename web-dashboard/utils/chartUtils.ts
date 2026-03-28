export const normalizePriceToSVG = (price: number, min: number, max: number, height: number): number => {
  const range = max - min || 1; // Prevent division by zero
  const padding = height * 0.1; // 10% padding
  const usableHeight = height - padding * 2;
  
  const normalized = (price - min) / range;
  
  // SVG y=0 is at the top, so we invert the normalized value
  return height - padding - (normalized * usableHeight);
};

export const normalizePricesToSVG = (prices: number[], height: number): number[] => {
  if (prices.length === 0) return [];
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  
  return prices.map(price => normalizePriceToSVG(price, min, max, height));
};
