"use client";

import React, { useState } from "react";
import {
  Trophy, Shield, Users, Activity, AlertCircle, ArrowUpRight,
  CheckCircle2, ChevronRight, Award, GitCommit, Grid, Share2,
  Scale, Compass, TrendingUp
} from "lucide-react";

interface CommandCenterProps {
  onNavigateTab: (tab: string) => void;
  rankings: any;
  qualityReport: any;
  researchData: any;
}

export default function CommandCenter({ onNavigateTab, rankings, qualityReport, researchData }: CommandCenterProps) {
  const [showAnomalyDetail, setShowAnomalyDetail] = useState(false);

  const flagship = researchData?.hypotheses?.[0] || {};
  const rankList = rankings?.rankings || [];

  return (
    <div className="space-y-8">
      {/* Flagship Headline Research Card */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold tracking-wide uppercase">
            <Award className="w-3.5 h-3.5" />
            <span>Flagship Research Discovery</span>
          </div>
          <span className="text-xs font-mono text-slate-400">Sample: 44 Paralympic Matches | 3,379 Tries | 4,047 Assists/Blocks</span>
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight mb-3">
          The 0.5-Point Asymmetry: How Low-Class Screeners Drive Elite Wheelchair Rugby Scoring
        </h2>
        <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-4xl mb-6">
          Official box score analysis demonstrates that Class 0.5 support athletes score just <strong className="text-amber-400">0.1%</strong> of all tries (3 of 3,379 recorded in 2004/2008), yet execute <strong className="text-amber-400">28.1%</strong> of all recorded Assist Blocks (<code className="text-amber-300">AB</code>) — outperforming 3.5 primary carriers by a factor of 7.6x. High-pointers cannot score without low-pointer screeners sacrificing chair contact to clear driving lanes.
        </p>

        {/* Key Comparison Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className="text-xs font-medium text-slate-400 mb-1">0.5 Try Share</div>
            <div className="text-2xl font-black text-slate-100">0.1%</div>
            <div className="text-[11px] text-slate-400">3 total tries scored</div>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30">
            <div className="text-xs font-medium text-amber-300 mb-1">0.5 Assist Block Share</div>
            <div className="text-2xl font-black text-amber-400">28.1%</div>
            <div className="text-[11px] text-amber-200/70">364 direct scoring picks</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className="text-xs font-medium text-slate-400 mb-1">Low-Point Block Share (0.5-1.5)</div>
            <div className="text-2xl font-black text-slate-100">46.6%</div>
            <div className="text-[11px] text-slate-400">Majority of try-creation</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className="text-xs font-medium text-slate-400 mb-1">Statistical Test Significance</div>
            <div className="text-2xl font-black text-emerald-400">p &lt; 10⁻²⁴⁰</div>
            <div className="text-[11px] text-slate-400">Cramér&apos;s V = 0.56 (Substantial)</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => onNavigateTab("research")} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg flex items-center space-x-1.5 transition-colors">
            <span>Explore Complete Research Portfolio</span>
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => onNavigateTab("championships")} className="px-4 py-2 bg-amber-950/60 hover:bg-amber-900/60 text-amber-200 text-xs font-semibold rounded-lg border border-amber-500/40 flex items-center space-x-1.5 transition-colors">
            <Trophy className="w-4 h-4" />
            <span>Major Championships (10)</span>
          </button>
          <button onClick={() => onNavigateTab("rankings")} className="px-4 py-2 bg-blue-950/60 hover:bg-blue-900/60 text-blue-200 text-xs font-semibold rounded-lg border border-blue-500/40 flex items-center space-x-1.5 transition-colors">
            <span>World Rankings (32 Nations)</span>
          </button>
          <button onClick={() => onNavigateTab("optimizer")} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-colors">
            <span>Lineup Solver</span>
          </button>
        </div>
      </div>

      {/* Aggregate Pipeline Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Paralympic Games</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-100">120 / 120</div>
          <div className="text-xs text-emerald-400 mt-1 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
            <span>100.0% Score Reconciled</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Lineup Stints</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-100">5,148</div>
          <div className="text-xs text-slate-400 mt-1">
            <span>On-court substitutions</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Play-by-Play Events</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-100">21,490</div>
          <div className="text-xs text-slate-400 mt-1">
            <span>Tries, turnovers, blocks</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">World Championships</span>
            <Shield className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-100">112</div>
          <div className="text-xs text-slate-400 mt-1">
            <span>1995, 2014, 2018, 2022 summaries</span>
          </div>
        </div>
      </div>

      {/* Frontier Tactical Intelligence & Decision Engines Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-wide">
                NEW ANALYTICAL INNOVATIONS
              </span>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wide">
                AQX FRONTIER LABS
              </span>
            </div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              Frontier Decision Intelligence & Tactical Engines
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Beyond Standard Dashboards &bull; Rooted in 120 Paralympic Matches
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Decision Mirror */}
          <div
            onClick={() => onNavigateTab("decision_mirror")}
            className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 cursor-pointer transition-all duration-200 group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-105 transition-transform">
                <GitCommit className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono text-cyan-400 font-semibold flex items-center gap-1">
                45 Dossiers <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
              Decision Mirror
            </h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Examine critical timeouts and substitutions with pre-120s context, observed aftermath, and modeled counterfactual alternatives with 90% CIs.
            </p>
          </div>

          {/* Scoring Pressure Atlas */}
          <div
            onClick={() => onNavigateTab("pressure_atlas")}
            className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850 cursor-pointer transition-all duration-200 group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                <Grid className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                85 Discrete States <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <h4 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
              Pressure Atlas & Momentum
            </h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              2D discretized game state matrix mapping next-try probability and turnover hazard across Period and Margin. Includes timeout efficacy on 318 runs.
            </p>
          </div>

          {/* Lineup Constellation */}
          <div
            onClick={() => onNavigateTab("constellation")}
            className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-850 cursor-pointer transition-all duration-200 group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-105 transition-transform">
                <Share2 className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono text-purple-400 font-semibold flex items-center gap-1">
                1,207 Co-play Edges <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <h4 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
              Lineup Constellation
            </h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Interactive orbit network of player partnerships, shared court minutes, and net rating synergies across national wheelchair rugby squads.
            </p>
          </div>

          {/* Lineup Confidence Frontier */}
          <div
            onClick={() => onNavigateTab("frontier")}
            className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-850 cursor-pointer transition-all duration-200 group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono text-amber-400 font-semibold flex items-center gap-1">
                Pareto Optimal <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <h4 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
              Confidence Frontier
            </h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Pareto tradeoff analysis comparing Net Points per 100s against historical minutes exposure with shrinkage uncertainty intervals.
            </p>
          </div>

          {/* RuleShift Lab */}
          <div
            onClick={() => onNavigateTab("ruleshift")}
            className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 hover:bg-slate-850 cursor-pointer transition-all duration-200 group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 group-hover:scale-105 transition-transform">
                <Scale className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono text-rose-400 font-semibold flex items-center gap-1">
                4 Rulesets <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <h4 className="text-base font-bold text-white group-hover:text-rose-300 transition-colors">
              RuleShift Lab
            </h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Combinatorial simulator modeling how female allowances (+0.5) and hypothetical caps (7.5 vs 9.0) reshape national roster viability.
            </p>
          </div>

          {/* Player Archetype Discovery */}
          <div
            onClick={() => onNavigateTab("archetypes")}
            className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-850 cursor-pointer transition-all duration-200 group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono text-blue-400 font-semibold flex items-center gap-1">
                5 Clusters (268 Athletes) <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <h4 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
              Player Archetypes
            </h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Unsupervised PCA clustering and 5-axis functional radar ratings across Ball Carriers, Corner Screeners, Defensive Anchors, and Floor Generals.
            </p>
          </div>
        </div>
      </div>

      {/* Official 2026 Rankings Anomaly Inspector Banner */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-indigo-500/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Official WWR World Rankings (August 29, 2026 Snapshot)</h3>
              <p className="text-xs text-slate-400">Source: World Wheelchair Rugby official rankings. Preserved authentic source records without data smoothing.</p>
            </div>
          </div>
          <button onClick={() => setShowAnomalyDetail(!showAnomalyDetail)} className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold rounded-lg border border-indigo-500/40 transition-colors">
            {showAnomalyDetail ? "Hide Anomaly Inspector" : "Inspect Official Anomalies (Israel & Poland)"}
          </button>
        </div>

        {/* Detailed Anomaly Explanation */}
        {showAnomalyDetail && (
          <div className="mt-4 p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/40 text-xs space-y-3">
            <div className="font-bold text-indigo-200 uppercase tracking-wider">Documented WWR Source Anomalies (Preserved Intentionally):</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-900/80 rounded-lg border border-indigo-500/20">
                <span className="font-bold text-amber-400">Rank #23 - Israel:</span>
                <p className="text-slate-300 mt-1">
                  In the official WWR table, Israel&apos;s points column contains the character string <code className="text-amber-300 font-mono bg-slate-800 px-1 py-0.5 rounded">&apos;c&apos;</code> rather than a float. Our pipeline preserves this exact value and documents the parser exception.
                </p>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-lg border border-indigo-500/20">
                <span className="font-bold text-amber-400">Rank #26 - Poland:</span>
                <p className="text-slate-300 mt-1">
                  Poland appears duplicated with two official rows in the WWR release. Row 1 has points 26.50, and Row 2 has points 24.38. Both rows are cataloged with distinct internal identifiers to maintain transparency.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-2 px-3">Rank</th>
                <th className="py-2 px-3">Country</th>
                <th className="py-2 px-3">Zone</th>
                <th className="py-2 px-3 text-right">Points</th>
                <th className="py-2 px-3 text-right">Prev Rank</th>
                <th className="py-2 px-3 text-right">Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {rankList.slice(0, 8).map((r: any) => (
                <tr key={r.rank} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-bold text-slate-200">#{r.rank}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-100 flex items-center space-x-2">
                    <span>{r.country}</span>
                    {r.rank === 1 && <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 text-[10px] rounded font-bold">#1 WORLD</span>}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{r.zone}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-300">{r.points}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-400">#{r.previous_rank}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-400">{r.rank_diff >= 0 ? `+${r.rank_diff}` : r.rank_diff}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Era & Paralympic Coverage Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-100">Paralympic Games Coverage (2004 – 2024)</h3>
          <span className="text-xs text-slate-400">6 Editions | 120 Detailed Matches Extracted</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { tourn: "Paris 2024", matches: 20, gold: "JPN", silver: "USA", bronze: "AUS", era: "2024 (8.5 w/ Female Allowance)", venue: "Champ-de-Mars Arena", id: "PAR24_M01" },
            { tourn: "Tokyo 2020", matches: 18, gold: "GBR", silver: "USA", bronze: "JPN", era: "2020 (8.5 w/ Female Allowance)", venue: "Yoyogi National Stadium", id: "TKY20_M01" },
            { tourn: "Rio 2016", matches: 18, gold: "AUS", silver: "USA", bronze: "JPN", era: "2016 (8.5 w/ Female Allowance)", venue: "Carioca Arena 1", id: "RIO16_M01" },
            { tourn: "London 2012", matches: 20, gold: "AUS", silver: "CAN", bronze: "USA", era: "2012 (8.0 Strict)", venue: "Basketball Arena", id: "LON12_M20" },
            { tourn: "Beijing 2008", matches: 20, gold: "USA", silver: "AUS", bronze: "CAN", era: "2008 (Split-Col, AS/AB)", venue: "USTB Gymnasium", id: "BEI08_M01" },
            { tourn: "Athens 2004", matches: 24, gold: "NZL", silver: "CAN", bronze: "USA", era: "2004 (Split-Col, AS/AB)", venue: "Helliniko Indoor Arena", id: "ATH04_M01" }
          ].map(t => (
            <div key={t.tourn} className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-100">{t.tourn}</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300">{t.matches} Matches</span>
              </div>
              <div className="text-xs text-slate-400 mb-3">{t.venue} | {t.era}</div>
              <div className="flex items-center space-x-3 text-xs mb-4">
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <strong className="text-slate-200">1st: {t.gold}</strong>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span className="text-slate-300">2nd: {t.silver}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-amber-700" />
                  <span className="text-slate-300">3rd: {t.bronze}</span>
                </span>
              </div>
              <button onClick={() => onNavigateTab("matches")} className="w-full py-1.5 text-center text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors">
                Browse Tournament Matches →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
