/**
 * Satellite Types & Constants
 * Decoupled from the SGP4 engine to prevent bundling overhead in UI components.
 */

export interface SatelliteTLE {
  noradId: string;
  name: string;
  line1: string;
  line2: string;
  type: 'military' | 'reconnaissance' | 'iss' | 'commercial' | 'weather' | 'gps';
  country: string;
}

export interface SatellitePosition {
  noradId: string;
  name: string;
  lat: number;
  lng: number;
  alt: number;
  type: SatelliteTLE['type'];
  country: string;
  velocity: number;
  inclination: number;
  trail: [number, number, number][];
}

export const OFFLINE_TLES: SatelliteTLE[] = [
  {
    noradId: '25544', name: 'ISS (ZARYA)', type: 'iss', country: 'ISS',
    line1: '1 25544U 98067A   24088.62426111  .00011558  00000+0  21044-3 0  9997',
    line2: '2 25544  51.6404 206.5823 0005476 324.6574 230.6739 15.49996519444444',
  },
  {
    noradId: '44235', name: 'KEYHOLE-11 USA', type: 'reconnaissance', country: 'USA',
    line1: '1 44235U 19022A   24089.58472222  .00000847  00000+0  23789-4 0  9991',
    line2: '2 44235  97.7673  99.4258 0001230  72.6219 287.5129 14.86012356261068',
  },
  {
    noradId: '48274', name: 'GAOFEN-12', type: 'reconnaissance', country: 'CHN',
    line1: '1 48274U 21028A   24089.25000000  .00000620  00000+0  13872-4 0  9998',
    line2: '2 48274  97.6740  98.2140 0001120  92.2380 267.8930 14.79890000264000',
  },
  {
    noradId: '49260', name: 'YAOGAN-33 (SAR)', type: 'military', country: 'CHN',
    line1: '1 49260U 21073A   24089.50000000  .00000310  00000+0  00000+0 0  9994',
    line2: '2 49260  63.4120 108.4570 7340620 267.8900  19.9390  2.00366100 26512',
  },
  {
    noradId: '37820', name: 'COSMOS 2472', type: 'military', country: 'RUS',
    line1: '1 37820U 11053A   24089.23611111  .00000010  00000+0  00000+0 0  9994',
    line2: '2 37820  64.8478 288.1040 0015620 139.8400 220.3670  2.00568180 91054',
  },
  {
    noradId: '28654', name: 'NOAA 18', type: 'weather', country: 'USA',
    line1: '1 28654U 05018A   24089.59756944  .00000262  00000+0  17826-3 0  9998',
    line2: '2 28654  98.9046 109.1948 0013880 318.2560  41.7500 14.12515090977413',
  },
  {
    noradId: '47851', name: 'SENTINEL-6A', type: 'commercial', country: 'EU',
    line1: '1 47851U 20089A   24089.73611111  .00000520  00000+0  15450-3 0  9997',
    line2: '2 47851  66.0001 100.6040 0001720 100.2230 259.8920 13.71813430187612',
  },
];

export const SAT_COLORS: Record<SatelliteTLE['type'], string> = {
  military:       '#ef4444',
  reconnaissance: '#f97316',
  iss:            '#22d3ee',
  commercial:     '#a3e635',
  weather:        '#60a5fa',
  gps:            '#c084fc',
};
