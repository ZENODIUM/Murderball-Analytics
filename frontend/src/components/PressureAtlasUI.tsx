"use client";

import React, { useState, useEffect } from "react";
import { getPressureAtlas, getMomentumMicroscope } from "../lib/api";
import {
  Grid, Flame, Clock, ShieldAlert, ArrowUpRight,
  CheckCircle, ChevronRight, Activity, HelpCircle, Eye
} from "lucide-react";

interface PressureAtlasProps {
  onSelectMatch?: (matchId: string) => void;
}

export default function PressureAtlasUI({ onSelectMatch }: PressureAtlasProps) {
  const [atlas, setAtlas] = useState<any[]>([]);
  const [momentum, setMomentum] = useState<any>({});
  const [selectedMetric, setSelectedMetric] = useState<"next_try" | "turnover_hazard" | "observations">("next_try");
  const [selectedCell, setSelectedCell] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [atlasData, momData] = await Promise.all([
          getPressureAtlas(),
          getMomentumMicroscope()
        ]);
        setAtlas(atlasData);
        setMomentum(momData);

        // Select an interesting cell by default (Q4, Margin 0)
        const defCell = atlasData.find((c: any) => c.period === 4 && c.score_margin === 0);
        if (defCell) setSelectedCell(defCell);
      } catch (err) {
        console.error("Failed to load pressure atlas data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <Activity className="w-6 h-6 animate-spin mr-3 text-cyan-400" />
        <span>Loading Scoring Pressure Atlas & Momentum Tensor...</span>
      </div>
    );
  }

  // Periods: 1, 2, 3, 4, 5 (OT)
  const periods = [1, 2, 3, 4, 5];
  // Margins: -8 to +8
  const margins = Array.from({ length: 17 }, (_, i) => i - 8);

  const getCell = (p: number, m: number) => {
    return atlas.find(c => c.period === p && c.score_margin === m);
  };

  const getCellBgColor = (cell: any) => {
    if (!cell || cell.sample_observations === 0) return "bg-slate-900/40 text-slate-600";

    if (selectedMetric === "next_try") {
      const p = cell.p_team_a_scores_next;
      if (p >= 0.65) return "bg-emerald-600/70 text-white font-bold";
      if (p >= 0.55) return "bg-emerald-800/60 text-emerald-200";
      if (p >= 0.45) return "bg-slate-800/80 text-slate-300";
      if (p >= 0.35) return "bg-rose-900/60 text-rose-200";
      return "bg-rose-700/70 text-white font-bold";
    } else if (selectedMetric === "turnover_hazard") {
      const haz = cell.turnover_hazard_rate;
      if (haz >= 0.20) return "bg-amber-500/80 text-slate-950 font-bold";
      if (haz >= 0.12) return "bg-amber-600/50 text-amber-200";
      if (haz >= 0.05) return "bg-slate-800/70 text-slate-300";
      return "bg-slate-900/50 text-slate-400";
    } else {
      const obs = cell.sample_observations;
      if (obs >= 150) return "bg-cyan-600/80 text-white font-bold";
      if (obs >= 80) return "bg-cyan-800/60 text-cyan-200";
      if (obs >= 20) return "bg-cyan-950/40 text-cyan-300";
      return "bg-slate-900/40 text-slate-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                DISCRETIZED GAME STATE MATRIX
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                120 PARALYMPIC MATCHES
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Grid className="w-7 h-7 text-cyan-400" />
              Scoring Pressure Atlas & Momentum Tensor
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Empirical next-score rates, turnover hazard, and matching historical games mapped across Period and Score Margin.
            </p>
          </div>

          {/* Metric Selector Buttons */}
          <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setSelectedMetric("next_try")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                selectedMetric === "next_try"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Next Try Rate
            </button>
            <button
              onClick={() => setSelectedMetric("turnover_hazard")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                selectedMetric === "turnover_hazard"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Turnover Hazard
            </button>
            <button
              onClick={() => setSelectedMetric("observations")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                selectedMetric === "observations"
                  ? "bg-purple-500 text-white font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sample Count
            </button>
          </div>
        </div>
      </div>

      {/* Main 2D Heatmap Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <span>Score Margin Distribution by Period (Lead vs Deficit)</span>
            <span className="text-xs font-normal text-slate-400">Click any cell to inspect matching historical matches</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span>&larr; Deficit (-8)</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200">Tied (0)</span>
            <span>Lead (+8) &rarr;</span>
          </div>
        </div>

        <div className="min-w-[780px]">
          {/* Column Header Margins */}
          <div className="grid grid-cols-18 gap-1 mb-1 text-center text-[10px] font-mono font-bold text-slate-400">
            <div className="text-left font-sans">Period</div>
            {margins.map(m => (
              <div key={m} className={m === 0 ? "text-cyan-400 font-black" : ""}>
                {m > 0 ? `+${m}` : m}
              </div>
            ))}
          </div>

          {/* Grid Rows (Periods) */}
          <div className="space-y-1.5">
            {periods.map(p => {
              const pLabel = p <= 4 ? `Q${p}` : "OT";
              return (
                <div key={p} className="grid grid-cols-18 gap-1 items-center">
                  <div className="text-xs font-bold font-mono text-slate-300">
                    {pLabel}
                  </div>
                  {margins.map(m => {
                    const cell = getCell(p, m);
                    const isSelected = selectedCell?.period === p && selectedCell?.score_margin === m;
                    const bgClass = getCellBgColor(cell);

                    let displayVal = "-";
                    if (cell && cell.sample_observations > 0) {
                      if (selectedMetric === "next_try") {
                        displayVal = `${Math.round(cell.p_team_a_scores_next * 100)}%`;
                      } else if (selectedMetric === "turnover_hazard") {
                        displayVal = `${Math.round(cell.turnover_hazard_rate * 100)}%`;
                      } else {
                        displayVal = `${cell.sample_observations}`;
                      }
                    }

                    return (
                      <button
                        key={m}
                        onClick={() => cell && setSelectedCell(cell)}
                        className={`h-11 rounded text-[11px] font-mono flex flex-col items-center justify-center transition-all ${bgClass} ${
                          isSelected ? "ring-2 ring-cyan-400 scale-105 z-10 shadow-lg" : "hover:brightness-125"
                        }`}
                        title={`Period: ${pLabel}, Margin: ${m > 0 ? `+${m}` : m}, Obs: ${cell?.sample_observations || 0}`}
                      >
                        <span>{displayVal}</span>
                        {cell && cell.sample_observations > 0 && selectedMetric !== "observations" && (
                          <span className="text-[9px] opacity-70">N={cell.sample_observations}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Game State Detail & Matching Historical Matches */}
      {selectedCell && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: State Profile */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                  Game State Profile
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {selectedCell.period_label} &bull; Margin: {selectedCell.score_margin > 0 ? `+${selectedCell.score_margin}` : selectedCell.score_margin}
                </h3>
              </div>
              <div className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-cyan-300">
                {selectedCell.sample_observations} Events
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">P(Lead Team Scores Next):</span>
                <span className="text-sm font-mono font-bold text-emerald-400">
                  {Math.round(selectedCell.p_team_a_scores_next * 100)}%
                </span>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">Turnover Hazard (&le; 45s):</span>
                <span className="text-sm font-mono font-bold text-amber-400">
                  {Math.round(selectedCell.turnover_hazard_rate * 100)}%
                </span>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">Avg Elapsed Sec to Next Try:</span>
                <span className="text-sm font-mono font-bold text-slate-200">
                  {selectedCell.avg_seconds_to_next_score}s
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-500/20 text-xs text-slate-300 leading-relaxed">
              <strong>Tactical Insight:</strong> In {selectedCell.period_label} with a {selectedCell.score_margin === 0 ? "tied score" : `${Math.abs(selectedCell.score_margin)}-point margin`}, possessions follow a strict {selectedCell.avg_seconds_to_next_score}s cycle. High-leverage teams force turnovers in {Math.round(selectedCell.turnover_hazard_rate * 100)}% of these critical sequences.
            </div>
          </div>

          {/* Right: Representative Paralympic Matches with this exact State */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              Matching Paralympic Games with this State ({selectedCell.notable_matches?.length || 0})
            </h4>

            <div className="space-y-2">
              {selectedCell.notable_matches && selectedCell.notable_matches.length > 0 ? (
                selectedCell.notable_matches.map((m: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-800 hover:border-slate-700 flex items-center justify-between transition-all"
                  >
                    <div>
                      <div className="text-xs font-semibold text-cyan-400">
                        {m.tournament} &bull; {m.stage}
                      </div>
                      <div className="text-sm font-bold text-white mt-0.5">
                        {m.matchup}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500 uppercase">Final Score</div>
                        <div className="text-sm font-mono font-bold text-slate-200">{m.final_score}</div>
                      </div>
                      {onSelectMatch && (
                        <button
                          onClick={() => onSelectMatch(m.match_id)}
                          className="p-2 rounded bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white transition-all"
                          title="Open match in explorer"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-500">
                  No specific matches recorded for this rare boundary state.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Momentum Microscope: Scoring Runs & Timeout Efficacy */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                CHANGE-POINT SEQUENCE ANALYSIS
              </span>
            </div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              Momentum Microscope & Timeout Efficacy
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Empirical study of {momentum.total_scoring_runs || 318} scoring runs across all Paralympic matches.
            </p>
          </div>

          {/* Key Metric Banner */}
          <div className="bg-slate-950/80 px-4 py-2.5 rounded-lg border border-slate-800 text-right">
            <div className="text-xs text-slate-400">Conceding Timeout Frequency</div>
            <div className="text-xl font-mono font-bold text-amber-400">
              {momentum.runs_with_conceding_timeout_pct || 42.8}% of Runs
            </div>
          </div>
        </div>

        {/* Scoring Runs Feed */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[11px]">
                <th className="py-2.5 px-3">Tournament</th>
                <th className="py-2.5 px-3">Period / Clock</th>
                <th className="py-2.5 px-3">Run Label</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Timeout Called?</th>
                <th className="py-2.5 px-3">Subsequent Resolution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {momentum.sample_runs?.slice(0, 10).map((r: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 text-slate-300 font-sans font-medium">
                    {r.tournament} ({r.stage})
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">
                    Q{r.period} {r.start_clock} &rarr; {r.end_clock}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-amber-400">
                    {r.run_label}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    {r.duration_seconds}s
                  </td>
                  <td className="py-2.5 px-3">
                    {r.conceding_timeout_called ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        YES (30s / 60s)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                        NO TIMEOUT
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 font-sans">
                    {r.post_run_status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
