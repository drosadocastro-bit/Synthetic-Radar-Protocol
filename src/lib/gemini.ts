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
