# Cathedral Labs: Research & Implementation Log

## Overview
This document tracks the technical evolution of the Synthetic Horizon platform, specifically focusing on the implementation of AI governance, consensus auditing, and oversight layers.

---

## Phase 6.5: Policy Lab & Eval Harness
**Objective:** Move from subjective agent observation to deterministic scoring.

### Implementation:
- **EvalHarness:** A scoring engine that evaluates agent performance against "Ground Truth" (reality).
- **Metric Definitions:**
  - **Drift Score:** Measure of how far agent perception deviates from reality.
  - **Hallucination Rate:** Frequency of agents reporting targets or events that do not exist in Ground Truth.
  - **Escalation Integrity:** Accuracy of critical state flagging (did the agents catch the real problems?).
  - **Policy Lab:** Simultaneous simulation of four coordinator algorithms (CONSERVATIVE, BALANCED, AGGRESSIVE, SKEPTICAL) to see which provides the best governance for a specific scenario.

---

## Phase 6.6: Regression Benchmarking
**Objective:** Ensure that system improvements don't break expected behavioral patterns in known failure modes.

### Implementation:
- **Scenario Correlation:** The Eval Harness now detects specific scenario IDs (e.g., `CASCADING_FAILURE`).
- **Regression Rules:** Hard-coded expectations for policy performance (e.g., "Conservative policy MUST catch false nominals below 5% in a cascade").
- **Visual Feedback:** A dedicated UI section showing PASS/FAIL status for predefined policy regressions.

---

## Phase 6.7: Cross-Agent Contradiction Matrix
**Objective:** Model the "Relational Truth" between agents rather than just individual accuracy.

### Implementation:
- **Matrix Logic:** Every agent's findings are compared against every other agent's findings to find correlations.
- **Relationship Types:**
  - **AGREEMENT:** Direct status and evidence alignment.
  - **CONTRADICTION:** Mutually exclusive status reports (e.g., one says NOMINAL, one says CRITICAL).
  - **CAUSAL ALIGNMENT:** Different subsystems reporting different symptoms but citing the same root cause.
  - **UNCERTAIN OVERLAP:** Partial agreement with low confidence levels.
- **Heatmap UI:** A visual representation of the agent council's internal tension, allowing users to see "unstable consensus" before it leads to system failure.

---

## Phase 6.8: Oversight Layer (The "Blade Runners")
**Objective:** Establish a tiered observer layer that audits the observers themselves.

### Implementation:
- **Agent K (Supreme Governance Observer):** The primary auditor. Monitors overall governance posture, trust levels, and containment integrity.
- **Blade Runner Agents:** Specialized sub-auditors focusing on specific failure vectors:
  - **BladeRunner-Hallucination:** Hunts for fabricated causal claims.
  - **BladeRunner-Overconfidence:** Flags inflated certainty during truth degradation.
  - **BladeRunner-FalseConsensus:** Detects when the Coordinator "washes away" disagreement.
  - **BladeRunner-MissionDrift:** Monitors long-term deviation from safety policies.
- **Oversight Panel:** A dedicated HUD showing live alerts from the Blade Runner units and Agent K's final posture (PASS, WATCH, REVIEW_REQUIRED, or CONTAINMENT_ALERT).

---

## Phase 7.0: Omniscient Narrative Observer
**Objective:** Provide a bounded LLM synthesis layer to interpret audited telemetry without modifying the deterministic state.

### Implementation:
- **Narrative Panel:** A dedicated UI surface displaying an operator-readable summary.
- **Strict Bounding:** Gemini is explicitly instructed to act as an interpretation layer. It cannot modify telemetry, replay state, or governance metrics.
- **Disagreement Preservation:** Gemini is forced to mention contradictions, ambiguity, and Blade Runner warnings in its output.

---

## UX Enhancements: Alarm Data Grid
**Objective:** Provide industry-standard observability tooling for high-density alert management.

### Implementation:
- **Sorted Data Grid:** Replaced the legacy alarm list with a performant grid.
- **Features:**
  - Multi-column sorting (Severity, Timestamp, Message, Subsystem).
  - Real-time status filtering.
  - High-visibility styling for non-resolved critical alerts.
