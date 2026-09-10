export type Language = 'vi' | 'en';

export type AppMode = 
  | 'mode1_warmup'
  | 'mode2_discovery'
  | 'mode3_compare'
  | 'mode4_units'
  | 'mode5_practice';

export interface Athlete {
  id: string;
  name: string;
  distance_m: number;
  time_s: number;
  color: string;
  avatar: string;
}

export interface ExperimentTrial {
  id: string;
  name: string;
  distance_m: number;
  time_s: number;
  speed_mps: number;
  speed_kmh: number;
  color: string;
  timestamp: number;
  note?: string;
}

export type UnknownTarget = 'v' | 's' | 't';

export interface PracticeProblem {
  id: string;
  target: UnknownTarget;
  titleVi: string;
  titleEn: string;
  contextVi: string;
  contextEn: string;
  given: {
    s?: number; // meters or km
    t?: number; // seconds or hours
    v?: number; // m/s or km/h
    sUnit?: 'm' | 'km';
    tUnit?: 's' | 'h';
    vUnit?: 'm/s' | 'km/h';
  };
  expectedFormula: string;
  answerValue: number;
  answerUnit: string;
  tolerance: number;
  explanationVi: string;
  explanationEn: string;
}

export interface RealWorldPreset {
  id: string;
  nameVi: string;
  nameEn: string;
  distance_m: number;
  time_s: number;
  typicalSpeed_mps: number;
  icon: string;
}
