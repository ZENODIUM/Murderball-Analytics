"use client";

import React, { useState, useEffect } from "react";
import { getConfidenceFrontier } from "../lib/api";
import {
  TrendingUp, Award, Shield, AlertTriangle, Users,
  ArrowRight, Filter, ChevronRight, Activity, Sparkles
} from "lucide-react";

interface ConfidenceFrontierProps {
  onSendToTacticalCourt?: (lineupNames: string[], teamCode: string) => void;
}

export default function ConfidenceFrontierUI({ onSendToTacticalCourt }: ConfidenceFrontierProps) {
  const [lineups, setLineups] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("ALL");
  const [selectedTier, setSelectedTier] = useState<string>("ALL");
  const [paretoOnly, setParetoOnly] = useState<boolean>(false);
  const [selectedLineup, setSelectedLineup] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getConfidenceFrontier(paretoOnly);
        const list = res.lineups || [];
        setLineups(list);
        if (list.length > 0) {
          setSelectedLineup(list[0]);
        }
      } catch (err) {
        console.error("Failed to load confidence frontier:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [paretoOnly]);

  const filteredLineups = lineups.filter(l => {
    if (selectedTeam !== "ALL" && l.team !== selectedTeam) return false;
    if (selectedTier !== "ALL" && l.tier !== selectedTier) return false;
    return true;
  });

  const activeLineup = selectedLineup || filteredLineups[0];

  const uniqueTeams = Array.from(new Set(lineups.map(l => l.team))).filter(Boolean).sort();
  const tiers = [
    "Proven Dominant Unit",
    "Bedrock Workhorse Unit",
    "High-Variance Gamble",
    "Defensive Containment Unit",
    "Developing Rotation Unit"
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <Activity className="w-6 h-6 animate-spin mr-3 text-cyan-400" />
        <span>Loading Lineup Confidence Frontier & Pareto Tradeoffs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                PARETO TRADEOFF FRONTIER
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                UNCERTAINTY INTERVALS
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-7 h-7 text-cyan-400" />
              Lineup Confidence Frontier: Evidence vs Net Advantage
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Balancing high-margin performance against sample exposure. Pareto-optimal lineups dominate all competitors in either net point differential or minutes played.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setParetoOnly(!paretoOnly)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                paretoOnly
                  ? "bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pareto Frontier Only</span>
            </button>

            <select
              aria-label="Filter lineups by national team"
              className="bg-slate-800 text-sm text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 outline-none cursor-pointer"
              value={selectedTeam}
              onChange={e => setSelectedTeam(e.target.value)}
            >
              <option value="ALL">All Nations</option>
              {uniqueTeams.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <select
              aria-label="Filter lineups by statistical reliability tier"
              className="bg-slate-800 text-sm text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 outline-none cursor-pointer"
              value={selectedTier}
              onChange={e => setSelectedTier(e.target.value)}
            >
              <option value="ALL">All Reliability Tiers</option>
              {tiers.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Pareto Scatter Plot */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold text-slate-300">
              Tradeoff Curve: Net Points / 100s (Y) vs Court Minutes (X)
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span className="text-[11px]">Pareto Frontier</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                <span className="text-[11px]">Other Units</span>
              </div>
            </div>
          </div>

          <div className="relative w-full max-w-[620px] aspect-[4/3] bg-slate-950/60 rounded-xl border border-slate-800 p-2 overflow-hidden">
            <svg viewBox="0 -6 110 12" className="w-full h-full">
              {/* Reference Grid */}
              <line x1="0" y1="0" x2="105" y2="0" stroke="#334155" strokeWidth="0.1" />
              <line x1="0" y1="-6" x2="0" y2="6" stroke="#334155" strokeWidth="0.1" />

              {/* Labels */}
              <text x="100" y="-0.3" fill="#64748b" fontSize="0.45" textAnchor="end">
                Court Exposure (Minutes) &rarr;
              </text>
              <text x="2" y="5.5" fill="#64748b" fontSize="0.45">
                Net Pts / 100s &rarr;
              </text>

              {/* Lineup Scatter Points */}
              {filteredLineups.map((l: any, idx: number) => {
                const isSelected = activeLineup?.lineup_id === l.lineup_id;
                const isPareto = l.is_pareto_optimal;

                // Coordinates
                const cx = Math.min(100, Math.max(1, l.court_minutes));
                const cy = Math.min(5.5, Math.max(-5.5, l.net_per_100s));
                const r = isSelected ? 1.5 : isPareto ? 1.2 : 0.7;
                const fill = isPareto ? "#f59e0b" : isSelected ? "#38bdf8" : "#0ea5e9";

                return (
                  <g
                    key={idx}
                    className="cursor-pointer"
                    onClick={() => setSelectedLineup(l)}
                  >
                    {isSelected && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={r + 0.8}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="0.3"
                        className="animate-pulse"
                      />
                    )}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill={fill}
                      opacity={isSelected ? 1.0 : isPareto ? 0.95 : 0.55}
                      stroke="#0f172a"
                      strokeWidth="0.15"
                    />
                    {isPareto && (
                      <text
                        x={cx}
                        y={cy - 1.2}
                        fill="#fbbf24"
                        fontSize="0.45"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily="sans-serif"
                      >
                        ★ {l.team}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right: Selected Lineup Intelligence Dossier */}
        <div className="lg:col-span-4 space-y-4">
          {activeLineup ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    {activeLineup.is_pareto_optimal && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        PARETO OPTIMAL
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {activeLineup.tier}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">
                    {activeLineup.team} 4-Player Tactical Unit
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Total Points</div>
                  <div className="text-base font-mono font-bold text-cyan-400">
                    {activeLineup.total_points.toFixed(1)} / 8.0
                  </div>
                </div>
              </div>

              {/* 4 Players Roster Badges */}
              <div className="space-y-1.5">
                {activeLineup.player_names?.map((name: string, pIdx: number) => (
                  <div
                    key={pIdx}
                    className="p-2 rounded bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-200 font-medium">{name}</span>
                    <span className="font-mono text-cyan-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px]">
                      {activeLineup.classes?.[pIdx]?.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Net Advantage & Uncertainty Interval */}
              <div className="space-y-2 pt-1 text-xs">
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Net Differential / 100s:</span>
                  <span className={`font-mono font-bold text-sm ${
                    activeLineup.net_per_100s >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    {activeLineup.net_per_100s > 0 ? `+${activeLineup.net_per_100s}` : activeLineup.net_per_100s}
                  </span>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">90% Confidence Interval:</span>
                  <span className="font-mono text-cyan-300">
                    [{activeLineup.ci_90?.[0]}, {activeLineup.ci_90?.[1]}]
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400">Court Minutes:</span>
                    <div className="font-mono font-bold text-white mt-0.5">
                      {activeLineup.court_minutes}m
                    </div>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400">Tries +/-:</span>
                    <div className="font-mono font-bold text-white mt-0.5">
                      {activeLineup.tries_for} - {activeLineup.tries_against}
                    </div>
                  </div>
                </div>
              </div>

              {/* 1-Click Deploy to Tactical Court */}
              {onSendToTacticalCourt && (
                <button
                  onClick={() => onSendToTacticalCourt(activeLineup.player_names, activeLineup.team)}
                  className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-950/30"
                >
                  <Users className="w-4 h-4" />
                  <span>Deploy Lineup to Tactical Court</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-sm">
              Click a lineup dot on the Pareto plot to inspect the unit dossier.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
