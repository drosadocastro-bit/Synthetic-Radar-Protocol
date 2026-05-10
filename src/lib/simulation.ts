import { SiteState, SubsystemStatus, TelemetryPoint, ObservedTarget, PerceptionMetrics } from '../types';

interface TargetTruth {
  id: string;
  rangeKm: number;
  azimuthDeg: number;
  velocityMps: number;
  rcs: number;
}

interface EnvironmentTruth {
  tempC: number;
  humidity: number;
  rainIntensity: 'NONE' | 'LIGHT' | 'MODERATE' | 'HEAVY';
  powerQuality: number; // 0.0 to 1.0
  heatStress: number; // 0.0 to 1.0
}

interface SystemHealthTruth {
  transmitter: number;
  receiver: number;
  dsp: number;
}

interface GroundTruth {
  targets: TargetTruth[];
  environment: EnvironmentTruth;
  systemHealth: SystemHealthTruth;
}

export class SimulationEngine {
  private truth: GroundTruth;
  private state: SiteState;

  constructor() {
    this.truth = this.initTruth();
    this.state = this.initObservedState(this.truth);
  }

  private initTruth(): GroundTruth {
    return {
      targets: [
        {
          id: "T001",
          rangeKm: 32.4,
          azimuthDeg: 114.2,
          velocityMps: 210,
          rcs: 0.82
        },
        {
          id: "T002",
          rangeKm: 12.1,
          azimuthDeg: 45.0,
          velocityMps: 15,
          rcs: 2.1
        }
      ],
      environment: {
        tempC: 28,
        humidity: 60,
        rainIntensity: 'NONE',
        powerQuality: 1.0,
        heatStress: 0.0
      },
      systemHealth: {
        transmitter: 0.98,
        receiver: 0.99,
        dsp: 0.95
      }
    };
  }

  private createInitialPoints(val: number, variance: number, now: number, historySize = 20): TelemetryPoint[] {
    return Array.from({ length: historySize }).map((_, i) => ({
      timestamp: now - (historySize - i) * 2000,
      value: val + (Math.random() - 0.5) * variance
    }));
  }

  private initObservedState(truth: GroundTruth): SiteState {
    const now = Date.now();
    return {
      timestamp: now,
      subsystems: [
        {
          id: 'lrr-01',
          name: 'Long Range Radar 1',
          type: 'LRR',
          status: SubsystemStatus.HEALTHY,
          health: truth.systemHealth.transmitter * 100,
          telemetry: {
            txPower: this.createInitialPoints(85, 2, now),
            rxNoise: this.createInitialPoints(12, 1, now),
            dspLoad: this.createInitialPoints(45, 5, now),
            attenuation: this.createInitialPoints(-1.0, 0.5, now),
            clutter: this.createInitialPoints(0.15, 0.05, now),
          },
          alarms: [],
        },
        {
          id: 'srr-01',
          name: 'Short Range Radar 1',
          type: 'SRR',
          status: SubsystemStatus.HEALTHY,
          health: 100,
          telemetry: {
            pedestalJitter: this.createInitialPoints(0.02, 0.01, now),
            azimuthError: this.createInitialPoints(0.05, 0.02, now),
            clutterDensity: this.createInitialPoints(0.2, 0.05, now),
            trackQual: this.createInitialPoints(99, 1, now),
          },
          alarms: [],
        },
        {
          id: 'beacon-01',
          name: 'Beacon System Alpha',
          type: 'BEACON',
          status: SubsystemStatus.HEALTHY,
          health: 95,
          telemetry: {
            interrogationTime: this.createInitialPoints(1000, 10, now),
            replyEfficiency: this.createInitialPoints(0.99, 0.01, now),
            falseReplyRate: this.createInitialPoints(0.01, 0.005, now),
            syncDrift: this.createInitialPoints(0.5, 0.2, now),
          },
          alarms: [],
        },
        {
          id: 'dop-01',
          name: 'Weather Doppler 1',
          type: 'DOPPLER',
          status: SubsystemStatus.HEALTHY,
          health: 99,
          telemetry: {
            reflectivityDistort: this.createInitialPoints(0.02, 0.01, now),
            radomeAtten: this.createInitialPoints(-1.1, 0.3, now),
            weatherClutter: this.createInitialPoints(0.1, 0.02, now),
            velocityAnomaly: this.createInitialPoints(0.05, 0.01, now),
          },
          alarms: [],
        },
      ],
      infrastructure: [
        {
          id: 'hvac-01',
          name: 'Main Equipment Cooling',
          type: 'HVAC',
          status: SubsystemStatus.HEALTHY,
          metrics: { 
            roomTemp: truth.environment.tempC, 
            rackTemp: truth.environment.tempC + 4, 
            humidity: truth.environment.humidity,
            airflowDeg: 2.1, 
            compressorCycle: 4.5, 
            filterRestriction: 15.0 
          },
        },
        {
          id: 'pwr-01',
          name: 'Site Power Distribution',
          type: 'POWER',
          status: SubsystemStatus.HEALTHY,
          metrics: { 
            utilityVoltage: 480.0, 
            upsCharge: 100.0, 
            genKickTiming: 0.0, 
            transferSwEvents: 2.0 
          },
        },
      ],
      powerGrid: {
        utilityStable: true,
        upsCharge: 100,
        generatorRunning: false,
      },
      environment: {
        externalTemp: truth.environment.tempC,
        humidity: truth.environment.humidity,
        rainIntensity: truth.environment.rainIntensity,
      },
      targets: [],
      perceptionMetrics: {
        truthVsObservedDelta: 0,
        confidenceError: 0,
        ghostTargetRate: 0,
        trackingStability: 100,
        signalIntegrity: 100
      }
    };
  }

  public update(): SiteState {
    const now = Date.now();
    this.state.timestamp = now;

    // 1. Advance Ground Truth
    this.advanceTruth();

    // 2. Degradation Engine
    const degradation = this.calculateDegradation();

    // 3. Observed Telemetry Layer
    this.applyDegradationToTelemetry(now, degradation);
    this.observeTargets(degradation);
    this.observeEnvironment();
    this.calculateMetrics(degradation);

    return { ...this.state };
  }

  private advanceTruth() {
    // Basic target movement
    this.truth.targets.forEach(t => {
      t.rangeKm -= (t.velocityMps / 1000) * 2; // 2 seconds update
      if (t.rangeKm < 1) t.rangeKm = 100; // loop around
      t.azimuthDeg += 0.5;
      if (t.azimuthDeg >= 360) t.azimuthDeg -= 360;
    });

    // Environment drift
    this.truth.environment.tempC += (Math.random() - 0.5) * 0.2;
    this.truth.environment.humidity += (Math.random() - 0.5) * 1.0;
    this.truth.environment.humidity = Math.max(0, Math.min(100, this.truth.environment.humidity));

    // Power drift
    if (Math.random() < 0.05) {
      this.truth.environment.powerQuality -= Math.random() * 0.1;
    } else {
      this.truth.environment.powerQuality += 0.05;
    }
    this.truth.environment.powerQuality = Math.max(0.6, Math.min(1.0, this.truth.environment.powerQuality));
    
    // Sometimes rain
    if (this.truth.environment.humidity > 85 && Math.random() < 0.1) {
      this.truth.environment.rainIntensity = 'LIGHT';
    } else if (this.truth.environment.humidity < 70) {
      this.truth.environment.rainIntensity = 'NONE';
    }
  }

  private calculateDegradation() {
    const env = this.truth.environment;
    
    // Weather attenuation: high humidity + rain -> weaker returns
    let weatherAttenCode = 0; // 0 to 1
    if (env.humidity > 80) weatherAttenCode += 0.2;
    if (env.rainIntensity === 'LIGHT') weatherAttenCode += 0.3;
    if (env.rainIntensity === 'MODERATE') weatherAttenCode += 0.6;
    if (env.rainIntensity === 'HEAVY') weatherAttenCode += 0.9;
    
    // Pedestal jitter / signal corruption from thermal / power
    let trackingJitter = 0.01;
    if (env.tempC > 35) trackingJitter += 0.05; // heat stress
    
    // DSP corruption from power instability
    let dspError = 0;
    if (env.powerQuality < 0.8) dspError += 0.2;
    if (env.powerQuality < 0.7) dspError += 0.5;

    return {
      weatherAttenuation: Math.min(1.0, weatherAttenCode),
      pedestalJitter: trackingJitter,
      dspError,
      packetLossRate: Math.max(0, (1.0 - env.powerQuality) * 0.5)
    };
  }

  private applyDegradationToTelemetry(now: number, deg: ReturnType<typeof this.calculateDegradation>) {
    // Generic updater
    const append = (subId: string, key: string, val: number) => {
      const sub = this.state.subsystems.find(s => s.id === subId);
      if (!sub) return;
      const arr = sub.telemetry[key];
      if (arr) {
        arr.push({ timestamp: now, value: val });
        if (arr.length > 20) arr.shift();
      }
    };

    // Update specific observed telemetry based on truth + degradation
    // LRR
    append('lrr-01', 'txPower', Math.max(0, 85 - (deg.dspError * 5) + (Math.random() - 0.5) * 2));
    append('lrr-01', 'rxNoise', 12 + (deg.weatherAttenuation * 20) + (Math.random() - 0.5) * 1);
    append('lrr-01', 'dspLoad', 45 + (deg.dspError * 40) + (Math.random() - 0.5) * 5);
    append('lrr-01', 'attenuation', -1.0 - (deg.weatherAttenuation * 8) + (Math.random() - 0.5) * 0.5);
    append('lrr-01', 'clutter', 0.15 + (deg.weatherAttenuation * 0.5) + (Math.random() - 0.5) * 0.05);

    // SRR
    append('srr-01', 'pedestalJitter', 0.02 + deg.pedestalJitter + (Math.random() - 0.5) * 0.01);
    append('srr-01', 'azimuthError', 0.05 + (deg.pedestalJitter * 2) + (Math.random() - 0.5) * 0.02);
    append('srr-01', 'clutterDensity', 0.2 + (deg.weatherAttenuation * 0.4) + (Math.random() - 0.5) * 0.05);
    append('srr-01', 'trackQual', Math.max(0, 99 - (deg.weatherAttenuation * 20) - (deg.packetLossRate * 50) + (Math.random() - 0.5) * 1));

    // Update Infrastructure
    const hvac = this.state.infrastructure.find(i => i.type === 'HVAC');
    if (hvac) {
      hvac.metrics.roomTemp = this.truth.environment.tempC;
      hvac.metrics.rackTemp = this.truth.environment.tempC + 4 + (deg.dspError * 10);
      hvac.metrics.humidity = this.truth.environment.humidity;
    }
    const pwr = this.state.infrastructure.find(i => i.type === 'POWER');
    if (pwr) {
      pwr.metrics.utilityVoltage = 480 * this.truth.environment.powerQuality;
      this.state.powerGrid.utilityStable = this.truth.environment.powerQuality > 0.8;
    }
  }

  private observeTargets(deg: ReturnType<typeof this.calculateDegradation>) {
    const observed: ObservedTarget[] = [];
    
    // Each truth target has a chance of being dropped or corrupted
    for (const t of this.truth.targets) {
      // Packet loss chance
      if (Math.random() < deg.packetLossRate) continue;

      // Calculate confidence based on attenuation and range
      let confidence = 1.0 - (deg.weatherAttenuation * 0.5) - (t.rangeKm / 200 * 0.2);
      
      // Jitter adds noise to observation
      const obsRange = t.rangeKm + (Math.random() - 0.5) * deg.pedestalJitter * 10;
      const obsAzimuth = t.azimuthDeg + (Math.random() - 0.5) * deg.pedestalJitter * 5;
      
      observed.push({
        id: t.id,
        rangeKm: obsRange,
        azimuthDeg: obsAzimuth,
        velocityMps: t.velocityMps,
        rcs: t.rcs,
        confidence: Math.max(0, Math.min(1.0, confidence))
      });
    }

    // Ghost targets from DSP corruption
    if (deg.dspError > 0.1 && Math.random() < deg.dspError) {
      observed.push({
        id: `G-${Math.floor(Math.random()*1000)}`,
        rangeKm: Math.random() * 50 + 10,
        azimuthDeg: Math.random() * 360,
        velocityMps: Math.random() * 500,
        rcs: Math.random() * 2,
        isGhost: true,
        confidence: 0.3 + Math.random() * 0.4
      });
    }

    this.state.targets = observed;
  }

  private observeEnvironment() {
    this.state.environment = {
      externalTemp: this.truth.environment.tempC,
      humidity: this.truth.environment.humidity,
      rainIntensity: this.truth.environment.rainIntensity
    };
  }

  private calculateMetrics(deg: ReturnType<typeof this.calculateDegradation>) {
    // Compare truth to observed
    const ghosts = this.state.targets.filter(t => t.isGhost);
    
    // Deltas
    let sumDelta = 0;
    let sumConf = 0;
    const realTargets = this.state.targets.filter(t => !t.isGhost);
    realTargets.forEach(ot => {
      const tt = this.truth.targets.find(x => x.id === ot.id);
      if (tt) {
        sumDelta += Math.abs(tt.rangeKm - ot.rangeKm) + Math.abs(tt.azimuthDeg - ot.azimuthDeg);
      }
      sumConf += ot.confidence || 0;
    });

    this.state.perceptionMetrics = {
      truthVsObservedDelta: realTargets.length > 0 ? sumDelta / realTargets.length : 0,
      confidenceError: realTargets.length > 0 ? 1.0 - (sumConf / realTargets.length) : 1.0,
      ghostTargetRate: ghosts.length / Math.max(1, this.state.targets.length),
      trackingStability: Math.max(0, 100 - (deg.pedestalJitter * 1000) - (deg.packetLossRate * 100)),
      signalIntegrity: Math.max(0, 100 - (deg.weatherAttenuation * 100) - (deg.dspError * 100))
    };
  }

  public getState(): SiteState {
    return { ...this.state };
  }
}

export const simulation = new SimulationEngine();
