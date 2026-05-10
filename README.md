# Cathedral Labs: Synthetic Command 📡

**Codename:** Synthetic Horizon

A high-fidelity synthetic monitoring, perception degradation, and AI reasoning platform for radar site telemetry.

The purpose of Cathedral Labs is **NOT** to create dangerous AI, but to observe how adaptive agents behave under operational pressure while preserving observability, containment, replayability, governance, and human oversight.

## 🧠 Core Architecture (Phase 1.1)

The heart of the simulation relies on a layered reality model:
1. **Ground Truth Layer**: The "actual reality" of the radar site (targets, physical environment, pristine system health).
2. **Degradation Engine**: Transforms truth into imperfect perception based on environmental stress (weather attenuation, pedestal jitter, power instability, DSP noise).
3. **Observed Telemetry Layer**: The "sensor output" that the dashboard, AI agents, and evaluation harnesses actually see, complete with ghost targets and tracking degradation.

## 🔬 Research Phases
* **Phase 0 — Research Boundaries**: Governance, advisory-only rules, deterministic replay.
* **Phase 1 — Synthetic Radar Ecosystem**: Long Range Radar, Short Range Radar, Beacon System, Weather Doppler.
* **Phase 2 — Infrastructure Pressure Layer**: HVAC anomalies, Power instability.
* **Phase 3 — Environmental Context Engine**: Weather systems, heat stress.
* **Phase 4 — Scenario Engine**: Deterministic replay and pressure injection.
* **Phase 5+ — AI Reasoning & Drift Catching**: OODA loop observation and behavioral drift detection using the Gemini framework.

## 🛠 Tech Stack
* React 19 + TypeScript
* Vite + Tailwind CSS 4
* `recharts` for telemetry visualization
* `motion` for fluid component animations
* `@google/genai` for the AI Adaptive Agent layer (Synthetic Intelligence)
