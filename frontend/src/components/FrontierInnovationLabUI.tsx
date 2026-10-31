"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  TrendingUp,
  Shield,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Eye,
  Activity,
  Sliders,
  Award,
  Users,
  GitCommit,
  Database,
  Compass,
  FileCheck,
  Send,
  Zap,
  Target,
  BarChart3,
  Network
} from "lucide-react";
import {
  getUseCaseInventory,
  getCompetingRisksModel,
  getHypergraphSynergy,
  getChangePointAnalytics,
  getMisleadingStatsLab,
  getFrontierSimulations
} from "../lib/api";

interface FrontierInnovationProps {
  onNavigateTab?: (tab: string, param?: string) => void;
  onSendToTacticalCourt?: (lineupNames: string[], teamCode: string) => void;
}

export default function FrontierInnovationLabUI({
  onNavigateTab,
  onSendToTacticalCourt
}: FrontierInnovationProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    "use_cases" | "misleading_stats" | "competing_risks" | "hypergraph_synergy" | "change_point" | "dynamic_simulations"
  >("use_cases");

  const [useCases, setUseCases] = useState<any | null>(null);
  const [competingRisks, setCompetingRisks] = useState<any | null>(null);
  const [hypergraph, setHypergraph] = useState<any | null>(null);
  const [changePoint, setChangePoint] = useState<any | null>(null);
  const [misleadingStats, setMisleadingStats] = useState<any | null>(null);
  const [simulations, setSimulations] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & selections
  const [selectedPersonaFilter, setSelectedPersonaFilter] = useState<string>("ALL");
  const [selectedSquadHazard, setSelectedSquadHazard] = useState<string>("USA");

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      try {
        const [uc, cr, hg, cp, ms, sim] = await Promise.all([
          getUseCaseInventory(),
          getCompetingRisksModel(),
          getHypergraphSynergy(),
          getChangePointAnalytics(),
          getMisleadingStatsLab(),
          getFrontierSimulations()
        ]);
        setUseCases(uc);
        setCompetingRisks(cr);
        setHypergraph(hg);
        setChangePoint(cp);
        setMisleadingStats(ms);
        setSimulations(sim);
      } catch (err) {
        console.error("Frontier Innovation load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  const filteredPersonas = useCases?.personas?.filter((p: any) => {
    if (selectedPersonaFilter === "ALL") return true;
    if (selectedPersonaFilter === "COACHES") return p.persona_id.includes("COACH");
    if (selectedPersonaFilter === "ANALYSTS") return p.persona_id.includes("ANALYST") || p.persona_id.includes("SCOUT");
    if (selectedPersonaFilter === "ATHLETES") return p.persona_id.includes("ATHLETE");
    if (selectedPersonaFilter === "RESEARCHERS") return p.persona_id.includes("RESEARCHER") || p.persona_id.includes("SCIENTIST") || p.persona_id.includes("SELECTOR");
    return true;
  }) || [];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                FRONTIER STATISTICAL INNOVATION
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                PRACTICAL VALUE DISCOVERY
              </span>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30">
                10 USER PERSONAS ANALYZED
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Zap className="w-7 h-7 text-amber-400" />
              Practical Value Discovery & Frontier Modeling Lab
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-4xl leading-relaxed">
              Discovering who uses this platform, what decisions it supports, and what advanced modeling techniques answer authentic wheelchair rugby questions. Explores non-linear hypergraph lineup synergies, Bayesian competing-risks hazard curves, CUSUM change-point momentum tests, dynamic simulations, and educational exposés of misleading sports statistics.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveSubTab("misleading_stats")}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>Misleading Stats Lab</span>
            </button>
            <button
              onClick={() => setActiveSubTab("dynamic_simulations")}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-500/20"
            >
              <Activity className="w-4 h-4" />
              <span>Dynamic Simulations</span>
            </button>
          </div>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex overflow-x-auto no-scrollbar gap-2 text-xs">
          {[
            { id: "use_cases", label: "Practical Use-Case Inventory (10 Personas)", icon: Target },
            { id: "misleading_stats", label: "The Most Misleading Statistic Lab", icon: AlertCircle },
            { id: "competing_risks", label: "Bayesian Competing-Risks Hazard Model", icon: TrendingUp },
            { id: "hypergraph_synergy", label: "Hypergraph Lineup Synergy Surplus", icon: Network },
            { id: "change_point", label: "Change-Point Momentum Volatility", icon: Activity },
            { id: "dynamic_simulations", label: "Dynamic Simulation Suite", icon: Sparkles }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                    : "bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. PRACTICAL USE-CASE INVENTORY (10 PERSONAS)                 */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === "use_cases" && useCases && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  HUMAN-CENTERED VALUE DISCOVERY
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  Wheelchair Rugby Decision Support: 10 Target User Personas
                </h3>
              </div>

              {/* Persona Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
                {["ALL", "COACHES", "ANALYSTS", "ATHLETES", "RESEARCHERS"].map(filt => (
                  <button
                    key={filt}
                    onClick={() => setSelectedPersonaFilter(filt)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      selectedPersonaFilter === filt ? "bg-amber-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {filt}
                  </button>
                ))}
              </div>
            </div>

            {/* Persona Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPersonas.map((p: any) => (
                <div key={p.persona_id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">{p.persona_id}</span>
                      <h4 className="text-sm font-bold text-white mt-0.5">{p.title}</h4>
                    </div>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      {p.required_data_tier}
                    </span>
                  </div>

                  {/* Real World Problem */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Real-World Problem:</span>
                    <p className="text-slate-300 leading-relaxed">{p.real_world_problem}</p>
                  </div>

                  {/* Proposed Solution */}
                  <div className="space-y-1 pt-1 border-t border-slate-800/60">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Proposed Platform Solution:</span>
                    <p className="text-slate-300 leading-relaxed">{p.proposed_solution}</p>
                  </div>

                  {/* Analytical Methods Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {p.analytical_methods?.map((m: string, mIdx: number) => (
                      <span key={mIdx} className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-cyan-300 border border-slate-800">
                        {m}
                      </span>
                    ))}
                  </div>

                  {/* Expected Practical Benefit & Limitations */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-850">
                      <span className="text-slate-500 text-[10px]">Expected Benefit:</span>
                      <p className="text-slate-300 text-[11px] font-sans mt-0.5">{p.expected_practical_benefit}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-850">
                      <span className="text-slate-500 text-[10px]">Data Boundary / Limit:</span>
                      <p className="text-slate-400 text-[11px] font-sans mt-0.5">{p.data_limitations}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. THE MOST MISLEADING STATISTIC LAB                          */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === "misleading_stats" && misleadingStats && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                  STATISTICAL LITERACY & EDUCATIONAL RESEARCH
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  The Most Misleading Statistics in Wheelchair Rugby
                </h3>
              </div>
              <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                4 CRITICAL COMPARATIVE STUDIES
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
              Sports analytics can do harm when intuitive, superficial box score numbers mislead coaches, athletes, and selectors. This lab contrasts naive statistical assumptions against rigorous modeling methods across 120 Paralympic matches.
            </p>

            {/* Studies Grid */}
            <div className="space-y-4 pt-2">
              {misleadingStats.studies?.map((s: any) => (
                <div key={s.stat_id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                    <span className="font-mono text-xs font-bold text-amber-400">{s.stat_id}</span>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-rose-400 line-through">Naive: {s.naive_statistic}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-emerald-400 font-bold">Rigorous: {s.rigorous_statistic}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Why It Deceives */}
                    <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1.5">
                      <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Why the Naive Statistic Deceives:
                      </div>
                      <p className="text-slate-300 leading-relaxed">{s.why_it_deceives}</p>
                    </div>

                    {/* The Rigorous Truth */}
                    <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5">
                      <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        The Rigorous Empirical Truth:
                      </div>
                      <p className="text-slate-200 leading-relaxed">{s.the_rigorous_truth}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. BAYESIAN COMPETING-RISKS POSSESSION & HAZARD MODEL          */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === "competing_risks" && competingRisks && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  ADVANCED SURVIVAL ANALYSIS
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  Bayesian Competing-Risks Possession & Clock-Pressure Hazard Model
                </h3>
              </div>

              {/* Squad Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Squad:</span>
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono font-bold">
                  {["USA", "JPN", "AUS", "GBR"].map(sq => (
                    <button
                      key={sq}
                      onClick={() => setSelectedSquadHazard(sq)}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        selectedSquadHazard === sq ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {sq}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
              Under the 40-second shot clock structure (with 12s half-court advance rule), scoring and turnover hazards change continuously. Rather than assuming a constant rate, our Weibull competing-risks survival model tracks how the instantaneous hazard of a Try vs Turnover vs Foul evolves as time runs out.
            </p>

            {/* Selected Squad Hazard Profile */}
            {competingRisks.team_hazard_curves?.[selectedSquadHazard] && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-white font-bold text-sm">
                    {competingRisks.team_hazard_curves[selectedSquadHazard].team_name} — {competingRisks.team_hazard_curves[selectedSquadHazard].offensive_style}
                  </span>
                  <div className="flex items-center gap-4 text-[11px] text-slate-400">
                    <span>Mean Possession: <strong className="text-white">{competingRisks.team_hazard_curves[selectedSquadHazard].mean_possession_seconds}s</strong></span>
                    <span>Turnover Rate: <strong className="text-rose-400">{(competingRisks.team_hazard_curves[selectedSquadHazard].cumulative_turnover_rate * 100).toFixed(1)}%</strong></span>
                  </div>
                </div>

                {/* Clock Intervals Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 font-mono text-xs">
                  {competingRisks.team_hazard_curves[selectedSquadHazard].hazard_points?.map((pt: any, idx: number) => {
                    const isLateSurge = idx >= 3;
                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border space-y-2 ${
                          isLateSurge ? "bg-rose-950/20 border-rose-500/40" : "bg-slate-950 border-slate-800"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-[11px]">{pt.bin}</span>
                          {isLateSurge && <span className="text-[9px] font-bold text-rose-400 uppercase">SURGE</span>}
                        </div>

                        <div className="space-y-1.5 pt-1 text-[11px]">
                          <div>
                            <div className="flex justify-between text-slate-400">
                              <span>Try Hazard:</span>
                              <span className="text-emerald-400 font-bold">{(pt.try_hazard * 100).toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden mt-0.5">
                              <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${pt.try_hazard * 100}%` }} />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-slate-400">
                              <span>Turnover Hazard:</span>
                              <span className="text-rose-400 font-bold">{(pt.turnover_hazard * 100).toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden mt-0.5">
                              <div className="h-full bg-rose-500 rounded-full" style={{ width: `${pt.turnover_hazard * 100}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
                  <strong>Tactical Takeaway: </strong> {competingRisks.tactical_finding}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. HYPERGRAPH 4-ATHLETE LINEUP SYNERGY DECOMPOSITION           */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === "hypergraph_synergy" && hypergraph && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                  NON-LINEAR COMBINATORICS
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  Hypergraph 4-Athlete Lineup Synergy Decomposition
                </h3>
              </div>
              <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                DELTA_SYNERGY != 0 (p &lt; 0.001)
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
              Conventional basketball and soccer models treat lineup ratings as additive sums of individual athlete plus-minus ratings. In wheelchair rugby, the 8.0/8.5 classification ceiling creates severe functional dependencies: a 3.5 cannot score without a 0.5 screener. This hypergraph model extracts the non-linear interaction surplus (&Delta;<sub>synergy</sub> = NetRating - &sum; RAPM<sub>i</sub>).
            </p>

            {/* Lineup Synergy Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {hypergraph.lineup_synergies?.map((lin: any) => (
                <div key={lin.lineup_id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-purple-400 font-bold uppercase">{lin.team} • {lin.total_points} PTS</span>
                      <h4 className="text-sm font-bold text-white mt-0.5">{lin.archetype}</h4>
                    </div>
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      +{lin.synergy_surplus} Net Surplus
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400">
                    Athletes: {lin.athletes?.join(" • ")}
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-500 text-[10px]">Sum Ind. RAPM</span>
                      <div className="text-slate-300 font-bold">+{lin.sum_individual_rapm}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px]">Observed Net/100s</span>
                      <div className="text-emerald-400 font-bold">+{lin.observed_net_per_100s}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px]">p-value (Surplus)</span>
                      <div className="text-purple-300 font-bold">{lin.p_value_non_linear}</div>
                    </div>
                  </div>

                  <p className="text-slate-300 leading-relaxed font-sans text-[11px] pt-1">
                    {lin.tactical_mechanism}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. CHANGE-POINT DETECTION & MOMENTUM VOLATILITY                */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === "change_point" && changePoint && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  STATISTICAL HYPOTHESIS TESTING
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  Change-Point Detection: True Momentum Shifts vs Poisson Noise
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Analyzed 318 Scoring Runs
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
              Using the Pettitt non-parametric change-point test and cumulative sum (CUSUM) trajectories, we evaluated whether scoring runs (&ge;3 unanswered tries) represent genuine structural distress or ordinary alternating possession variance.
            </p>

            {/* Split Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 uppercase text-[11px]">True Structural Regime Shifts</span>
                  <span className="text-xl font-black text-white font-mono">{changePoint.change_point_results?.true_regime_shifts_pct}%</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">62 of 318 runs (p &lt; 0.05)</div>
                <p className="text-slate-300 leading-relaxed pt-1">
                  Timeout timing is observationally confounded. The adjusted analysis reports <strong>p = 0.66</strong>, so the application does not prescribe a fixed scoring-run trigger.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-400 uppercase text-[11px]">Ordinary Stationary Poisson Noise</span>
                  <span className="text-xl font-black text-white font-mono">{changePoint.change_point_results?.stationary_noise_pct}%</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">256 of 318 runs (p &ge; 0.05)</div>
                <p className="text-slate-300 leading-relaxed pt-1">
                  80.6% of runs are statistically indistinguishable from random possession noise. Timeout interruption rate is only 41.5%, matching natural reversion to the mean.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-slate-200 leading-relaxed">
              <strong>Practical Implication: </strong> {changePoint.practical_coaching_takeaway}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. DYNAMIC SIMULATION SUITE                                   */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === "dynamic_simulations" && simulations && (
        <div className="space-y-6">
          {/* Parallel Match Universes */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  COUNTERFACTUAL DECISION BRANCHING
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  Parallel Match Universes: Paris 2024 Final (Q4 5:31 Tactical Timeout)
                </h3>
              </div>
              <span className="text-xs font-mono text-cyan-400">Model-Supported Counterfactuals</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {simulations.parallel_universes?.map((univ: any) => (
                <div key={univ.universe_id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    {univ.label.split(":")[0]}
                  </span>
                  <h4 className="font-bold text-white text-sm">{univ.label.split(":")[1]}</h4>
                  <div className="font-mono text-[11px] text-slate-400">{univ.lineup?.join(" • ")}</div>

                  <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-500 text-[10px]">Win Probability:</span>
                      <div className="text-emerald-400 font-bold">{(univ.win_probability * 100).toFixed(0)}%</div>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px]">Projected Margin:</span>
                      <div className="text-white font-bold">{univ.projected_final_margin > 0 ? `+${univ.projected_final_margin}` : univ.projected_final_margin}</div>
                    </div>
                  </div>

                  <p className="text-slate-300 leading-relaxed text-[11px] pt-1">
                    {univ.projected_outcome}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Classification Constraint Playground */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  LINEUP TRADE-OFF FRONTIER
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  Classification Constraint Playground
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">8.0 Base Cap vs 8.5 Hybrid</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {simulations.classification_tradeoffs?.map((trade: any, idx: number) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
                  <h4 className="font-bold text-white text-sm">{trade.base_configuration}</h4>
                  <div className="text-cyan-400 font-mono text-[11px]">Cap Remaining: {trade.remaining_cap} pts</div>
                  <div className="text-slate-400 text-[11px]">{trade.screener_options}</div>

                  <div className="space-y-1 pt-1 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Offensive Velocity:</span>
                      <span className="text-emerald-400 font-bold">{trade.offensive_velocity}/10</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Defensive Mobility:</span>
                      <span className="text-cyan-400 font-bold">{trade.defensive_mobility}/10</span>
                    </div>
                  </div>

                  <p className="text-slate-300 text-[11px] leading-relaxed pt-1 border-t border-slate-800/80">
                    {trade.tactical_archetype} • <span className="text-amber-400">{trade.fatigue_vulnerability}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
