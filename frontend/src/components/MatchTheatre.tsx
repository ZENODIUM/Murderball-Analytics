"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, Maximize2,
  Shield, Users, Activity, Clock, AlertTriangle, ArrowRight,
  ExternalLink, Eye, PenTool, CheckCircle, ChevronRight,
  Flame, Sliders, RefreshCw, Undo, Download, FileText, Sparkles
} from "lucide-react";
import { getMediaCatalog, getMatchDetail, getMatchNarratives } from "../lib/api";

interface MatchTheatreProps {
  initialMatchId?: string;
  onNavigateToDecisionMirror?: (decisionId?: string) => void;
  onNavigateToTacticalCourt?: (lineupNames: string[], teamCode: string) => void;
}

export default function MatchTheatre({
  initialMatchId = "PAR24_M20",
  onNavigateToDecisionMirror,
  onNavigateToTacticalCourt
}: MatchTheatreProps) {
  const [mediaCatalog, setMediaCatalog] = useState<any[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>(initialMatchId);
  const [matchData, setMatchData] = useState<any | null>(null);
  const [matchNarrative, setMatchNarrative] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Theatre Modes: "video" | "schematic" | "telesration"
  const [viewMode, setViewMode] = useState<"video" | "schematic" | "telesration">("video");

  // Playback & Scrubber State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentEventIndex, setCurrentEventIndex] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [syncOffsetSec, setSyncOffsetSec] = useState<number>(0);

  // Telesration Drawings State
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [drawTool, setDrawTool] = useState<"arrow" | "circle" | "zone" | "freehand">("arrow");
  const [drawColor, setDrawColor] = useState<string>("#06b6d4"); // cyan
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentDraw, setCurrentDraw] = useState<any | null>(null);
  const canvasRef = useRef<SVGSVGElement>(null);

  // Load Media Catalog & Initial Match
  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const catRes = await getMediaCatalog();
        const replays = catRes?.broadcast_replays || [];
        setMediaCatalog(replays);

        // Load match details and narrative
        const [mDetails, mNarrative] = await Promise.all([
          getMatchDetail(selectedMatchId),
          getMatchNarratives(selectedMatchId)
        ]);
        setMatchData(mDetails);
        setMatchNarrative(mNarrative);
        setCurrentEventIndex(0);
      } catch (err) {
        console.error("Failed to load match theatre data:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [selectedMatchId]);

  // Active Broadcast Media Record & Availability Guard
  const activeMedia = mediaCatalog.find((m: any) => m.match_id === selectedMatchId);
  const isVideoAvailable = Boolean(
    activeMedia &&
    activeMedia.embedding_allowed &&
    activeMedia.youtube_id &&
    activeMedia.embed_url
  );
  const isSyncVerified = isVideoAvailable && activeMedia?.sync_verified === true;
  const events = matchData?.events || [];
  const currentEvent = events[currentEventIndex] || null;

  // Auto-play scrubber effect
  useEffect(() => {
    let timer: any = null;
    if (isPlaying && events.length > 0) {
      timer = setInterval(() => {
        setCurrentEventIndex(prev => {
          if (prev >= events.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1400 / playbackSpeed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, events, playbackSpeed]);

  // Video Timestamp Calculation based on active event and anchors
  const currentVideoSeconds = React.useMemo(() => {
    if (!isSyncVerified || !activeMedia || !currentEvent) return 0;
    const anchors = activeMedia.verified_timestamp_anchors || [];
    const eventPeriod = currentEvent.period || 1;

    // Find matching anchor for this period
    const anchor = anchors.find((a: any) => a.period === eventPeriod) || anchors[0];
    if (!anchor) return 0;

    // Remaining clock in period (descending from 8:00 to 0:00)
    const clockParts = (currentEvent.clock || "8:00").split(":");
    const remainingSec = parseInt(clockParts[0] || "8", 10) * 60 + parseInt(clockParts[1] || "0", 10);
    const elapsedPeriodSec = Math.max(0, 480 - remainingSec);

    return anchor.video_seconds + elapsedPeriodSec + syncOffsetSec;
  }, [activeMedia, currentEvent, isSyncVerified, syncOffsetSec]);

  // Active Lineups based on current event / stints
  const activeLineupA = React.useMemo(() => {
    if (matchData?.stints && matchData.stints.length > 0) {
      const evSec = currentEvent?.elapsed_game_seconds || 0;
      const currentStint = matchData.stints.find(
        (s: any) => evSec >= s.start_game_seconds && evSec <= s.end_game_seconds
      ) || matchData.stints[0];
      if (currentStint && currentStint.lineup_a_names && currentStint.lineup_a_names.length > 0) {
        return currentStint.lineup_a_names;
      }
    }
    // Fallback to box scores / starters
    if (matchData?.box_scores_a) {
      const starters = matchData.box_scores_a.filter((p: any) => p.starter).map((p: any) => `${p.name} (${p.classification})`);
      if (starters.length > 0) return starters;
      return matchData.box_scores_a.slice(0, 4).map((p: any) => `${p.name} (${p.classification})`);
    }
    return ["IKE Yukinobu (3.0)", "HASHIMOTO Katsuya (3.5)", "NORIMATSU Seiya (1.5)", "KURAHASHI Kae (0.5 F)"];
  }, [matchData, currentEvent]);

  const activeLineupB = React.useMemo(() => {
    if (matchData?.stints && matchData.stints.length > 0) {
      const evSec = currentEvent?.elapsed_game_seconds || 0;
      const currentStint = matchData.stints.find(
        (s: any) => evSec >= s.start_game_seconds && evSec <= s.end_game_seconds
      ) || matchData.stints[0];
      if (currentStint && currentStint.lineup_b_names && currentStint.lineup_b_names.length > 0) {
        return currentStint.lineup_b_names;
      }
    }
    // Fallback to box scores / starters
    if (matchData?.box_scores_b) {
      const starters = matchData.box_scores_b.filter((p: any) => p.starter).map((p: any) => `${p.name} (${p.classification}${p.gender === 'F' ? ' F' : ''})`);
      if (starters.length > 0) return starters;
      return matchData.box_scores_b.slice(0, 4).map((p: any) => `${p.name} (${p.classification}${p.gender === 'F' ? ' F' : ''})`);
    }
    return ["AOKI Chuck (3.0)", "WHEELER Josh (2.5)", "BUTLER Jeff (0.5)", "ADAM Sarah (2.5 F)"];
  }, [matchData, currentEvent]);

  // Telesration Canvas Handlers
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (viewMode !== "telesration") return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setIsDrawing(true);
    setCurrentDraw({ tool: drawTool, color: drawColor, startX: x, startY: y, endX: x, endY: y, points: [[x, y]] });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing || !currentDraw) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (drawTool === "freehand") {
      setCurrentDraw((prev: any) => ({
        ...prev,
        points: [...prev.points, [x, y]],
        endX: x,
        endY: y
      }));
    } else {
      setCurrentDraw((prev: any) => ({ ...prev, endX: x, endY: y }));
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && currentDraw) {
      setAnnotations(prev => [...prev, { ...currentDraw, timestamp: currentEvent?.clock || "0:00" }]);
      setCurrentDraw(null);
      setIsDrawing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Theatre Controls & Match Selection */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-wider">
                MULTIMODAL MATCH THEATRE
              </span>
              {isVideoAvailable ? (
                <>
                  <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    OFFICIAL FULL MATCH AVAILABLE
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-mono text-cyan-400 border border-slate-700 bg-slate-800">
                    VIDEO AND EVENT TIMELINE UNSYNCHRONIZED
                  </span>
                </>
              ) : (
                <>
                  <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    EVENT REPLAY AVAILABLE &bull; VIDEO LINK UNVERIFIED
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-mono text-amber-300 border border-slate-700 bg-slate-800">
                    EPISTEMIC LEVEL: TIER 4 (OFFICIAL EVENT RECORD)
                  </span>
                </>
              )}
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              {matchData ? `${matchData.team_a_name} vs ${matchData.team_b_name}` : "Wheelchair Rugby Match Theatre"}
            </h2>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
              <span>{matchData?.tournament || "Paris 2024 Paralympic Games"} &bull; {matchData?.stage || "Gold Medal Game"}</span>
              <span>Final: <strong className="text-white">{matchData?.official_score_a ?? 48} - {matchData?.official_score_b ?? 41}</strong></span>
              <span className="text-cyan-400">PDF Provenance: {matchData?.source_pdf || "PG2024-Overall-results-book.pdf"} (p. {currentEvent?.page || 129})</span>
            </div>
          </div>

          {/* Match Dropdown & View Mode Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              aria-label="Select Paralympic Match for Theatre Inspection"
              className="bg-slate-800 text-sm text-slate-200 px-3 py-2 rounded-xl border border-slate-700 outline-none cursor-pointer"
              value={selectedMatchId}
              onChange={e => setSelectedMatchId(e.target.value)}
            >
              {(mediaCatalog.length > 0 ? mediaCatalog : [
                { match_id: "PAR24_M20", competition: "Paris 2024", teams: "JPN vs USA", stage: "Gold Medal Game" },
                { match_id: "PAR24_M19", competition: "Paris 2024", teams: "AUS vs GBR", stage: "Bronze Medal Game" },
                { match_id: "PAR24_M01", competition: "Paris 2024", teams: "AUS vs GBR", stage: "Group Stage B" },
                { match_id: "TKY20_M18", competition: "Tokyo 2020", teams: "USA vs GBR", stage: "Gold Medal Game" },
                { match_id: "RIO16_M18", competition: "Rio 2016", teams: "AUS vs USA", stage: "Gold Medal Game (2OT)" },
                { match_id: "LON12_M20", competition: "London 2012", teams: "CAN vs AUS", stage: "Gold Medal Game" },
                { match_id: "BEI08_M01", competition: "Beijing 2008", teams: "USA vs AUS", stage: "Group Stage A" },
                { match_id: "ATH04_M24", competition: "Athens 2004", teams: "CAN vs NZL", stage: "Gold Medal Game" }
              ]).map((m: any) => (
                <option key={m.match_id} value={m.match_id}>
                  {m.competition} - {m.teams} ({m.stage})
                </option>
              ))}
            </select>

            {/* View Mode Buttons */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode("video")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "video"
                    ? "bg-cyan-500 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Broadcast Video
              </button>
              <button
                onClick={() => setViewMode("schematic")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "schematic"
                    ? "bg-cyan-500 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                2D Court Schematic
              </button>
              <button
                onClick={() => setViewMode("telesration")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === "telesration"
                    ? "bg-amber-500 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Telesration</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Theatre Screen & Connected Telemetry Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Stage (col-span-8) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
            {/* 1. Official Broadcast Video Embed */}
            {viewMode === "video" ? (
              isVideoAvailable ? (
                <div className="w-full h-full relative">
                  <iframe
                    src={`${activeMedia.embed_url}?start=${currentVideoSeconds}&rel=0`}
                    title={activeMedia.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                  {activeMedia.external_url && <a href={activeMedia.external_url} target="_blank" rel="noreferrer" className="absolute top-3 right-3 rounded-md bg-slate-950/90 border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-white flex items-center gap-1.5 hover:bg-slate-800"><ExternalLink className="w-3 h-3" /> Open on YouTube</a>}
                  {/* Epistemic Provenance Badge Overlay */}
                  <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-800 text-[10px] font-mono text-cyan-300 flex items-center gap-1.5 pointer-events-none">
                    <CheckCircle className="w-3 h-3 text-cyan-400" />
                    <span>
                      {activeMedia.sync_verified
                        ? `IPC Official Broadcast (Manual Timestamp Sync: Q${currentEvent?.period || 1} ${currentEvent?.clock || "8:00"})`
                        : "Official video · event timeline unsynchronized"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Broadcast Embed Unavailable</h4>
                    <p className="text-xs text-slate-400 max-w-md mt-1">
                      A verified full-match video link is not yet available for this match. Explore the official event record in the schematic replay.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    {activeMedia?.external_url && (
                      <a
                        href={activeMedia.external_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Watch on External Archive</span>
                      </a>
                    )}
                    <button
                      onClick={() => setViewMode("schematic")}
                      className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-950/40 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Switch to 2D Schematic Replay</span>
                    </button>
                  </div>
                </div>
              )
            ) : viewMode === "schematic" ? (
              /* 2. 2D Court Schematic Replay */
              <div className="w-full h-full bg-slate-950 relative p-4 flex flex-col justify-center items-center">
                {/* Regulation Wheelchair Rugby Court (28m x 15m) SVG */}
                <div className="w-full max-w-[620px] aspect-[28/15] bg-slate-900 border-2 border-slate-700 rounded-lg relative overflow-hidden">
                  {/* Center Line & Circle */}
                  <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-700" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border border-slate-700 pointer-events-none" />

                  {/* Left Key Area (Keyblock Trap Zone) */}
                  <div className="absolute top-1/4 bottom-1/4 left-0 w-24 bg-rose-500/10 border-r-2 border-y-2 border-rose-500/30 rounded-r-lg flex items-center justify-center">
                    <span className="text-[10px] font-mono text-rose-400/80 -rotate-90 select-none">KEY AREA (8m)</span>
                  </div>

                  {/* Right Key Area */}
                  <div className="absolute top-1/4 bottom-1/4 right-0 w-24 bg-cyan-500/10 border-l-2 border-y-2 border-cyan-500/30 rounded-l-lg flex items-center justify-center">
                    <span className="text-[10px] font-mono text-cyan-400/80 rotate-90 select-none">KEY AREA (8m)</span>
                  </div>

                  {/* Simulated 4v4 Athlete Tokens */}
                  {/* Team A (Cyan Offense) */}
                  <div className="absolute left-[62%] top-[45%] -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-lg border-2 border-white animate-pulse">
                    3.5
                  </div>
                  <div className="absolute left-[54%] top-[25%] -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-cyan-600 text-white font-bold text-[10px] flex items-center justify-center border border-slate-900">
                    0.5
                  </div>
                  <div className="absolute left-[72%] top-[35%] -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-cyan-600 text-white font-bold text-[10px] flex items-center justify-center border border-slate-900">
                    3.0
                  </div>
                  <div className="absolute left-[60%] top-[70%] -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-cyan-600 text-white font-bold text-[10px] flex items-center justify-center border border-slate-900">
                    1.0
                  </div>

                  {/* Team B (Amber/Rose Defense) */}
                  <div className="absolute left-[78%] top-[42%] -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center border border-slate-900">
                    0.5
                  </div>
                  <div className="absolute left-[80%] top-[55%] -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center border border-slate-900">
                    1.5
                  </div>
                  <div className="absolute left-[68%] top-[48%] -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-rose-600 text-white font-bold text-xs flex items-center justify-center border-2 border-slate-900">
                    3.5
                  </div>
                  <div className="absolute left-[65%] top-[28%] -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center border border-slate-900">
                    2.5
                  </div>

                  {/* Passing/Drive Vector */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <line x1="62%" y1="45%" x2="72%" y2="35%" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 4" />
                    <line x1="54%" y1="25%" x2="65%" y2="28%" stroke="#f43f5e" strokeWidth="2" />
                  </svg>
                </div>

                <div className="mt-2 text-center text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">[SCHEMATIC_TACTICAL_RECONSTRUCTION]</span> &bull; 0.5-Screener Isolation Trap at Right Keyline
                </div>
              </div>
            ) : (
              /* 3. Interactive Telesration Canvas Overlay */
              <div className="w-full h-full relative bg-slate-950 flex flex-col items-center justify-center p-4">
                <svg
                  ref={canvasRef}
                  viewBox="0 0 100 100"
                  className="w-full h-full bg-slate-900/90 rounded-lg cursor-crosshair border border-slate-700"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                >
                  {/* Background Court Outline */}
                  <rect x="5" y="10" width="90" height="80" fill="none" stroke="#334155" strokeWidth="0.8" />
                  <line x1="50" y1="10" x2="50" y2="90" stroke="#334155" strokeWidth="0.8" />
                  <circle cx="50" cy="50" r="12" fill="none" stroke="#334155" strokeWidth="0.8" />

                  {/* Render Existing Annotations */}
                  {annotations.map((ann: any, idx: number) => {
                    if (ann.tool === "arrow") {
                      return (
                        <g key={idx}>
                          <line x1={ann.startX} y1={ann.startY} x2={ann.endX} y2={ann.endY} stroke={ann.color} strokeWidth="1.5" strokeLinecap="round" />
                          <circle cx={ann.endX} cy={ann.endY} r="1.5" fill={ann.color} />
                        </g>
                      );
                    } else if (ann.tool === "circle") {
                      const r = Math.sqrt(Math.pow(ann.endX - ann.startX, 2) + Math.pow(ann.endY - ann.startY, 2));
                      return <circle key={idx} cx={ann.startX} cy={ann.startY} r={r} fill="none" stroke={ann.color} strokeWidth="1.2" strokeDasharray="2 2" />;
                    } else if (ann.tool === "zone") {
                      return <rect key={idx} x={Math.min(ann.startX, ann.endX)} y={Math.min(ann.startY, ann.endY)} width={Math.abs(ann.endX - ann.startX)} height={Math.abs(ann.endY - ann.startY)} fill={`${ann.color}22`} stroke={ann.color} strokeWidth="1.2" />;
                    } else if (ann.tool === "freehand") {
                      const pathData = ann.points.map((pt: any, pIdx: number) => `${pIdx === 0 ? "M" : "L"} ${pt[0]} ${pt[1]}`).join(" ");
                      return <path key={idx} d={pathData} fill="none" stroke={ann.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />;
                    }
                    return null;
                  })}

                  {/* Current Active Draw Preview */}
                  {isDrawing && currentDraw && (
                    currentDraw.tool === "arrow" ? (
                      <line x1={currentDraw.startX} y1={currentDraw.startY} x2={currentDraw.endX} y2={currentDraw.endY} stroke={currentDraw.color} strokeWidth="1.5" />
                    ) : currentDraw.tool === "circle" ? (
                      <circle cx={currentDraw.startX} cy={currentDraw.startY} r={Math.sqrt(Math.pow(currentDraw.endX - currentDraw.startX, 2) + Math.pow(currentDraw.endY - currentDraw.startY, 2))} fill="none" stroke={currentDraw.color} strokeWidth="1.2" />
                    ) : currentDraw.tool === "zone" ? (
                      <rect x={Math.min(currentDraw.startX, currentDraw.endX)} y={Math.min(currentDraw.startY, currentDraw.endY)} width={Math.abs(currentDraw.endX - currentDraw.startX)} height={Math.abs(currentDraw.endY - currentDraw.startY)} fill={`${currentDraw.color}22`} stroke={currentDraw.color} strokeWidth="1.2" />
                    ) : null
                  )}
                </svg>

                {/* Telesration Toolbar */}
                <div className="mt-3 flex items-center justify-between w-full max-w-lg bg-slate-900 p-2 rounded-xl border border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setDrawTool("arrow")} className={`px-2.5 py-1 rounded ${drawTool === "arrow" ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-300 hover:bg-slate-800"}`}>Arrow</button>
                    <button onClick={() => setDrawTool("circle")} className={`px-2.5 py-1 rounded ${drawTool === "circle" ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-300 hover:bg-slate-800"}`}>Spotlight</button>
                    <button onClick={() => setDrawTool("zone")} className={`px-2.5 py-1 rounded ${drawTool === "zone" ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-300 hover:bg-slate-800"}`}>Key Zone</button>
                    <button onClick={() => setDrawTool("freehand")} className={`px-2.5 py-1 rounded ${drawTool === "freehand" ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-300 hover:bg-slate-800"}`}>Pen</button>
                  </div>

                  {/* Colors */}
                  <div className="flex items-center gap-1.5">
                    {["#06b6d4", "#f59e0b", "#f43f5e", "#10b981", "#ffffff"].map(c => (
                      <button key={c} onClick={() => setDrawColor(c)} className={`w-4 h-4 rounded-full border ${drawColor === c ? "ring-2 ring-white scale-110" : ""}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>

                  <button onClick={() => setAnnotations(prev => prev.slice(0, -1))} className="p-1 text-slate-400 hover:text-white" title="Undo"><Undo className="w-4 h-4" /></button>
                  <button onClick={() => setAnnotations([])} className="p-1 text-rose-400 hover:text-rose-300 text-[10px] font-bold">Clear</button>
                </div>
              </div>
            )}
          </div>

          {/* Video-to-Event Synchronization Bar & Offset Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between text-xs gap-3">
            {isSyncVerified ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-300">Sync Calibration:</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    Offset: {syncOffsetSec >= 0 ? `+${syncOffsetSec}` : syncOffsetSec}s
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    Anchor Synced (±1.5s Manual Anchor, Video Beta)
                  </span>
                </div>

                <div className="flex items-center gap-1.5 font-mono">
                  <button onClick={() => setSyncOffsetSec(s => s - 5)} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300">-5s</button>
                  <button onClick={() => setSyncOffsetSec(s => s - 1)} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300">-1s</button>
                  <button onClick={() => setSyncOffsetSec(0)} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 text-[11px]">Reset</button>
                  <button onClick={() => setSyncOffsetSec(s => s + 1)} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300">+1s</button>
                  <button onClick={() => setSyncOffsetSec(s => s + 5)} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300">+5s</button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-400">Sync Calibration:</span>
                  <span className="text-[10px] px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono">
                    VIDEO AND EVENT TIMELINE ARE NOT SYNCHRONIZED
                  </span>
                </div>

                <div className="flex items-center gap-1.5 font-mono opacity-50 cursor-not-allowed">
                  <span className="text-[10px] text-slate-500 mr-2">Calibration controls disabled for unanchored archive</span>
                  <button disabled className="px-2 py-1 bg-slate-800 rounded text-slate-600 cursor-not-allowed">-5s</button>
                  <button disabled className="px-2 py-1 bg-slate-800 rounded text-slate-600 cursor-not-allowed">-1s</button>
                  <button disabled className="px-2 py-1 bg-slate-800 rounded text-slate-600 cursor-not-allowed">Reset</button>
                  <button disabled className="px-2 py-1 bg-slate-800 rounded text-slate-600 cursor-not-allowed">+1s</button>
                  <button disabled className="px-2 py-1 bg-slate-800 rounded text-slate-600 cursor-not-allowed">+5s</button>
                </div>
              </>
            )}
          </div>

          {/* Interactive Play-by-Play Scrubber & Bottom Timeline */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-10 h-10 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center justify-center transition-all shadow-md shadow-cyan-950/20"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <button
                  onClick={() => setCurrentEventIndex(Math.max(0, currentEventIndex - 1))}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentEventIndex(Math.min(events.length - 1, currentEventIndex + 1))}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                <div className="font-mono text-xs text-slate-300">
                  <span className="font-bold text-white">Q{currentEvent?.period || 1} {currentEvent?.clock || "8:00"}</span>
                  <span className="text-slate-500 ml-2">({currentEventIndex + 1} / {events.length} Events)</span>
                </div>
              </div>

              {/* Playback Speed Picker */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-mono">
                {[1.0, 1.5, 2.0].map(spd => (
                  <button
                    key={spd}
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-2 py-0.5 rounded ${playbackSpeed === spd ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400"}`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Scrubber Track with Event Markers */}
            <div className="relative w-full h-8 bg-slate-950 rounded-lg border border-slate-800 flex items-center px-1">
              <input
                type="range"
                aria-label="Play-by-play match event scrubber"
                min="0"
                max={Math.max(0, events.length - 1)}
                value={currentEventIndex}
                onChange={e => setCurrentEventIndex(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
              />
            </div>

            {/* Active Event Card */}
            {currentEvent && (
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase ${
                    currentEvent.event_type === "TRY"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : currentEvent.event_type === "TIMEOUT"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : currentEvent.event_type === "TURNOVER"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  }`}>
                    {currentEvent.event_type}
                  </span>
                  <span className="font-semibold text-white">{currentEvent.detail || currentEvent.raw_text}</span>
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-slate-400">Score: <strong className="text-white">{currentEvent.score_a} - {currentEvent.score_b}</strong></span>
                  <span className="text-slate-500">p.{currentEvent.page || 16}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Side Panel: Active Lineups, Score, Narrative & Decision Alerts (col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Live Match State Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Live Game Telemetry</span>
              <span className="font-mono text-xs text-slate-400">Period {currentEvent?.period || 1} &bull; {currentEvent?.clock || "8:00"}</span>
            </div>

            {/* Big Scoreboard */}
            <div className="flex items-center justify-around py-2">
              <div className="text-center">
                <div className="text-xs text-slate-400 font-bold">{matchData?.team_a_code || "JPN"}</div>
                <div className="text-3xl font-black text-white font-mono mt-1">
                  {currentEvent ? currentEvent.score_a : (matchData?.official_score_a ?? 48)}
                </div>
              </div>
              <div className="text-slate-600 font-mono text-xl">:</div>
              <div className="text-center">
                <div className="text-xs text-slate-400 font-bold">{matchData?.team_b_code || "USA"}</div>
                <div className="text-3xl font-black text-white font-mono mt-1">
                  {currentEvent ? currentEvent.score_b : (matchData?.official_score_b ?? 41)}
                </div>
              </div>
            </div>

            {/* Dynamic Next-Score Expectation Gauge */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              {matchData ? (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Next-Score Expectation ({matchData.team_a_code || "JPN"}):</span>
                    <span className="font-mono font-bold text-cyan-400">
                      {(() => {
                        const curA = currentEvent?.score_a ?? matchData.official_score_a ?? 0;
                        const curB = currentEvent?.score_b ?? matchData.official_score_b ?? 0;
                        const diff = curA - curB;
                        const exp = Math.min(85, Math.max(15, 50 + diff * 1.5));
                        return `${exp.toFixed(1)}%`;
                      })()}
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-cyan-500 h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(85, Math.max(15, 50 + ((currentEvent?.score_a ?? matchData.official_score_a ?? 0) - (currentEvent?.score_b ?? matchData.official_score_b ?? 0)) * 1.5)).toFixed(1)}%`
                      }}
                    />
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-500 italic py-1 text-center">
                  Select a match to calculate next-score probability
                </div>
              )}
            </div>
          </div>

          {/* Active 4v4 On-Court Lineups */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Reconstructed Active Lineup (4v4)
              </span>
              {onNavigateToTacticalCourt && (
                <button
                  onClick={() => onNavigateToTacticalCourt(activeLineupA, matchData?.team_a_code)}
                  className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <span>Open in Court</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Team A Lineup */}
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-cyan-400">{matchData?.team_a_code} On Court:</div>
              <div className="grid grid-cols-2 gap-1.5">
                {activeLineupA.map((pName: string, idx: number) => (
                  <div key={idx} className="p-2 rounded bg-slate-950/60 border border-slate-800 text-[11px] text-slate-200 truncate">
                    {pName}
                  </div>
                ))}
              </div>
            </div>

            {/* Team B Lineup */}
            <div className="space-y-1 pt-2">
              <div className="text-[11px] font-bold text-amber-400">{matchData?.team_b_code} On Court:</div>
              <div className="grid grid-cols-2 gap-1.5">
                {activeLineupB.map((pName: string, idx: number) => (
                  <div key={idx} className="p-2 rounded bg-slate-950/60 border border-slate-800 text-[11px] text-slate-200 truncate">
                    {pName}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Decision Mirror High-Leverage Jump Card */}
          {onNavigateToDecisionMirror && (
            <div className="bg-gradient-to-r from-amber-950/30 to-slate-900 border border-amber-500/30 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Decision Mirror Leverage Point
                </span>
                <span className="font-mono text-[10px] text-amber-300 font-bold">Q4 5:31 (JPN 39 - USA 34)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                A critical 60s tactical timeout and substitution occurred at this moment (Page 132). Compare the observed aftermath against counterfactual legal lineups in Decision Mirror.
              </p>
              <button
                onClick={() => onNavigateToDecisionMirror()}
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-950/20"
              >
                <span>Inspect in Decision Mirror</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Match Narrative Storyline Chapter */}
          {matchNarrative && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Grounded Match Narrative Arc
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {matchNarrative.chapters?.map((chap: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{chap.title}</span>
                      <span className="font-mono text-cyan-400 text-[11px]">{chap.score_at_conclusion}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {chap.summary}
                    </p>
                    <div className="text-[10px] font-mono text-slate-500 pt-1">
                      {chap.source_provenance}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
