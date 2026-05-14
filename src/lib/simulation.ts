import { SiteState, SubsystemStatus, TelemetryPoint, ObservedTarget, PerceptionMetrics, ExperimentLedgerEntry, ScenarioMetadata, ScenarioPreset, ScenarioEvent, ScenarioFrame, GroundTruth } from '../types';
import { runObserverAgents } from './agents';
import { runEvalHarness } from './evalHarness';
import { runOversightAnalysis } from './oversight';

export class PRNG {
  public seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

export class SimulationEngine {
  private truth!: GroundTruth;
  private state!: SiteState;
  private prng!: PRNG;
  private initialSeed: number;
  
  public simTime: number = 0;
  public history: ScenarioFrame[] = [];
  public activePresetId: string = 'NOMINAL_DAY';

  public ledger: ExperimentLedgerEntry[] = [];
  public activeExperimentId: string = "EXP-INITIAL";
  private activeEvents: string[] = [];
  
  public scheduledEvents: ScenarioEvent[] = [];
  public injectedEventsLog: {tick: number, type: string, timeStr: string}[] = [];

  constructor(seed: number = 12345) {
    this.initialSeed = seed;
    this.reset(seed);
  }

  public reset(seed: number = this.initialSeed) {
    this.prng = new PRNG(seed);
    this.simTime = Date.now();
    this.history = [];
    this.activeEvents = [];
    this.injectedEventsLog = [];
    this.truth = this.initTruth();
    this.state = this.initObservedState(this.truth);
    this.history.push({
      prngSeed: this.prng.seed,
      truth: JSON.parse(JSON.stringify(this.truth)),
      state: JSON.parse(JSON.stringify(this.state)),
      simTime: this.simTime
    });

    this.activeExperimentId = "EXP-" + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    // We don't commit it immediately, we maintain it virtually until branched or queried.
  }

  public loadScenario(scenario: ScenarioPreset) {
    if (this.history.length > 1) {
       const prevEntry = this.compileLedgerEntry(this.activeExperimentId, this.ledger.length > 0 ? this.ledger[this.ledger.length - 1].id : null, this.history, this.activeEvents);
       this.ledger.push(prevEntry);
    }
    
    this.initialSeed = scenario.seed;
    this.scheduledEvents = [...scenario.events];
    this.activePresetId = scenario.id;
    this.reset(scenario.seed); // This resets history, activeEvents, simTime, sets activeExperimentId
  }

  private cloneState(s: SiteState): SiteState {
    return JSON.parse(JSON.stringify(s));
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
      value: val + (this.prng.next() - 0.5) * variance
    }));
  }

  private initObservedState(truth: GroundTruth): SiteState {
    const now = this.simTime;
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
    const currentTick = this.history.length;
    const scheduled = this.scheduledEvents.filter(e => e.tick === currentTick);
    scheduled.forEach(e => {
      this.injectEvent(e.type);
      if (!this.activeEvents.includes(e.type)) {
         this.activeEvents.push(e.type);
      }
    });

    const now = this.simTime + 2000; // advance by 2 seconds
    this.simTime = now;
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

    this.state.councilReport = runObserverAgents(this.state);

    this.history.push({
      prngSeed: this.prng.seed,
      truth: JSON.parse(JSON.stringify(this.truth)),
      state: this.cloneState(this.state),
      simTime: this.simTime
    });

    return this.cloneState(this.state);
  }

  public getHistory(): ScenarioFrame[] {
    return this.history;
  }

  public getActiveExperimentEntry(): ExperimentLedgerEntry {
    const parentId = this.ledger.length > 0 ? this.ledger[this.ledger.length - 1].id : null;
    return this.compileLedgerEntry(this.activeExperimentId, parentId, this.history, this.activeEvents);
  }

  private compileLedgerEntry(id: string, parentId: string | null, frames: ScenarioFrame[], events: string[]): ExperimentLedgerEntry {
    let peakGhost = 0;
    let lowestSignal = 100;
    let sumStable = 0;
    let sumConf = 0;

    const timelineData = frames.map((f, i) => {
      const p = f.state.perceptionMetrics;
      const tick = i;
      return {
        tick,
        ghostRate: p.ghostTargetRate,
        signalIntegrity: p.signalIntegrity,
        trackingStability: p.trackingStability,
        confError: p.confidenceError,
        powerQuality: f.truth.environment.powerQuality
      };
    });

    frames.forEach(f => {
      const p = f.state.perceptionMetrics;
      if (p.ghostTargetRate > peakGhost) peakGhost = p.ghostTargetRate;
      if (p.signalIntegrity < lowestSignal) lowestSignal = p.signalIntegrity;
      sumStable += p.trackingStability;
      sumConf += p.confidenceError;
    });

    const len = Math.max(1, frames.length);
    const evalMetrics = runEvalHarness(frames, this.activePresetId);

    // Grab environment state roughly from last frame
    const lastTruth = frames[frames.length - 1]?.truth.environment;
    
    return {
      id,
      seed: frames[0]?.prngSeed || 0,
      branchParentId: parentId,
      startTick: frames[0]?.simTime || 0,
      scenarioEvents: [...events],
      durationTicks: len * 2, // approximate since each tick is 2 sec
      metadata: {
        environment: {
          humidity: lastTruth?.humidity > 80 ? 'HIGH' : lastTruth?.humidity > 40 ? 'MODERATE' : 'LOW',
          rain: lastTruth?.rainIntensity || 'NONE'
        },
        infrastructure: {
          generatorState: lastTruth?.powerQuality < 0.8 ? 'UNSTABLE' : 'STABLE',
          hvacStatus: (lastTruth?.tempC > 35) ? 'DEGRADED' : 'NOMINAL'
        },
        signalConditions: {
          jitter: 'VARIES', // Placeholder
          packetLoss: lastTruth?.powerQuality < 0.9 ? 'ELEVATED' : 'LOW'
        }
      },
      timelineData,
      results: {
        peakGhostRate: peakGhost,
        lowestSignalIntegrity: lowestSignal,
        avgTrackingStability: sumStable / len,
        avgConfidenceError: sumConf / len
      },
      finalCouncilReport: frames[frames.length - 1]?.state.councilReport,
      evalMetrics: evalMetrics,
      oversightReport: runOversightAnalysis(evalMetrics, frames)
    };
  }

  public branchFromFrame(frame: ScenarioFrame, dropFuture: boolean = true) {
    // Commit the current experiment to the ledger up to the point of branching
    const prevEntry = this.compileLedgerEntry(this.activeExperimentId, this.ledger.length > 0 ? this.ledger[this.ledger.length - 1].id : null, this.history, this.activeEvents);
    this.ledger.push(prevEntry);

    this.prng.seed = frame.prngSeed;
    this.truth = JSON.parse(JSON.stringify(frame.truth));
    this.state = this.cloneState(frame.state);
    this.simTime = frame.simTime;
    
    if (dropFuture) {
      const idx = this.history.findIndex(f => f.simTime === frame.simTime);
      if (idx !== -1) {
        this.history = this.history.slice(0, idx + 1);
      } else {
        this.history = [frame];
      }
    }

    // Assign new experiment ID
    this.activeExperimentId = "EXP-" + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    // We retain prior activeEvents up to this branching point by just leaving them, minus injected ones?
    // Start fresh
    this.activeEvents = [];
  }

  public injectEvent(type: 'POWER_SPIKE' | 'HVAC_FAILURE' | 'STORM') {
    const tick = this.history.length;
    const timeStr = new Date(this.simTime).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.injectedEventsLog.push({ tick, type, timeStr });

    switch (type) {
      case 'POWER_SPIKE':
        this.truth.environment.powerQuality = 0.2; // Massive drop
        this.activeEvents.push('POWER_DROP');
        break;
      case 'HVAC_FAILURE':
        const hvac = this.state.infrastructure.find(i => i.type === 'HVAC');
        if (hvac) hvac.status = SubsystemStatus.CRITICAL;
        this.truth.environment.tempC += 15; // Spike temperature
        this.activeEvents.push('HVAC_FAIL');
        break;
      case 'STORM':
        this.truth.environment.humidity = 95;
        this.truth.environment.rainIntensity = 'HEAVY';
        this.activeEvents.push('STORM_CELL');
        break;
    }
    // Update state to reflect this injected event immediately in the next tick
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
    this.truth.environment.tempC += (this.prng.next() - 0.5) * 0.2;
    this.truth.environment.humidity += (this.prng.next() - 0.5) * 1.0;
    this.truth.environment.humidity = Math.max(0, Math.min(100, this.truth.environment.humidity));

    // Power drift
    if (this.prng.next() < 0.05) {
      this.truth.environment.powerQuality -= this.prng.next() * 0.1;
    } else {
      this.truth.environment.powerQuality += 0.05;
    }
    this.truth.environment.powerQuality = Math.max(0.6, Math.min(1.0, this.truth.environment.powerQuality));
    
    // Sometimes rain
    if (this.truth.environment.humidity > 85 && this.prng.next() < 0.1) {
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
    append('lrr-01', 'txPower', Math.max(0, 85 - (deg.dspError * 5) + (this.prng.next() - 0.5) * 2));
    append('lrr-01', 'rxNoise', 12 + (deg.weatherAttenuation * 20) + (this.prng.next() - 0.5) * 1);
    append('lrr-01', 'dspLoad', 45 + (deg.dspError * 40) + (this.prng.next() - 0.5) * 5);
    append('lrr-01', 'attenuation', -1.0 - (deg.weatherAttenuation * 8) + (this.prng.next() - 0.5) * 0.5);
    append('lrr-01', 'clutter', 0.15 + (deg.weatherAttenuation * 0.5) + (this.prng.next() - 0.5) * 0.05);

    // SRR
    append('srr-01', 'pedestalJitter', 0.02 + deg.pedestalJitter + (this.prng.next() - 0.5) * 0.01);
    append('srr-01', 'azimuthError', 0.05 + (deg.pedestalJitter * 2) + (this.prng.next() - 0.5) * 0.02);
    append('srr-01', 'clutterDensity', 0.2 + (deg.weatherAttenuation * 0.4) + (this.prng.next() - 0.5) * 0.05);
    append('srr-01', 'trackQual', Math.max(0, 99 - (deg.weatherAttenuation * 20) - (deg.packetLossRate * 50) + (this.prng.next() - 0.5) * 1));

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
      if (this.prng.next() < deg.packetLossRate) continue;

      // Calculate confidence based on attenuation and range
      let confidence = 1.0 - (deg.weatherAttenuation * 0.5) - (t.rangeKm / 200 * 0.2);
      
      // Jitter adds noise to observation
      const obsRange = t.rangeKm + (this.prng.next() - 0.5) * deg.pedestalJitter * 10;
      const obsAzimuth = t.azimuthDeg + (this.prng.next() - 0.5) * deg.pedestalJitter * 5;
      
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
    if (deg.dspError > 0.1 && this.prng.next() < deg.dspError) {
      observed.push({
        id: `G-${Math.floor(this.prng.next()*1000)}`,
        rangeKm: this.prng.next() * 50 + 10,
        azimuthDeg: this.prng.next() * 360,
        velocityMps: this.prng.next() * 500,
        rcs: this.prng.next() * 2,
        isGhost: true,
        confidence: 0.3 + this.prng.next() * 0.4
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
