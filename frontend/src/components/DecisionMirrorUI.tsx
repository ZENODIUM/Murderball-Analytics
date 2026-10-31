"use client";

import React, { useState, useEffect } from "react";
import { getDecisionMirrorDatabase } from "../lib/api";
import {
  GitCommit, Clock, AlertTriangle, Shield, CheckCircle2,
  ArrowRight, Users, Activity, BarChart2, Filter, ChevronRight
} from "lucide-react";

interface DecisionMirrorProps {
  onSendToTacticalCourt?: (lineupNames: string[], teamCode: string) => void;
}

function recordedEventLabel(event: any, sourceTimeline: boolean) {
  if (!sourceTimeline) return event.detail || event.description || event.event_type;
  if (event.event_type === "TRY") return `${event.athlete || event.team} try`;
  if (event.event_type === "TIMEOUT") return `${event.team} timeout (60 seconds)`;
  if (event.event_type === "TURNOVER") return `${event.athlete || event.team} turnover (out of bounds)`;
  if (event.event_type === "SUBSTITUTION_OUT") return event.description;
  return event.event_type?.replaceAll("_", " ") || "Recorded event";
}

function recordedEventScore(event: any) {
  if (event.score) return event.score;
  if (typeof event.score_a === "number" && typeof event.score_b === "number") return `${event.score_a}–${event.score_b}`;
  return "";
}

export default function DecisionMirrorUI({ onSendToTacticalCourt }: DecisionMirrorProps) {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [teamFilter, setTeamFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getDecisionMirrorDatabase();
        const list = res.decisions || [];
        setDecisions(list);
        if (list.length > 0) {
          setSelectedId(list[0].decision_id);
        }
      } catch (err) {
        console.error("Failed to load decision mirror data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredDecisions = decisions.filter(d => {
    if (teamFilter !== "ALL" && d.team !== teamFilter) return false;
    if (typeFilter !== "ALL" && d.decision_type !== typeFilter) return false;
    return true;
  });

  const activeDecision = decisions.find(d => d.decision_id === selectedId) || filteredDecisions[0];
  const sourceTimeline = !!activeDecision && Array.isArray(activeDecision.prior_120s_context);
  const priorSummary = sourceTimeline ? null : activeDecision?.prior_120s_context;
  const aftermathSummary = sourceTimeline ? null : activeDecision?.observed_subsequent_120s_outcome;
  const priorEvents = sourceTimeline ? activeDecision.prior_120s_context : (priorSummary?.recent_events || []);
  const aftermathEvents = sourceTimeline ? activeDecision.observed_subsequent_120s_outcome : (aftermathSummary?.subsequent_events || []);
  const observedSwing = sourceTimeline ? activeDecision?.measured_net_aftermath : aftermathSummary?.net_swing;

  const uniqueTeams = Array.from(new Set(decisions.map(d => d.team))).sort();
  const uniqueTypes = Array.from(new Set(decisions.map(d => d.decision_type))).sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <Activity className="w-6 h-6 animate-spin mr-3 text-cyan-400" />
        <span>Loading Decision Mirror Dossiers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Strategic Scope */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                TACTICAL INTELLIGENCE
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                EVIDENCE-BACKED COUNTERFACTUALS
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <GitCommit className="w-7 h-7 text-cyan-400" />
              Decision Mirror: Historical Coaching Leverage Engine
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Investigate critical substitutions and timeouts in close Paralympic matches. Pair observed 120s aftermath with modeled legal alternatives.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                aria-label="Filter decisions by national team"
                className="bg-transparent text-sm text-slate-200 outline-none cursor-pointer"
                value={teamFilter}
                onChange={e => setTeamFilter(e.target.value)}
              >
                <option value="ALL">All Nations</option>
                {uniqueTeams.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <select
                aria-label="Filter decisions by tactical action type"
                className="bg-transparent text-sm text-slate-200 outline-none cursor-pointer"
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
              >
                <option value="ALL">All Decision Types</option>
                {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Decision Selector Feed */}
        <div className="lg:col-span-4 space-y-3 max-h-[850px] overflow-y-auto pr-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
            Recorded Decision Points ({filteredDecisions.length})
          </div>
          {filteredDecisions.map(d => {
            const isSelected = d.decision_id === activeDecision?.decision_id;
            return (
              <button
                key={d.decision_id}
                onClick={() => setSelectedId(d.decision_id)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-150 ${
                  isSelected
                    ? "bg-slate-800/90 border-cyan-500 shadow-md shadow-cyan-950/20"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span className="font-semibold text-slate-300">{d.tournament}</span>
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    Q{d.period} {d.clock}
                  </span>
                </div>
                <div className="text-sm font-bold text-white flex items-center justify-between">
                  <span>{d.team_name} vs {d.opponent}</span>
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                    {d.score_at_decision}
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-300 flex items-center gap-1.5 line-clamp-1">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                    d.decision_type === "TIMEOUT" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  }`}>
                    {d.decision_type}
                  </span>
                  <span className="truncate">{d.decision_detail || d.historical_action}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Selected Decision Detailed Dossier */}
        {activeDecision ? (
          <div className="lg:col-span-8 space-y-6">
            {/* Match Situation Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                <div>
                  <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                    {activeDecision.tournament} &bull; {activeDecision.stage}
                  </div>
                  <h3 className="text-xl font-bold text-white mt-1">
                    {activeDecision.team_name} ({activeDecision.team}) vs {activeDecision.opponent}
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Score at Decision</div>
                    <div className="text-2xl font-mono font-bold text-white">{activeDecision.score_at_decision}</div>
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold ${
                    activeDecision.score_differential > 0
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : activeDecision.score_differential < 0
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  }`}>
                    {activeDecision.score_differential > 0 ? `+${activeDecision.score_differential}` : activeDecision.score_differential}
                  </div>
                </div>
              </div>

              {sourceTimeline && (
                <div className="mt-4 rounded-lg border border-slate-700 bg-slate-950/60 p-3 text-sm text-slate-200">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-emerald-300">Recorded timeout and substitution</span>
                  {activeDecision.historical_action}
                </div>
              )}

              {/* On-Court Lineups Prior to Decision */}
              {!sourceTimeline && <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-semibold text-slate-300">{activeDecision.team} Lineup on Court</span>
                    <span className="font-mono text-cyan-400 font-bold">
                      {activeDecision.on_court_unit_prior?.total_points.toFixed(1)} pts
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {activeDecision.on_court_unit_prior?.names?.map((name: string, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-slate-200 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">
                        <span>{name}</span>
                        <span className="font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                          {activeDecision.on_court_unit_prior?.classes?.[idx]?.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-semibold text-slate-300">{activeDecision.opponent} Lineup on Court</span>
                    <span className="font-mono text-slate-400 font-bold">
                      {activeDecision.opponent_on_court_unit?.total_points?.toFixed(1) || "8.0"} pts
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {activeDecision.opponent_on_court_unit?.names?.map((name: string, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-slate-200 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">
                        <span>{name}</span>
                        <span className="font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                          {activeDecision.opponent_on_court_unit?.classes?.[idx]?.toFixed(1) || "-"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>}
            </div>

            {/* Pre-Context vs Subsequent Aftermath (Chronological Timeline) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Prior 120s Context */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-400" />
                    Prior 120s Momentum Context
                  </h4>
                  {priorSummary && <span className="text-xs font-mono text-amber-400">
                    Net: {priorSummary.net_differential > 0 ? `+${priorSummary.net_differential}` : priorSummary.net_differential}
                  </span>}
                </div>
                {priorSummary && <div className="flex items-center gap-4 text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800 mb-3">
                  <div>Tries: <span className="font-bold text-white">{priorSummary.team_tries} - {priorSummary.opponent_tries}</span></div>
                  <div>TOs: <span className="font-bold text-rose-400">{priorSummary.turnovers || 0}</span></div>
                  <div>Steals: <span className="font-bold text-emerald-400">{priorSummary.steals || 0}</span></div>
                </div>}
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {priorEvents.map((ev: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 rounded bg-slate-950/30 border border-slate-800/60">
                      <span className="font-mono text-slate-400 text-[11px]">{ev.clock}</span>
                      <span className="text-slate-300 truncate max-w-[200px]">{recordedEventLabel(ev, sourceTimeline)}</span>
                      <span className="font-mono font-bold text-slate-400 text-[11px]">{recordedEventScore(ev)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Observed Subsequent 120s Aftermath */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Observed 120s Aftermath
                  </h4>
                  <span className={`text-xs font-mono font-bold ${
                    observedSwing > 0
                      ? "text-emerald-400"
                      : observedSwing < 0
                      ? "text-rose-400"
                      : "text-slate-400"
                  }`}>
                    Swing: {observedSwing > 0 ? `+${observedSwing}` : observedSwing ?? "not available"}
                  </span>
                </div>
                {aftermathSummary && <div className="flex items-center gap-4 text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800 mb-3">
                  <div>Tries Scored: <span className="font-bold text-white">{aftermathSummary.team_tries} - {aftermathSummary.opponent_tries}</span></div>
                  <div>TOs: <span className="font-bold text-rose-400">{aftermathSummary.turnovers || 0}</span></div>
                  <div>Steals: <span className="font-bold text-emerald-400">{aftermathSummary.steals || 0}</span></div>
                </div>}
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {aftermathEvents.map((ev: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 rounded bg-slate-950/30 border border-slate-800/60">
                      <span className="font-mono text-slate-400 text-[11px]">{ev.clock}</span>
                      <span className="text-slate-300 truncate max-w-[200px]">{recordedEventLabel(ev, sourceTimeline)}</span>
                      <span className="font-mono font-bold text-slate-400 text-[11px]">{recordedEventScore(ev)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Counterfactual Alternative Lineup Analysis */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-400" />
                    {sourceTimeline ? "Modeled Alternative Lineups" : "Evaluated Alternative Options (Observed vs Counterfactuals)"}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ridge RAPM net expectations with 90% confidence intervals and legal classification sums.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {activeDecision.alternatives_evaluated?.map((alt: any, idx: number) => {
                  const isObserved = alt.evidence_status === "OBSERVED_HISTORICAL";
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border transition-all ${
                        isObserved
                          ? "bg-cyan-950/20 border-cyan-500/40"
                          : "bg-slate-950/40 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isObserved
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                          }`}>
                            {isObserved ? "VERIFIED OBSERVATION" : "HYPOTHETICAL SCENARIO"}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-300">
                            {alt.lineup_type || alt.lineup_name || "Lineup scenario"}
                          </span>
                          <span className="font-mono text-xs font-semibold text-slate-300">
                            {alt.total_points.toFixed(1)} / {alt.legal_cap?.toFixed(1) || "8.0"} pts
                          </span>
                        </div>

                        {/* Interactive Send to Tactical Court */}
                        {onSendToTacticalCourt && (
                          <button
                            onClick={() => onSendToTacticalCourt(alt.player_names, activeDecision.team)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white rounded-lg text-xs font-medium border border-slate-700 hover:border-cyan-500 transition-all"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>Deploy to Court</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Lineup Players Badges */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                        {alt.player_names?.map((pName: string, pIdx: number) => (
                          <div key={pIdx} className="bg-slate-900 border border-slate-800 px-2 py-1.5 rounded flex items-center justify-between text-xs">
                            <span className="truncate text-slate-200">{pName}</span>
                            <span className="font-mono text-[10px] text-cyan-400 ml-1">
                              {alt.classes?.[pIdx]?.toFixed(1)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Modeled Expectations & Confidence Interval */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-xs">
                        <div>
                          <span className="text-slate-400">Modeled 120s Net Margin:</span>
                          <span className="ml-1.5 font-mono font-bold text-white">
                            {alt.modeled_120s_margin_mean > 0 ? `+${alt.modeled_120s_margin_mean}` : alt.modeled_120s_margin_mean} pts
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">90% Uncertainty Interval:</span>
                          <span className="ml-1.5 font-mono text-cyan-300">
                            [{alt.modeled_120s_margin_ci90?.[0]}, {alt.modeled_120s_margin_ci90?.[1]}]
                          </span>
                        </div>
                        {typeof alt.historical_stint_minutes === "number" && <div>
                          <span className="text-slate-400">Historical Court Time:</span>
                          <span className="ml-1.5 font-mono text-slate-300">
                            {alt.historical_stint_minutes} min
                          </span>
                        </div>}
                      </div>

                      <div className="mt-2 text-xs text-slate-400 italic">
                        {sourceTimeline ? "Modeled lineup comparison only. No observed spatial route or causal result is asserted." : alt.tactical_rationale}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Coaching Verdict & Scientific Note */}
              <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-semibold">
                  <Shield className="w-4 h-4" />
                  Tactical Review & Limitation Notice
                </div>
                <p>
                  <strong className="text-white">{sourceTimeline ? "Interpretation:" : "Coaching Verdict:"}</strong> {sourceTimeline ? "The record identifies the timeout, substitution, and subsequent events. It cannot establish what a different lineup would have caused." : activeDecision.coaching_verdict}
                </p>
                <p className="text-slate-400">
                  <strong className="text-slate-300">Scientific Integrity Note:</strong> {sourceTimeline ? "Alternative lineup margins are model outputs with uncertainty, not observed outcomes. Presses, screens, and movement routes need synchronized video or tracking before they can be described as observed." : activeDecision.uncertainty_note}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 flex items-center justify-center p-12 text-slate-500">
            Select a decision from the left panel to inspect the tactical dossier.
          </div>
        )}
      </div>
    </div>
  );
}
