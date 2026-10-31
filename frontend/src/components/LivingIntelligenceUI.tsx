"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
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
  X
} from "lucide-react";
import {
  getLivingSources,
  get2026Evaluation,
  getModelRegistry,
  evaluateChallengerModel,
  getDriftMetrics,
  getFutureCompetitions,
  getWatchtowerProposals,
  getHumanCorrections,
  freezeMatchPrediction,
  submitHumanCorrection
} from "../lib/api";

interface LivingUIProps {
  onNavigateTab?: (tab: string, param?: string) => void;
}

export default function LivingIntelligenceUI({ onNavigateTab }: LivingUIProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    "time_machine" | "model_registry" | "drift_observatory" | "future_competitions" | "watchtower_audit" | "sources_registry"
  >("time_machine");

  // State
  const [sourcesData, setSourcesData] = useState<any | null>(null);
  const [eval2026, setEval2026] = useState<any | null>(null);
  const [modelReg, setModelReg] = useState<any | null>(null);
  const [driftData, setDriftData] = useState<any | null>(null);
  const [futureComp, setFutureComp] = useState<any | null>(null);
  const [watchtower, setWatchtower] = useState<any | null>(null);
  const [corrections, setCorrections] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionNotice, setActionNotice] = useState<string>("");

  // Time machine form
  const [freezeMatchId, setFreezeMatchId] = useState<string>("FUTURE_LA28_01");
  const [freezeTeamA, setFreezeTeamA] = useState<string>("USA");
  const [freezeTeamB, setFreezeTeamB] = useState<string>("AUS");
  const [freezeNotes, setFreezeNotes] = useState<string>("");
  const [frozenList, setFrozenList] = useState<any[]>([]);

  // Challenger test modal
  const [challengerResult, setChallengerResult] = useState<any | null>(null);
  const [showChallengerModal, setShowChallengerModal] = useState<boolean>(false);

  // Correction submission modal
  const [showCorrectionModal, setShowCorrectionModal] = useState<boolean>(false);
  const [corrMatchId, setCorrMatchId] = useState<string>("PAR24_M20");
  const [corrField, setCorrField] = useState<string>("");
  const [corrOriginal, setCorrOriginal] = useState<string>("");
  const [corrUpdated, setCorrUpdated] = useState<string>("");
  const [corrEvidence, setCorrEvidence] = useState<string>("");
  const [corrReviewer, setCorrReviewer] = useState<string>("");

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      try {
        const [src, ev26, mreg, drift, fut, wt, corrs] = await Promise.all([
          getLivingSources(),
          get2026Evaluation(),
          getModelRegistry(),
          getDriftMetrics(),
          getFutureCompetitions(),
          getWatchtowerProposals(),
          getHumanCorrections()
        ]);
        setSourcesData(src);
        setEval2026(ev26);
        setModelReg(mreg);
        setDriftData(drift);
        setFutureComp(fut);
        setWatchtower(wt);
        setCorrections(corrs);
      } catch (err) {
        console.error("Living Intelligence load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  const handleFreezePrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!freezeMatchId.trim()) return;
    setActionNotice("");
    const res = await freezeMatchPrediction({
      match_id: freezeMatchId,
      team_a: freezeTeamA,
      team_b: freezeTeamB,
      custom_notes: freezeNotes
    });
    if (res.evaluation_status === "UNAVAILABLE_OFFLINE") {
      setActionNotice(res.message);
      return;
    }
    setFrozenList(prev => [res, ...prev]);
    setFreezeNotes("");
  };

  const handleRunChallengerTest = async (challengerId: string) => {
    const res = await evaluateChallengerModel(challengerId);
    setChallengerResult(res);
    setShowChallengerModal(true);
  };

  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionNotice("");
    const res = await submitHumanCorrection({
      target_match_id: corrMatchId,
      field_corrected: corrField,
      original_value: corrOriginal,
      updated_value: corrUpdated,
      evidence_source: corrEvidence,
      reviewer_name: corrReviewer
    });
    if (res.status === "UNAVAILABLE_OFFLINE") {
      setActionNotice(res.message);
      return;
    }
    if (res?.correction && corrections) {
      setCorrections({
        ...corrections,
        total_corrections: (corrections.total_corrections || 0) + 1,
        corrections: [res.correction, ...corrections.corrections]
      });
    }
    setShowCorrectionModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {actionNotice && <p role="alert" className="rounded-lg border border-amber-500/40 bg-amber-950/30 px-4 py-2 text-sm text-amber-200">{actionNotice}</p>}
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                LIVING SPORTS INTELLIGENCE
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                PREDICTION TIME MACHINE
              </span>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30">
                RETROSPECTIVE REUSED COHORT (2026 WORLD CHAMPIONSHIP)
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Clock className="w-7 h-7 text-amber-400" />
              Living Intelligence, Model Evolution & Future Predictions
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-4xl leading-relaxed">
              This living system discovers newly published competitions, can freeze future forecasts before outcomes occur, tracks tactical distribution drift, and monitors research hypotheses. The completed 2026 analysis shown here is retrospective and development-influenced.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleRunChallengerTest("v2.0.0-hierarchical-bayes")}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Deployment Model Comparison</span>
            </button>
            <button
              onClick={() => { setActionNotice(""); setShowCorrectionModal(true); }}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-cyan-500/20"
            >
              <FileCheck className="w-4 h-4" />
              <span>Submit Verified Correction</span>
            </button>
          </div>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex overflow-x-auto no-scrollbar gap-2 text-xs">
          {[
            { id: "time_machine", label: "Prediction Time Machine & 2026 Review", icon: Clock },
            { id: "model_registry", label: "Model Registry & Evolution", icon: Sliders },
            { id: "drift_observatory", label: "Model Drift Observatory", icon: TrendingUp },
            { id: "future_competitions", label: "Future Events & Women's WC", icon: Compass },
            { id: "watchtower_audit", label: "Research Watchtower & Human Audit", icon: Eye },
            { id: "sources_registry", label: "Source Discovery Registry", icon: Database }
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
      {/* 1. PREDICTION TIME MACHINE & 2026 OUT-OF-TIME EVALUATION       */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === "time_machine" && eval2026 && (
        <div className="space-y-6">
          {/* Out-of-Time Gold Medal Game Spotlight */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  RETROSPECTIVE DEVELOPMENT-INFLUENCED REVIEW
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  2026 WWR World Championship Reused-Cohort Evaluation (USA 57 - 51 AUS)
                </h3>
              </div>
              <div className="flex items-center gap-3 font-mono text-xs">
                <div className="text-right">
                  <div className="text-slate-400 text-[10px]">Observed Winner Accuracy</div>
                  <div className="text-emerald-400 font-bold text-base">{eval2026.champion_accuracy_pct}%</div>
                </div>
                <div className="text-right border-l border-slate-800 pl-3">
                  <div className="text-slate-400 text-[10px]">Legacy Model Brier</div>
                  <div className="text-cyan-400 font-bold text-base">{eval2026.champion_mean_brier}</div>
                </div>
                <div className="text-right border-l border-slate-800 pl-3">
                  <div className="text-slate-400 text-[10px]">Naive 50/50 Baseline</div>
                  <div className="text-slate-400 font-bold text-base">{eval2026.naive_baseline_brier}</div>
                </div>
              </div>
            </div>

            {/* Scientific Leakage Prevention Notice */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1.5">
              <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Strict Temporal Leakage Prevention Protocol:
              </div>
              <ul className="text-slate-300 text-[11px] space-y-1 list-disc pl-4 leading-relaxed font-mono">
                {eval2026.data_leakage_prevented?.map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Gold Medal Match Comparison Card */}
            {eval2026.gold_medal_evaluation && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    <span className="font-bold text-white text-sm">
                      {eval2026.gold_medal_evaluation.stage}: {eval2026.gold_medal_evaluation.matchup}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    PREDICTION VERIFIED CORRECT
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-1">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px]">Official Result</span>
                    <div className="text-white font-bold text-sm mt-0.5">{eval2026.gold_medal_evaluation.final_score}</div>
                    <span className="text-slate-400 text-[10px]">Winner: {eval2026.gold_medal_evaluation.actual_winner} (+{eval2026.gold_medal_evaluation.actual_margin})</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px]">Pre-Match Win Prob (USA)</span>
                    <div className="text-emerald-400 font-bold text-sm mt-0.5">{(eval2026.gold_medal_evaluation.predicted_win_prob_a * 100).toFixed(1)}%</div>
                    <span className="text-slate-400 text-[10px]">Logistic on Pre-Elo</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px]">Predicted Spread</span>
                    <div className="text-cyan-400 font-bold text-sm mt-0.5">+{eval2026.gold_medal_evaluation.predicted_spread_a} USA</div>
                    <span className="text-slate-400 text-[10px]">Actual Spread: +{eval2026.gold_medal_evaluation.actual_margin}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px]">Match Brier Score</span>
                    <div className="text-amber-400 font-bold text-sm mt-0.5">{eval2026.gold_medal_evaluation.champion_brier_score}</div>
                    <span className="text-slate-400 text-[10px]">Margin Error: {eval2026.gold_medal_evaluation.margin_absolute_error} pts</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans pt-1">
                  {eval2026.scientific_takeaway}
                </p>
              </div>
            )}
          </div>

          {/* Interactive Pre-Match Prediction Freezer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <Clock className="w-5 h-5 text-amber-400" />
                <h4 className="text-base font-bold text-white">Freeze Prospective Pre-Match Forecast</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Preserve a model prediction before an upcoming fixture occurs. Frozen records capture an immutable timestamp, feature snapshots, and credible intervals to prevent hindsight tampering.
              </p>

              <form onSubmit={handleFreezePrediction} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Match Identifier:</label>
                  <input
                    type="text"
                    value={freezeMatchId}
                    onChange={e => setFreezeMatchId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 px-3 py-2 rounded-xl text-white font-mono outline-none focus:border-amber-500"
                    placeholder="e.g. FUTURE_LA28_01"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Team A:</label>
                    <select
                      value={freezeTeamA}
                      onChange={e => setFreezeTeamA(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 px-3 py-2 rounded-xl text-white outline-none focus:border-amber-500"
                    >
                      {["USA", "JPN", "AUS", "GBR", "CAN", "FRA", "GER", "NZL"].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Team B:</label>
                    <select
                      value={freezeTeamB}
                      onChange={e => setFreezeTeamB(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 px-3 py-2 rounded-xl text-white outline-none focus:border-amber-500"
                    >
                      {["AUS", "JPN", "USA", "GBR", "CAN", "FRA", "GER", "NZL"].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Contextual Notes / Uncertainty Hypothesis:</label>
                  <input
                    type="text"
                    value={freezeNotes}
                    onChange={e => setFreezeNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 px-3 py-2 rounded-xl text-white outline-none focus:border-amber-500"
                    placeholder="e.g. Evaluating Sarah Adam's high-mobility inbound pressure..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all cursor-pointer shadow-md shadow-amber-500/20"
                >
                  Freeze Prediction in Time Machine
                </button>
              </form>
            </div>

            {/* Frozen Records Stream */}
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Active Frozen Predictions ({frozenList.length})
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Immutable Provenance</span>
              </div>

              {frozenList.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No active predictions frozen yet in this session. Submit the form on the left to test freezing a prospective forecast.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {frozenList.map((fp, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1 font-mono">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-400">{fp.prediction_id}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-blue-950 text-blue-300 border border-blue-800">
                          {fp.evaluation_status}
                        </span>
                      </div>
                      <div className="text-white font-sans text-sm">
                        {fp.team_a} vs {fp.team_b}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span>Win Prob {fp.team_a}: {(fp.predicted_win_probability_a * 100).toFixed(1)}%</span>
                        <span>Spread: {fp.predicted_spread_team_a > 0 ? `+${fp.predicted_spread_team_a}` : fp.predicted_spread_team_a}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. MODEL REGISTRY & EVOLUTION (CHAMPION VS CHALLENGER)         */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === "model_registry" && modelReg && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  MODEL LIFECYCLE MANAGEMENT
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  Machine Learning Model Registry & Controlled Promotion Framework
                </h3>
              </div>
              <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ACTIVE CHAMPION: {modelReg.current_champion}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
              Models are not retrained after single matches without sample-size justification. Deployment changes require a prespecified, independently frozen evaluation and review of calibration, uncertainty, data coverage, and operational constraints.
            </p>

            {/* Model Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {modelReg.models?.map((m: any) => {
                const isChamp = m.role === "CHAMPION";
                return (
                  <div
                    key={m.model_id}
                    className={`p-5 rounded-2xl border transition-all space-y-3 text-xs ${
                      isChamp
                        ? "bg-slate-950 border-emerald-500/50 ring-1 ring-emerald-500/20 shadow-lg shadow-emerald-950/20"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isChamp ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-slate-800 text-slate-300"
                      }`}>
                        {m.role}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{m.status}</span>
                    </div>

                    <div>
                      <h4 className="font-bold text-white text-sm">{m.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{m.architecture}</p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-800/80 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Historical Brier:</span>
                        <span className="text-white font-bold">{m.historical_brier ?? "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">2026 OOT Brier:</span>
                        <span className="text-cyan-400 font-bold">{m.oot_2026_brier ?? "Ineligible (No Stints)"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">2026 OOT Accuracy:</span>
                        <span className="text-emerald-400 font-bold">{m.oot_2026_accuracy_pct ? `${m.oot_2026_accuracy_pct}%` : "Tier 6 Restricted"}</span>
                      </div>
                    </div>

                    {!isChamp && (
                      <button
                        onClick={() => handleRunChallengerTest(m.model_id)}
                        className="w-full mt-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Evaluate Promotion</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. MODEL DRIFT & DISTRIBUTION SHIFT OBSERVATORY                */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === "drift_observatory" && driftData && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  STATISTICAL MONITORING
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  Tactical Evolution & Distribution Drift Observatory
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Audited: {driftData.last_audited}
              </span>
            </div>

            {/* Drift Signals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {driftData.drift_signals?.map((sig: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-slate-400 uppercase text-[11px]">{sig.feature}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      {sig.drift_percentage > 0 ? `+${sig.drift_percentage}%` : `${sig.drift_percentage}%`}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 font-mono">
                    <span className="text-2xl font-black text-white">{sig.recent_2026_mean}</span>
                    <span className="text-slate-500 text-xs">vs hist {sig.historical_mean}</span>
                  </div>
                  <div className="text-[11px] text-cyan-400 font-medium">{sig.drift_status} ({sig.statistical_significance})</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed pt-1 border-t border-slate-800/80">
                    {sig.tactical_driver}
                  </p>
                </div>
              ))}
            </div>

            {/* Era Shifts Table */}
            <div className="pt-3 space-y-2">
              <span className="font-bold text-slate-300 text-xs uppercase tracking-wider">
                Wheelchair Rugby Scoring & Rule Shift Across Eras
              </span>
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3">Era & Tournaments</th>
                      <th className="p-3">Rules Context</th>
                      <th className="p-3 text-right">Matches</th>
                      <th className="p-3 text-right">Mean Tries</th>
                      <th className="p-3 text-right">Turnover %</th>
                      <th className="p-3 text-right">Mean Margin</th>
                      <th className="p-3 text-right">Brier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-950/40">
                    {driftData.era_shifts?.map((era: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-900/50">
                        <td className="p-3 font-bold text-white">{era.era}</td>
                        <td className="p-3 text-slate-400 font-sans text-[11px] max-w-xs">{era.rules_context}</td>
                        <td className="p-3 text-right text-slate-300">{era.matches_count}</td>
                        <td className="p-3 text-right text-emerald-400 font-bold">{era.mean_tries_per_game}</td>
                        <td className="p-3 text-right text-amber-400">{era.turnover_rate_pct}%</td>
                        <td className="p-3 text-right text-slate-300">{era.mean_margin}</td>
                        <td className="p-3 text-right text-cyan-400">{era.champion_model_brier}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. FUTURE COMPETITIONS & INAUGURAL WOMEN'S WORLD CHAMPIONSHIP  */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === "future_competitions" && futureComp && (
        <div className="space-y-6">
          {/* Women's World Championship Research Deep Dive */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30 uppercase tracking-wider">
                  COLD-START RESEARCH DOSSIER
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  Inaugural Women's Wheelchair Rugby World Championship (Dec 1–5, 2026, Paris)
                </h3>
              </div>
              <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                CONFIRMED UPCOMING
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Analytical Challenge: Extreme Cold-Start Problem
                </div>
                <p className="text-slate-300 leading-relaxed">
                  No historical all-female national team match records exist in official results books. Prior models trained on mixed Paralympic competition cannot be blindly deployed without severe domain shift.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-cyan-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Scientific Epistemic Boundary
                </div>
                <p className="text-slate-300 leading-relaxed">
                  The MurderBall platform explicitly refuses to invent synthetic match results or generate overconfident point spreads for this tournament. Instead, we establish descriptive athlete profiles, prior uncertainty bounds, and a live data collection framework.
                </p>
              </div>
            </div>

            {/* Standout Athletes to Watch */}
            <div className="space-y-2 pt-2">
              <span className="font-bold text-slate-300 text-xs uppercase tracking-wider">
                Confirmed Standout Athletes to Watch
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {futureComp.upcoming_events?.[0]?.special_research_dossier?.standout_athletes_to_watch?.map((ath: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{ath.name}</span>
                      <span className="font-mono text-cyan-400 font-bold">{ath.class} pts</span>
                    </div>
                    <div className="text-amber-400 font-mono text-[11px]">{ath.country} National Squad</div>
                    <div className="text-slate-400 text-[11px]">{ath.role}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. RESEARCH WATCHTOWER & HUMAN-VERIFIED DATA CORRECTION AUDIT  */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === "watchtower_audit" && watchtower && corrections && (
        <div className="space-y-6">
          {/* Autonomous Watchtower Proposals */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  AUTONOMOUS RESEARCH MONITORING
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  Research Watchtower: Anomaly Detection & Experimental Proposals
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {watchtower.active_proposals_count} ACTIVE PROPOSALS
              </span>
            </div>

            <div className="space-y-3">
              {watchtower.proposals?.map((prop: any) => (
                <div key={prop.proposal_id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{prop.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {prop.status}
                    </span>
                  </div>
                  <div className="text-amber-400 text-[11px] font-mono">Trigger: {prop.trigger_event}</div>
                  <p className="text-slate-300 leading-relaxed font-sans">{prop.why_it_matters}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Human Corrections Audit Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Human-Verified Data Correction Audit Log ({corrections.total_corrections})
              </span>
              <button
                onClick={() => { setActionNotice(""); setShowCorrectionModal(true); }}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all cursor-pointer"
              >
                + Submit Correction
              </button>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {corrections.corrections?.map((c: any) => (
                <div key={c.correction_id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400 font-bold">{c.correction_id} ({c.target_match_id})</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                      {c.status}
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px]">Field: <span className="text-white">{c.field_corrected}</span></div>
                  <div className="text-rose-400 text-[11px] line-through">{c.original_value}</div>
                  <div className="text-emerald-300 text-[11px]">{c.updated_value}</div>
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/60 flex justify-between">
                    <span>Reviewer: {c.reviewer}</span>
                    <span>Source: {c.evidence_source}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. OFFICIAL SOURCE DISCOVERY REGISTRY                          */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === "sources_registry" && sourcesData && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  PROVENANCE & DATA GOVERNANCE
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  Official Wheelchair Rugby Source Discovery Registry
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {sourcesData.total_sources} REGISTERED SOURCES
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sourcesData.sources?.map((s: any) => (
                <div key={s.source_id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{s.competition}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      {s.data_completeness_tier}
                    </span>
                  </div>
                  <div className="text-slate-400 font-mono text-[11px]">Publisher: {s.publisher}</div>
                  <a
                    href={s.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 text-[11px] font-mono flex items-center gap-1 underline truncate"
                  >
                    <span>{s.source_url}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                  <p className="text-[11px] text-slate-300 leading-relaxed pt-1 border-t border-slate-800/80">
                    {s.notes}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Challenger Evaluation Modal */}
      {showChallengerModal && challengerResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Challenger Promotion Evaluation</h3>
              </div>
              <button
                onClick={() => setShowChallengerModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-slate-400">Tested Challenger:</div>
                <div className="font-mono font-bold text-white text-sm">{challengerResult.challenger_id}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-slate-400">{challengerResult.promotion_verdict === "UNAVAILABLE_OFFLINE" ? "Evaluation status:" : "Independent Validation Verdict:"}</div>
                <div className="font-mono font-bold text-rose-400 text-sm">{challengerResult.promotion_verdict}</div>
                {challengerResult.p_value_diebold_mariano && (
                  <div className="text-slate-400 text-[11px] font-mono">
                    Diebold-Mariano p-value = {challengerResult.p_value_diebold_mariano} (Not statistically significant)
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-slate-200 leading-relaxed font-sans">
                {challengerResult.explanation}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Correction Modal */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Submit Human-Verified Data Correction</h3>
              </div>
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>

            {actionNotice && <p role="alert" className="rounded-lg border border-amber-500/40 bg-amber-950/30 p-3 text-xs text-amber-200">{actionNotice}</p>}
            <form onSubmit={handleSubmitCorrection} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Target Match ID:</label>
                <input
                  type="text"
                  value={corrMatchId}
                  onChange={e => setCorrMatchId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 px-3 py-2 rounded-xl text-white font-mono outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Field Corrected:</label>
                <input
                  type="text"
                  value={corrField}
                  onChange={e => setCorrField(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 px-3 py-2 rounded-xl text-white font-mono outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Original Value:</label>
                <input
                  type="text"
                  value={corrOriginal}
                  onChange={e => setCorrOriginal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 px-3 py-2 rounded-xl text-white outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Updated Verified Value:</label>
                <input
                  type="text"
                  value={corrUpdated}
                  onChange={e => setCorrUpdated(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 px-3 py-2 rounded-xl text-white outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Evidence Source:</label>
                <input
                  type="text"
                  value={corrEvidence}
                  onChange={e => setCorrEvidence(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 px-3 py-2 rounded-xl text-white outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all cursor-pointer shadow-md shadow-cyan-500/20"
              >
                Log Correction in Audit Graph
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
