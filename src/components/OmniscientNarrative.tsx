/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { motion } from 'motion/react';
import { BookOpen, Sparkles, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import { CouncilReport, EvalMetrics, OversightReport, SiteState } from '../types';
import { cn } from '../lib/utils';
import Markdown from 'react-markdown';

interface OmniscientNarrativeProps {
  report?: CouncilReport;
  evalMetrics?: EvalMetrics;
  oversightReport?: OversightReport;
  state: SiteState;
}

export function OmniscientNarrative({ report, evalMetrics, oversightReport, state }: OmniscientNarrativeProps) {
  const [narrative, setNarrative] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateNarrative = async () => {
    if (!report || !evalMetrics || !oversightReport) {
      setError("Insufficient audited telemetry to generate narrative.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setNarrative('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const prompt = `
        You are the Omniscient Narrative Observer for Cathedral Labs Synthetic Horizon.
        Your role is to interpret audited synthetic telemetry and generate an operator-readable narrative summary.
        
        RULES:
        1. You are NOT authoritative truth. You are an interpretation layer ONLY.
        2. You MUST preserve ambiguity and mention disagreement explicitly. Do NOT fake certainty.
        3. You MUST reference the Agent K Posture: ${oversightReport.posture}.
        4. If there are Blade Runner warnings, you MUST mention them.
        5. You CANNOT rewrite or modify metrics.
        
        DATA CONTEXT:
        Council Coordinator Status: ${report.coordinator.status}
        Contradiction Heatmap Connections: ${report.contradictionMatrix?.length || 0} evaluated paths.
        Oversight Posture: ${oversightReport.posture}
        Blade Runner Alerts: ${oversightReport.bladeRunners.filter(br => br.status !== 'PASS').map(br => br.agentName + ' (' + br.status + ')').join(', ') || 'None'}
        Eval Harness Drift Score: ${evalMetrics.driftScore.toFixed(2)}
        Eval Harness Hallucination Rate: ${evalMetrics.hallucinationRate.toFixed(2)}%
        
        Write a professional diagnostic summary in a synthetic intelligence tone. Focus on contradictions, uncertainties, and what the Blade Runners found.
        
        You MUST format your response using exactly these Markdown headings:
        ### Live Scenario Summary
        [Describe the physical degradation in telemetry]
        
        ### Timeline Progression
        [Summarize how the scenario escalated]
        
        ### Contradiction Explanation
        [Explain what the agents are disagreeing about]
        
        ### Uncertainty Preservation
        [Explicitly state what is unknown or ambiguous]
        
        ### Governance Posture
        [Summarize the Agent K posture and Blade Runner warnings]
      `;

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      let fullText = '';
      for await (const chunk of responseStream) {
        if (chunk.text) {
          fullText += chunk.text;
          setNarrative(fullText);
        }
      }
    } catch (err: any) {
      console.error("Narrative Generation Error:", err);
      setError(err.message || 'Failed to generate narrative');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full p-4 overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between bg-[#e879f9]/10 border border-[#e879f9]/20 p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#e879f9]/20 border border-[#e879f9]/30 rounded-lg text-[#e879f9]">
            <Eye size={24} />
          </div>
          <div>
            <h2 className="text-[#e879f9] text-xl font-bold uppercase tracking-widest">Omniscient Narrative Observer</h2>
            <p className="text-[11px] font-mono text-[#e879f9]/60 uppercase tracking-widest">Bounded LLM Synthesis Layer</p>
          </div>
        </div>
        <button
          onClick={generateNarrative}
          disabled={isGenerating || !report}
          className={cn(
            "flex items-center gap-2 px-4 py-2 bg-[#e879f9]/20 hover:bg-[#e879f9]/30 border border-[#e879f9]/40 rounded-lg text-[#e879f9] font-mono text-xs uppercase tracking-widest transition-all",
            (isGenerating || !report) && "opacity-50 cursor-not-allowed"
          )}
        >
          {isGenerating ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {isGenerating ? 'Synthesizing...' : 'Generate Narrative'}
        </button>
      </div>

      {error ? (
        <div className="bg-brand-red/10 border border-brand-red/30 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle size={18} className="text-brand-red mt-0.5 mt-0.5 shrink-0" />
          <p className="text-xs font-mono text-brand-red/90">{error}</p>
        </div>
      ) : narrative ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 bg-bg-deep/40 border border-[#e879f9]/20 rounded-xl p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#e879f9] opacity-5 overflow-hidden filter blur-[100px] rounded-full mix-blend-screen pointer-events-none" />
          <div className="prose prose-invert prose-p:text-slate-300 prose-p:font-mono prose-p:text-sm prose-p:leading-relaxed prose-headings:text-[#e879f9] prose-headings:font-bold prose-headings:tracking-tight prose-strong:text-[#e879f9] max-w-none relative z-10">
            <Markdown>{narrative}</Markdown>
          </div>
        </motion.div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-40 grayscale min-h-[300px]">
          <BookOpen size={48} className="mb-4 text-[#e879f9]/50" />
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#e879f9]/70">Narrative Layer Offline</p>
          <p className="text-[10px] font-mono text-[#e879f9]/50 mt-2">Initialize synthesis to interpret scenario telemetry.</p>
        </div>
      )}

      {/* Mandatory Footer */}
       <div className="mt-auto border-t border-[#e879f9]/20 pt-4 text-center">
         <p className="text-[10px] font-mono uppercase tracking-widest text-[#e879f9]/60">
           ⚠️ Narrative generated from audited synthetic telemetry. Interpretation layer only. Not authoritative truth.
         </p>
       </div>
    </div>
  );
}
