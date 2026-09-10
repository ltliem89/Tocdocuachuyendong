export interface CalculationResult {
  valid: boolean;
  errorMessage?: string;
  speed_mps: number;
  speed_kmh: number;
  distanceInOneSec: number;
}

/**
 * Calculates speed from distance (meters) and time (seconds).
 * Enforces strictly positive values (Section 11, 23).
 */
export function calculateSpeed(distance_m: number, time_s: number): CalculationResult {
  if (time_s <= 0) {
    return {
      valid: false,
      errorMessage: 'MC5: Thời gian phải lớn hơn 0 (không thể chia cho 0).',
      speed_mps: 0,
      speed_kmh: 0,
      distanceInOneSec: 0,
    };
  }

  if (distance_m <= 0) {
    return {
      valid: false,
      errorMessage: 'Quãng đường phải lớn hơn 0.',
      speed_mps: 0,
      speed_kmh: 0,
      distanceInOneSec: 0,
    };
  }

  const speed_mps = distance_m / time_s;
  const speed_kmh = speed_mps * 3.6;
  const distanceInOneSec = speed_mps; // By definition of unit rate

  return {
    valid: true,
    speed_mps,
    speed_kmh,
    distanceInOneSec,
  };
}

/**
 * Calculates distance from speed and time (s = v * t).
 */
export function calculateDistance(speed_mps: number, time_s: number): number {
  if (speed_mps < 0 || time_s < 0) return 0;
  return speed_mps * time_s;
}

/**
 * Calculates time from distance and speed (t = s / v).
 */
export function calculateTime(distance_m: number, speed_mps: number): number {
  if (speed_mps <= 0 || distance_m <= 0) return 0;
  return distance_m / speed_mps;
}

/**
 * Unit conversion between m/s and km/h.
 * 1 m/s = 3.6 km/h
 * 1 km/h = 1 / 3.6 m/s
 */
export function convertUnit(value: number, from: 'm/s' | 'km/h', to: 'm/s' | 'km/h'): number {
  if (from === to) return value;
  if (from === 'm/s' && to === 'km/h') {
    return value * 3.6;
  }
  return value / 3.6;
}

/**
 * Computes position at elapsed simulation time τ:
 * position(τ) = v * τ, with 0 <= τ <= t (Section 22 Animation Contract)
 */
export function positionAtTime(distance_m: number, time_s: number, elapsed_s: number): number {
  if (time_s <= 0 || distance_m <= 0) return 0;
  const clampedElapsed = Math.min(Math.max(0, elapsed_s), time_s);
  const v = distance_m / time_s;
  return v * clampedElapsed;
}

/**
 * Formats numbers gracefully for display
 */
export function formatNumber(val: number, decimals: number = 2): string {
  if (isNaN(val) || !isFinite(val)) return '0';
  if (Number.isInteger(val)) return val.toString();
  return Number(val.toFixed(decimals)).toString();
}

/**
 * Section 24: EXPECTED VALUE TESTS
 * Runs verification on all 7 test cases from the specification.
 */
export function runExpectedValueTests(): { passed: boolean; details: string[] } {
  const details: string[] = [];
  let passed = true;

  // TEST 01: s = 60 m, t = 10 s => v = 6 m/s
  const t1 = calculateSpeed(60, 10);
  const ok1 = Math.abs(t1.speed_mps - 6.0) < 0.001;
  details.push(`TEST 01 (60m / 10s = 6 m/s): ${ok1 ? 'PASS' : 'FAIL'} (${t1.speed_mps})`);
  if (!ok1) passed = false;

  // TEST 02: s = 60 m, t = 9.5 s => v ≈ 6.3158 m/s
  const t2 = calculateSpeed(60, 9.5);
  const ok2 = Math.abs(t2.speed_mps - 60 / 9.5) < 0.001;
  details.push(`TEST 02 (60m / 9.5s ≈ 6.3158 m/s): ${ok2 ? 'PASS' : 'FAIL'} (${t2.speed_mps.toFixed(4)})`);
  if (!ok2) passed = false;

  // TEST 03: s = 60 m, t = 11 s => v ≈ 5.4545 m/s
  const t3 = calculateSpeed(60, 11);
  const ok3 = Math.abs(t3.speed_mps - 60 / 11) < 0.001;
  details.push(`TEST 03 (60m / 11s ≈ 5.4545 m/s): ${ok3 ? 'PASS' : 'FAIL'} (${t3.speed_mps.toFixed(4)})`);
  if (!ok3) passed = false;

  // TEST 04: 10 m/s = 36 km/h
  const t4 = convertUnit(10, 'm/s', 'km/h');
  const ok4 = Math.abs(t4 - 36) < 0.001;
  details.push(`TEST 04 (10 m/s = 36 km/h): ${ok4 ? 'PASS' : 'FAIL'} (${t4})`);
  if (!ok4) passed = false;

  // TEST 05: 36 km/h = 10 m/s
  const t5 = convertUnit(36, 'km/h', 'm/s');
  const ok5 = Math.abs(t5 - 10) < 0.001;
  details.push(`TEST 05 (36 km/h = 10 m/s): ${ok5 ? 'PASS' : 'FAIL'} (${t5})`);
  if (!ok5) passed = false;

  // TEST 06: v = 4.8 km/h, t = 0.5 h => s = 2.4 km
  const v6_mps = 4.8 / 3.6;
  const t6_s = 0.5 * 3600;
  const s6_m = calculateDistance(v6_mps, t6_s);
  const s6_km = s6_m / 1000;
  const ok6 = Math.abs(s6_km - 2.4) < 0.001;
  details.push(`TEST 06 (v=4.8km/h, t=0.5h => s=2.4km): ${ok6 ? 'PASS' : 'FAIL'} (${s6_km} km)`);
  if (!ok6) passed = false;

  // TEST 07: s = 4 km, t = 1/3 h => v = 12 km/h
  const s7_m = 4 * 1000;
  const t7_s = (1 / 3) * 3600; // 1200 s
  const t7 = calculateSpeed(s7_m, t7_s);
  const ok7 = Math.abs(t7.speed_kmh - 12.0) < 0.001;
  details.push(`TEST 07 (s=4km, t=1/3h => v=12km/h): ${ok7 ? 'PASS' : 'FAIL'} (${t7.speed_kmh} km/h)`);
  if (!ok7) passed = false;

  return { passed, details };
}
