/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum SubsystemStatus {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  CRITICAL = 'CRITICAL',
  OFFLINE = 'OFFLINE',
}

export interface TelemetryPoint {
  timestamp: number;
  value: number;
}

export interface RadarSubsystem {
  id: string;
  name: string;
  type: 'LRR' | 'SRR' | 'BEACON' | 'DOPPLER';
  status: SubsystemStatus;
  health: number; // 0-100
  telemetry: {
    [key: string]: TelemetryPoint[];
  };
  alarms: Alarm[];
}

export interface InfrastructureSystem {
  id: string;
  name: string;
  type: 'HVAC' | 'POWER' | 'COMMS';
  status: SubsystemStatus;
  metrics: {
    [key: string]: number;
  };
}

export interface Alarm {
  id: string;
  timestamp: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  subsystemId: string;
  resolved: boolean;
}

export interface ScenarioEvent {
  tick: number;
  type: 'POWER_SPIKE' | 'HVAC_FAILURE' | 'STORM';
}

export interface ExpectedOutcome {
  tag: string;
  description: string;
}

export interface ScenarioPreset {
  id: string;
  name: string;
  description: string;
  pack: 'BASELINE' | 'STORM' | 'POWER' | 'HVAC' | 'COMPOUND' | string;
  seed: number;
  events: ScenarioEvent[];
  expectedOutcomes: ExpectedOutcome[];
}

export interface ScenarioMetadata {
  environment: {
    humidity: string;
    rain: string;
  };
  infrastructure: {
    generatorState: string;
    hvacStatus: string;
  };
  signalConditions: {
    jitter: string;
    packetLoss: string;
  };
}

export type CoordinatorPolicy = 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE' | 'SKEPTICAL';

export interface PolicyMetrics {
  policy: CoordinatorPolicy;
  reviewRate: number;
  falseNominalRate: number;
  overconfidenceRate: number;
  criticalEscalationRate: number;
  disagreementPreservation: number;
  gracefulDegradationScore: number;
}

export interface RegressionResult {
  policy: CoordinatorPolicy | 'GLOBAL';
  rule: string;
  passed: boolean;
  actual: string;
}

export interface EvalMetrics {
  driftScore: number;
  hallucinationRate: number;
  overconfidenceEvents: number;
  ghostPersistenceAvg: number;
  escalationIntegrity: number;
  disagreementPreserved: number;
  contradictionRate?: number;
  falseConsensusRate?: number;
  causalAmbiguityScore?: number;
  agreementStability?: number;
  policyComparisons: PolicyMetrics[];
  policyRegressions: RegressionResult[];
}

export type OversightStatus = 'PASS' | 'WATCH' | 'REVIEW_REQUIRED' | 'CONTAINMENT_ALERT';

export interface OversightOutcome {
  agentId: string;
  agentName: string;
  status: OversightStatus;
  message: string;
  metrics: { [key: string]: number };
}

export interface OversightReport {
  timestamp: number;
  posture: OversightStatus;
  agentK: OversightOutcome;
  bladeRunners: OversightOutcome[];
  governanceScore: number;
}

export interface ExperimentLedgerEntry {
  id: string;
  seed: number;
  branchParentId: string | null;
  startTick: number;
  scenarioEvents: string[];
  durationTicks: number;
  metadata: ScenarioMetadata;
  timelineData: {
    tick: number;
    ghostRate: number;
    signalIntegrity: number;
    trackingStability: number;
    confError: number;
    powerQuality: number;
  }[];
  results: {
    peakGhostRate: number;
    lowestSignalIntegrity: number;
    avgTrackingStability: number;
    avgConfidenceError: number;
  };
  finalCouncilReport?: CouncilReport;
  evalMetrics?: EvalMetrics;
  oversightReport?: OversightReport;
}

export interface PerceptionMetrics {
  truthVsObservedDelta: number;
  confidenceError: number;
  ghostTargetRate: number;
  trackingStability: number;
  signalIntegrity: number;
}

export interface ObservedTarget {
  id: string;
  rangeKm: number;
  azimuthDeg: number;
  velocityMps: number;
  rcs: number;
  isGhost?: boolean;
  confidence?: number;
}

export interface AgentFinding {
  agentId: string;
  agentName: string;
  status: 'NOMINAL' | 'CONCERN' | 'CRITICAL' | 'UNKNOWN';
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
  observations: string[];
  suspectedContributors: string[];
  missingEvidence: string[];
  requiresReview: boolean;
}

export interface CoordinatorSummary {
  status: 'NOMINAL' | 'CONCERN' | 'CRITICAL';
  conflicts: string[];
  commonCause: string | null;
  summary: string;
  agentsRequiringReview: string[];
}

export interface ContradictionNode {
  agentA: string;
  agentB: string;
  relationship: 'AGREEMENT' | 'CONTRADICTION' | 'UNCERTAIN_OVERLAP' | 'CAUSAL_ALIGNMENT';
  strength: number; // 0-1
  reasoning: string;
}

export interface CouncilReport {
  timestamp: number;
  findings: AgentFinding[];
  coordinator: CoordinatorSummary;
  contradictionMatrix?: ContradictionNode[];
}

export interface SiteState {
  timestamp: number;
  subsystems: RadarSubsystem[];
  infrastructure: InfrastructureSystem[];
  powerGrid: {
    utilityStable: boolean;
    upsCharge: number;
    generatorRunning: boolean;
  };
  environment: {
    externalTemp: number;
    humidity: number;
    rainIntensity: 'NONE' | 'LIGHT' | 'MODERATE' | 'HEAVY';
  };
  targets: ObservedTarget[];
  perceptionMetrics: PerceptionMetrics;
  councilReport?: CouncilReport;
}

export interface AIReasoning {
  id: string;
  timestamp: number;
  analysis: string;
  confidence: number;
  subsystemEvidence: string[];
  recommendation: string;
}

export interface TargetTruth {
  id: string;
  rangeKm: number;
  azimuthDeg: number;
  velocityMps: number;
  rcs: number;
}

export interface EnvironmentTruth {
  tempC: number;
  humidity: number;
  rainIntensity: 'NONE' | 'LIGHT' | 'MODERATE' | 'HEAVY';
  powerQuality: number;
  heatStress: number;
}

export interface SystemHealthTruth {
  transmitter: number;
  receiver: number;
  dsp: number;
}

export interface GroundTruth {
  targets: TargetTruth[];
  environment: EnvironmentTruth;
  systemHealth: SystemHealthTruth;
}

export interface ScenarioFrame {
  prngSeed: number;
  truth: GroundTruth;
  state: SiteState;
  simTime: number;
}
