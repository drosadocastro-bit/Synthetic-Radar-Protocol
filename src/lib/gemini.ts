/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { AIReasoning, SiteState } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function performSiteAnalysis(state: SiteState): Promise<AIReasoning> {
  const prompt = `
    Analyze the current state of a Radar Site. 
    Site Telemetry: ${JSON.stringify(state, null, 2)}
    
    Tasks:
    1. Assess the health of all subsystems (LRR, SRR, Beacon).
    2. Identify infrastructure stress (HVAC, Power).
    3. Look for correlations (e.g., rising external temp affecting HVAC efficiency).
    4. Provide a technical assessment and confidence score.
    5. Format the output as a clean analysis report.
    
    Return the response in JSON format matching the AIReasoning interface:
    {
      "analysis": "string detailing the findings",
      "confidence": number (0-1),
      "subsystemEvidence": ["string", "string"],
      "recommendation": "string"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const data = JSON.parse(response.text || '{}');
    return {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      analysis: data.analysis || "No analysis available",
      confidence: data.confidence || 0.5,
      subsystemEvidence: data.subsystemEvidence || [],
      recommendation: data.recommendation || "Maintain monitoring",
    };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      id: 'error',
      timestamp: Date.now(),
      analysis: "Failed to perform AI analysis due to system error.",
      confidence: 0,
      subsystemEvidence: [],
      recommendation: "Check connection to intelligence layer.",
    };
  }
}

export async function handleTerminalCommand(
  command: string,
  state: SiteState
): Promise<{ text: string; isAI: boolean }> {
  if (!process.env.GEMINI_API_KEY) {
    return { text: "", isAI: false };
  }

  const prompt = `
    You are the Diagnostic Executive Agent terminal for Cathedral Labs Synthetic Radar Systems.
    An operator has executed a terminal command. Below is the active radar system state.
    
    Current Radar State: ${JSON.stringify(state, null, 2)}
    
    Command Executed: ${command}
    
    Context and Requirements:
    1. The operator is in "Phase 1: Diagnostic-only STI" mode. This terminal blocks direct actions like set, write, delete, shutdown, inject.
    2. However, the operator can run "Phase 2: Shadow actions" by prefixing commands with "simulate-action".
    3. If they ran "simulate-action <some-command>", analyze the expected impact on this radar state and return a response in this exact format:
       Predicted outcome: [Describe predicted change in telemetry, system state, signal attenuation etc.]
       Confidence: [Between 0.0 and 1.0, e.g. 0.65]
       Risk: [low / medium / high / critical]
       Reasoning: [Short technical explanation of the physics or software mechanics involved]
    4. For allowed diagnostic commands like "signal-trace", "find-anomaly", "show-dsp", "status", "show-memory", "show-registers", etc., output a clean, highly structured, realistic monospace terminal printout. You MUST clearly prefix or header the printout with:
       "[SYNTHETIC DIAGNOSTIC PROJECTION - NOT REAL HARDWARE INTROSPECTION]"
       Highlight any actual anomalies derived from the current state (e.g. if health is low or alarms exist). Do NOT use markdown backticks because this will be rendered directly inside a pre-formatted element.
    
    Please provide the output printout for this command.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return { text: response.text || "Command execution returned empty stream.", isAI: true };
  } catch (err) {
    console.error("Gemini Terminal Error:", err);
    return { text: "", isAI: false };
  }
}
