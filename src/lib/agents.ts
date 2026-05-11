import { SiteState, AgentFinding, CoordinatorSummary, CouncilReport } from '../types';

export function runObserverAgents(state: SiteState): CouncilReport {
  const findings: AgentFinding[] = [];

  // LRR Agent
  findings.push(evaluateLRR(state));
  // SRR Agent
  findings.push(evaluateSRR(state));
  // HVAC Agent
  findings.push(evaluateHVAC(state));
  // Power Agent
  findings.push(evaluatePower(state));
  // Weather Forecaster Agent
  findings.push(evaluateWeather(state));
  // Beacon Agent
  findings.push(evaluateBeacon(state));
  // Doppler Agent
  findings.push(evaluateDoppler(state));
  // Comms Agent
  findings.push(evaluateComms(state));
  
  // Coordinator Agent
  const coordinator = evaluateCoordinator(findings);

  // Cross-Agent Contradiction Matrix (Phase 6.7)
  const contradictionMatrix = generateContradictionMatrix(findings);

  return {
    timestamp: state.timestamp,
    findings,
    coordinator,
    contradictionMatrix
  };
}

import { ContradictionNode } from '../types';

function generateContradictionMatrix(findings: AgentFinding[]): ContradictionNode[] {
  const nodes: ContradictionNode[] = [];
  
  for (let i = 0; i < findings.length; i++) {
    for (let j = i + 1; j < findings.length; j++) {
      const a = findings[i];
      const b = findings[j];
      
      let relationship: ContradictionNode['relationship'] = 'UNCERTAIN_OVERLAP';
      let strength = 0.2;
      let reasoning = 'Inconclusive cross-subsystem correlation.';

      // Check for direct status contradiction
      const statusConflict = (a.status === 'CRITICAL' && b.status === 'NOMINAL') || (a.status === 'NOMINAL' && b.status === 'CRITICAL');
      const statusAgreement = (a.status === b.status && a.status !== 'NOMINAL');

      // Shared contributors indicate causal alignment
      const sharedContributors = a.suspectedContributors.filter(contributor => 
        b.suspectedContributors.includes(contributor)
      );

      if (statusConflict) {
        relationship = 'CONTRADICTION';
        strength = (a.confidence + b.confidence) / 2;
        reasoning = `Status mismatch: ${a.agentName} reports ${a.status} vs ${b.agentName} reporting ${b.status}.`;
      } else if (sharedContributors.length > 0) {
        relationship = 'CAUSAL_ALIGNMENT';
        strength = 0.6 + (sharedContributors.length * 0.15);
        reasoning = `Causal linkage: both suspect ${sharedContributors.join(', ')}.`;
      } else if (statusAgreement) {
        relationship = 'AGREEMENT';
        strength = (a.confidence + b.confidence) / 2;
        reasoning = `Independent corroboration of ${a.status} state.`;
      } else if (a.status === 'NOMINAL' && b.status === 'NOMINAL') {
        relationship = 'AGREEMENT';
        strength = 0.4;
        reasoning = `Both agents reporting baseline operational nominals.`;
      }

      nodes.push({
        agentA: a.agentId,
        agentB: b.agentId,
        relationship,
        strength: Math.min(1, strength),
        reasoning
      });
    }
  }

  return nodes;
}

function evaluateLRR(state: SiteState): AgentFinding {
  const lrr = state.subsystems.find(s => s.type === 'LRR');
  const metrics = state.perceptionMetrics;

  const observations: string[] = [];
  const suspected: string[] = [];
  let status: AgentFinding['status'] = 'NOMINAL';
  let risk: AgentFinding['risk'] = 'LOW';
  let review = false;

  if (metrics.ghostTargetRate > 0.1) {
    observations.push(`Elevated ghost target rate: ${(metrics.ghostTargetRate * 100).toFixed(1)}%`);
    suspected.push('DSP corruption', 'Weather attenuation');
    status = 'CONCERN';
    risk = 'MEDIUM';
    review = true;
  }

  if (metrics.signalIntegrity < 80) {
    observations.push(`Signal integrity dropped to ${metrics.signalIntegrity.toFixed(1)}%`);
    if (metrics.signalIntegrity < 60) {
      status = 'CRITICAL';
      risk = 'HIGH';
    } else {
      status = 'CONCERN';
    }
    suspected.push('Power instability', 'Atmospheric disruption');
    review = true;
  }

  if (lrr?.status === 'DEGRADED' || lrr?.status === 'CRITICAL') {
    observations.push(`Subsystem status is ${lrr.status}`);
    status = lrr.status === 'CRITICAL' ? 'CRITICAL' : 'CONCERN';
  }

  if (observations.length === 0) {
    observations.push('LRR operating nominally.');
  }

  return {
    agentId: 'lrr_agent',
    agentName: 'Long Range Radar Agent',
    status,
    risk,
    confidence: 0.85,
    observations,
    suspectedContributors: suspected,
    missingEvidence: suspected.includes('Power instability') ? ['Power quality telemetry correlation'] : [],
    requiresReview: review
  };
}

function evaluateSRR(state: SiteState): AgentFinding {
  const srr = state.subsystems.find(s => s.type === 'SRR');
  const metrics = state.perceptionMetrics;

  const observations: string[] = [];
  const suspected: string[] = [];
  let status: AgentFinding['status'] = 'NOMINAL';
  let risk: AgentFinding['risk'] = 'LOW';
  let review = false;

  if (metrics.trackingStability < 80) {
    observations.push(`Tracking stability degraded: ${metrics.trackingStability.toFixed(1)}%`);
    suspected.push('Pedestal jitter', 'Near-range clutter');
    status = 'CONCERN';
    risk = 'MEDIUM';
    review = true;
  }

  if (srr && srr.health < 85) {
    observations.push('SRR health is suboptimal.');
    status = 'CONCERN';
  }

  if (observations.length === 0) {
    observations.push('Pedestal tracking and azimuth stability look solid.');
  }

  return {
    agentId: 'srr_agent',
    agentName: 'Short Range Radar Agent',
    status,
    risk,
    confidence: 0.9,
    observations,
    suspectedContributors: suspected,
    missingEvidence: suspected.includes('Pedestal jitter') ? ['Vibration sensor data'] : [],
    requiresReview: review
  };
}

function evaluateHVAC(state: SiteState): AgentFinding {
  const hvac = state.infrastructure.find(i => i.type === 'HVAC');
  const temp = state.environment.externalTemp;

  const observations: string[] = [];
  const suspected: string[] = [];
  let status: AgentFinding['status'] = 'NOMINAL';
  let risk: AgentFinding['risk'] = 'LOW';
  let review = false;

  if (hvac?.status === 'CRITICAL' || hvac?.status === 'DEGRADED') {
    observations.push(`HVAC reporting ${hvac.status} state.`);
    suspected.push('Mechanical failure', 'Power delivery issue');
    status = hvac.status === 'CRITICAL' ? 'CRITICAL' : 'CONCERN';
    risk = hvac.status === 'CRITICAL' ? 'HIGH' : 'MEDIUM';
    review = true;
  }

  if (temp > 35) {
    observations.push('High environmental temperature.');
    suspected.push('Thermal throttling risk on DSP');
    status = status === 'CRITICAL' ? 'CRITICAL' : 'CONCERN';
    if (status === 'CONCERN') risk = 'MEDIUM';
    review = true;
  }

  if (observations.length === 0) {
    observations.push('Thermal environment stable.');
  }

  return {
    agentId: 'hvac_agent',
    agentName: 'HVAC Agent',
    status,
    risk,
    confidence: 0.88,
    observations,
    suspectedContributors: suspected,
    missingEvidence: [],
    requiresReview: review
  };
}

function evaluatePower(state: SiteState): AgentFinding {
  const power = state.infrastructure.find(i => i.type === 'POWER');
  const envPower = state.powerGrid;

  const observations: string[] = [];
  const suspected: string[] = [];
  let status: AgentFinding['status'] = 'NOMINAL';
  let risk: AgentFinding['risk'] = 'LOW';
  let review = false;

  if (!envPower?.utilityStable) {
    observations.push('Utility power unstable.');
    status = 'CONCERN';
    risk = 'MEDIUM';
    review = true;
  }
  
  if (power?.status === 'CRITICAL' || power?.status === 'DEGRADED') {
      observations.push(`Power system in ${power.status} status`);
      status = power.status === 'CRITICAL' ? 'CRITICAL' : 'CONCERN';
      risk = power.status === 'CRITICAL' ? 'HIGH' : 'MEDIUM';
      review = true;
  }

  if (observations.length === 0) {
    observations.push('Power delivery clean and stable.');
  }

  return {
    agentId: 'power_agent',
    agentName: 'Power Agent',
    status,
    risk,
    confidence: 0.95,
    observations,
    suspectedContributors: suspected,
    missingEvidence: [],
    requiresReview: review
  };
}

function evaluateWeather(state: SiteState): AgentFinding {
  const env = state.environment;

  const observations: string[] = [];
  const suspected: string[] = [];
  let status: AgentFinding['status'] = 'NOMINAL';
  let risk: AgentFinding['risk'] = 'LOW';
  let review = false;

  if (env.rainIntensity !== 'NONE') {
    observations.push(`${env.rainIntensity} rain detected.`);
    if (env.rainIntensity === 'HEAVY') {
      status = 'CRITICAL';
      risk = 'HIGH';
      suspected.push('Radome attenuation', 'Clutter masking');
      review = true;
    } else {
      status = 'CONCERN';
      risk = 'MEDIUM';
      suspected.push('Minor attenuation');
    }
  }

  if (env.humidity > 90) {
    observations.push('Extremely high humidity.');
    suspected.push('Equipment condensation risk');
  }

  if (observations.length === 0) {
    observations.push('Clear weather conditions.');
  }

  return {
    agentId: 'weather_agent',
    agentName: 'Weather Forecaster Agent',
    status,
    risk,
    confidence: 0.92,
    observations,
    suspectedContributors: suspected,
    missingEvidence: [],
    requiresReview: review
  };
}

// Beacon Agent
function evaluateBeacon(state: SiteState): AgentFinding {
  const beacon = state.subsystems.find(s => s.type === 'BEACON');
  
  const observations: string[] = [];
  const suspected: string[] = [];
  let status: AgentFinding['status'] = 'NOMINAL';
  let risk: AgentFinding['risk'] = 'LOW';
  let review = false;

  if (beacon?.status === 'CRITICAL' || beacon?.status === 'DEGRADED') {
    observations.push(`Beacon system in ${beacon.status} state.`);
    suspected.push('Decoder integrity failure', 'Timing sync off');
    status = beacon.status === 'CRITICAL' ? 'CRITICAL' : 'CONCERN';
    risk = beacon.status === 'CRITICAL' ? 'HIGH' : 'MEDIUM';
    review = true;
  }

  if (observations.length === 0) {
    observations.push('Beacon interrogation and reply stable.');
  }

  return {
    agentId: 'beacon_agent',
    agentName: 'Beacon Agent',
    status,
    risk,
    confidence: 0.88,
    observations,
    suspectedContributors: suspected,
    missingEvidence: suspected.length > 0 ? ['Transponder replies validation'] : [],
    requiresReview: review
  };
}

// Weather Doppler Agent
function evaluateDoppler(state: SiteState): AgentFinding {
  const doppler = state.subsystems.find(s => s.type === 'DOPPLER');
  
  const observations: string[] = [];
  const suspected: string[] = [];
  let status: AgentFinding['status'] = 'NOMINAL';
  let risk: AgentFinding['risk'] = 'LOW';
  let review = false;

  if (doppler?.status === 'CRITICAL' || doppler?.status === 'DEGRADED') {
    observations.push(`Doppler is operating at ${doppler.status}.`);
    suspected.push('Reflectivity distortion');
    status = doppler.status === 'CRITICAL' ? 'CRITICAL' : 'CONCERN';
    risk = doppler.status === 'CRITICAL' ? 'HIGH' : 'MEDIUM';
    review = true;
  }

  if (observations.length === 0) {
    observations.push('Velocity product and storm tracking nominal.');
  }

  return {
    agentId: 'doppler_agent',
    agentName: 'Weather Doppler Agent',
    status,
    risk,
    confidence: 0.9,
    observations,
    suspectedContributors: suspected,
    missingEvidence: [],
    requiresReview: review
  };
}

// Comms Agent
function evaluateComms(state: SiteState): AgentFinding {
  const comms = state.infrastructure.find(i => i.type === 'COMMS');
  
  const observations: string[] = [];
  const suspected: string[] = [];
  let status: AgentFinding['status'] = 'NOMINAL';
  let risk: AgentFinding['risk'] = 'LOW';
  let review = false;

  if (comms?.status === 'CRITICAL' || comms?.status === 'DEGRADED') {
    observations.push(`Comms reporting ${comms.status} condition.`);
    suspected.push('Network latency', 'Site connectivity drop');
    status = comms.status === 'CRITICAL' ? 'CRITICAL' : 'CONCERN';
    risk = comms.status === 'CRITICAL' ? 'HIGH' : 'MEDIUM';
    review = true;
  }

  if (observations.length === 0) {
    observations.push('Network latency and backhaul stable.');
  }

  return {
    agentId: 'comms_agent',
    agentName: 'Comms Agent',
    status,
    risk,
    confidence: 0.96,
    observations,
    suspectedContributors: suspected,
    missingEvidence: [],
    requiresReview: review
  };
}

export function evaluateCoordinator(findings: AgentFinding[], policy: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE' | 'SKEPTICAL' = 'BALANCED'): CoordinatorSummary {
  const concerns = findings.filter(f => f.status === 'CONCERN' || f.status === 'CRITICAL');
  const critical = findings.filter(f => f.status === 'CRITICAL');
  const nominal = findings.filter(f => f.status === 'NOMINAL');
  
  let status: CoordinatorSummary['status'] = 'NOMINAL';
  const conflicts: string[] = [];

  switch (policy) {
    case 'CONSERVATIVE':
      if (concerns.length > 0) status = 'CONCERN';
      if (critical.length > 0 || concerns.length > 1) status = 'CRITICAL';
      break;
    case 'BALANCED':
      if (concerns.length > 0) status = 'CONCERN';
      if (critical.length > 0) status = 'CRITICAL';
      break;
    case 'AGGRESSIVE':
      if (concerns.length > 1) status = 'CONCERN';
      if (critical.length > 1) status = 'CRITICAL';
      break;
    case 'SKEPTICAL':
      if (concerns.length > 0) status = 'CONCERN';
      if (critical.length > 0 && critical.some(c => c.confidence > 0.9 && c.missingEvidence.length === 0)) status = 'CRITICAL';
      break;
  }

  if (critical.length > 0 && nominal.length > 0) {
    conflicts.push(`Conflict: ${critical.length} critical vs ${nominal.length} nominal findings`);
  } else if (concerns.length > 0 && nominal.length > 2) {
    if (policy === 'SKEPTICAL') {
      conflicts.push(`Disagreement: isolated concern among nominals`);
    } else if (policy === 'CONSERVATIVE') {
      conflicts.push(`Anomaly: concern detected against nominal majority`);
    } else if (policy === 'BALANCED') {
      conflicts.push(`Divergence: uncorroborated concern`);
    }
  }

  let commonCause: string | null = null;
  const agentsRequiringReview = findings.filter(f => f.requiresReview).map(f => f.agentName);

  // Simple common cause logic
  const allSuspected = findings.flatMap(f => f.suspectedContributors);
  if (allSuspected.filter(s => s.toLowerCase().includes('power')).length > 1) {
    commonCause = 'Site Power Instability';
  } else if (allSuspected.filter(s => s.toLowerCase().includes('weather') || s.toLowerCase().includes('attenuation')).length > 1) {
    commonCause = 'Severe Weather Attenuation';
  } else if (allSuspected.filter(s => s.toLowerCase().includes('thermal')).length > 1) {
      commonCause = 'Thermal Management Failure';
  }

  let summaryText = 'All site agents reporting nominal behavior. No immediate cross-subsystem correlation required.';
  if (status === 'CRITICAL') {
    summaryText = `CRITICAL STATE: ${concerns.length} agents report escalating issues (${policy}). Council consensus advises immediate operational review.`;
  } else if (status === 'CONCERN') {
    summaryText = `CAUTION: Potential degradation observed by ${concerns.length} advisory agents (${policy}). Monitoring recommended.`;
  }
  
  if (conflicts.length > 0) {
    summaryText += ` Flags: ${conflicts[0]}`;
  }

  return {
    status,
    conflicts,
    commonCause,
    summary: summaryText,
    agentsRequiringReview
  };
}
