export interface PowerAllocations {
  engines: number; // Muladhara Drive
  shields: number; // Anahata Shield
  weapons: number; // Agneya/Astra Capacitors
  sensors: number; // Ajna Array
  cooling: number; // Manipura Core Thermal Radiators
}

export interface Vector2D {
  x: number;
  y: number;
}

export type AstraWeaponType =
  | 'AGNEYA_ASTRA'     // Plasma / Thermal Lance (formerly Pulse Laser)
  | 'VARUNA_ASTRA'     // Cryo / Electromagnetic Wave
  | 'VAYAVYA_ASTRA'    // High-Velocity Relativistic Kinetic Railgun
  | 'NARAYANASTRA'     // Autonomous Tracking Seeker Swarm
  | 'BRAHMASTRA';      // Reality-Collapsing Quantum Singularity Weapon

export interface AstraWeaponInfo {
  id: AstraWeaponType;
  name: string;
  sanskritName: string;
  category: string;
  description: string;
  color: string;
  damage: number;
  fireCooldownMs: number;
  heatCost: number;
  energyCost: number;
  shieldPenetration: number;
  specialTrait: string;
  unlockedByDefault: boolean;
}

export interface TrimurtiState {
  brahmaCharge: number;     // Creation Engine - Matter / Nanite Genesis (Hull Regeneration)
  vishnuCharge: number;     // Preservation Network - Shield Harmonic Equilibrium & Coherence
  shivaCharge: number;      // Dissolution Engine - Thermal Purging & EMP Shockwave
  activeFocus: 'BRAHMA' | 'VISHNU' | 'SHIVA';
}

export interface VesselState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  heading: number; // in radians
  angularVelocity: number;
  thrust: number; // 0 to 1
  isRetrograde: boolean;
  
  hull: number; // 0 - 100
  maxHull: number;
  shields: number; // 0 - 100
  maxShields: number;
  coreTemp: number; // Kelvin (baseline 300K, hazard > 480K, meltdown > 600K)
  maxTemp: number;
  
  reactorPower: number; // in MW (e.g. 100 MW)
  powerAllocations: PowerAllocations;
  
  energy: number; // Joules / MJ stored
  maxEnergy: number;
  
  salvageCredits: number;
  score: number;
  sectorIndex: number;
  
  isTractorActive: boolean;
  isVentingHeat: boolean;
  isFiringLaser: boolean;
  isOverclockedSensors: boolean;
  selectedWeapon: AstraWeaponType | 'PULSE_LASER' | 'HEAVY_RAILGUN';
  
  lastLaserFired: number;
  lastRailgunFired?: number;
  railgunCooldownMs?: number;
  lastVentTime: number;
  
  // Vimana Protocol & Ancient Vedic Enhancements
  isHanumanProtocolActive: boolean;
  hanumanTimeRemaining: number;
  lastHanumanActivation: number;
  isVimanaDriveActive: boolean;
  vimanaInertialReduction: number; // 0.0 to 0.75
  
  trimurti: TrimurtiState;
  
  statusLog: string;
  droneKills: number;
  relicsRecovered: number;
  
  // Kala Cosmic Intelligence Endgame
  isKalaEncounterActive?: boolean;
  kalaEndingResolved?: 'BHAKTI_TRANSMUTE' | 'MOKSHA_ASCEND' | 'KSHATRIYA_DEFY' | 'TYAGA_SACRIFICE' | null;
  selectedAstra?: AstraWeaponType;
  karmaBalance?: number;
  dharmaPath?: string;
  hanumanProtocolTimeRemaining?: number;
  trimurtiActiveMode?: 'BRAHMA' | 'VISHNU' | 'SHIVA';
}

export type KalaEndingChoice = 'BHAKTI_TRANSMUTE' | 'MOKSHA_ASCEND' | 'KSHATRIYA_DEFY' | 'TYAGA_SACRIFICE';

export interface Asteroid {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  health: number;
  maxHealth: number;
  mineral: string;
  value: number;
  points: { x: number; y: number }[];
  rotation: number;
  rotSpeed: number;
}

export interface QuantumRelic {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  name: string;
  sanskritName?: string;
  classification: string;
  molecularDensity: number;
  quantumCoherence: number; // 0 - 100%
  value: number;
  pulsePhase: number;
  color: string;
  isAnalyzed: boolean;
  scanProgress: number; // 0 - 100
  
  // Vedic Mantra Resonance parameters
  mantraFrequency: number;
  mantraTargetFrequency: number;
  mantraPhaseAngle: number;
  mantraHarmonicRatio: number;
  isMantraResonanceLocked: boolean;
}

export interface RogueDrone {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  heading: number;
  radius: number;
  health: number;
  maxHealth: number;
  shields: number;
  maxShields: number;
  droneType: 'SCOUT' | 'INTERCEPTOR' | 'HEAVY_SENTINEL' | 'RAKSHASA_WARDRONE' | 'ASURA_TITAN';
  sanskritDesignation?: string;
  fireCooldown: number;
  lastFireTime: number;
  evasionTimer: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  life: number;
  maxLife: number;
  isEnemy: boolean;
  color: string;
  weaponType?: AstraWeaponType | 'PULSE_LASER' | 'HEAVY_RAILGUN';
  shieldPenetration?: number; // 0 to 1.0 ratio
  isSeeking?: boolean;
  targetId?: string;
  aoeRadius?: number;
}

export interface FloatingLoot {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'CREDITS' | 'ENERGY_CELL' | 'CRYO_COOLANT' | 'ALLOY' | 'SOMA_AMRITA' | 'YANTRA_SHARD';
  name: string;
  value: number;
  life: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  glow?: boolean;
  shape?: 'CIRCLE' | 'YANTRA_SPARK' | 'MANTRA_RING';
}

export interface SectorConfig {
  id: string;
  name: string;
  realmName: string;
  sanskritTitle: string;
  subtitle: string;
  hazardRating: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' | 'SINGULARITY';
  description: string;
  vedicLore: string;
  ambientColor: string;
  starCount: number;
  ambientParticles: string;
  relicsNeeded: number;
  hasBlackhole?: boolean;
  blackholePos?: Vector2D;
  blackholeMass?: number;
  themeColor: string;
  specialMechanicTitle?: string;
}

export interface AssistantDiagnostic {
  technicalDiagnosis: string;
  recommendedAction: string;
  alertLevel: 'NOMINAL' | 'ADVISORY' | 'CRITICAL' | 'HAZARD';
  audioLogSummary: string;
  suggestedPower?: PowerAllocations;
  timestamp: number;
  vedicVerseCorrelation?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'COMMANDER' | 'ASSISTANT_VECTOR' | 'SYSTEM';
  text: string;
  timestamp: string;
  action?: {
    type: string;
    power?: PowerAllocations;
    [key: string]: any;
  };
  vedicWisdomQuote?: string;
}

export interface AnomalyReport {
  spectrometerClassification: string;
  quantumCoherence: string;
  atomicComposition: string;
  hazardRating: string;
  salvageYieldEst: string;
  operationalRecommendation: string;
  ancientScriptCorrelation?: string;
  astronomicalRatio?: string;
}

export type DifficultyTier = 'CADET' | 'OPERATOR' | 'VECTORED_ACE' | 'QUANTUM_OVERLORD';

export interface DirectorParameters {
  tier: DifficultyTier;
  difficultyMultiplier: number;
  droneAggression: number;
  droneFireIntervalMultiplier: number;
  asteroidDensityMultiplier: number;
  relicValueMultiplier?: number;
  thermalDissipationRate: number;
  environmentalHazardsEnabled: boolean;
  activeScenarios?: string[];
}

export interface PlayerMasteryIndex {
  overallScore: number; // 0 - 100
  kinematicEfficiency: number; // 0 - 100 (delta-v vs drift)
  gunneryAccuracy: number; // 0 - 100 (shots fired vs hits)
  thermalStability: number; // 0 - 100 (avoiding critical threshold)
  salvageCadence: number; // 0 - 100 (relic recovery speed)
  combatRating?: number; // 0 - 100
  tier?: DifficultyTier;
  tierLabel?: string;
  shotsFired: number;
  shotsHit: number;
  distanceTraveled?: number;
  totalDistanceTraveled?: number;
  timeUnderThermalStrain: number; // seconds
}

export interface EmergentScenario {
  id: string;
  title: string;
  sanskritTitle?: string;
  type: 'ION_STORM' | 'SENTINEL_INCURSION' | 'SINGULARITY_SURGE' | 'DERELICT_NANITES' | 'CUSTOM_WARGAME' | 'KURUKSHETRA_VALLEY' | 'MANTRA_ANOMALY';
  hazardDescription: string;
  technicalDirective: string;
  hazardModifiers?: string[];
  duration?: number; // in seconds
  durationSeconds?: number;
  activeTimeRemaining: number;
  bonusSalvage?: number;
  bonusSalvageReward?: number;
  progress?: number; // 0 - 100
  isCompleted?: boolean;
  objectiveText: string;
  objectiveTarget: number;
  objectiveCurrent: number;
  verbalBroadcast?: string;
  environmentalModifiers?: Record<string, any>;
}

export interface DirectorEventLog {
  id: string;
  timestamp: string;
  eventType:
    | 'INITIALIZATION'
    | 'DIFFICULTY_SHIFT'
    | 'DIFFICULTY_ADAPTATION'
    | 'SCENARIO_INJECTED'
    | 'SCENARIO_INJECTION'
    | 'THREAT_MUTATION'
    | 'ASSISTANT_OVERRIDE'
    | 'MANUAL_TIER_OVERRIDE'
    | 'VIMANA_AWAKENING'
    | 'DHARMA_CHOICE'
    | 'HANUMAN_SUPERCHARGE'
    | 'MANTRA_HARMONIC_LOCK';
  description: string;
  impact: string;
  tierTriggered?: DifficultyTier;
}

export interface CognitiveReasoningNode {
  id: string;
  layer: 'SENSOR_INGRESS' | 'HEURISTIC_EVAL' | 'PREDICTIVE_RISK' | 'ACTION_DISPATCH' | 'VEDIC_CORRELATION';
  title: string;
  value: string;
  weight: number; // 0 to 1
  status: 'NOMINAL' | 'ALERT' | 'OPTIMIZING';
}

export interface DharmaDilemma {
  id: string;
  title: string;
  context: string;
  sanskritConcept: string;
  missionSuccessProbability: number;
  optionA: {
    label: string;
    description: string;
    consequence: string;
    philosophicalAlignment: string;
  };
  optionB: {
    label: string;
    description: string;
    consequence: string;
    philosophicalAlignment: string;
  };
}

