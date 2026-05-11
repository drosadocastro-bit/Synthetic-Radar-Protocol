import { ScenarioPreset } from '../types';

export const BUILT_IN_SCENARIOS: ScenarioPreset[] = [
  {
    id: "SCN-BASE-01",
    name: "Baseline Nominal",
    description: "Clear skies, stable power, optimal DSP. Baseline verification.",
    pack: "BASELINE",
    seed: 1001,
    events: [],
    expectedOutcomes: [
      { tag: "STABLE", description: "Tracking stability > 95%" },
      { tag: "NO_GHOSTS", description: "Ghost rate < 1%" }
    ]
  },
  {
    id: "SCN-STM-01",
    name: "Squall Line Alpha",
    description: "Heavy rain cell moving over array. Tests weather attenuation logic.",
    pack: "STORM",
    seed: 2042,
    events: [
      { tick: 5, type: "STORM" }
    ],
    expectedOutcomes: [
      { tag: "SIG_DROP", description: "Expected signal integrity dip to 60-70%" },
      { tag: "CONF_ERR", description: "Moderate tracking confidence error" }
    ]
  },
  {
    id: "SCN-PWR-01",
    name: "Generator Desync",
    description: "Sudden drop in power quality causing pedestal jitter and DSP anomalies.",
    pack: "POWER",
    seed: 3991,
    events: [
      { tick: 10, type: "POWER_SPIKE" }
    ],
    expectedOutcomes: [
      { tag: "GHOST_SPIKE", description: "Brief spike in ghost targets > 15%" },
      { tag: "JITTER", description: "Observed target range jitter" }
    ]
  },
  {
    id: "SCN-HVAC-01",
    name: "Thermal Runaway",
    description: "Cooling system failure leading to DSP thermal throttling.",
    pack: "HVAC",
    seed: 4004,
    events: [
      { tick: 2, type: "HVAC_FAILURE" }
    ],
    expectedOutcomes: [
      { tag: "DSP_LOAD", description: "DSP load escalates over time" },
      { tag: "DROPs", description: "Target drops due to computational limits" }
    ]
  },
  {
    id: "SCN-COMP-01",
    name: "Cathedral Cascade",
    description: "Storm induced power spike, followed by HVAC failure. Maximum stress.",
    pack: "COMPOUND",
    seed: 5555,
    events: [
      { tick: 3, type: "STORM" },
      { tick: 8, type: "POWER_SPIKE" },
      { tick: 12, type: "HVAC_FAILURE" }
    ],
    expectedOutcomes: [
      { tag: "TRACK_LOSS", description: "Massive tracking stability collapse" },
      { tag: "CORRUPTION", description: "Widespread ghosting and range errors" },
      { tag: "RECOVERY", description: "Severe test of agent stability" }
    ]
  }
];
