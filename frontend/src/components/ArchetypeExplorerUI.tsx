"use client";

import React, { useState, useEffect } from "react";
import { getPlayerArchetypes } from "../lib/api";
import {
  Compass, Users, Target, Shield, Zap,
  ArrowUpRight, Filter, ChevronRight, Activity, Crosshair
} from "lucide-react";

interface ArchetypeExplorerProps {
  onSelectPlayer?: (playerName: string) => void;
}

export default function ArchetypeExplorerUI({ onSelectPlayer }: ArchetypeExplorerProps) {
  const [data, setData] = useState<any>({ archetypes: [], profiles: [] });
  const [selectedArchId, setSelectedArchId] = useState<string>("ALL");
  const [selectedPlayerName, setSelectedPlayerName] = useState<string>("BATT Ryley");
  const [teamFilter, setTeamFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getPlayerArchetypes();
        setData(res);
        if (res.profiles?.length > 0) {
          setSelectedPlayerName(res.profiles[0].name);
        }
      } catch (err) {
        console.error("Failed to load archetypes:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const archetypes = data.archetypes || [];
  const profiles = data.profiles || [];

  const filteredProfiles = profiles.filter((p: any) => {
    if (selectedArchId !== "ALL" && p.archetype_id !== selectedArchId) return false;
    if (teamFilter !== "ALL" && p.team !== teamFilter) return false;
    return true;
  });

  const activePlayer = profiles.find((p: any) => p.name === selectedPlayerName) || filteredProfiles[0];

  const getArchetypeColor = (archId: string) => {
    switch (archId) {
      case "apex_carrier": return "text-amber-400 bg-amber-500/20 border-amber-500/30";
      case "corner_screener": return "text-emerald-400 bg-emerald-500/20 border-emerald-500/30";
      case "defensive_anchor": return "text-teal-400 bg-teal-500/20 border-teal-500/30";
      case "floor_general": return "text-cyan-400 bg-cyan-500/20 border-cyan-500/30";
      case "transition_hybrid": return "text-purple-400 bg-purple-500/20 border-purple-500/30";
      default: return "text-slate-400 bg-slate-800 border-slate-700";
    }
  };

  const getDotColor = (archId: string) => {
    switch (archId) {
      case "apex_carrier": return "#f59e0b"; // amber
      case "corner_screener": return "#10b981"; // emerald
      case "defensive_anchor": return "#14b8a6"; // teal
      case "floor_general": return "#06b6d4"; // cyan
      case "transition_hybrid": return "#a855f7"; // purple
      default: return "#94a3b8";
    }
  };

  const uniqueTeams = Array.from(new Set(profiles.map((p: any) => p.team))).filter(Boolean).sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <Activity className="w-6 h-6 animate-spin mr-3 text-cyan-400" />
        <span>Loading Player Archetype Clusters & PCA Embeddings...</span>
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
                DATA-DERIVED CLUSTERING
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                PCA 2D EMBEDDING
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Compass className="w-7 h-7 text-cyan-400" />
              Player Archetype Discovery: Functional Tactical Roles
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Unsupervised clustering of 268 Paralympic athletes into 5 core wheelchair rugby tactical roles based on authentic match events and box scores.
            </p>
          </div>

          {/* Archetype & Team Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              aria-label="Filter players by archetype cluster"
              className="bg-slate-800 text-sm text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 outline-none cursor-pointer"
              value={selectedArchId}
              onChange={e => setSelectedArchId(e.target.value)}
            >
              <option value="ALL">All 5 Archetypes</option>
              {archetypes.map((a: any) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>

            <select
              aria-label="Filter players by team code"
              className="bg-slate-800 text-sm text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 outline-none cursor-pointer"
              value={teamFilter}
              onChange={e => setTeamFilter(e.target.value)}
            >
              <option value="ALL">All Nations</option>
              {uniqueTeams.map((t: any) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 5 Archetype Cards Carousel / Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {archetypes.map((arch: any) => {
          const isSelected = selectedArchId === arch.id;
          const count = profiles.filter((p: any) => p.archetype_id === arch.id).length;
          return (
            <button
              key={arch.id}
              onClick={() => setSelectedArchId(isSelected ? "ALL" : arch.id)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? "bg-slate-800/90 border-cyan-500 shadow-md shadow-cyan-950/20"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getArchetypeColor(arch.id)}`}>
                  Class {arch.class_range}
                </span>
                <span className="text-[11px] font-mono font-bold text-slate-400">
                  {count} athletes
                </span>
              </div>
              <div className="text-xs font-bold text-white mb-1 line-clamp-1">
                {arch.name}
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {arch.core_attributes}
              </p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 2D PCA Scatter Plot */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold text-slate-300">
              PCA Projection: Scoring Gravity (PC1) vs Defensive Disruption (PC2)
            </span>
            <span className="font-mono text-cyan-400 text-[11px]">
              Showing {filteredProfiles.length} Athletes
            </span>
          </div>

          <div className="relative w-full max-w-[620px] aspect-[4/3] bg-slate-950/60 rounded-xl border border-slate-800 p-2 overflow-hidden">
            <svg viewBox="-5 -4 16 10" className="w-full h-full">
              {/* Axes */}
              <line x1="-5" y1="0" x2="11" y2="0" stroke="#334155" strokeWidth="0.08" strokeDasharray="0.3 0.3" />
              <line x1="0" y1="-4" x2="0" y2="6" stroke="#334155" strokeWidth="0.08" strokeDasharray="0.3 0.3" />

              {/* Axis Labels */}
              <text x="10.5" y="-0.3" fill="#64748b" fontSize="0.4" textAnchor="end" fontFamily="sans-serif">
                PC1 (Scoring Gravity &rarr;)
              </text>
              <text x="0.3" y="5.7" fill="#64748b" fontSize="0.4" textAnchor="start" fontFamily="sans-serif">
                PC2 (Disruption &rarr;)
              </text>

              {/* Athlete Points */}
              {filteredProfiles.map((p: any) => {
                const isSelected = activePlayer?.name === p.name;
                const dotColor = getDotColor(p.archetype_id);
                const dotRadius = isSelected ? 0.38 : Math.min(0.26, Math.max(0.14, Math.sqrt(p.career_minutes) * 0.015));

                return (
                  <g
                    key={p.name}
                    className="cursor-pointer"
                    onClick={() => setSelectedPlayerName(p.name)}
                  >
                    {isSelected && (
                      <circle
                        cx={p.pca_x}
                        cy={p.pca_y}
                        r={dotRadius + 0.15}
                        fill="none"
                        stroke="#22d3ee"
                        strokeWidth="0.06"
                        className="animate-pulse"
                      />
                    )}
                    <circle
                      cx={p.pca_x}
                      cy={p.pca_y}
                      r={dotRadius}
                      fill={dotColor}
                      opacity={isSelected ? 1.0 : 0.75}
                      stroke="#0f172a"
                      strokeWidth="0.04"
                    />
                    {isSelected && (
                      <text
                        x={p.pca_x}
                        y={p.pca_y - 0.4}
                        fill="#f8fafc"
                        fontSize="0.45"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily="sans-serif"
                      >
                        {p.name.split(" ")[0]} ({p.team})
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right: Selected Athlete Functional Dossier */}
        <div className="lg:col-span-4 space-y-4">
          {activePlayer ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getArchetypeColor(activePlayer.archetype_id)}`}>
                    {activePlayer.archetype_name}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">
                    {activePlayer.name}
                  </h3>
                  <div className="text-xs text-slate-400">
                    {activePlayer.team} National Squad &bull; Class {activePlayer.classification.toFixed(1)}
                  </div>
                </div>
              </div>

              {/* 5-Axis Functional Radar Dimensions */}
              <div className="space-y-2.5">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Functional Dimension Ratings (0-100)
                </div>

                <div className="space-y-2">
                  {Object.entries(activePlayer.radar || {}).map(([dim, score]: [string, any]) => {
                    const label = dim.replace("_", " ").toUpperCase();
                    return (
                      <div key={dim} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 capitalize">{dim.replace("_", " ")}</span>
                          <span className="font-mono font-bold text-cyan-400">{score}</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="bg-cyan-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${score}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Match Stats per 32 mins */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400">Tries / 32m:</div>
                  <div className="text-sm font-mono font-bold text-white mt-0.5">
                    {activePlayer.tries_per_32}
                  </div>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400">Steals / 32m:</div>
                  <div className="text-sm font-mono font-bold text-emerald-400 mt-0.5">
                    {activePlayer.steals_per_32}
                  </div>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400">Turnovers / 32m:</div>
                  <div className="text-sm font-mono font-bold text-rose-400 mt-0.5">
                    {activePlayer.turnovers_per_32}
                  </div>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400">Paralympic Mins:</div>
                  <div className="text-sm font-mono font-bold text-cyan-400 mt-0.5">
                    {activePlayer.career_minutes}m
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {onSelectPlayer && (
                <button
                  onClick={() => onSelectPlayer(activePlayer.name)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all mt-2"
                >
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>View in Player Studio</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-sm">
              Click an athlete dot on the PCA plot to inspect their functional radar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
