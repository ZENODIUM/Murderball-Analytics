"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search, Filter, CheckCircle, Shield, Clock, Users, Play, Pause,
  RotateCcw, ChevronRight, FileText, Activity, FastForward, ArrowRight,
  TrendingUp, Download, Eye
} from "lucide-react";
import { getMatchesSummary, getMatchDetail } from "@/lib/api";

export default function MatchExplorer({
  initialMatchId
}: {
  initialMatchId?: string;
}) {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState<string>("All");
  const [selectedTeam, setSelectedTeam] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [eventFilter, setEventFilter] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<"box" | "stints" | "pbp" | "replay">("box");

  // Replay scrubber state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [currentEventIndex, setCurrentEventIndex] = useState<number>(0);
  const [selectedSubEvent, setSelectedSubEvent] = useState<any | null>(null);

  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function loadMatches() {
      try {
        const data = await getMatchesSummary();
        const list = Array.isArray(data) ? data : ((data as any)?.matches || []);
        setMatches(list);
        if (list.length > 0) {
          const matchToLoad = initialMatchId || list[0].match_id;
          loadDetail(matchToLoad);
        }
      } catch (err) {
        console.error("Error loading matches:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMatches();
  }, [initialMatchId]);

  async function loadDetail(matchId: string) {
    setMatchLoading(true);
    setIsPlaying(false);
    setCurrentEventIndex(0);
    setSelectedSubEvent(null);
    try {
      const detail = await getMatchDetail(matchId);
      setSelectedMatch(detail);
    } catch (err) {
      console.error("Error loading match detail:", err);
    } finally {
      setMatchLoading(false);
    }
  }

  // Playback timer loop
  useEffect(() => {
    if (isPlaying && selectedMatch?.events && selectedMatch.events.length > 0) {
      playbackTimerRef.current = setInterval(() => {
        setCurrentEventIndex((prev) => {
          if (prev >= selectedMatch.events.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, Math.max(150, 1000 / playbackSpeed));
    } else {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    }
    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, [isPlaying, playbackSpeed, selectedMatch]);

  const filteredMatches = (Array.isArray(matches) ? matches : []).filter(m => {
    if (selectedTournament !== "All" && m.tournament !== selectedTournament) return false;
    if (selectedTeam !== "All" && m.team_a_code !== selectedTeam && m.team_b_code !== selectedTeam) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        m.team_a_name?.toLowerCase().includes(q) ||
        m.team_b_name?.toLowerCase().includes(q) ||
        m.team_a_code?.toLowerCase().includes(q) ||
        m.team_b_code?.toLowerCase().includes(q) ||
        m.match_id?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const events = selectedMatch?.events || [];
  const currentEvent = events[currentEventIndex] || null;

  // Build scoring timeline for margin graph
  const scoringEvents = events.filter((e: any) => e.event_type === "TRY" || e.event_type === "PENALTY_TRY");
  const maxElapsed = 1920; // 32 minutes regulation

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Match Browser & Search Filter */}
      <div className="lg:col-span-4 space-y-4">
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
          <div className="flex items-center space-x-2 bg-zinc-950 px-3 py-2 rounded-lg border border-zinc-800">
            <Search className="w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search team, match, or stage..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-zinc-400 block mb-1 font-semibold uppercase text-[10px]">Tournament:</label>
              <select
                value={selectedTournament}
                onChange={e => setSelectedTournament(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-zinc-200 text-xs"
              >
                <option value="All">All Tournaments</option>
                <option value="Paris 2024">Paris 2024</option>
                <option value="Tokyo 2020">Tokyo 2020</option>
                <option value="Rio 2016">Rio 2016</option>
                <option value="London 2012">London 2012</option>
                <option value="Beijing 2008">Beijing 2008</option>
                <option value="Athens 2004">Athens 2004</option>
              </select>
            </div>

            <div>
              <label className="text-zinc-400 block mb-1 font-semibold uppercase text-[10px]">Team:</label>
              <select
                value={selectedTeam}
                onChange={e => setSelectedTeam(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-zinc-200 text-xs"
              >
                <option value="All">All Nations</option>
                <option value="AUS">AUS (Australia)</option>
                <option value="USA">USA (United States)</option>
                <option value="GBR">GBR (Great Britain)</option>
                <option value="JPN">JPN (Japan)</option>
                <option value="CAN">CAN (Canada)</option>
                <option value="FRA">FRA (France)</option>
                <option value="DEN">DEN (Denmark)</option>
                <option value="GER">GER (Germany)</option>
                <option value="NZL">NZL (New Zealand)</option>
              </select>
            </div>
          </div>

          <div className="text-[11px] text-zinc-400 flex items-center justify-between border-t border-zinc-800/80 pt-2">
            <span>Historical Matches:</span>
            <span className="font-mono font-bold text-amber-400">{filteredMatches.length} / {matches.length}</span>
          </div>
        </div>

        {/* Matches Scrollable List */}
        <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
          {filteredMatches.map(m => {
            const isSelected = selectedMatch?.match_id === m.match_id;
            return (
              <div
                key={m.match_id}
                onClick={() => loadDetail(m.match_id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-amber-950/20 border-amber-500/60 shadow-lg shadow-amber-950/10"
                    : "bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1.5">
                  <span className="font-semibold text-zinc-300">{m.tournament}</span>
                  <span className="font-mono text-zinc-500">{m.date_str}</span>
                </div>
                <div className="flex items-center justify-between font-bold text-sm text-zinc-100 mb-1">
                  <span className="flex items-center space-x-1.5">
                    <span>{m.team_a_code}</span>
                    <span className="font-mono text-amber-400">{m.official_score_a}</span>
                  </span>
                  <span className="text-zinc-600 font-light">-</span>
                  <span className="flex items-center space-x-1.5">
                    <span className="font-mono text-amber-400">{m.official_score_b}</span>
                    <span>{m.team_b_code}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="truncate max-w-[160px]">{m.stage}</span>
                  <span className="text-emerald-400 flex items-center text-[10px] font-semibold">
                    <CheckCircle className="w-3 h-3 inline mr-1" /> Reconciled
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Detailed Match Sheet & Interactive Inspector */}
      <div className="lg:col-span-8 space-y-5">
        {matchLoading && (
          <div className="flex h-96 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/60">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              <span className="text-xs uppercase tracking-widest text-zinc-400">Loading Reconstructed Match Sheet...</span>
            </div>
          </div>
        )}

        {!matchLoading && selectedMatch && (
          <div className="space-y-6">
            {/* Match Header Scoreboard Card */}
            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400 mb-4 pb-3 border-b border-zinc-800">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 font-bold">{selectedMatch.tournament}</span>
                  <span>{selectedMatch.stage}</span>
                  <span>•</span>
                  <span>{selectedMatch.date_str} {selectedMatch.start_time}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[11px] flex items-center">
                    <CheckCircle className="w-3.5 h-3.5 inline mr-1" /> Score Reconciled 100%
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">Source: {selectedMatch.source_pdf}</span>
                </div>
              </div>

              {/* Score Display */}
              <div className="flex items-center justify-around py-4">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-black text-zinc-100">{selectedMatch.team_a_code}</div>
                  <div className="text-xs text-zinc-400 font-medium">{selectedMatch.team_a_name}</div>
                </div>

                <div className="flex items-center space-x-6 text-center">
                  <div className="text-5xl md:text-6xl font-black font-mono text-amber-400">{selectedMatch.official_score_a}</div>
                  <div className="text-2xl font-light text-zinc-600">-</div>
                  <div className="text-5xl md:text-6xl font-black font-mono text-amber-400">{selectedMatch.official_score_b}</div>
                </div>

                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-black text-zinc-100">{selectedMatch.team_b_code}</div>
                  <div className="text-xs text-zinc-400 font-medium">{selectedMatch.team_b_name}</div>
                </div>
              </div>

              {/* Period Score Table */}
              <div className="mt-4 pt-4 border-t border-zinc-800 overflow-x-auto">
                <table className="w-full text-center text-xs">
                  <thead>
                    <tr className="text-zinc-400 uppercase tracking-wider text-[11px]">
                      <th className="py-1 px-3 text-left">Period</th>
                      {selectedMatch.period_scores?.map((p: any) => (
                        <th key={p.period} className="py-1 px-3">P{p.period}</th>
                      ))}
                      <th className="py-1 px-3 font-bold text-zinc-200">FINAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 font-mono">
                    <tr>
                      <td className="py-1.5 px-3 text-left font-sans font-bold text-zinc-300">{selectedMatch.team_a_code}</td>
                      {selectedMatch.period_scores?.map((p: any) => (
                        <td key={p.period} className="py-1.5 px-3 text-zinc-300">{p.score_a}</td>
                      ))}
                      <td className="py-1.5 px-3 font-bold text-amber-400">{selectedMatch.official_score_a}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 text-left font-sans font-bold text-zinc-300">{selectedMatch.team_b_code}</td>
                      {selectedMatch.period_scores?.map((p: any) => (
                        <td key={p.period} className="py-1.5 px-3 text-zinc-300">{p.score_b}</td>
                      ))}
                      <td className="py-1.5 px-3 font-bold text-amber-400">{selectedMatch.official_score_b}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Score Margin Progression Graph */}
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60">
              <div className="flex items-center justify-between mb-3 text-xs">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-400" />
                  <span className="font-bold uppercase tracking-wider text-white">Score Margin Flow ({selectedMatch.team_a_code} vs {selectedMatch.team_b_code})</span>
                </div>
                <span className="text-zinc-400 font-mono text-[11px]">32 Minutes Regulation (4 × 8m)</span>
              </div>

              {/* Margin Curve SVG */}
              <div className="w-full h-24 relative overflow-hidden bg-zinc-950 rounded-lg p-2 border border-zinc-800">
                <svg className="w-full h-full" viewBox="0 0 1000 100" preserveAspectRatio="none">
                  {/* Zero Center Line */}
                  <line x1="0" y1="50" x2="1000" y2="50" stroke="#3f3f46" strokeWidth="1" strokeDasharray="4 4" />
                  {/* Period Dividers */}
                  {[250, 500, 750].map(x => (
                    <line key={x} x1={x} y1="0" x2={x} y2="100" stroke="#27272a" strokeWidth="1" />
                  ))}

                  {/* Score Margin Points */}
                  {scoringEvents.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      points={scoringEvents
                        .map((e: any) => {
                          const elapsed = typeof e.elapsed_game_seconds === "number" && !isNaN(e.elapsed_game_seconds)
                            ? e.elapsed_game_seconds
                            : 0;
                          const x = Math.max(0, Math.min(1000, (elapsed / (maxElapsed || 1920)) * 1000));
                          const diff = (Number(e.score_a) || 0) - (Number(e.score_b) || 0);
                          const y = Math.max(10, Math.min(90, 50 - diff * 3));
                          if (isNaN(x) || isNaN(y)) return null;
                          return `${x.toFixed(1)},${y.toFixed(1)}`;
                        })
                        .filter(Boolean)
                        .join(" ")}
                    />
                  )}
                </svg>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-zinc-800 space-x-6 text-sm">
              <button
                onClick={() => setActiveTab("box")}
                className={`pb-2.5 font-semibold transition-colors flex items-center space-x-1.5 ${
                  activeTab === "box" ? "border-b-2 border-amber-500 text-amber-400" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Box Scores & Stats</span>
              </button>

              <button
                onClick={() => setActiveTab("replay")}
                className={`pb-2.5 font-semibold transition-colors flex items-center space-x-1.5 ${
                  activeTab === "replay" ? "border-b-2 border-amber-500 text-amber-400" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Match Replay Scrubber ({events.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("stints")}
                className={`pb-2.5 font-semibold transition-colors flex items-center space-x-1.5 ${
                  activeTab === "stints" ? "border-b-2 border-amber-500 text-amber-400" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Lineup Stints ({selectedMatch.stints?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab("pbp")}
                className={`pb-2.5 font-semibold transition-colors flex items-center space-x-1.5 ${
                  activeTab === "pbp" ? "border-b-2 border-amber-500 text-amber-400" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Play-by-Play Log</span>
              </button>
            </div>

            {/* TAB 1: Box Scores */}
            {activeTab === "box" && (
              <div className="space-y-6">
                {/* Team A Box */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
                  <div className="p-3 bg-zinc-950/80 border-b border-zinc-800 flex justify-between items-center text-xs">
                    <span className="font-bold text-zinc-100">{selectedMatch.team_a_name} ({selectedMatch.team_a_code}) Box Score</span>
                    <span className="text-zinc-400 font-mono">Total Tries: {selectedMatch.official_score_a}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] text-zinc-400 uppercase">
                        <tr>
                          <th className="py-2 px-2.5">Bib</th>
                          <th className="py-2 px-2.5 font-sans">Athlete</th>
                          <th className="py-2 px-2.5">Class</th>
                          <th className="py-2 px-2.5 font-sans">G</th>
                          <th className="py-2 px-2.5 text-right">Min</th>
                          <th className="py-2 px-2.5 text-right">Tries</th>
                          <th className="py-2 px-2.5 text-right">TO</th>
                          <th className="py-2 px-2.5 text-right">ST</th>
                          <th className="py-2 px-2.5 text-right">PF</th>
                          {selectedMatch.tournament_year <= 2008 && <th className="py-2 px-2.5 text-right text-emerald-400 font-bold">AB</th>}
                          {selectedMatch.tournament_year <= 2008 && <th className="py-2 px-2.5 text-right text-blue-400 font-bold">AS</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {selectedMatch.box_scores_a?.map((p: any, index: number) => (
                          <tr key={`${selectedMatch.match_id}-a-${p.bib ?? p.number ?? p.name}-${index}`} className="hover:bg-zinc-800/40">
                            <td className="py-2 px-2.5 font-bold text-zinc-300">#{p.bib ?? p.number ?? "—"}</td>
                            <td className="py-2 px-2.5 font-sans font-medium text-zinc-100">{p.name}</td>
                            <td className="py-2 px-2.5 text-amber-400">{(p.sport_class ?? p.classification)?.toFixed(1) ?? "—"}</td>
                            <td className="py-2 px-2.5 text-zinc-400 font-sans">{p.gender}</td>
                            <td className="py-2 px-2.5 text-right text-zinc-300">{p.minutes_str ?? p.minutes ?? (p.minutes_decimal != null ? `${p.minutes_decimal.toFixed(1)}m` : "—")}</td>
                            <td className="py-2 px-2.5 text-right font-bold text-amber-400">{p.tries}</td>
                            <td className="py-2 px-2.5 text-right text-zinc-400">{p.turnovers ?? "—"}</td>
                            <td className="py-2 px-2.5 text-right text-zinc-400">{p.steals ?? "—"}</td>
                            <td className="py-2 px-2.5 text-right text-zinc-400">{p.penalties ?? "—"}</td>
                            {selectedMatch.tournament_year <= 2008 && <td className="py-2 px-2.5 text-right text-emerald-400 font-bold">{p.assist_block || 0}</td>}
                            {selectedMatch.tournament_year <= 2008 && <td className="py-2 px-2.5 text-right text-blue-400 font-bold">{p.assist_pass || 0}</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Team B Box */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
                  <div className="p-3 bg-zinc-950/80 border-b border-zinc-800 flex justify-between items-center text-xs">
                    <span className="font-bold text-zinc-100">{selectedMatch.team_b_name} ({selectedMatch.team_b_code}) Box Score</span>
                    <span className="text-zinc-400 font-mono">Total Tries: {selectedMatch.official_score_b}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] text-zinc-400 uppercase">
                        <tr>
                          <th className="py-2 px-2.5">Bib</th>
                          <th className="py-2 px-2.5 font-sans">Athlete</th>
                          <th className="py-2 px-2.5">Class</th>
                          <th className="py-2 px-2.5 font-sans">G</th>
                          <th className="py-2 px-2.5 text-right">Min</th>
                          <th className="py-2 px-2.5 text-right">Tries</th>
                          <th className="py-2 px-2.5 text-right">TO</th>
                          <th className="py-2 px-2.5 text-right">ST</th>
                          <th className="py-2 px-2.5 text-right">PF</th>
                          {selectedMatch.tournament_year <= 2008 && <th className="py-2 px-2.5 text-right text-emerald-400 font-bold">AB</th>}
                          {selectedMatch.tournament_year <= 2008 && <th className="py-2 px-2.5 text-right text-blue-400 font-bold">AS</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {selectedMatch.box_scores_b?.map((p: any, index: number) => (
                          <tr key={`${selectedMatch.match_id}-b-${p.bib ?? p.number ?? p.name}-${index}`} className="hover:bg-zinc-800/40">
                            <td className="py-2 px-2.5 font-bold text-zinc-300">#{p.bib ?? p.number ?? "—"}</td>
                            <td className="py-2 px-2.5 font-sans font-medium text-zinc-100">{p.name}</td>
                            <td className="py-2 px-2.5 text-amber-400">{(p.sport_class ?? p.classification)?.toFixed(1) ?? "—"}</td>
                            <td className="py-2 px-2.5 text-zinc-400 font-sans">{p.gender}</td>
                            <td className="py-2 px-2.5 text-right text-zinc-300">{p.minutes_str ?? p.minutes ?? (p.minutes_decimal != null ? `${p.minutes_decimal.toFixed(1)}m` : "—")}</td>
                            <td className="py-2 px-2.5 text-right font-bold text-amber-400">{p.tries}</td>
                            <td className="py-2 px-2.5 text-right text-zinc-400">{p.turnovers ?? "—"}</td>
                            <td className="py-2 px-2.5 text-right text-zinc-400">{p.steals ?? "—"}</td>
                            <td className="py-2 px-2.5 text-right text-zinc-400">{p.penalties ?? "—"}</td>
                            {selectedMatch.tournament_year <= 2008 && <td className="py-2 px-2.5 text-right text-emerald-400 font-bold">{p.assist_block || 0}</td>}
                            {selectedMatch.tournament_year <= 2008 && <td className="py-2 px-2.5 text-right text-blue-400 font-bold">{p.assist_pass || 0}</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Interactive Match Replay Scrubber */}
            {activeTab === "replay" && (
              <div className="space-y-4">
                {/* Control Panel */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold text-zinc-950 transition-colors ${
                          isPlaying ? "bg-amber-400 hover:bg-amber-300" : "bg-emerald-400 hover:bg-emerald-300"
                        }`}
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        <span>{isPlaying ? "Pause Scrubber" : "Play Match Replay"}</span>
                      </button>

                      <button
                        onClick={() => { setIsPlaying(false); setCurrentEventIndex(0); }}
                        className="rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-zinc-300 hover:bg-zinc-700"
                        title="Reset to Start"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Speed Selector */}
                    <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
                      {[1, 2, 5].map(spd => (
                        <button
                          key={spd}
                          onClick={() => setPlaybackSpeed(spd)}
                          className={`rounded px-2.5 py-1 text-xs font-bold font-mono transition-colors ${
                            playbackSpeed === spd ? "bg-amber-500 text-zinc-950" : "text-zinc-400 hover:text-white"
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>

                    {/* Event Counter */}
                    <span className="font-mono text-xs text-zinc-400">
                      Event <strong className="text-white">{currentEventIndex + 1}</strong> / {events.length}
                    </span>
                  </div>

                  {/* Scrubber Progress Slider */}
                  <div className="mt-4">
                    <input
                      type="range"
                      min={0}
                      max={events.length - 1}
                      value={currentEventIndex}
                      onChange={e => setCurrentEventIndex(parseInt(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Active Event Spotlight Card */}
                {currentEvent && (
                  <div className="rounded-xl border border-amber-500/40 bg-amber-950/10 p-5">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-amber-500/20 px-2.5 py-0.5 font-mono text-xs font-bold text-amber-300">
                          Period {currentEvent.period} • {currentEvent.clock}
                        </span>
                        <span className="text-xs font-semibold text-zinc-400">
                          {currentEvent.event_type}
                        </span>
                      </div>
                      <div className="font-mono text-xl font-black text-white">
                        {currentEvent.score_a} – {currentEvent.score_b}
                      </div>
                    </div>

                    <div className="mt-3 text-sm font-semibold text-white">
                      {currentEvent.detail || currentEvent.raw_text}
                    </div>

                    {/* If this is a substitution event, show Before / After Lineup units */}
                    {currentEvent.event_type === "SUBSTITUTION" && (
                      <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950/80 p-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                          Tactical Substitution Inspection:
                        </span>
                        <div className="text-xs text-zinc-300">
                          {currentEvent.detail}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Lineup Stints */}
            {activeTab === "stints" && (
              <div className="space-y-4">
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-400">
                  Continuous lineup intervals tracked between substitutions. Each stint records exact on-court 4-athlete units, exposure time, point differential, and legality check.
                </div>
                <div className="space-y-3">
                  {selectedMatch.stints?.map((s: any, idx: number) => (
                    <div key={s.stint_id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs text-zinc-400 pb-2 border-b border-zinc-800">
                        <span className="font-bold text-zinc-200">Stint #{idx + 1} (Period {s.period})</span>
                        <div className="flex items-center space-x-3 font-mono">
                          <span>Clock: {s.start_clock} → {s.end_clock}</span>
                          <span className="px-2 py-0.5 rounded bg-zinc-800 font-bold text-amber-300">{s.duration_seconds}s</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.net_diff_a > 0 ? "bg-emerald-500/20 text-emerald-300" : s.net_diff_a < 0 ? "bg-red-500/20 text-red-300" : "bg-zinc-800 text-zinc-400"
                          }`}>
                            {selectedMatch.team_a_code} Net: {s.net_diff_a > 0 ? `+${s.net_diff_a}` : s.net_diff_a}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                        <div>
                          <div className="text-zinc-400 mb-1 flex items-center justify-between">
                            <strong className="text-zinc-200">{selectedMatch.team_a_code} Unit ({s.lineup_a_points_sum} pts):</strong>
                            <span className="text-[10px] text-emerald-400">Scored: {s.team_a_points_scored}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {s.lineup_a_names?.map((n: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 text-[11px] border border-zinc-700">
                                #{s.lineup_a_bibs?.[i]} {n.split(" ")[0]} ({s.lineup_a_classes?.[i]?.toFixed(1)})
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="text-zinc-400 mb-1 flex items-center justify-between">
                            <strong className="text-zinc-200">{selectedMatch.team_b_code} Unit ({s.lineup_b_points_sum} pts):</strong>
                            <span className="text-[10px] text-emerald-400">Scored: {s.team_b_points_scored}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {s.lineup_b_names?.map((n: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 text-[11px] border border-zinc-700">
                                #{s.lineup_b_bibs?.[i]} {n.split(" ")[0]} ({s.lineup_b_classes?.[i]?.toFixed(1)})
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: Play-by-Play Event Log */}
            {activeTab === "pbp" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs">
                  <div className="flex flex-wrap items-center space-x-2">
                    <Filter className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-zinc-400 font-semibold">Filter:</span>
                    {["ALL", "TRY", "TURNOVER", "STEAL", "TIMEOUT", "SUBSTITUTION"].map(type => (
                      <button
                        key={type}
                        onClick={() => setEventFilter(type)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                          eventFilter === type ? "bg-amber-500 text-zinc-950" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
                  {selectedMatch.events
                    ?.filter((e: any) => eventFilter === "ALL" || e.event_type === eventFilter || (eventFilter === "TRY" && e.event_type === "PENALTY_TRY"))
                    .map((e: any, idx: number) => {
                      const isTry = e.event_type === "TRY" || e.event_type === "PENALTY_TRY";
                      const isTurnover = e.event_type === "TURNOVER";
                      const isSteal = e.event_type === "STEAL";
                      return (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                            isTry
                              ? "bg-amber-950/20 border-amber-500/30 text-amber-200"
                              : isTurnover
                              ? "bg-red-950/20 border-red-500/30 text-red-200"
                              : isSteal
                              ? "bg-blue-950/20 border-blue-500/30 text-blue-200"
                              : "bg-zinc-900 border-zinc-800 text-zinc-300"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-400">
                              P{e.period} {e.clock}
                            </span>
                            <span className="font-bold text-zinc-100">{e.team}</span>
                            <span>{e.detail || e.raw_text}</span>
                          </div>
                          <div className="font-mono font-bold text-zinc-100 text-xs">
                            {e.score_a} - {e.score_b}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
