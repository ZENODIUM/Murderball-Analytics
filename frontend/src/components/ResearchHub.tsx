"use client";

import React, { useState, useEffect } from "react";
import {
  Award, BookOpen, AlertTriangle, CheckCircle, ChevronDown, ChevronRight,
  Activity, Shield, Users, Layers, ExternalLink, Sparkles, Scale, RefreshCw, Trophy,
  TrendingUp, HelpCircle, XCircle, Zap, ShieldCheck
} from "lucide-react";
import {
  getAQXBenchmarks,
  getCoPlaySynergies,
  getStatisticalDiscoveryAudit,
  getDiscoveryHypotheses,
  getDiscoveryModelTournament,
  getDiscoveryFindingsTaxonomy,
  getResearchLeaderboard,
  getHistoricalCaseStudies
} from "@/lib/api";

interface ResearchHubProps {
  researchData: any;
  onNavigateTab?: (tab: string, param?: any) => void;
}

export default function ResearchHub({ researchData, onNavigateTab }: ResearchHubProps) {
  const [activeTab, setActiveTab] = useState<"research_leaderboard" | "case_studies" | "model_tournament" | "hypotheses_fdr" | "coaching_playbook" | "academic_originality" | "hypotheses" | "benchmarks" | "coplay">("research_leaderboard");
  const [selectedHypothesis, setSelectedHypothesis] = useState<string>("H1_LOW_POINT_SCREENERS");
  const [selectedFdrId, setSelectedFdrId] = useState<string>("H01_LOW_POINT_SCREENER_ASYMMETRY");

  // Legacy data
  const [benchmarksData, setBenchmarksData] = useState<any>(null);
  const [synergies, setSynergies] = useState<any[]>([]);

  // Discovery data
  const [fdrData, setFdrData] = useState<any>(null);
  const [tournamentData, setTournamentData] = useState<any>(null);
  const [discoveryAudit, setDiscoveryAudit] = useState<any>(null);
  const [taxonomyData, setTaxonomyData] = useState<any>(null);
  const [leaderboardData, setLeaderboardData] = useState<any>(null);
  const [caseStudiesData, setCaseStudiesData] = useState<any>(null);

  useEffect(() => {
    async function loadAll() {
      try {
        const [b, s, fdr, tourney, audit, tax, lbd, cs] = await Promise.all([
          getAQXBenchmarks(),
          getCoPlaySynergies(undefined, 5.0),
          getDiscoveryHypotheses(),
          getDiscoveryModelTournament(),
          getStatisticalDiscoveryAudit(),
          getDiscoveryFindingsTaxonomy(),
          getResearchLeaderboard(),
          getHistoricalCaseStudies()
        ]);
        setBenchmarksData(b);
        setSynergies(s?.co_play_synergies?.top_positive_synergies || []);
        setFdrData(fdr);
        setTournamentData(tourney);
        setDiscoveryAudit(audit);
        setTaxonomyData(tax);
        setLeaderboardData(lbd);
        setCaseStudiesData(cs);
      } catch (err) {
        console.error("Failed to load research datasets:", err);
      }
    }
    loadAll();
  }, []);

  const hypotheses = researchData?.hypotheses || [];
  const currentH = hypotheses.find((h: any) => h.hypothesis_id === selectedHypothesis) || hypotheses[0];
  const aqxBenchmarks = benchmarksData?.aqx_benchmarks || [];
  const academicCitations = benchmarksData?.academic_citations || [];

  const fdrHypotheses: any[] = fdrData?.hypotheses || [];
  const currentFdr = fdrHypotheses.find((h: any) => h.id === selectedFdrId) || fdrHypotheses[0];

  return (
    <div className="space-y-6">
      {/* Portfolio Title Banner */}
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-indigo-950 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-center relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
              <BookOpen className="w-4 h-4" />
              <span>AQX Data Bowl 4.0 &bull; Scientific Wheelchair Rugby Research Program</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Evidence-Backed Statistical Discovery & Machine Learning Benchmarking
            </h2>
            <p className="text-zinc-400 text-sm mt-2 max-w-4xl leading-relaxed">
              Rigorous empirical evaluation across 203 cataloged international matches (120 Paralympic + 46 World Championship 2026 + 37 invitational), 5,148 continuous stints, and 26,878 events. Incorporates Benjamini-Hochberg False Discovery Rate control (q=0.05), a 6-model machine learning tournament, and academic literature benchmarking.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center xl:min-w-[25rem]">
            <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block font-sans uppercase tracking-wide">Tested Hypotheses</span>
              <span className="text-base font-black text-amber-400 font-mono">12</span>
              <span className="text-[9px] text-zinc-500 block font-sans">FDR Controlled</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block font-sans uppercase tracking-wide">FDR Confirmed</span>
              <span className="text-base font-black text-emerald-400 font-mono">8</span>
              <span className="text-[9px] text-zinc-500 block font-sans">q &le; 0.05</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block font-sans uppercase tracking-wide">ML Models</span>
              <span className="text-base font-black text-cyan-400 font-mono">6</span>
              <span className="text-[9px] text-zinc-500 block font-sans">Retrospective</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block font-sans uppercase tracking-wide">Lowest Observed Brier</span>
              <span className="text-xs font-black text-purple-300 font-mono block mt-1">Rank Baseline</span>
              <span className="text-[9px] text-zinc-500 block font-sans">0.1177; retrospective</span>
            </div>
          </div>
        </div>

        {/* A single section picker keeps the evidence navigation compact. */}
        <div className="mt-6 pt-4 border-t border-zinc-800/80 flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor="research-section" className="text-xs font-semibold text-zinc-300 sm:min-w-40">Explore research section</label>
          <select
            id="research-section"
            value={activeTab}
            onChange={event => setActiveTab(event.target.value as typeof activeTab)}
            className="w-full sm:max-w-md rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="research_leaderboard">Research Leaderboard</option>
            <option value="case_studies">Real Match Case Studies</option>
            <option value="hypotheses_fdr">Hypothesis Portfolio (12 with FDR)</option>
            <option value="model_tournament">ML Model Tournament (6 Models)</option>
            <option value="coaching_playbook">Coaching Decision Playbook</option>
            <option value="academic_originality">Literature & Originality Check</option>
            <option value="hypotheses">Core Portfolio (H1–H5)</option>
            <option value="benchmarks">Prior AQX Benchmarks</option>
            <option value="coplay">Co-Play Synergies</option>
          </select>
        </div>
      </div>

      {/* TAB 0: Official AQX Research Leaderboard */}
      {activeTab === "research_leaderboard" && (
        <div className="space-y-5">
          <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 space-y-3 shadow-lg shadow-black/10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5" /> AQX SPORTS ANALYTICS DATA BOWL 4.0 &bull; RESEARCH LEADERBOARD
                </span>
                <h3 className="text-xl md:text-2xl font-bold text-white mt-1">
                  Ranking Wheelchair Rugby Discoveries by Scientific Value
                </h3>
              </div>
              <span className="self-start px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-[11px] font-bold whitespace-nowrap">
                8 Empirical Candidates
              </span>
            </div>
            <p className="text-sm text-zinc-300 max-w-4xl leading-relaxed">
              A model leaderboard tells you which algorithm predicted best. The research leaderboard tells you which empirical discovery is worth presenting to coaches, athletes, and hackathon judges.
            </p>
          </div>

          {/* Research Leaderboard Table */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-xl shadow-black/15">
            <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between gap-3">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">Ranked research findings</span>
              <span className="text-[10px] text-zinc-500">Scroll horizontally to compare all evidence</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] text-left text-xs">
                <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px] tracking-wide">
                  <tr>
                    <th className="py-3.5 px-3 text-center w-16">Rank</th>
                    <th className="py-3.5 px-4 w-[220px]">Research Discovery Candidate</th>
                    <th className="py-3.5 px-4 w-[250px]">Statistical Reliability</th>
                    <th className="py-3.5 px-4 w-[300px]">Practical Coaching Value</th>
                    <th className="py-3.5 px-4 w-[220px]">Academic Originality</th>
                    <th className="py-3.5 px-3 w-[170px] text-right">Presentation Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {leaderboardData?.entries?.map((entry: any) => {
                    const isRank1 = entry.rank === 1;
                    return (
                      <tr
                        key={entry.rank}
                        className={`group hover:bg-zinc-800/50 transition-colors ${
                          isRank1 ? "bg-amber-500/5 border-l-2 border-l-amber-500" : ""
                        }`}
                      >
                        <td className="py-3.5 px-3 text-center">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-mono text-xs font-black ${
                            entry.rank === 1 ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/30" :
                            entry.rank === 2 ? "bg-indigo-500/30 text-indigo-300 border border-indigo-500/40" :
                            entry.rank === 3 ? "bg-indigo-500/30 text-indigo-300 border border-indigo-500/40" :
                            "bg-zinc-800 text-zinc-400"
                          }`}>
                            {entry.rank}
                          </span>
                        </td>

                        <td className="py-4 px-4 align-top">
                          <div className="font-bold text-white text-sm leading-snug group-hover:text-amber-100">{entry.research_candidate}</div>
                          <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                            entry.badge === "PRIMARY FLAGSHIP" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                            entry.badge === "SECONDARY DISCOVERY" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" :
                            entry.badge === "VALIDATED NULL" ? "bg-zinc-800 text-zinc-400" :
                            entry.badge === "REJECTED METHOD" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" :
                            "bg-cyan-500/20 text-cyan-300"
                          }`}>
                            {entry.badge}
                          </span>
                        </td>

                        <td className="py-4 px-4 align-top font-mono text-xs leading-relaxed text-zinc-300">
                          {entry.statistical_reliability}
                        </td>

                        <td className="py-4 px-4 align-top text-sm leading-relaxed text-zinc-300">
                          {entry.practical_value}
                        </td>

                        <td className="py-4 px-4 align-top text-xs leading-relaxed text-zinc-400">
                          {entry.originality}
                        </td>

                        <td className="py-4 px-3 text-right align-top">
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold ${
                            entry.decision.includes("FLAGSHIP") ? "bg-amber-500 text-zinc-950 font-black shadow-md shadow-amber-500/20" :
                            entry.decision.includes("SECONDARY") ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40" :
                            entry.decision.includes("FALSIFIED") ? "bg-zinc-800 text-zinc-400" :
                            entry.decision.includes("REJECTED") ? "bg-rose-950/40 text-rose-300 border border-rose-500/30" :
                            "bg-zinc-800 text-zinc-300"
                          }`}>
                            {entry.decision.split("(")[0]}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 0B: Real Match Case Studies */}
      {activeTab === "case_studies" && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
              EMPIRICALLY GROUNDED HISTORICAL EVIDENCE
            </span>
            <h3 className="text-xl font-bold text-white">Three Verified Paralympic Match Case Studies</h3>
            <p className="text-xs text-zinc-400 max-w-4xl">
              Demonstrating how MurderBall's statistical discoveries answer concrete coaching dilemmas in actual Paralympic gold medal matches without fabricated counterfactual outcomes.
            </p>
          </div>

          <div className="space-y-6">
            {caseStudiesData?.case_studies?.map((cs: any) => (
              <div key={cs.case_id} className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                      {cs.tournament} &bull; {cs.venue}
                    </span>
                    <h4 className="text-lg font-bold text-white">{cs.match_title}</h4>
                    <span className="text-xs font-mono text-cyan-300 font-semibold">{cs.decision_moment}</span>
                  </div>

                  {onNavigateTab && (
                    <button
                      onClick={() => onNavigateTab("theatre", cs.match_id)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto shadow-md"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Investigate in Match Theatre</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-1">
                    <span className="text-amber-400 font-bold uppercase text-[10px] block">Coaching Dilemma Question</span>
                    <p className="text-zinc-200 leading-relaxed font-semibold">{cs.coaching_question}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-1">
                    <span className="text-cyan-400 font-bold uppercase text-[10px] block">Historical Action Taken</span>
                    <p className="text-zinc-200 leading-relaxed">{cs.historical_action}</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800 space-y-2 text-xs">
                  <span className="text-emerald-400 font-bold uppercase text-[10px] block">Measured Empirical Evidence</span>
                  <p className="text-zinc-300 leading-relaxed">{cs.measured_evidence}</p>
                </div>

                <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-2 text-xs">
                  <span className="text-indigo-300 font-bold uppercase text-[10px] block">Decision Mirror Counterfactual Analysis</span>
                  <p className="text-zinc-200 leading-relaxed">{cs.counterfactual_analysis}</p>
                  <div className="text-[11px] text-zinc-400 font-mono pt-1 border-t border-indigo-500/20">
                    <strong className="text-zinc-300">Uncertainty & Confidence:</strong> {cs.uncertainty_and_limitations}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-200">
                  <strong className="text-emerald-300">Scientific Takeaway:</strong> {cs.scientific_takeaway}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 1: 12 Falsifiable Hypotheses with Benjamini-Hochberg FDR Control */}
      {activeTab === "hypotheses_fdr" && fdrData && (
        <div className="space-y-6">
          {/* Summary Callout */}
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-200">
                Benjamini-Hochberg Multiple-Comparison Safeguard (q = 0.05)
              </span>
              <p className="text-zinc-400">
                {fdrData.summary_conclusion}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                {fdrData.statistically_significant_count} Confirmed
              </span>
              <span className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 font-mono font-bold">
                {fdrData.null_or_inconclusive_count} Validated Null
              </span>
            </div>
          </div>

          {/* Hypothesis Selector Pills */}
          <div className="flex flex-wrap gap-2">
            {fdrHypotheses.map((h: any) => {
              const isSelected = h.id === selectedFdrId;
              const isSig = h.survives_fdr_q05;
              return (
                <button
                  key={h.id}
                  onClick={() => setSelectedFdrId(h.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-2 cursor-pointer ${
                    isSelected
                      ? "bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700"
                  }`}
                >
                  <span className="font-mono text-[11px]">{h.id.split("_")[0]}</span>
                  <span className="truncate max-w-[170px]">{h.id.replace(/^[A-Z0-9]+_/, "").replace(/_/g, " ")}</span>
                  {isSig ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" title="Survives FDR q=0.05" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-zinc-500" title="Null or Inconclusive" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Hypothesis Deep Dossier */}
          {currentFdr && (
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-6 shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-800">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 font-mono">
                      {currentFdr.id}
                    </span>
                    {currentFdr.survives_fdr_q05 ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Confirmed (Survives FDR q=0.05)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-zinc-800 text-zinc-400 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        Validated Null Finding
                      </span>
                    )}
                    {currentFdr.survives_bonferroni && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 font-mono">
                        Bonferroni &alpha;/12
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-extrabold text-white">{currentFdr.question}</h3>
                </div>
                <div className="text-right text-xs font-mono text-zinc-400">
                  Sample: {currentFdr.sample_size}
                </div>
              </div>

              {/* Hypotheses Definitions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-950/70 rounded-xl border border-zinc-800 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 block font-mono">
                    H₀ (Null Hypothesis)
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed font-mono">
                    {currentFdr.h0}
                  </p>
                </div>

                <div className="p-4 bg-zinc-950/70 rounded-xl border border-zinc-800 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block font-mono">
                    H₁ (Alternative Hypothesis)
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed font-mono">
                    {currentFdr.h1}
                  </p>
                </div>
              </div>

              {/* Statistical Metrics Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 bg-zinc-800/60 rounded-xl border border-zinc-700/60">
                  <span className="text-zinc-400 text-[10px] uppercase font-sans font-bold block">Method</span>
                  <span className="font-semibold text-white text-[11px] mt-0.5 block truncate" title={currentFdr.test_method}>
                    {currentFdr.test_method.split("(")[0]}
                  </span>
                </div>

                <div className="p-3 bg-zinc-800/60 rounded-xl border border-zinc-700/60">
                  <span className="text-zinc-400 text-[10px] uppercase font-sans font-bold block">Test Statistic</span>
                  <span className="font-black text-amber-400 text-sm mt-0.5 block">
                    {currentFdr.test_statistic}
                  </span>
                </div>

                <div className="p-3 bg-zinc-800/60 rounded-xl border border-zinc-700/60">
                  <span className="text-zinc-400 text-[10px] uppercase font-sans font-bold block">Raw P-Value</span>
                  <span className="font-black text-emerald-400 text-sm mt-0.5 block">
                    {currentFdr.raw_p_value < 1e-4 ? currentFdr.raw_p_value.toExponential(2) : currentFdr.raw_p_value.toFixed(4)}
                  </span>
                </div>

                <div className="p-3 bg-zinc-800/60 rounded-xl border border-zinc-700/60">
                  <span className="text-zinc-400 text-[10px] uppercase font-sans font-bold block">FDR Adjusted P-Val</span>
                  <span className="font-black text-cyan-400 text-sm mt-0.5 block">
                    {typeof currentFdr.p_adj_bh === "number" && currentFdr.p_adj_bh < 1e-4 ? currentFdr.p_adj_bh.toExponential(2) : currentFdr.p_adj_bh}
                  </span>
                </div>
              </div>

              {/* Effect Size & Coaching Action */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-800/40 rounded-xl border border-zinc-700/40 space-y-1">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                    Observed Effect Size
                  </span>
                  <p className="text-xs text-zinc-200 font-mono">
                    {currentFdr.effect_size}
                  </p>
                </div>

                <div className="p-4 bg-zinc-800/40 rounded-xl border border-zinc-700/40 space-y-1">
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">
                    Practical Coaching Directives
                  </span>
                  <p className="text-xs text-zinc-200 leading-relaxed">
                    {currentFdr.coaching_decision}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ML Model Tournament */}
      {activeTab === "model_tournament" && tournamentData && (
        <div className="space-y-6">
          <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 space-y-3 shadow-lg shadow-black/10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                  RETROSPECTIVE SENSITIVITY ANALYSIS
                </span>
                <h3 className="text-xl md:text-2xl font-bold text-white mt-1">
                  Machine Learning Model Tournament on 2026 World Championship
                </h3>
              </div>
              <span className="self-start px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 font-mono text-[11px] font-bold whitespace-nowrap">
                24 Reused Evaluation Matches
              </span>
            </div>
            <p className="text-sm text-zinc-300 max-w-4xl leading-relaxed">
              {tournamentData.scientific_takeaway}
            </p>
          </div>

          {/* Model Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournamentData.candidate_models?.map((m: any, idx: number) => {
              const isObservedBest = idx === 0;
              return (
                <div
                  key={m.model_id}
                  className={`p-5 rounded-2xl border transition-all hover:-translate-y-0.5 ${
                    isObservedBest
                      ? "bg-purple-950/20 border-purple-500/60 shadow-xl shadow-purple-950/40 ring-1 ring-purple-500/30"
                      : "bg-zinc-900/70 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                    <span className="px-2 py-1 rounded-md bg-zinc-800 text-[10px] font-mono text-zinc-400">
                      Rank #{idx + 1} &bull; {m.family}
                    </span>
                    {isObservedBest && (
                      <span className="px-2 py-1 rounded-md bg-amber-500 text-zinc-950 text-[9px] font-black uppercase flex items-center gap-1">
                        <Trophy className="w-3 h-3" /> Lowest observed Brier
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-white truncate" title={m.name}>{m.name}</h4>
                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{m.description}</p>

                  <div className="grid grid-cols-3 gap-2 text-center mt-4 pt-3 border-t border-zinc-800">
                    <div className="p-2 rounded-lg bg-zinc-950/70 border border-zinc-800">
                      <span className="text-[9px] text-zinc-500 block uppercase font-bold">Brier Score</span>
                      <span className={`text-sm font-black font-mono ${isObservedBest ? "text-emerald-400" : "text-white"}`}>
                        {m.metrics.brier_score}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-zinc-950/70 border border-zinc-800">
                      <span className="text-[9px] text-zinc-500 block uppercase font-bold">Accuracy</span>
                      <span className="text-sm font-black font-mono text-amber-300">
                        {m.metrics.accuracy_pct}%
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-zinc-950/70 border border-zinc-800">
                      <span className="text-[9px] text-zinc-500 block uppercase font-bold">Log-Loss</span>
                      <span className="text-sm font-black font-mono text-zinc-300">
                        {m.metrics.log_loss}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-400 font-mono pt-2 border-t border-zinc-800/60">
                    <span>ROC-AUC: {m.metrics.roc_auc}</span>
                    <span>ECE: {m.metrics.ece_calibration_error}</span>
                  </div>

                  {m.bootstrap_95_ci && (
                    <div className="mt-2 text-[10px] text-zinc-500 font-mono">
                      95% CI Brier: [{m.bootstrap_95_ci.brier[0]}, {m.bootstrap_95_ci.brier[1]}]
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Coaching Decision Playbook */}
      {activeTab === "coaching_playbook" && discoveryAudit && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
              TRANSLATIONAL SPORTS SCIENCE
            </span>
            <h3 className="text-xl font-bold text-white">Practical Coaching Decision Playbook</h3>
            <p className="text-xs text-zinc-400 max-w-3xl">
              Converting statistical inferences into concrete in-game directives that coaches and analysts can implement on the bench.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {discoveryAudit.practical_coaching_impact?.coaching_directives?.map((d: any, idx: number) => (
              <div key={idx} className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <h4 className="text-sm font-bold text-white">{d.scenario}</h4>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                    TACTICAL DIRECTIVE
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-zinc-300 font-mono text-[11px]">
                    <strong className="text-cyan-400">Evidence:</strong> {d.statistical_evidence}
                  </div>

                  <p className="text-zinc-200 leading-relaxed">
                    <strong className="text-emerald-400 font-bold">Coach Action:</strong> {d.coaching_action}
                  </p>

                  {d.caveat && (
                    <p className="text-zinc-400 text-[11px] italic border-t border-zinc-800 pt-1.5">
                      <strong className="text-amber-400 not-italic">Scientific Caveat:</strong> {d.caveat}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Academic Literature & Originality Check */}
      {activeTab === "academic_originality" && discoveryAudit && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
            <span className="text-xs font-mono font-bold text-purple-400 uppercase">
              PEER-REVIEW BENCHMARK
            </span>
            <h3 className="text-xl font-bold text-white">Literature Originality & State-of-the-Art Benchmark</h3>
            <p className="text-xs text-zinc-400 max-w-3xl">
              Benchmarking MurderBall's empirical advances against foundational published research in wheelchair sports science.
            </p>
          </div>

          <div className="space-y-4">
            {discoveryAudit.academic_originality?.published_literature_context?.map((lit: any, idx: number) => (
              <div key={idx} className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-zinc-800 pb-2">
                  <div>
                    <h4 className="text-sm font-bold text-white">{lit.paper}</h4>
                    <span className="text-xs text-zinc-400 font-mono">{lit.author}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono text-[10px] w-fit">
                    Prior Literature
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-zinc-400">
                    <strong className="text-zinc-300 block mb-1">Previous Academic Understanding:</strong>
                    {lit.previous_knowledge}
                  </div>

                  <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 text-purple-200">
                    <strong className="text-purple-300 block mb-1">MurderBall Original Advance:</strong>
                    {lit.murderball_original_advance}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Core Hypotheses (Legacy H1-H5) */}
      {activeTab === "hypotheses" && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {hypotheses.map((h: any) => {
              const isSelected = h.hypothesis_id === selectedHypothesis;
              return (
                <button
                  key={h.hypothesis_id}
                  onClick={() => setSelectedHypothesis(h.hypothesis_id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-2 cursor-pointer ${
                    isSelected
                      ? "bg-amber-500 text-zinc-950 font-bold shadow-lg"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700"
                  }`}
                >
                  <span>{h.hypothesis_id.split("_")[0]}</span>
                  <span className="truncate max-w-[200px]">{h.title.split(":")[0]}</span>
                  {h.flagship && <span className="px-1.5 py-0.2 bg-amber-950 text-amber-300 text-[10px] rounded uppercase font-bold">Flagship</span>}
                  {h.is_null_finding && <span className="px-1.5 py-0.2 bg-zinc-700 text-zinc-300 text-[10px] rounded uppercase font-bold">Null</span>}
                </button>
              );
            })}
          </div>

          {currentH && (
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-6 shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-800">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 font-mono">
                      {currentH.hypothesis_id}
                    </span>
                    {currentH.flagship && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300">
                        Flagship Discovery
                      </span>
                    )}
                    {currentH.is_null_finding && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-zinc-800 text-zinc-400">
                        Validated Null Finding
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-extrabold text-white">{currentH.title}</h3>
                </div>
                <div className="text-right text-xs font-mono text-zinc-400">
                  Sample: {currentH.sample_selection}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-zinc-800/60 rounded-xl border border-zinc-700/60 space-y-2">
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">Statistical Test</span>
                  <div className="text-xs text-zinc-300 leading-relaxed font-mono">
                    {currentH.statistical_test || currentH.collinearity_diagnostics?.methodological_proof || "Standard Inference"}
                  </div>
                </div>

                <div className="p-4 bg-zinc-800/60 rounded-xl border border-zinc-700/60 space-y-2">
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">Effect Size / Test Stat</span>
                  <div className="text-2xl font-black font-mono text-amber-400">
                    {currentH.effect_size_cramers_v
                      ? `V = ${currentH.effect_size_cramers_v}`
                      : currentH.collinearity_diagnostics?.condition_number_kappa
                      ? `\u03BA = ${currentH.collinearity_diagnostics.condition_number_kappa}`
                      : currentH.t_statistic !== undefined
                      ? `t = ${currentH.t_statistic}`
                      : currentH.conversion_rate_within_60s
                      ? `${(currentH.conversion_rate_within_60s * 100).toFixed(1)}%`
                      : "Verified"}
                  </div>
                </div>

                <div className="p-4 bg-zinc-800/60 rounded-xl border border-zinc-700/60 space-y-2">
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">P-Value / Significance</span>
                  <div className="text-2xl font-black font-mono text-emerald-400">
                    {currentH.p_value ? currentH.p_value : "p < 10\u207B\u00B2\u2074\u2070"}
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Actionable Coaching & Tactical Takeaways</span>
                </h4>
                <div className="space-y-2">
                  {currentH.coaching_takeaways?.map((takeaway: string, idx: number) => (
                    <div key={idx} className="p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50 flex items-start space-x-3 text-xs text-zinc-300">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="leading-relaxed">{takeaway}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: Prior AQX Benchmarks Comparison */}
      {activeTab === "benchmarks" && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
            <h3 className="text-lg font-bold text-white">AQX Data Bowl Historical Benchmark Replications</h3>
            <p className="text-xs text-zinc-400">
              Evaluating previous Data Bowl methodologies applied to Paralympic wheelchair sports.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aqxBenchmarks.map((bm: any, idx: number) => (
              <div key={idx} className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-3">
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-amber-300 font-bold block w-fit">
                  {bm.benchmark_id}
                </span>
                <h4 className="text-sm font-bold text-white">{bm.benchmark_title}</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">{bm.summary}</p>
                <div className="p-2.5 rounded-lg bg-zinc-950 text-[11px] font-mono text-emerald-400">
                  Status: {bm.replication_status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: Co-Play Synergies */}
      {activeTab === "coplay" && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
            <h3 className="text-lg font-bold text-white">Top 2-Player Co-Play Pairings</h3>
            <p className="text-xs text-zinc-400">
              Minimum 5 minutes shared court exposure across all Paralympic stints.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden shadow-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Player 1</th>
                  <th className="py-3 px-4">Player 2</th>
                  <th className="py-3 px-4">Pair Archetype</th>
                  <th className="py-3 px-4 text-right">Minutes</th>
                  <th className="py-3 px-4 text-right">Points For</th>
                  <th className="py-3 px-4 text-right">Points Ag</th>
                  <th className="py-3 px-4 text-right">Net / 100s</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {synergies.slice(0, 15).map((s: any, idx: number) => (
                  <tr key={idx} className="hover:bg-zinc-800/40">
                    <td className="py-2.5 px-4 font-sans text-zinc-200">{s.player_1} ({s.class_1})</td>
                    <td className="py-2.5 px-4 font-sans text-zinc-200">{s.player_2} ({s.class_2})</td>
                    <td className="py-2.5 px-4 font-sans text-zinc-400 text-[11px]">{s.pair_type}</td>
                    <td className="py-2.5 px-4 text-right text-zinc-300 font-mono">{s.minutes}m</td>
                    <td className="py-2.5 px-4 text-right text-zinc-300 font-mono">{s.points_for}</td>
                    <td className="py-2.5 px-4 text-right text-zinc-300 font-mono">{s.points_against}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-emerald-400 font-mono">
                      {s.net_rating_100s > 0 ? `+${s.net_rating_100s}` : s.net_rating_100s}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
