"use client";

import React, { useState } from "react";
import { Play, RotateCcw, TrendingUp, Shield, Activity, RefreshCw } from "lucide-react";
import { runMonteCarloSimulation } from "@/lib/api";

export default function ScenarioLab() {
  const [period, setPeriod] = useState<number>(3);
  const [clockSeconds, setClockSeconds] = useState<number>(240);
  const [scoreA, setScoreA] = useState<number>(36);
  const [scoreB, setScoreB] = useState<number>(34);
  const [eloDiff, setEloDiff] = useState<number>(45);
  const [simulation, setSimulation] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const res = await runMonteCarloSimulation({
        current_period: period,
        clock_remaining_seconds: clockSeconds,
        score_a: scoreA,
        score_b: scoreB,
        elo_diff_a: eloDiff,
        iterations: 500
      });
      setSimulation(res);
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Run initial simulation on load if none
  React.useEffect(() => {
    handleSimulate();
  }, []);

  const formatClock = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="space-y-6">
      {/* Simulation Controls Header */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <Activity className="w-5 h-5 text-amber-400" />
              <span>Probabilistic Monte Carlo Scenario Lab</span>
            </h2>
            <p className="text-xs text-slate-400">
              Simulates 500 stochastic match continuations based on calibrated logistic next-score models and possession hazard rates.
            </p>
          </div>

          <button
            onClick={handleSimulate}
            disabled={loading}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-2 shadow-lg transition-all"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-slate-950" />}
            <span>Run 500 Iterations</span>
          </button>
        </div>

        {/* In-Game State Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Game Period:</label>
            <select
              value={period}
              onChange={e => setPeriod(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
            >
              <option value={1}>Period 1 (Start)</option>
              <option value={2}>Period 2</option>
              <option value={3}>Period 3</option>
              <option value={4}>Period 4 (Clutch)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Clock Remaining: {formatClock(clockSeconds)}</label>
            <input
              type="range"
              min={10}
              max={480}
              step={10}
              value={clockSeconds}
              onChange={e => setClockSeconds(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer mt-2"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Team A Score:</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={scoreA}
                onChange={e => setScoreA(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 font-mono text-slate-100 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Team B Score:</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={scoreB}
                onChange={e => setScoreB(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 font-mono text-slate-100 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Pre-Match Elo Diff: {eloDiff > 0 ? `+${eloDiff}` : eloDiff}</label>
            <input
              type="range"
              min={-200}
              max={200}
              step={10}
              value={eloDiff}
              onChange={e => setEloDiff(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer mt-2"
            />
          </div>
        </div>
      </div>

      {/* Simulation Results Display */}
      {simulation && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Win Probability Gauge Card */}
          <div className="md:col-span-6 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Simulated Win Probability</h3>

            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-emerald-400">Team A: {(simulation.win_probability_a * 100).toFixed(1)}%</span>
                <span className="text-blue-400">Team B: {(simulation.win_probability_b * 100).toFixed(1)}%</span>
              </div>

              <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden flex">
                <div style={{ width: `${simulation.win_probability_a * 100}%` }} className="bg-emerald-500 transition-all duration-300" />
                <div style={{ width: `${simulation.win_probability_b * 100}%` }} className="bg-blue-500 transition-all duration-300" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-4 border-t border-slate-800">
              <div className="p-3 bg-slate-800/60 rounded-xl">
                <span className="text-slate-400 block">Regulation Overtime Likelihood:</span>
                <strong className="text-amber-400 font-mono text-base">{(simulation.regulation_tie_probability * 100).toFixed(1)}%</strong>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl">
                <span className="text-slate-400 block">Iterations Completed:</span>
                <strong className="text-slate-100 font-mono text-base">{simulation.iterations} runs</strong>
              </div>
            </div>
          </div>

          {/* Projected Score Intervals */}
          <div className="md:col-span-6 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Expected Final Score Distribution</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-center">
                <div className="text-xs text-emerald-400 font-semibold mb-1">Team A Final Score</div>
                <div className="text-4xl font-black font-mono text-slate-100">{simulation.projected_score_a.median}</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  80% Interval: [{simulation.projected_score_a.p10} - {simulation.projected_score_a.p90}]
                </div>
              </div>

              <div className="p-4 bg-blue-950/20 border border-blue-500/30 rounded-xl text-center">
                <div className="text-xs text-blue-400 font-semibold mb-1">Team B Final Score</div>
                <div className="text-4xl font-black font-mono text-slate-100">{simulation.projected_score_b.median}</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  80% Interval: [{simulation.projected_score_b.p10} - {simulation.projected_score_b.p90}]
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 italic pt-2">
              Model Note: Wheelchair rugby possessions average ~25 seconds under the 40-second shot clock. Forecast updates dynamically with score differential and pre-match Elo ratings.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
