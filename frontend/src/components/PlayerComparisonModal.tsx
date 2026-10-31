"use client";

import React from "react";
import { Star, Shield, Zap, Target, Crosshair, ArrowRight, UserCheck, X } from "lucide-react";

export interface RatedPlayer {
  player_name: string;
  team: string;
  classification: number;
  role: string;
  career_minutes: number;
  matches_played: number;
  tournaments_count: number;
  tournaments: string[];
  career_tries: number;
  career_blocks: number;
  career_turnovers: number;
  career_steals: number;
  career_fouls?: number;
  career_rapm: number;
  star_rating: number;
  composite_score: number;
  tier: string;
  radar: {
    scoring_efficiency: number;
    assist_screening: number;
    ball_security: number;
    defensive_disruption: number;
    net_rapm_value: number;
  };
}

interface PlayerComparisonModalProps {
  players: RatedPlayer[];
  onClose: () => void;
  onSendToCourt?: (player: RatedPlayer) => void;
}

export function PlayerComparisonModal({
  players,
  onClose,
  onSendToCourt
}: PlayerComparisonModalProps) {
  if (!players || players.length === 0) return null;

  // Radar polygon generator
  const dimensions = [
    { key: "scoring_efficiency", label: "Scoring Efficiency", icon: Target },
    { key: "assist_screening", label: "Assist & Screen", icon: Shield },
    { key: "ball_security", label: "Ball Security", icon: Crosshair },
    { key: "defensive_disruption", label: "Def. Disruption", icon: Zap },
    { key: "net_rapm_value", label: "Net RAPM Impact", icon: Star }
  ];

  const size = 260;
  const center = size / 2;
  const radius = 95;
  const angleStep = (2 * Math.PI) / dimensions.length;

  // Calculate polygon points for each player
  const colors = [
    { stroke: "#3b82f6", fill: "rgba(59, 130, 246, 0.25)", text: "text-blue-400", bg: "bg-blue-500" },
    { stroke: "#f59e0b", fill: "rgba(245, 158, 11, 0.25)", text: "text-amber-400", bg: "bg-amber-500" },
    { stroke: "#10b981", fill: "rgba(16, 185, 129, 0.25)", text: "text-emerald-400", bg: "bg-emerald-500" }
  ];

  function getPolygonPoints(player: RatedPlayer) {
    return dimensions.map((dim, i) => {
      const val = (player.radar as any)?.[dim.key] || 50;
      const normalized = Math.max(10, Math.min(100, val)) / 100;
      const r = normalized * radius;
      const angle = i * angleStep - Math.PI / 2;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${x},${y}`;
    }).join(" ");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Multi-Athlete Evaluation Matrix
            </span>
            <h2 className="text-xl font-bold text-white">
              Side-by-Side Athlete Comparison & Functional Radar
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Interactive Radar Chart */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 lg:col-span-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Role Performance Overlay
            </h3>

            <div className="relative">
              <svg width={size} height={size} className="overflow-visible">
                {/* Background concentric polygons */}
                {[0.25, 0.5, 0.75, 1.0].map((level, idx) => {
                  const pts = dimensions.map((_, i) => {
                    const r = level * radius;
                    const angle = i * angleStep - Math.PI / 2;
                    return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
                  }).join(" ");
                  return (
                    <polygon
                      key={idx}
                      points={pts}
                      fill="none"
                      stroke="#27272a"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Spoke lines */}
                {dimensions.map((dim, i) => {
                  const angle = i * angleStep - Math.PI / 2;
                  const x = center + radius * Math.cos(angle);
                  const y = center + radius * Math.sin(angle);
                  return (
                    <line
                      key={dim.key}
                      x1={center}
                      y1={center}
                      x2={x}
                      y2={y}
                      stroke="#3f3f46"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                    />
                  );
                })}

                {/* Player Polygons */}
                {players.map((p, idx) => (
                  <polygon
                    key={p.player_name}
                    points={getPolygonPoints(p)}
                    fill={colors[idx % colors.length].fill}
                    stroke={colors[idx % colors.length].stroke}
                    strokeWidth="2.5"
                  />
                ))}
              </svg>
            </div>

            {/* Radar Legend */}
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs">
              {players.map((p, idx) => (
                <div key={p.player_name} className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${colors[idx % colors.length].bg}`} />
                  <span className="font-semibold text-white">{p.player_name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Comparative Stat Dossier */}
          <div className="space-y-4 lg:col-span-7">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {players.map((p, idx) => (
                <div
                  key={p.player_name}
                  className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      idx === 0 ? "border-blue-500/40 text-blue-400 bg-blue-500/10" :
                      idx === 1 ? "border-amber-500/40 text-amber-400 bg-amber-500/10" :
                      "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                    }`}>
                      Class {p.classification.toFixed(1)}
                    </span>
                    <span className="text-xs font-bold text-zinc-400">{p.team}</span>
                  </div>

                  <h4 className="mt-2 text-sm font-bold text-white truncate" title={p.player_name}>
                    {p.player_name}
                  </h4>
                  <p className="text-[11px] text-zinc-400">{p.role}</p>

                  {/* Star Rating Badge */}
                  <div className="mt-3 flex items-center justify-between border-t border-zinc-800/80 pt-2.5">
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-white text-xs">{p.star_rating.toFixed(1)}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-amber-300">{p.tier}</span>
                  </div>

                  {/* Stat Metrics */}
                  <div className="mt-3 space-y-1.5 text-[11px] font-mono">
                    <div className="flex justify-between text-zinc-400">
                      <span>Minutes:</span>
                      <span className="text-white font-semibold">{p.career_minutes}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Tries:</span>
                      <span className="text-white font-semibold">{p.career_tries}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Assist Blocks:</span>
                      <span className="text-white font-semibold">{p.career_blocks}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Turnovers:</span>
                      <span className="text-white font-semibold">{p.career_turnovers}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Ridge RAPM:</span>
                      <span className={p.career_rapm > 0 ? "text-emerald-400 font-semibold" : "text-zinc-400"}>
                        {p.career_rapm > 0 ? `+${p.career_rapm.toFixed(3)}` : p.career_rapm.toFixed(3)}
                      </span>
                    </div>
                  </div>

                  {/* Send to Tactical Court Button */}
                  {onSendToCourt && (
                    <button
                      onClick={() => onSendToCourt(p)}
                      className="mt-4 w-full flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 py-1.5 text-[11px] font-semibold text-white hover:bg-zinc-700 transition-colors"
                    >
                      <UserCheck className="h-3.5 w-3.5" /> Add to Court Lineup
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Scientific Shrinkage Footnote */}
            <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3 text-[11px] text-zinc-400">
              <span className="font-semibold text-zinc-300">Empirical Bayes Shrinkage Active:</span> Ratings are stabilized with role-stratified priors ($M_0 = 24.0$ minutes) to prevent small-sample distortion for low-minute reserves while preserving true separation among high-volume veterans.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
