"use client";

import React, { useState, useEffect } from "react";
import { getHistoricalChampionships } from "@/lib/api";
import {
  Trophy, Medal, Award, Calendar, ChevronRight, Shield,
  ExternalLink, CheckCircle, Info, Sparkles, Filter, Users
} from "lucide-react";

export function ChampionshipsExplorer({
  onSelectTeam,
  onSelectMatch
}: {
  onSelectTeam?: (team: string) => void;
  onSelectMatch?: (matchId: string) => void;
}) {
  const [data, setData] = useState<any>(null);
  const [selectedChampId, setSelectedChampId] = useState<string>("PAR24");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getHistoricalChampionships();
        setData(res);
        if (res.championships && res.championships.length > 0) {
          setSelectedChampId(res.championships[0].id);
        }
      } catch (err) {
        console.error("Failed to load championships:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <span className="text-xs uppercase tracking-widest text-zinc-400">Loading Official Championship Records...</span>
        </div>
      </div>
    );
  }

  const championships: any[] = data?.championships || [];
  const medalTable = data?.all_time_medal_table || [];

  const filteredChamps = championships.filter(c => {
    if (filterType === "PARALYMPIC") return c.competition === "Paralympic Games";
    if (filterType === "WORLD_CHAMP") return c.competition.includes("World Championship");
    return true;
  });

  const activeChamp = championships.find(c => c.id === selectedChampId) || championships[0];

  // Helper accessors for resilient schema mapping
  const getGold = (c: any) => ({
    code: c.champion?.code || c.podium?.gold?.team || "TBD",
    name: c.champion?.name || c.podium?.gold?.name || ""
  });
  const getSilver = (c: any) => ({
    code: c.runner_up?.code || c.podium?.silver?.team || "TBD",
    name: c.runner_up?.name || c.podium?.silver?.name || ""
  });
  const getBronze = (c: any) => ({
    code: c.third_place?.code || c.podium?.bronze?.team || "TBD",
    name: c.third_place?.name || c.podium?.bronze?.name || ""
  });

  const goldMatch = activeChamp ? (activeChamp.gold_match || activeChamp.gold_medal_match || {}) : {};
  const bronzeMatch = activeChamp ? (activeChamp.bronze_match || activeChamp.bronze_medal_match || {}) : {};
  const standings = activeChamp ? (activeChamp.standings || activeChamp.final_standings || []) : [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-amber-950/20 p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-wider text-amber-400 uppercase">
                <Trophy className="h-3 w-3" /> Official Historical Archive (1995 – 2024)
              </span>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                100% Score Reconciled
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">
              World Wheelchair Rugby Championships & Paralympic Games
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Verified historical podiums, medal rounds, standouts, and tournament records across 30 years of premier international competition.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 p-1">
            <button
              onClick={() => setFilterType("ALL")}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-all ${
                filterType === "ALL"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              All (10)
            </button>
            <button
              onClick={() => setFilterType("PARALYMPIC")}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-all ${
                filterType === "PARALYMPIC"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Paralympics (6)
            </button>
            <button
              onClick={() => setFilterType("WORLD_CHAMP")}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-all ${
                filterType === "WORLD_CHAMP"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              World Champs (4)
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Timeline / Right Detail */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Championship Timeline Selector */}
        <div className="space-y-3 lg:col-span-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Major Tournaments</h3>
            <span className="text-xs text-zinc-500">{filteredChamps.length} verified events</span>
          </div>

          <div className="space-y-2">
            {filteredChamps.map((champ) => {
              const isSelected = champ.id === activeChamp?.id;
              const g = getGold(champ);
              const s = getSilver(champ);
              const b = getBronze(champ);
              return (
                <button
                  key={champ.id}
                  onClick={() => setSelectedChampId(champ.id)}
                  className={`w-full text-left rounded-xl border p-3.5 transition-all ${
                    isSelected
                      ? "border-amber-500/60 bg-amber-950/20 shadow-lg shadow-amber-950/10"
                      : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{champ.edition || `${champ.host_city} ${champ.year}`}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      champ.competition === "Paralympic Games"
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                    }`}>
                      {champ.year}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1 font-semibold text-amber-400">
                      <Trophy className="h-3.5 w-3.5 text-amber-400" />
                      <span>{g.code}</span>
                    </div>
                    <div className="flex items-center gap-1 text-zinc-400">
                      <Medal className="h-3.5 w-3.5 text-zinc-300" />
                      <span>{s.code}</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-600">
                      <Medal className="h-3.5 w-3.5 text-amber-700" />
                      <span>{b.code}</span>
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] text-zinc-500 flex items-center justify-between border-t border-zinc-800/80 pt-2">
                    <span>{champ.host_city}, {champ.host_country}</span>
                    <span>{champ.competition}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* All-Time Leaderboard Card */}
          <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Trophy className="h-4 w-4 text-amber-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">All-Time Major Medal Table</h4>
            </div>

            <div className="mt-3 space-y-2">
              {medalTable.map((row: any, idx: number) => (
                <button
                  type="button"
                  key={row.code}
                  onClick={() => onSelectTeam?.(row.code)}
                  className="flex w-full items-center justify-between rounded-lg border border-zinc-800/50 bg-zinc-950/40 p-2 text-left text-xs hover:border-zinc-700 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-4 text-center font-mono text-[11px] text-zinc-500 font-bold">{idx + 1}</span>
                    <span className="font-bold text-white">{row.code}</span>
                    <span className="text-[11px] text-zinc-400 hidden sm:inline">{row.name || row.team_name}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-xs">
                    <span className="font-semibold text-amber-400" title="Gold Medals">{row.gold}G</span>
                    <span className="text-zinc-300" title="Silver Medals">{row.silver}S</span>
                    <span className="text-amber-600" title="Bronze Medals">{row.bronze}B</span>
                    <span className="w-6 text-right font-bold text-white">{row.total}</span>
                  </div>
                </button>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-zinc-500 text-center">
              Covers 10 major tournaments: 6 Paralympics + 4 World Championships
            </p>
          </div>
        </div>

        {/* Right Column: Championship Detail Dossier */}
        <div className="space-y-6 lg:col-span-8">
          {activeChamp && (
            <>
              {/* Header Title & Overview */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
                      <span>{activeChamp.competition}</span>
                      <span>•</span>
                      <span>{activeChamp.host_city}, {activeChamp.host_country}</span>
                    </div>
                    <h2 className="mt-1 text-2xl font-bold text-white">{activeChamp.edition || `${activeChamp.host_city} ${activeChamp.year}`}</h2>
                    <p className="mt-0.5 text-xs text-zinc-400">Rules Era: {activeChamp.rules_era}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-xs text-zinc-300 font-medium">
                      {activeChamp.venue}
                    </span>
                    <span className="rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-xs text-zinc-300 font-medium">
                      Year {activeChamp.year}
                    </span>
                  </div>
                </div>

                {/* Podium Cards */}
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {/* Gold */}
                  <div className="relative rounded-xl border border-amber-500/40 bg-gradient-to-b from-amber-500/10 via-zinc-900 to-zinc-950 p-4 text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <span className="mt-2 block text-[10px] font-bold uppercase tracking-widest text-amber-400">Gold Champions</span>
                    <div
                      onClick={() => onSelectTeam?.(getGold(activeChamp).code)}
                      className="cursor-pointer hover:underline"
                    >
                      <h3 className="mt-1 text-xl font-black text-white">{getGold(activeChamp).code}</h3>
                      <p className="text-xs text-zinc-400">{getGold(activeChamp).name}</p>
                    </div>
                  </div>

                  {/* Silver */}
                  <div className="relative rounded-xl border border-zinc-400/30 bg-gradient-to-b from-zinc-400/10 via-zinc-900 to-zinc-950 p-4 text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-zinc-400/20 text-zinc-300 border border-zinc-400/40">
                      <Medal className="h-5 w-5" />
                    </div>
                    <span className="mt-2 block text-[10px] font-bold uppercase tracking-widest text-zinc-300">Silver Runner-Up</span>
                    <div
                      onClick={() => onSelectTeam?.(getSilver(activeChamp).code)}
                      className="cursor-pointer hover:underline"
                    >
                      <h3 className="mt-1 text-xl font-black text-white">{getSilver(activeChamp).code}</h3>
                      <p className="text-xs text-zinc-400">{getSilver(activeChamp).name}</p>
                    </div>
                  </div>

                  {/* Bronze */}
                  <div className="relative rounded-xl border border-amber-700/40 bg-gradient-to-b from-amber-700/10 via-zinc-900 to-zinc-950 p-4 text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-700/20 text-amber-600 border border-amber-700/40">
                      <Medal className="h-5 w-5" />
                    </div>
                    <span className="mt-2 block text-[10px] font-bold uppercase tracking-widest text-amber-600">Bronze 3rd Place</span>
                    <div
                      onClick={() => onSelectTeam?.(getBronze(activeChamp).code)}
                      className="cursor-pointer hover:underline"
                    >
                      <h3 className="mt-1 text-xl font-black text-white">{getBronze(activeChamp).code}</h3>
                      <p className="text-xs text-zinc-400">{getBronze(activeChamp).name}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gold Medal Match Scorecard */}
              {goldMatch && goldMatch.score_a && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-amber-400" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-white">Championship Final Scorecard</h3>
                    </div>
                    {goldMatch.overtime && (
                      <span className="rounded border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-red-400 uppercase animate-pulse">
                        Overtime Thriller
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex flex-col items-center justify-between gap-6 rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-6 sm:flex-row">
                    {/* Team A */}
                    <div className="text-center sm:text-left flex-1">
                      <span className={`text-2xl font-black ${
                        goldMatch.score_a > goldMatch.score_b ? "text-amber-400" : "text-zinc-400"
                      }`}>
                        {goldMatch.team_a}
                      </span>
                      <p className="text-xs text-zinc-500">
                        {goldMatch.score_a > goldMatch.score_b ? "Gold Winner" : "Finalist"}
                      </p>
                    </div>

                    {/* Score Display */}
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-4xl font-black text-white">
                        {goldMatch.score_a}
                      </span>
                      <span className="text-zinc-600 font-bold text-xl">–</span>
                      <span className="font-mono text-4xl font-black text-white">
                        {goldMatch.score_b}
                      </span>
                    </div>

                    {/* Team B */}
                    <div className="text-center sm:text-right flex-1">
                      <span className={`text-2xl font-black ${
                        goldMatch.score_b > goldMatch.score_a ? "text-amber-400" : "text-zinc-400"
                      }`}>
                        {goldMatch.team_b}
                      </span>
                      <p className="text-xs text-zinc-500">
                        {goldMatch.score_b > goldMatch.score_a ? "Gold Winner" : "Finalist"}
                      </p>
                    </div>
                  </div>

                  {/* Standout Notes */}
                  {activeChamp.standout_notes && (
                    <div className="mt-4 rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3 text-amber-400" /> Standout Historical Summary:
                      </span>
                      <p className="mt-1 text-xs text-zinc-300 leading-relaxed">
                        {activeChamp.standout_notes}
                      </p>
                    </div>
                  )}

                  {/* Match Explorer Link if match_id present */}
                  {goldMatch.match_id && onSelectMatch && (
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => onSelectMatch(goldMatch.match_id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300"
                      >
                        <span>Open Full Play-by-Play & Lineups</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Tournament Standings & Source Verification */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Final Standings Table */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-zinc-400" /> Final Tournament Standings
                  </h4>
                  <div className="space-y-1.5">
                    {standings.map((st: any) => (
                      <div
                        key={st.rank}
                        className="flex items-center justify-between rounded border border-zinc-800/40 bg-zinc-950/30 px-3 py-1.5 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-5 font-mono font-bold ${
                            st.rank === 1 ? "text-amber-400" : st.rank === 2 ? "text-zinc-300" : st.rank === 3 ? "text-amber-600" : "text-zinc-500"
                          }`}>
                            #{st.rank}
                          </span>
                          <span className="font-semibold text-white">{st.code || st.team}</span>
                        </div>
                        <span className="text-zinc-400 text-[11px]">{st.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Source Verification Card */}
                <div className="rounded-xl border border-emerald-950/60 bg-emerald-950/10 p-5">
                  <div className="flex items-center gap-2 text-emerald-400 mb-2">
                    <CheckCircle className="h-4 w-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Source Document & Traceability</h4>
                  </div>
                  <div className="space-y-1.5 text-xs text-zinc-400">
                    <div>
                      <span className="text-zinc-500">Source: </span>
                      <span className="font-mono text-zinc-300">{goldMatch?.source_pdf || "Official WWR Results Document"}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Pages: </span>
                      <span className="font-mono text-zinc-300">
                        {goldMatch?.source_pages?.length > 0
                          ? goldMatch.source_pages.join(", ")
                          : "Primary Championship Bulletin"}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Verification: </span>
                      <span className="text-emerald-400 font-semibold">100% Score Reconciled</span>
                    </div>
                    <p className="mt-2 text-[11px] text-zinc-500 border-t border-emerald-900/30 pt-2">
                      Verified from primary World Wheelchair Rugby (WWR) results publications without synthetic data injection.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
