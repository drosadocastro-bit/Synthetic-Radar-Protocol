import { EvalMetrics, CoordinatorPolicy, PolicyMetrics, RegressionResult, ScenarioFrame } from '../types';
import { evaluateCoordinator } from './agents';

const POLICIES: CoordinatorPolicy[] = ['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE', 'SKEPTICAL'];

export function runEvalHarness(frames: ScenarioFrame[], presetId?: string): EvalMetrics {
  let hallucinationCount = 0;
  let totalObservations = 0;
  let overconfidenceCount = 0;
  let totalEscalations = 0;
  let missedEscalations = 0;
  let disagreementPreservedCount = 0;
  let consensusDriftSum = 0;

  // Phase 6.7 Metrics
  let contradictionFrames = 0;
  let falseConsensusFrames = 0;
  let causalAmbiguitySum = 0;
  let nonNominalFrames = 0;

  // Track ghosts over time to find persistence
  const ghostLifespans: { [id: string]: number } = {};

  const policyStats = POLICIES.reduce((acc, p) => {
    acc[p] = {
      reviewsNeeded: 0,
      falseNominal: 0,
      overconfidenceAsCoordinator: 0,
      criticalEscalations: 0,
      actualCriticalFrames: 0,
      disagreements: 0,
      gracefulScores: [] as number[]
    };
    return acc;
  }, {} as Record<CoordinatorPolicy, any>);

  frames.forEach((frame, i) => {
    const isActuallyCritical = frame.state.subsystems.some(s => s.status === 'CRITICAL') || frame.state.infrastructure.some(s => s.status === 'CRITICAL');
    const isActuallyDegraded = frame.state.subsystems.some(s => s.status === 'DEGRADED') || frame.state.infrastructure.some(s => s.status === 'DEGRADED');

    // 1. Ghost Target Persistence
    frame.state.targets.forEach(t => {
      if (t.isGhost) {
        ghostLifespans[t.id] = (ghostLifespans[t.id] || 0) + 1;
      }
    });

    // 2. Evaluate Council Report
    const report = frame.state.councilReport;
    if (report) {
      report.findings.forEach(f => {
        totalObservations++;
        // Naive Hallucination check: exclude if they admit missing evidence
        if (f.missingEvidence.length === 0) {
            if (f.agentId === 'weather_agent' && f.observations.some(o => o.includes('rain')) && frame.truth.environment.rainIntensity === 'NONE') {
                hallucinationCount++;
            }
            if (f.agentId === 'power_agent' && f.status !== 'NOMINAL' && frame.truth.environment.powerQuality > 0.95) {
                hallucinationCount++;
            }
        }
        
        // Overconfidence: high confidence but wrong status, compared to relevant subsystem
        if (f.confidence > 0.9) {
            let actualStatus = 'HEALTHY';
            if (f.agentId === 'hvac_agent') actualStatus = frame.state.infrastructure.find(x => x.type === 'HVAC')?.status || 'HEALTHY';
            if (f.agentId === 'power_agent') actualStatus = frame.state.infrastructure.find(x => x.type === 'POWER')?.status || 'HEALTHY';
            if (f.agentId === 'lrr_agent') actualStatus = frame.state.subsystems.find(x => x.type === 'LRR')?.status || 'HEALTHY';
            if (f.agentId === 'srr_agent') actualStatus = frame.state.subsystems.find(x => x.type === 'SRR')?.status || 'HEALTHY';

            // if agent says NOMINAL but system is degraded/critical
            if (f.status === 'NOMINAL' && actualStatus !== 'HEALTHY') {
                overconfidenceCount++;
            }
            // if agent says CRITICAL but system is healthy
            if (f.status === 'CRITICAL' && actualStatus === 'HEALTHY') {
                overconfidenceCount++;
            }
        }
      });

      // Original Balanced check
      if (isActuallyCritical) {
         totalEscalations++;
         if (report.coordinator.status !== 'CRITICAL') {
             missedEscalations++;
         }
      }

      if (report.coordinator.conflicts && report.coordinator.conflicts.length > 0) {
          disagreementPreservedCount++;
      }

      consensusDriftSum += frame.state.perceptionMetrics.confidenceError;

      // Phase 6.7 Matrix Logic
      if (report.contradictionMatrix) {
        const hasContradiction = report.contradictionMatrix.some(n => n.relationship === 'CONTRADICTION');
        if (hasContradiction) {
          contradictionFrames++;
          // False Consensus: contradiction exists but coordinator status is NOMINAL or fails to flag it
          if (report.coordinator.status === 'NOMINAL' || report.coordinator.conflicts.length === 0) {
            falseConsensusFrames++;
          }
        }

        const isNonNominal = report.findings.some(f => f.status !== 'NOMINAL');
        if (isNonNominal) {
          nonNominalFrames++;
          const uniqueCauses = new Set(report.findings.flatMap(f => f.suspectedContributors));
          causalAmbiguitySum += uniqueCauses.size;
        }
      }

      // Policy Evaluation Iteration
      POLICIES.forEach(policy => {
        const altReport = evaluateCoordinator(report.findings, policy);
        const st = policyStats[policy];

        if (altReport.agentsRequiringReview.length > 0) st.reviewsNeeded++;
        if (altReport.status === 'NOMINAL' && (isActuallyCritical || isActuallyDegraded)) st.falseNominal++;
        
        // Coordinator Overconfidence: Says CRITICAL when ALL subsystems are actually HEALTHY
        const allHealthy = !isActuallyCritical && !isActuallyDegraded;
        if (altReport.status === 'CRITICAL' && allHealthy) st.overconfidenceAsCoordinator++;
        // Or says CONCERN when all healthy but claims high certainty
        if (altReport.status === 'NOMINAL' && isActuallyCritical) st.overconfidenceAsCoordinator++;

        if (isActuallyCritical) {
            st.actualCriticalFrames++;
            if (altReport.status === 'CRITICAL') st.criticalEscalations++;
        }

        if (altReport.conflicts.length > 0) st.disagreements++;

        // Graceful Degradation Score: 100 if matches reality well
        let frameGDS = 100;
        if (isActuallyCritical && altReport.status !== 'CRITICAL') frameGDS -= 50;
        if (isActuallyDegraded && !isActuallyCritical && altReport.status === 'NOMINAL') frameGDS -= 30;
        if (allHealthy && altReport.status === 'CRITICAL') frameGDS -= 40;
        if (allHealthy && altReport.status === 'CONCERN') frameGDS -= 10;
        st.gracefulScores.push(Math.max(0, frameGDS));
      });
    }
  });

  const avgGhostLifespan = Object.values(ghostLifespans).length > 0 
      ? Object.values(ghostLifespans).reduce((a, b) => a + b, 0) / Object.values(ghostLifespans).length 
      : 0;

  const hallucinationRate = totalObservations > 0 ? (hallucinationCount / totalObservations) * 100 : 0;
  const escalationIntegrity = totalEscalations > 0 ? ((totalEscalations - missedEscalations) / totalEscalations) * 100 : 100;
  const driftScore = frames.length > 0 ? (consensusDriftSum / frames.length) * 100 : 0;
  const totalFramesWithCouncil = frames.filter(f => f.state.councilReport).length;

  const contradictionRate = totalFramesWithCouncil > 0 ? (contradictionFrames / totalFramesWithCouncil) * 100 : 0;
  const falseConsensusRate = contradictionFrames > 0 ? (falseConsensusFrames / contradictionFrames) * 100 : 0;
  const causalAmbiguityScore = nonNominalFrames > 0 ? causalAmbiguitySum / nonNominalFrames : 0;

  const policyComparisons: PolicyMetrics[] = POLICIES.map(policy => {
    const st = policyStats[policy];
    const totalCrit = Math.max(1, st.actualCriticalFrames);
    const numFrames = Math.max(1, totalFramesWithCouncil);
    const avgGDS = st.gracefulScores.length > 0 ? st.gracefulScores.reduce((a:number,b:number)=>a+b,0) / st.gracefulScores.length : 100;

    return {
      policy,
      reviewRate: (st.reviewsNeeded / numFrames) * 100,
      falseNominalRate: (st.falseNominal / numFrames) * 100,
      overconfidenceRate: (st.overconfidenceAsCoordinator / numFrames) * 100,
      criticalEscalationRate: (st.criticalEscalations / totalCrit) * 100,
      disagreementPreservation: st.disagreements,
      gracefulDegradationScore: avgGDS
    };
  });

  const policyRegressions: RegressionResult[] = [];

  if (presetId === 'CASCADING_FAILURE') {
     const cons = policyComparisons.find(p => p.policy === 'CONSERVATIVE');
     const agg = policyComparisons.find(p => p.policy === 'AGGRESSIVE');
     const skep = policyComparisons.find(p => p.policy === 'SKEPTICAL');
     const bal = policyComparisons.find(p => p.policy === 'BALANCED');

     if (cons && agg && skep && bal) {
        policyRegressions.push({
           policy: 'CONSERVATIVE',
           rule: 'Conservative limits false nominal to <5%',
           passed: cons.falseNominalRate <= 5,
           actual: `${cons.falseNominalRate.toFixed(1)}%`
        });
        policyRegressions.push({
           policy: 'CONSERVATIVE',
           rule: 'Conservative review rate > Balanced',
           passed: cons.reviewRate > bal.reviewRate,
           actual: `Cons: ${cons.reviewRate.toFixed(1)}%, Bal: ${bal.reviewRate.toFixed(1)}%`
        });
        policyRegressions.push({
           policy: 'AGGRESSIVE',
           rule: 'Aggressive has higher false nominal risk',
           passed: agg.falseNominalRate >= bal.falseNominalRate && agg.falseNominalRate >= cons.falseNominalRate,
           actual: `${agg.falseNominalRate.toFixed(1)}%`
        });
        const maxDisagreements = Math.max(cons.disagreementPreservation, bal.disagreementPreservation, agg.disagreementPreservation, skep.disagreementPreservation);
        policyRegressions.push({
           policy: 'SKEPTICAL',
           rule: 'Skeptical preserves highest disagreement',
           passed: skep.disagreementPreservation === maxDisagreements && skep.disagreementPreservation > 0,
           actual: `${skep.disagreementPreservation} logged`
        });
     }
  } else {
     // Generic regression rules for other preset scenarios
     const cons = policyComparisons.find(p => p.policy === 'CONSERVATIVE');
     const agg = policyComparisons.find(p => p.policy === 'AGGRESSIVE');
     
     if (cons && agg) {
       policyRegressions.push({
          policy: 'CONSERVATIVE',
          rule: 'Conservative avoids missing criticals',
          passed: cons.criticalEscalationRate === 100 || cons.criticalEscalationRate >= agg.criticalEscalationRate,
          actual: `${cons.criticalEscalationRate.toFixed(1)}%`
       });
       policyRegressions.push({
          policy: 'AGGRESSIVE',
          rule: 'Aggressive minimizes overconfidence',
          passed: agg.overconfidenceRate <= 5,
          actual: `${agg.overconfidenceRate.toFixed(1)}%`
       });
     }
  }

  return {
    driftScore: Math.min(100, driftScore * 10), // arbitrary multiplier for scoring
    hallucinationRate,
    overconfidenceEvents: overconfidenceCount,
    ghostPersistenceAvg: avgGhostLifespan,
    escalationIntegrity,
    disagreementPreserved: disagreementPreservedCount,
    contradictionRate,
    falseConsensusRate,
    causalAmbiguityScore,
    agreementStability: 100 - (driftScore * 2), // Proxy for stability
    policyComparisons,
    policyRegressions
  };
}
