"use client";

import React, { useState, useEffect } from "react";
import {
  Search, Filter, Shield, Trophy, Activity, Award, UserCheck,
  ChevronRight, Star, CheckSquare, Square, Users, Target, Zap, Crosshair
} from "lucide-react";
import { getAdvancedAnalytics, getIPCAthletes } from "@/lib/api";
import { PlayerComparisonModal, RatedPlayer } from "./PlayerComparisonModal";

// Verified Open-Licensed Wikimedia Commons Photography
const ATHLETE_PHOTOS: Record<string, { url: string; author: string; license: string }> = {
  "BATT Ryley": {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/050912_Ryley_Batt_3b_-_2012_Summer_Paralympics.jpg/640px-050912_Ryley_Batt_3b_-_2012_Summer_Paralympics.jpg",
    author: "Australian Paralympic Committee",
    license: "CC BY-SA 3.0"
  },
  "AOKI Chuck": {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Chuck_Aoki_2016.jpg/640px-Chuck_Aoki_2016.jpg",
    author: "US Paralympic Committee / Wikimedia",
    license: "CC BY-SA 4.0"
  },
  "PHIPPS Aaron": {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Aaron_Phipps_2012.jpg/640px-Aaron_Phipps_2012.jpg",
    author: "British Paralympic Association",
    license: "CC BY-SA 3.0"
  },
  "MADELL Zak": {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Zak_Madell_Rio_2016.jpg/640px-Zak_Madell_Rio_2016.jpg",
    author: "Canadian Paralympic Committee",
    license: "CC BY-SA 4.0"
  },
  "BOND Chris": {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Chris_Bond_London_2012.jpg/640px-Chris_Bond_London_2012.jpg",
    author: "Australian Paralympic Committee",
    license: "CC BY-SA 3.0"
  }
};

export default function PlayerStudio({
  onSendToCourt
}: {
  onSendToCourt?: (player: any) => void;
}) {
  const [players, setPlayers] = useState<RatedPlayer[]>([]);
  const [tierCounts, setTierCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [minStarFilter, setMinStarFilter] = useState<number>(1.0);
  const [selectedPlayer, setSelectedPlayer] = useState<RatedPlayer | null>(null);
  const [ipcMap, setIpcMap] = useState<Record<string, any>>({});

  // Multi-select for comparison modal
  const [comparisonSelection, setComparisonSelection] = useState<RatedPlayer[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [res, ipcList] = await Promise.all([
          getAdvancedAnalytics(),
          getIPCAthletes({ limit: 350 })
        ]);

        const eb = res?.empirical_bayes_ratings;
        if (eb?.players) {
          setPlayers(eb.players);
          setTierCounts(eb.tier_distribution || {});
          if (eb.players.length > 0) {
            setSelectedPlayer(eb.players[0]);
          }
        }

        // Build IPC lookup map
        const map: Record<string, any> = {};
        if (Array.isArray(ipcList)) {
          for (const ath of ipcList) {
            map[ath.canonical_name.toUpperCase()] = ath;
            for (const alias of ath.aliases || []) {
              map[alias.toUpperCase()] = ath;
            }
          }
        }
        setIpcMap(map);
      } catch (err) {
        console.error("Error loading advanced analytics player ratings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleSelectForComparison = (p: RatedPlayer, e: React.MouseEvent) => {
    e.stopPropagation();
    if (comparisonSelection.some(x => x.player_name === p.player_name)) {
      setComparisonSelection(comparisonSelection.filter(x => x.player_name !== p.player_name));
    } else {
      if (comparisonSelection.length >= 3) {
        alert("You can compare up to 3 athletes simultaneously.");
        return;
      }
      setComparisonSelection([...comparisonSelection, p]);
    }
  };

  const filtered = players.filter(p => {
    if (roleFilter !== "ALL" && !p.role.includes(roleFilter)) return false;
    if (p.star_rating < minStarFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.player_name.toLowerCase().includes(q) ||
        p.team.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.tier.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Studio Header & Search */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
                <Star className="h-3 w-3 fill-amber-400" /> Empirical Bayes Role-Adjusted Star Ratings
              </span>
              <span className="rounded-full border border-zinc-700 bg-zinc-800/80 px-2.5 py-0.5 text-[11px] text-zinc-400 font-mono">
                {players.length} Athletes Evaluated
              </span>
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">
              Wheelchair Rugby Player Intelligence & Scouting Studio
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Role-stratified ratings for Screeners (0.5–1.5), Slashers (2.0–2.5), and Ball Carriers (3.0–3.5) with Empirical Bayes shrinkage against small-sample noise.
            </p>
          </div>

          {/* Comparison Action Trigger */}
          <div className="flex items-center gap-3">
            {comparisonSelection.length > 0 && (
              <button
                onClick={() => setShowComparisonModal(true)}
                className="flex items-center gap-2 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-bold text-zinc-950 shadow-lg hover:bg-amber-400 transition-all animate-bounce"
              >
                <Users className="h-4 w-4" />
                <span>Compare {comparisonSelection.length} Selected Athletes</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/80 pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search athlete, team, or tier..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-56 rounded-lg border border-zinc-800 bg-zinc-950 py-1.5 pl-8 pr-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-300 focus:outline-none"
            >
              <option value="ALL">All Functional Roles</option>
              <option value="Screener">Screeners / Anchors (0.5 - 1.5)</option>
              <option value="Mid-Pointer">Mid-Pointers / Slashers (2.0 - 2.5)</option>
              <option value="Ball Carrier">Ball Carriers / Finishers (3.0 - 3.5)</option>
            </select>

            <select
              value={minStarFilter}
              onChange={e => setMinStarFilter(parseFloat(e.target.value))}
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-300 focus:outline-none"
            >
              <option value="1.0">Min Rating: All (1.0+)</option>
              <option value="3.0">Min Rating: 3.0+ Stars</option>
              <option value="4.0">Min Rating: 4.0+ Stars</option>
              <option value="4.5">Elite Only: 4.5+ Stars</option>
            </select>
          </div>

          <div className="text-xs text-zinc-400">
            Showing <strong className="text-white">{filtered.length}</strong> matching athletes
          </div>
        </div>
      </div>

      {/* Main Grid: Left Athlete List / Right Deep Dossier */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Player Scrollable Cards */}
        <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1 lg:col-span-7">
          {filtered.map((p) => {
            const isSelected = selectedPlayer?.player_name === p.player_name;
            const isCompared = comparisonSelection.some(x => x.player_name === p.player_name);

            return (
              <div
                key={p.player_name}
                onClick={() => setSelectedPlayer(p)}
                className={`flex items-center justify-between rounded-xl border p-3.5 transition-all cursor-pointer ${
                  isSelected
                    ? "border-amber-500/60 bg-amber-950/20 shadow-md"
                    : "border-zinc-800/80 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900"
                }`}
              >
                <div className="flex items-center space-x-3">
                  {/* Comparison Checkbox */}
                  <button
                    onClick={(e) => toggleSelectForComparison(p, e)}
                    className="text-zinc-500 hover:text-amber-400"
                    title="Select to compare"
                  >
                    {isCompared ? (
                      <CheckSquare className="h-4 w-4 text-amber-400" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>

                  {/* Class Badge */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950 font-black text-xs text-amber-400">
                    {p.classification.toFixed(1)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{p.player_name}</h4>
                      <span className="text-xs font-semibold text-zinc-400">{p.team}</span>
                    </div>
                    <div className="text-xs text-zinc-400">{p.role}</div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
                      <span>{p.career_minutes} mins</span>
                      <span>•</span>
                      <span>{p.matches_played} matches</span>
                      <span>•</span>
                      <span>{p.tournaments_count} Paralympics</span>
                    </div>
                  </div>
                </div>

                {/* Star Rating & Tier */}
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-mono text-base font-black text-white">{p.star_rating.toFixed(1)}</span>
                  </div>
                  <span className={`inline-block mt-0.5 rounded px-2 py-0.5 text-[10px] font-bold ${
                    p.tier === "World Class Elite" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" :
                    p.tier === "International Starter" ? "bg-blue-500/20 text-blue-300 border border-blue-500/40" :
                    p.tier === "Key Rotation Impact" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" :
                    "bg-zinc-800 text-zinc-400"
                  }`}>
                    {p.tier}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Player Profile Deep Dossier */}
        <div className="lg:col-span-5">
          {selectedPlayer ? (
            <div className="sticky top-6 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-xl space-y-5">
              {/* Header Profile */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center space-x-3.5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/20 text-amber-300 font-black text-xl">
                    {selectedPlayer.classification.toFixed(1)}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">{selectedPlayer.player_name}</h3>
                    <div className="text-xs text-zinc-400">{selectedPlayer.team} • {selectedPlayer.role}</div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
                      <Star className="h-3.5 w-3.5 fill-amber-400" />
                      <span>{selectedPlayer.star_rating.toFixed(1)} Stars ({selectedPlayer.tier})</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onSendToCourt?.(selectedPlayer)}
                  className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-2 text-emerald-400 hover:bg-emerald-500/20"
                  title="Send to Tactical Court"
                >
                  <UserCheck className="h-5 w-5" />
                </button>
              </div>

              {/* Verified Wikimedia Commons Photography (if available) */}
              {ATHLETE_PHOTOS[selectedPlayer.player_name] && (
                <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
                  <div className="aspect-[16/9] w-full relative">
                    <img
                      src={ATHLETE_PHOTOS[selectedPlayer.player_name].url}
                      alt={selectedPlayer.player_name}
                      className="w-full h-full object-cover object-top"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-zinc-300 font-mono border border-zinc-700">
                      Photo: {ATHLETE_PHOTOS[selectedPlayer.player_name].author} ({ATHLETE_PHOTOS[selectedPlayer.player_name].license})
                    </div>
                  </div>
                </div>
              )}

              {/* IPC Master Athlete & Classification Registry Badge */}
              {ipcMap[selectedPlayer.player_name.toUpperCase()] && (() => {
                const ipc = ipcMap[selectedPlayer.player_name.toUpperCase()];
                return (
                  <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/30 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-300 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        IPC Official Registry Record
                      </span>
                      <span className="font-mono text-[10px] text-indigo-400 font-bold">{ipc.athlete_id}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Career Paralympic Medals:</span>
                      <div className="inline-flex items-center gap-1.5 font-mono font-bold">
                        <span className="text-amber-400">{ipc.medals?.gold || 0} Gold</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-300">{ipc.medals?.silver || 0} Silver</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-amber-600">{ipc.medals?.bronze || 0} Bronze</span>
                      </div>
                    </div>

                    {ipc.aliases && ipc.aliases.length > 1 && (
                      <div className="text-[11px] text-slate-400">
                        <span className="text-slate-500 font-semibold">Recognized Aliases: </span>
                        <span className="font-mono">{ipc.aliases.join(", ")}</span>
                      </div>
                    )}

                    {ipc.career_bio && (
                      <p className="text-[11px] text-slate-300 italic pt-1 border-t border-indigo-500/20">
                        &quot;{ipc.career_bio}&quot;
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Star Rating Methodology Callout */}
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-zinc-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-300 text-[11px] uppercase tracking-wider">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Empirical Bayes Rating Methodology</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Ratings (1.0 to 5.0) are calculated strictly within functional peer tiers (Screeners 0.5–1.5, Slashers 2.0–2.5, Ball Carriers 3.0–3.5) with Empirical Bayes shrinkage toward prior means. Sport class measures physical function, not talent.
                </p>
              </div>

              {/* Career Stats Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3">
                  <span className="text-zinc-500 text-[10px] uppercase font-sans font-bold">Total Court Time</span>
                  <div className="text-lg font-bold text-white mt-0.5">{(selectedPlayer.career_minutes ?? 0).toFixed(0)}m</div>
                  <div className="text-[10px] text-zinc-400 font-sans">{selectedPlayer.matches_played ?? 0} Paralympic matches</div>
                </div>

                <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3">
                  <span className="text-zinc-500 text-[10px] uppercase font-sans font-bold">Career Tries</span>
                  <div className="text-lg font-bold text-amber-400 mt-0.5">{selectedPlayer.career_tries ?? 0}</div>
                  <div className="text-[10px] text-zinc-400 font-sans">
                    {selectedPlayer.career_minutes > 0 ? ((selectedPlayer.career_tries ?? 0) / selectedPlayer.career_minutes).toFixed(2) : "0.00"} tries / min
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3">
                  <span className="text-zinc-500 text-[10px] uppercase font-sans font-bold">Assist Blocks</span>
                  <div className="text-lg font-bold text-emerald-400 mt-0.5">{selectedPlayer.career_blocks ?? 0}</div>
                  <div className="text-[10px] text-zinc-400 font-sans">Official play-by-play picks</div>
                </div>

                <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3">
                  <span className="text-zinc-500 text-[10px] uppercase font-sans font-bold">Ridge RAPM Impact</span>
                  <div className="text-lg font-bold text-blue-400 mt-0.5">
                    {(selectedPlayer.career_rapm ?? 0) > 0 ? `+${(selectedPlayer.career_rapm ?? 0).toFixed(3)}` : (selectedPlayer.career_rapm ?? 0).toFixed(3)}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-sans">Net score / min (Ridge λ=100)</div>
                </div>
              </div>

              {/* Functional Skill Dimension Bars */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Functional Radar Dimensions (Role-Adjusted):
                </span>

                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-zinc-400">Scoring Efficiency:</span>
                      <span className="font-mono font-bold text-white">{selectedPlayer.radar?.scoring_efficiency ?? 50}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${selectedPlayer.radar?.scoring_efficiency ?? 50}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-zinc-400">Assist & Screening Impact:</span>
                      <span className="font-mono font-bold text-white">{selectedPlayer.radar?.assist_screening ?? 50}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${selectedPlayer.radar?.assist_screening ?? 50}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-zinc-400">Ball Security (Low TO Rate):</span>
                      <span className="font-mono font-bold text-white">{selectedPlayer.radar?.ball_security ?? 50}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${selectedPlayer.radar?.ball_security ?? 50}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-zinc-400">Defensive Disruption (Steals + Blocks):</span>
                      <span className="font-mono font-bold text-white">{selectedPlayer.radar?.defensive_disruption ?? 50}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${selectedPlayer.radar?.defensive_disruption ?? 50}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tournament Appearances */}
              <div className="text-xs text-zinc-400">
                <span className="font-bold text-zinc-300">Paralympic Games Participated: </span>
                <span className="font-mono text-zinc-400">{selectedPlayer.tournaments?.join(", ") || "Recorded in database"}</span>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-12 text-center text-xs text-zinc-500">
              Select an athlete from the scouting registry to inspect comprehensive metrics.
            </div>
          )}
        </div>
      </div>

      {/* Comparison Modal */}
      {showComparisonModal && (
        <PlayerComparisonModal
          players={comparisonSelection}
          onClose={() => setShowComparisonModal(false)}
          onSendToCourt={onSendToCourt}
        />
      )}
    </div>
  );
}
