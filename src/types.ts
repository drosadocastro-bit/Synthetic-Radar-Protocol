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
  type: 'HVAC' | 'POWER';
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
}

export interface AIReasoning {
  id: string;
  timestamp: number;
  analysis: string;
  confidence: number;
  subsystemEvidence: string[];
  recommendation: string;
}
