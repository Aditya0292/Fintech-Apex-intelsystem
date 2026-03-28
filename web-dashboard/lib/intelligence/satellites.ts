/**
 * DUMMY Satellite Engine — Emergency fix for hydration hangs.
 */
import { SAT_COLORS, type SatellitePosition, type SatelliteTLE } from './satellite-types';

// RE-EXPORT ALL TYPES for the public API
export { SAT_COLORS, type SatellitePosition, type SatelliteTLE };

export async function startPropagationLoop(
  onUpdate: (positions: SatellitePosition[]) => void,
  intervalMs: number
) {
  console.log("[Satellites] Mock engine active — Bypassing heavy physics for fast load.");
  
  const tick = () => {
    // Ensure mock data matches the Full SatellitePosition interface exactly
    const mockPositions: SatellitePosition[] = [
      { 
        noradId: '25544',
        name: 'ISS (ZARYA)', 
        lat: 45.4, 
        lng: -73.6, 
        alt: 420, 
        velocity: 7.66,
        inclination: 51.6,
        country: 'ISS',
        type: 'iss',
        trail: [[45.4, -73.6, 420], [45.0, -74.0, 420], [44.6, -74.5, 420]]
      },
      { 
        noradId: '24000',
        name: 'GPS BIIR-2', 
        lat: 30.1, 
        lng: 110.2, 
        alt: 20200, 
        velocity: 3.87,
        inclination: 55.1,
        country: 'USA',
        type: 'gps',
        trail: [[30.1, 110.2, 20200], [29.8, 110.5, 20200], [29.5, 110.8, 20200]]
      },
      { 
        noradId: '44713',
        name: 'STARLINK-1002', 
        lat: -20.5, 
        lng: 45.1, 
        alt: 550, 
        velocity: 7.58,
        inclination: 53.0,
        country: 'USA',
        type: 'commercial',
        trail: [[-20.5, 45.1, 550], [-20.8, 44.8, 550], [-21.1, 44.5, 550]]
      },
    ];
    onUpdate(mockPositions);
  };

  const timer = setInterval(tick, intervalMs);
  tick();

  return () => clearInterval(timer);
}

export async function updateTLEs() { return true; }
