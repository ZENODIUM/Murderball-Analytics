"use client";

import React, { useState, useEffect } from "react";
import { getRuleShiftLab } from "../lib/api";
import {
  Sliders, Shield, Users, Award, CheckCircle2,
  AlertCircle, ArrowRight, Zap, Scale, Layers
} from "lucide-react";

interface RuleShiftProps {
  onSendToTacticalCourt?: (lineupNames: string[], teamCode: string) => void;
}

export default function RuleShiftLabUI({ onSendToTacticalCourt }: RuleShiftProps) {
  const [data, setData] = useState<any>({ rulesets_definition: {}, roster_evaluations: [] });
  const [selectedTourney, setSelectedTourney] = useState<string>("Paris 2024");
  const [selectedTeam, setSelectedTeam] = useState<string>("AUS");
  const [activeRulesetKey, setActiveRulesetKey] = useState<string>("current_2024");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getRuleShiftLab();
        setData(res);
      } catch (err) {
        console.error("Failed to load RuleShift data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const tourneys = ["Paris 2024", "Tokyo 2020", "Rio 2016", "London 2012", "Beijing 2008", "Athens 2004"];
  const evalsForTourney = data.roster_evaluations?.filter((e: any) => e.tournament === selectedTourney) || [];
  const activeEval = evalsForTourney.find((e: any) => e.team_code === selectedTeam) || evalsForTourney[0];

  const rulesets = data.rulesets_definition || {};

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <Sliders className="w-6 h-6 animate-spin mr-3 text-cyan-400" />
        <span>Loading RuleShift Combinatorial Simulator...</span>
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
                REGULATORY SIMULATION LAB
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                COMBINATORIAL LEGALITY
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Scale className="w-7 h-7 text-cyan-400" />
              RuleShift Lab: Classification Cap Sensitivity Simulator
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Model how regulatory changes (2004 Strict 8.0, 2024 Flat Female Allowance, 2026 Tiered Female Allowance: +0.5 / +1.0, 7.5 Parity, 9.0 Power) expand or restrict roster possibilities.
            </p>
          </div>

          {/* Tournament & Team Pickers */}
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              aria-label="Select Paralympic tournament edition"
              className="bg-slate-800 text-sm text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 outline-none cursor-pointer"
              value={selectedTourney}
              onChange={e => {
                setSelectedTourney(e.target.value);
                const nextEvals = data.roster_evaluations?.filter((x: any) => x.tournament === e.target.value) || [];
                if (nextEvals.length > 0) setSelectedTeam(nextEvals[0].team_code);
              }}
            >
              {tourneys.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <select
              aria-label="Select national team squad"
              className="bg-slate-800 text-sm text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 outline-none cursor-pointer"
              value={selectedTeam}
              onChange={e => setSelectedTeam(e.target.value)}
            >
              {evalsForTourney.map((e: any) => (
                <option key={e.team_code} value={e.team_code}>
                  {e.team_code} ({e.team_name})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Ruleset Toggle Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(rulesets).map(([key, rInfo]: [string, any]) => {
          const isSelected = activeRulesetKey === key;
          const currentStats = activeEval?.ruleset_breakdown?.[key];
          return (
            <button
              key={key}
              onClick={() => setActiveRulesetKey(key)}
              className={`p-4 rounded-xl border text-left transition-all ${
                isSelected
                  ? "bg-slate-800/90 border-cyan-500 shadow-md shadow-cyan-950/20"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-mono text-cyan-400">
                  {key === "current_2024" ? "CURRENT OFFICIAL" : key === "legacy_2004" ? "LEGACY HISTORICAL" : "HYPOTHETICAL"}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-950 text-slate-300 border border-slate-800">
                  {rInfo.base_cap.toFixed(1)} pts
                </span>
              </div>
              <div className="text-sm font-bold text-white mb-1">
                {rInfo.name}
              </div>
              <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                {rInfo.description}
              </p>
              {currentStats && (
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Legal Lineups:</span>
                  <span className="font-bold text-white">
                    {currentStats.legal_lineups_count} ({currentStats.legal_pct}%)
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Evaluation Breakdown for Selected Team */}
      {activeEval && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Combinatorial Roster Impact */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                  Roster Combinatorial Profile
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {activeEval.team_name} ({activeEval.tournament})
                </h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Roster Athletes:</span>
                <div className="text-sm font-mono font-bold text-white">
                  {activeEval.roster_size} players ({activeEval.female_athletes_count} female)
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
                <span className="text-slate-400">Theoretical 4-Player Combos:</span>
                <div className="text-xl font-mono font-bold text-white mt-1">
                  {activeEval.total_theoretical_lineups}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">C({activeEval.roster_size}, 4)</span>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
                <span className="text-slate-400">Flexibility Index:</span>
                <div className="text-xl font-mono font-bold text-cyan-400 mt-1">
                  {activeEval.tactical_flexibility_score}%
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Lineup pool legality</span>
              </div>
            </div>

            {/* Comparative Legality Bar Chart */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Lineup Count by Ruleset Environment
              </div>

              {Object.entries(activeEval.ruleset_breakdown || {}).map(([rKey, stats]: [string, any]) => {
                const isSelected = rKey === activeRulesetKey;
                return (
                  <div key={rKey} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-semibold ${isSelected ? "text-cyan-400 font-bold" : "text-slate-300"}`}>
                        {rulesets[rKey]?.name || rKey}
                      </span>
                      <span className="font-mono text-slate-300">
                        {stats.legal_lineups_count} / {activeEval.total_theoretical_lineups} ({stats.legal_pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isSelected ? "bg-cyan-500" : "bg-slate-700"
                        }`}
                        style={{ width: `${stats.legal_pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Tactical Implications & Unlocked Capabilities */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                Strategic Implications under {rulesets[activeRulesetKey]?.name}
              </h3>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              {/* Female Allowance Impact */}
              <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between font-bold text-white">
                  <span>Female Bonus Lineup Unlocks:</span>
                  <span className="font-mono text-emerald-400">
                    +{activeEval.female_bonus_unlocked_lineups} Lineups
                  </span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  In the 2010–2025 cycle, a flat +0.5 allowance applied. Under 2026 WWR rules, female allowances expand to +1.0 for mid/high-pointers (2.0–3.5) and +0.5 for low-pointers (0.5–1.5), unlocking even higher mobility configurations for {activeEval.team_code} without sacrificing classification integrity.
                </p>
              </div>

              {/* Parity Cap Impact */}
              <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between font-bold text-white">
                  <span>7.5 Parity Cap Restrictions:</span>
                  <span className="font-mono text-rose-400">
                    -{activeEval.parity_cap_eliminated_lineups} Lineups Banned
                  </span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Lowering the cap to 7.5 eliminates {activeEval.parity_cap_eliminated_lineups} lineups, banning all dual 3.5 super-pairings (3.5 + 3.5 + 0.5 + 0.5 = 8.0). This would force coaches to integrate lower classification athletes (0.5 to 1.5) on every single possession.
                </p>
              </div>

              {/* Lineup Composition Breakdown */}
              <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 space-y-2">
                <div className="font-bold text-white">Tactical Unit Diversity:</div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-slate-400">Dual High-Pointer Sets:</span>
                    <div className="text-sm font-mono font-bold text-amber-400">
                      {activeEval.ruleset_breakdown?.[activeRulesetKey]?.dual_high_pointer_lineups || 0} lineups
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Low-Pointer Heavy Sets (&ge; 2):</span>
                    <div className="text-sm font-mono font-bold text-emerald-400">
                      {activeEval.ruleset_breakdown?.[activeRulesetKey]?.low_pointer_heavy_lineups || 0} lineups
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
