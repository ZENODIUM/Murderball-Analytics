"use client";

import React, { useState, useEffect } from "react";
import { Sliders, Shield, Zap, CheckCircle2, AlertTriangle, Lock, Unlock, Play, RefreshCw, Trophy } from "lucide-react";
import { runLineupOptimizer, getRosters } from "@/lib/api";

export default function LineupOptimizerUI() {
  const [tournament, setTournament] = useState("Paris 2024");
  const [teamCode, setTeamCode] = useState("AUS");
  const [objectiveMode, setObjectiveMode] = useState("BALANCED");
  const [lockedIn, setLockedIn] = useState<number[]>([]);
  const [lockedOut, setLockedOut] = useState<number[]>([]);
  const [roster, setRoster] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadRoster() {
      const allRosters = await getRosters();
      const current = allRosters?.[tournament]?.[teamCode]?.players || [];
      setRoster(current);
      setLockedIn([]);
      setLockedOut([]);
    }
    loadRoster();
  }, [tournament, teamCode]);

  async function handleSolve() {
    setLoading(true);
    try {
      const era = tournament.includes("2026")
        ? "ERA_2026_MODERN"
        : tournament.includes("Paris") || tournament.includes("Tokyo") || tournament.includes("Rio")
        ? "ERA_2010_2025"
        : "ERA_PRE_2010";

      const res = await runLineupOptimizer({
        tournament,
        team_code: teamCode,
        rules_era: era,
        objective_mode: objectiveMode,
        locked_in_bibs: lockedIn,
        locked_out_bibs: lockedOut,
        top_k: 5
      });
      setResults(res.lineups || []);
    } catch (err) {
      console.error("Solver error:", err);
    } finally {
      setLoading(false);
    }
  }

  const toggleLockIn = (bib: number) => {
    if (lockedIn.includes(bib)) {
      setLockedIn(lockedIn.filter(b => b !== bib));
    } else {
      setLockedIn([...lockedIn, bib]);
      setLockedOut(lockedOut.filter(b => b !== bib));
    }
  };

  const toggleLockOut = (bib: number) => {
    if (lockedOut.includes(bib)) {
      setLockedOut(lockedOut.filter(b => b !== bib));
    } else {
      setLockedOut([...lockedOut, bib]);
      setLockedIn(lockedIn.filter(b => b !== bib));
    }
  };

  return (
    <div className="space-y-6">
      {/* Optimizer Header */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-amber-400" />
              <span>CP-SAT Constraint Lineup Optimizer</span>
            </h2>
            <p className="text-xs text-slate-400">
              Formulated as an exact integer programming problem solved via Google OR-Tools CP-SAT. Guarantees 100% legal lineups under WWR rules.
            </p>
          </div>

          <button
            onClick={handleSolve}
            disabled={loading}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-2 shadow-lg transition-all"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-slate-950" />}
            <span>Solve Optimal Lineups</span>
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-4 border-t border-slate-800">
          <div>
            <label className="text-slate-400 block mb-1 font-medium">Tournament:</label>
            <select
              value={tournament}
              onChange={e => setTournament(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
            >
              <option value="2026 WWR World Championship">2026 São Paulo (Tiered Female Allowance: +0.5 low / +1.0 high)</option>
              <option value="Paris 2024">Paris 2024 (8.5 w/ +0.5 Flat Female Allowance)</option>
              <option value="Tokyo 2020">Tokyo 2020 (8.5 w/ +0.5 Flat Female Allowance)</option>
              <option value="Rio 2016">Rio 2016 (8.5 w/ +0.5 Flat Female Allowance)</option>
              <option value="London 2012">London 2012 (8.0 Strict Classical)</option>
              <option value="Beijing 2008">Beijing 2008 (8.0 Strict Classical)</option>
              <option value="Athens 2004">Athens 2004 (8.0 Strict Classical)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-medium">National Team:</label>
            <select
              value={teamCode}
              onChange={e => setTeamCode(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
            >
              <option value="AUS">Australia (AUS)</option>
              <option value="USA">USA</option>
              <option value="JPN">Japan (JPN)</option>
              <option value="GBR">Great Britain (GBR)</option>
              <option value="CAN">Canada (CAN)</option>
              <option value="FRA">France (FRA)</option>
              <option value="NZL">New Zealand (NZL)</option>
              <option value="DEN">Denmark (DEN)</option>
              <option value="GER">Germany (GER)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-medium">Tactical Objective:</label>
            <select
              value={objectiveMode}
              onChange={e => setObjectiveMode(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
            >
              <option value="BALANCED">Balanced Synergy (Maximize Point Cap & Screen Efficiency)</option>
              <option value="MAX_OFFENSE">Max Offense (Prioritize High-Pointers & Scoring Pace)</option>
              <option value="MAX_DEFENSE">Max Lockdown Defense (Prioritize 0.5-1.5 Screeners)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Roster Lock Controls */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-200 uppercase tracking-wider">
            {teamCode} Available Roster ({roster.length} Athletes) - Click to Force In / Bench:
          </span>
          <span className="text-slate-400">
            Locked In: <strong className="text-emerald-400">{lockedIn.length}</strong> | Benched: <strong className="text-red-400">{lockedOut.length}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {roster.map(p => {
            const isIn = lockedIn.includes(p.bib);
            const isOut = lockedOut.includes(p.bib);
            return (
              <div
                key={p.bib}
                className={`p-2.5 rounded-xl border text-xs transition-colors flex flex-col justify-between ${
                  isIn
                    ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-200"
                    : isOut
                    ? "bg-red-950/40 border-red-500/50 text-red-300 opacity-60"
                    : "bg-slate-800/80 border-slate-700 text-slate-200"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span>#{p.bib}</span>
                    <span className="text-amber-400 font-mono">{p.sport_class?.toFixed(1)}</span>
                  </div>
                  <div className="truncate font-medium text-slate-100">{p.name}</div>
                  <div className="text-[10px] text-slate-400">{p.gender === "F" ? "Female (+0.5)" : "Male"}</div>
                </div>

                <div className="flex items-center space-x-1.5 mt-2.5 pt-1.5 border-t border-slate-700/50">
                  <button
                    onClick={() => toggleLockIn(p.bib)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex-1 ${isIn ? "bg-emerald-500 text-slate-950" : "bg-slate-700 hover:bg-slate-600 text-slate-300"}`}
                  >
                    Force IN
                  </button>
                  <button
                    onClick={() => toggleLockOut(p.bib)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex-1 ${isOut ? "bg-red-500 text-white" : "bg-slate-700 hover:bg-slate-600 text-slate-300"}`}
                  >
                    Bench
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Solver Results */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Optimal Legal Lineup Combinations ({results.length} Found)</span>
        </h3>

        {results.length === 0 && !loading && (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl">
            Click &quot;Solve Optimal Lineups&quot; above to calculate legal 4-athlete units using CP-SAT.
          </div>
        )}

        <div className="space-y-3">
          {results.map((l: any) => (
            <div key={l.rank} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 hover:border-slate-700 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center space-x-2.5">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs">
                    #{l.rank}
                  </span>
                  <span className="font-bold text-slate-100 text-sm">{l.tactical_archetype}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                    WWR Legal: {l.total_classification_points} / {l.allowed_classification_cap} pts
                  </span>
                  {l.female_count > 0 && (
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[11px]">
                      +{l.female_count * 0.5} Female Allowance Applied
                    </span>
                  )}
                </div>
              </div>

              {/* 4 Selected Athletes */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {l.players?.map((p: any) => (
                  <div key={p.bib} className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-xs">
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span className="text-slate-100">#{p.bib}</span>
                      <span className="text-amber-400 font-mono">{p.sport_class?.toFixed(1)}</span>
                    </div>
                    <div className="font-semibold text-slate-200 truncate">{p.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{p.sport_class <= 1.5 ? "Screen / Support" : "Ball Carrier / Slasher"}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
