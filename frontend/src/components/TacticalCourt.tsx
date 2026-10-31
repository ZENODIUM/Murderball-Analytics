"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Shield, Users, RefreshCw, Download, Play, CheckCircle, AlertTriangle,
  PenTool, Eraser, Move, ArrowRight, Save, Undo, Redo, HelpCircle,
  Maximize2, Eye, ChevronDown, Plus, Minus, UserMinus, UserPlus, BookOpen, GitCommit
} from "lucide-react";

export interface PlayerToken {
  id: string;
  bib: number;
  name: string;
  sportClass: number;
  gender: string;
  team: "offense" | "defense";
  x: number; // percentage 0-100 of court width
  y: number; // percentage 0-100 of court height
  role?: string;
  status: "court" | "bench";
}

import { evaluateLineupLegality, RULES_ERAS } from "@/lib/classificationRules";

// Preset rosters for dual team selection
const PRESET_ROSTERS: Record<string, { code: string; name: string; players: Omit<PlayerToken, "id" | "team" | "x" | "y" | "status">[] }> = {
  AUS_2024: {
    code: "AUS",
    name: "Australia (Paris 2024)",
    players: [
      { bib: 3, name: "BATT Ryley", sportClass: 3.5, gender: "M", role: "Primary Ball-Carrier" },
      { bib: 10, name: "BOND Chris", sportClass: 3.5, gender: "M", role: "Secondary Finisher" },
      { bib: 11, name: "VERNON Beau", sportClass: 0.5, gender: "M", role: "Keyblock Screener" },
      { bib: 5, name: "McQUILLAN James", sportClass: 0.5, gender: "M", role: "Screen & Pick" },
      { bib: 14, name: "EDMONDSON Andrew", sportClass: 2.0, gender: "M", role: "Transition Slasher" },
      { bib: 7, name: "GRAHAM Shae", sportClass: 2.5, gender: "F", role: "Playmaker (Female Allowance)" },
      { bib: 9, name: "WARN Chris", sportClass: 1.5, gender: "M", role: "Defensive Anchor" },
      { bib: 2, name: "ERDEM Nazim", sportClass: 0.5, gender: "M", role: "Low-Point Specialist" }
    ]
  },
  USA_2024: {
    code: "USA",
    name: "United States (Paris 2024)",
    players: [
      { bib: 5, name: "AOKI Chuck", sportClass: 3.0, gender: "M", role: "Primary Ball-Carrier (Captain)" },
      { bib: 8, name: "ADAM Sarah", sportClass: 2.5, gender: "F", role: "Playmaker & Slasher (Female Allowance)" },
      { bib: 6, name: "BUTLER Jeff", sportClass: 0.5, gender: "M", role: "Keyblock Screener" },
      { bib: 10, name: "WHEELER Josh", sportClass: 2.5, gender: "M", role: "Transition Slasher" },
      { bib: 11, name: "FREDETTE Lee", sportClass: 1.0, gender: "M", role: "Low-Point Screener" },
      { bib: 15, name: "O'NEILL Josh", sportClass: 1.5, gender: "M", role: "Mid-Point Anchor" },
      { bib: 9, name: "NEWBY Eric", sportClass: 2.0, gender: "M", role: "Transition Wing" },
      { bib: 2, name: "MELTON Chuck", sportClass: 2.0, gender: "M", role: "Defensive Containment" }
    ]
  },
  GBR_2024: {
    code: "GBR",
    name: "Great Britain (Paris 2024)",
    players: [
      { bib: 13, name: "PHIPPS Aaron", sportClass: 3.5, gender: "M", role: "Primary Ball-Carrier" },
      { bib: 3, name: "ROBINSON Stuart", sportClass: 3.5, gender: "M", role: "Secondary Finisher" },
      { bib: 2, name: "COGGAN Jonathan", sportClass: 0.5, gender: "M", role: "Premier Screener" },
      { bib: 5, name: "SMITH Jack", sportClass: 0.5, gender: "M", role: "Keyblock Pick" },
      { bib: 8, name: "WALKER Daniel", sportClass: 2.5, gender: "M", role: "Transition Wing" },
      { bib: 11, name: "ASH David", sportClass: 2.0, gender: "M", role: "Mid-Trap Defender" },
      { bib: 4, name: "GAVIN Ryan", sportClass: 1.0, gender: "M", role: "Anchor Screener" },
      { bib: 12, name: "HADDEN Jamie", sportClass: 1.5, gender: "M", role: "Mid Screener" }
    ]
  },
  JPN_2024: {
    code: "JPN",
    name: "Japan (Paris 2024)",
    players: [
      { bib: 32, name: "HASHIMOTO Katsuya", sportClass: 3.5, gender: "M", role: "Primary Finisher & Slasher" },
      { bib: 21, name: "IKE Yukinobu", sportClass: 3.0, gender: "M", role: "Floor General & Captain" },
      { bib: 7, name: "IKEZAKI Daisuke", sportClass: 3.0, gender: "M", role: "Transition Speedster" },
      { bib: 22, name: "NORIMATSU Seiya", sportClass: 1.5, gender: "M", role: "Premier Pick/Screen" },
      { bib: 3, name: "KURAHASHI Kae", sportClass: 0.5, gender: "F", role: "Defensive Stopper (Female Allowance)" },
      { bib: 2, name: "HASEGAWA Yuki", sportClass: 0.5, gender: "M", role: "Low Corner Screener" },
      { bib: 11, name: "KUSABA Ryuji", sportClass: 1.0, gender: "M", role: "Mid-Field Containment" },
      { bib: 23, name: "OGAWA Hitoshi", sportClass: 1.0, gender: "M", role: "Mid-Trap Defender" }
    ]
  }
};

export interface TacticalCourtProps {
  initialLineupNames?: string[];
  initialTeamCode?: string;
  onNavigateToResearch?: () => void;
  onNavigateToDecisionMirror?: () => void;
}

export default function TacticalCourt({
  initialLineupNames,
  initialTeamCode,
  onNavigateToResearch,
  onNavigateToDecisionMirror
}: TacticalCourtProps = {}) {
  const [teamAKey, setTeamAKey] = useState("AUS_2024");
  const [teamBKey, setTeamBKey] = useState("USA_2024");
  const [selectedEra, setSelectedEra] = useState<string>("ERA_2026_MODERN");

  useEffect(() => {
    if (initialTeamCode) {
      const matchKey = Object.keys(PRESET_ROSTERS).find(k => PRESET_ROSTERS[k].code === initialTeamCode);
      if (matchKey) {
        setTeamAKey(matchKey);
      }
    }
  }, [initialTeamCode]);

  // Roster states
  const [offenseRoster, setOffenseRoster] = useState<PlayerToken[]>([]);
  const [defenseRoster, setDefenseRoster] = useState<PlayerToken[]>([]);

  const [selectedToken, setSelectedToken] = useState<PlayerToken | null>(null);
  const [drawMode, setDrawMode] = useState<"select" | "pan" | "arrow" | "pass" | "screen" | "trap">("select");
  const [courtZoom, setCourtZoom] = useState(1);
  const [courtPan, setCourtPan] = useState({ x: 0, y: 0 });
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [previewAnnotation, setPreviewAnnotation] = useState<any | null>(null);
  const [pendingStart, setPendingStart] = useState<{ type: "arrow" | "pass"; x: number; y: number } | null>(null);
  const [history, setHistory] = useState<any[][]>([]);
  const [scenarioName, setScenarioName] = useState("0.5-Point Keyblock Iso Trap");
  const [scenarioStatus, setScenarioStatus] = useState("");

  const courtRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<{ kind: "token" | "drawing" | "pan"; tokenId?: string; startX: number; startY: number; panX?: number; panY?: number } | null>(null);

  useEffect(() => {
    setPreviewAnnotation(null);
    setPendingStart(null);
  }, [drawMode]);

  // Initialize rosters when team keys change
  useEffect(() => {
    const tA = PRESET_ROSTERS[teamAKey];
    const offPlayers: PlayerToken[] = tA.players.map((p, idx) => {
      let isOnCourt = idx < 4;
      if (initialLineupNames && initialLineupNames.length > 0) {
        isOnCourt = initialLineupNames.some(n => n.toUpperCase().includes(p.name.toUpperCase()) || p.name.toUpperCase().includes(n.toUpperCase()));
      }
      return {
        ...p,
        id: `off_${idx}_${p.bib}`,
        team: "offense",
        status: isOnCourt ? "court" : "bench",
        x: idx === 0 ? 70 : idx === 1 ? 62 : idx === 2 ? 82 : idx === 3 ? 80 : 0,
        y: idx === 0 ? 50 : idx === 1 ? 25 : idx === 2 ? 35 : idx === 3 ? 65 : 0
      };
    });
    setOffenseRoster(offPlayers);

    const tB = PRESET_ROSTERS[teamBKey];
    const defPlayers: PlayerToken[] = tB.players.map((p, idx) => ({
      ...p,
      id: `def_${idx}_${p.bib}`,
      team: "defense",
      status: idx < 4 ? "court" : "bench",
      x: idx === 0 ? 86 : idx === 1 ? 86 : idx === 2 ? 74 : idx === 3 ? 68 : 0,
      y: idx === 0 ? 40 : idx === 1 ? 60 : idx === 2 ? 45 : idx === 3 ? 70 : 0
    }));
    setDefenseRoster(defPlayers);
    setAnnotations([]);
    setHistory([]);
  }, [teamAKey, teamBKey]);

  // Active on-court tokens
  const activeOffense = offenseRoster.filter(p => p.status === "court");
  const benchOffense = offenseRoster.filter(p => p.status === "bench");

  const activeDefense = defenseRoster.filter(p => p.status === "court");
  const benchDefense = defenseRoster.filter(p => p.status === "bench");

  // Legal Lineup Calculations via Central Date-Aware Engine
  const offLegality = evaluateLineupLegality(activeOffense, selectedEra);
  const offPoints = offLegality.rawClassificationSum;
  const offCap = offLegality.effectiveCap;
  const offLegal = offLegality.isLegal;

  const defLegality = evaluateLineupLegality(activeDefense, selectedEra);
  const defPoints = defLegality.rawClassificationSum;
  const defCap = defLegality.effectiveCap;
  const defLegal = defLegality.isLegal;

  // Substitution action
  const substitutePlayer = (enteringToken: PlayerToken, exitingToken: PlayerToken) => {
    if (enteringToken.team === "offense") {
      setOffenseRoster(prev => prev.map(p => {
        if (p.id === enteringToken.id) {
          return { ...p, status: "court", x: exitingToken.x, y: exitingToken.y };
        }
        if (p.id === exitingToken.id) {
          return { ...p, status: "bench", x: 0, y: 0 };
        }
        return p;
      }));
    } else {
      setDefenseRoster(prev => prev.map(p => {
        if (p.id === enteringToken.id) {
          return { ...p, status: "court", x: exitingToken.x, y: exitingToken.y };
        }
        if (p.id === exitingToken.id) {
          return { ...p, status: "bench", x: 0, y: 0 };
        }
        return p;
      }));
    }
    setSelectedToken(null);
  };

  const courtPoint = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = courtRef.current!.getBoundingClientRect();
    return {
      x: Math.max(3, Math.min(97, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(5, Math.min(95, ((event.clientY - rect.top) / rect.height) * 100)),
    };
  };

  const moveToken = (token: PlayerToken, x: number, y: number) => {
    const update = (players: PlayerToken[]) => players.map(player => player.id === token.id ? { ...player, x, y } : player);
    if (token.team === "offense") setOffenseRoster(update);
    else setDefenseRoster(update);
  };

  const handleCourtPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!courtRef.current) return;
    if (drawMode === "pan") {
      gestureRef.current = { kind: "pan", startX: event.clientX, startY: event.clientY, panX: courtPan.x, panY: courtPan.y };
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    const { x, y } = courtPoint(event);
    if (drawMode === "select") {
      const id = (event.target as Element).closest<HTMLElement>("[data-token-id]")?.dataset.tokenId;
      const token = [...activeOffense, ...activeDefense].find(player => player.id === id);
      if (token) {
        setSelectedToken(token);
        gestureRef.current = { kind: "token", tokenId: token.id, startX: x, startY: y };
        event.currentTarget.setPointerCapture(event.pointerId);
      } else if (selectedToken?.status === "court") {
        moveToken(selectedToken, x, y);
        setSelectedToken(null);
      }
      return;
    }

    if (drawMode === "screen" || drawMode === "trap") {
      setHistory(previous => [...previous, annotations]);
      setAnnotations(previous => [...previous, { type: drawMode, x, y }]);
      return;
    }

    if (pendingStart?.type === drawMode) {
      setHistory(previous => [...previous, annotations]);
      setAnnotations(previous => [...previous, { type: drawMode, x1: pendingStart.x, y1: pendingStart.y, x2: x, y2: y }]);
      setPendingStart(null);
      setPreviewAnnotation(null);
      return;
    }
    gestureRef.current = { kind: "drawing", startX: x, startY: y };
    setPreviewAnnotation({ type: drawMode, x1: x, y1: y, x2: x, y2: y });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleCourtPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || !courtRef.current) return;
    if (gesture.kind === "pan") {
      setCourtPan({ x: (gesture.panX || 0) + event.clientX - gesture.startX, y: (gesture.panY || 0) + event.clientY - gesture.startY });
      return;
    }
    const { x, y } = courtPoint(event);
    if (gesture.kind === "token") {
      const token = [...activeOffense, ...activeDefense].find(player => player.id === gesture.tokenId);
      if (token) moveToken(token, x, y);
    } else {
      setPreviewAnnotation({ type: drawMode, x1: gesture.startX, y1: gesture.startY, x2: x, y2: y });
    }
  };

  const handleCourtPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || !courtRef.current) return;
    const { x, y } = gesture.kind === "pan" ? { x: 0, y: 0 } : courtPoint(event);
    if (gesture.kind === "drawing" && (drawMode === "arrow" || drawMode === "pass")) {
      if (Math.hypot(x - gesture.startX, y - gesture.startY) > 1.5) {
        setHistory(previous => [...previous, annotations]);
        setAnnotations(previous => [...previous, { type: drawMode, x1: gesture.startX, y1: gesture.startY, x2: x, y2: y }]);
        setPendingStart(null);
      } else {
        setPendingStart({ type: drawMode, x, y });
      }
      setPreviewAnnotation(null);
    } else if (gesture.kind === "token" && Math.hypot(x - gesture.startX, y - gesture.startY) > 1.5) {
      setSelectedToken(null);
    }
    gestureRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const undoLastAction = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setAnnotations(prev);
      setHistory(history.slice(0, -1));
    } else if (annotations.length > 0) {
      setAnnotations(annotations.slice(0, -1));
    }
  };

  const applyTacticalPreset = (preset: "keyblock" | "press" | "iso") => {
    setPendingStart(null);
    setPreviewAnnotation(null);
    if (preset === "keyblock") {
      setAnnotations([
        { type: "screen", x: 88, y: 38 },
        { type: "screen", x: 88, y: 62 },
        { type: "arrow", x1: 72, y1: 50, x2: 96, y2: 50 }
      ]);
      setScenarioName("Double 0.5 Keyblock Pick (Tactical Hypothesis)");
    } else if (preset === "press") {
      setAnnotations([
        { type: "trap", x: 22, y: 50 },
        { type: "pass", x1: 5, y1: 50, x2: 18, y2: 50 }
      ]);
      setScenarioName("12-Second Backcourt Inbound Trap Press");
    } else if (preset === "iso") {
      setAnnotations([
        { type: "screen", x: 75, y: 30 },
        { type: "arrow", x1: 65, y1: 70, x2: 95, y2: 70 }
      ]);
      setScenarioName("Corner Clear-Out Isolation Drive");
    }
  };

  const scenarioStorageKey = `murderball.court.${teamAKey}.${teamBKey}`;
  const saveScenario = () => {
    try {
      localStorage.setItem(scenarioStorageKey, JSON.stringify({
        name: scenarioName,
        era: selectedEra,
        offense: offenseRoster,
        defense: defenseRoster,
        annotations,
      }));
      setScenarioStatus("Saved on this device");
    } catch {
      setScenarioStatus("Could not save this scenario in this browser");
    }
  };
  const loadScenario = () => {
    try {
      const stored = localStorage.getItem(scenarioStorageKey);
      if (!stored) { setScenarioStatus("No saved scenario for these teams"); return; }
      const scenario = JSON.parse(stored);
      if (!Array.isArray(scenario.offense) || !Array.isArray(scenario.defense) || !Array.isArray(scenario.annotations)) throw new Error("Invalid saved scenario");
      setOffenseRoster(scenario.offense);
      setDefenseRoster(scenario.defense);
      setAnnotations(scenario.annotations);
      setSelectedEra(scenario.era || selectedEra);
      setScenarioName(scenario.name || scenarioName);
      setHistory([]);
      setPendingStart(null);
      setPreviewAnnotation(null);
      setScenarioStatus("Saved scenario loaded");
    } catch {
      setScenarioStatus("Saved scenario could not be loaded");
    }
  };

  return (
    <div className="space-y-6 tactical-court-ui">
      {/* Header & Match Setup Controls */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Tactical court</h1>
            <p className="mt-1 text-sm text-zinc-300">Arrange two lineups and sketch a play on a 28m × 15m court.</p>
          </div>

          {/* Dual Team Roster Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase text-emerald-400">Offense:</span>
              <select
                value={teamAKey}
                onChange={e => setTeamAKey(e.target.value)}
                className="rounded-lg border border-emerald-500/40 bg-zinc-950 px-3 py-1.5 text-xs font-bold text-white focus:outline-none"
              >
                {Object.entries(PRESET_ROSTERS).map(([k, v]) => (
                  <option key={k} value={k}>{v.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase text-blue-400">Defense:</span>
              <select
                value={teamBKey}
                onChange={e => setTeamBKey(e.target.value)}
                className="rounded-lg border border-blue-500/40 bg-zinc-950 px-3 py-1.5 text-xs font-bold text-white focus:outline-none"
              >
                {Object.entries(PRESET_ROSTERS).map(([k, v]) => (
                  <option key={k} value={k}>{v.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase text-amber-400">Rules Era:</span>
              <select
                value={selectedEra}
                onChange={e => setSelectedEra(e.target.value)}
                className="rounded-lg border border-[#819b83] bg-[#23382d] px-3 py-1.5 text-xs font-bold text-[#f4efe4] focus:outline-none"
              >
                {Object.entries(RULES_ERAS).map(([k, v]) => (
                  <option key={k} value={k}>{v.name}</option>
                ))}
              </select>
            </div>

            {onNavigateToResearch && (
              <button
                onClick={onNavigateToResearch}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3d5948] hover:bg-[#4a6855] border border-[#789b82] text-[#f4efe4] text-xs font-semibold cursor-pointer transition-all shadow-sm"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Inspect Evidence in Research Hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lineup Validation Banners & Bench Substitution Trays */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Offense Panel */}
        <div className={`rounded-xl border p-4 transition-all ${
          offLegal ? "border-[#7aa184] bg-[#2d4536]" : "border-[#bb7c6b] bg-[#573d35]"
        }`}>
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="font-bold text-white text-sm">
                Team A (Offense) Active Lineup
              </h3>
            </div>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
              offLegal ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
            }`}>
              {offLegal ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
              {offLegal ? "LEGAL 4-ATHLETE UNIT" : "RULE VIOLATION"}
            </span>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>Points: <strong className="text-white text-sm">{offPoints.toFixed(1)}</strong> / {offCap.toFixed(1)} {offLegality.femaleCount > 0 ? `(+${offLegality.totalFemaleAllowance.toFixed(1)} allowance)` : ""}</span>
            <span>On-Court: <strong className="text-white text-sm">{activeOffense.length} / 4</strong></span>
          </div>

          {/* Active 4 Athletes */}
          <div className="mt-3 flex flex-wrap gap-2">
            {activeOffense.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedToken(selectedToken?.id === p.id ? null : p)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all ${
                  selectedToken?.id === p.id
                    ? "border-emerald-400 bg-emerald-500 text-zinc-950 shadow-md scale-105"
                    : "border-emerald-500/40 bg-emerald-950/30 text-emerald-300 hover:border-emerald-400"
                }`}
              >
                #{p.bib} {p.name.split(" ")[0]} ({p.sportClass.toFixed(1)})
              </button>
            ))}
          </div>

          {/* Bench Roster for Instant Swap */}
          <div className="mt-4 border-t border-zinc-800/80 pt-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">
              Team A Bench (Click to Swap with Selected Player):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {benchOffense.map(b => (
                <button
                  key={b.id}
                  onClick={() => {
                    if (selectedToken && selectedToken.team === "offense") {
                      substitutePlayer(b, selectedToken);
                    }
                  }}
                  className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-300 hover:border-emerald-500/60 hover:text-white transition-colors"
                  title="Select an on-court player first, then click bench player to swap"
                >
                  +{b.name.split(" ")[0]} ({b.sportClass.toFixed(1)})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Defense Panel */}
        <div className={`rounded-xl border p-4 transition-all ${
          defLegal ? "border-[#7c9ba6] bg-[#2d4346]" : "border-[#bb7c6b] bg-[#573d35]"
        }`}>
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
              <h3 className="font-bold text-white text-sm">
                Team B (Defense) Active Lineup
              </h3>
            </div>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
              defLegal ? "bg-blue-500/20 text-blue-400" : "bg-red-500/20 text-red-400"
            }`}>
              {defLegal ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
              {defLegal ? "LEGAL 4-ATHLETE UNIT" : "RULE VIOLATION"}
            </span>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>Points: <strong className="text-white text-sm">{defPoints.toFixed(1)}</strong> / {defCap.toFixed(1)} {defLegality.femaleCount > 0 ? `(+${defLegality.totalFemaleAllowance.toFixed(1)} allowance)` : ""}</span>
            <span>On-Court: <strong className="text-white text-sm">{activeDefense.length} / 4</strong></span>
          </div>

          {/* Active 4 Athletes */}
          <div className="mt-3 flex flex-wrap gap-2">
            {activeDefense.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedToken(selectedToken?.id === p.id ? null : p)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all ${
                  selectedToken?.id === p.id
                    ? "border-blue-400 bg-blue-500 text-zinc-950 shadow-md scale-105"
                    : "border-blue-500/40 bg-blue-950/30 text-blue-300 hover:border-blue-400"
                }`}
              >
                #{p.bib} {p.name.split(" ")[0]} ({p.sportClass.toFixed(1)})
              </button>
            ))}
          </div>

          {/* Bench Roster for Instant Swap */}
          <div className="mt-4 border-t border-zinc-800/80 pt-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">
              Team B Bench (Click to Swap with Selected Player):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {benchDefense.map(b => (
                <button
                  key={b.id}
                  onClick={() => {
                    if (selectedToken && selectedToken.team === "defense") {
                      substitutePlayer(b, selectedToken);
                    }
                  }}
                  className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-300 hover:border-blue-500/60 hover:text-white transition-colors"
                  title="Select an on-court player first, then click bench player to swap"
                >
                  +{b.name.split(" ")[0]} ({b.sportClass.toFixed(1)})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tactical Toolbar & Actions */}
      <div className="tactical-toolbar flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#456050] bg-[#293e33] p-3">
        {/* Drawing Mode Tools */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 px-2">Tools:</span>

          <button
            onClick={() => setDrawMode("select")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              drawMode === "select"
                ? "bg-zinc-700 text-white shadow"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <Move className="h-3.5 w-3.5" /> Move Token
          </button>

          <button
            onClick={() => setDrawMode("pan")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${drawMode === "pan" ? "bg-zinc-700 text-white shadow" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}
          ><Move className="h-3.5 w-3.5" /> Pan Court</button>

          <button
            onClick={() => setDrawMode("arrow")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              drawMode === "arrow"
                ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <PenTool className="h-3.5 w-3.5" /> Drive Arrow
          </button>

          <button
            onClick={() => setDrawMode("pass")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              drawMode === "pass"
                ? "bg-blue-600/30 text-blue-300 border border-blue-500/40"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <ArrowRight className="h-3.5 w-3.5" /> Pass Route
          </button>

          <button
            onClick={() => setDrawMode("screen")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              drawMode === "screen"
                ? "bg-amber-600/30 text-amber-300 border border-amber-500/40"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <Shield className="h-3.5 w-3.5" /> Keyblock Screen
          </button>

          <button
            onClick={() => setDrawMode("trap")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              drawMode === "trap"
                ? "bg-rose-600/30 text-rose-300 border border-rose-500/40"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <Shield className="h-3.5 w-3.5" /> Trap Zone
          </button>

          <div className="h-4 w-px bg-zinc-800 mx-1" />

          <button
            onClick={undoLastAction}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white"
            title="Undo"
          >
            <Undo className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => { setAnnotations([]); setHistory([]); }}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-red-400"
            title="Clear All Annotations"
          >
            <Eraser className="h-3.5 w-3.5" /> Clear
          </button>
        </div>

        {/* Tactical Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">View:</span>
          <button aria-label="Zoom out court" onClick={() => setCourtZoom(value => Math.max(.75, +(value - .25).toFixed(2)))} className="rounded-lg border border-zinc-700 bg-zinc-800 p-1.5 text-zinc-200 hover:bg-zinc-700"><Minus className="h-3.5 w-3.5" /></button>
          <span className="min-w-9 text-center text-xs text-zinc-300 font-mono">{Math.round(courtZoom * 100)}%</span>
          <button aria-label="Zoom in court" onClick={() => setCourtZoom(value => Math.min(2, +(value + .25).toFixed(2)))} className="rounded-lg border border-zinc-700 bg-zinc-800 p-1.5 text-zinc-200 hover:bg-zinc-700"><Plus className="h-3.5 w-3.5" /></button>
          <button aria-label="Reset court view" onClick={() => { setCourtZoom(1); setCourtPan({ x: 0, y: 0 }); }} className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700">Reset view</button>
          <div className="h-4 w-px bg-zinc-700 mx-1" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Presets:</span>

          <button
            onClick={() => applyTacticalPreset("keyblock")}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
          >
            H1: Double Keyblock
          </button>

          <button
            onClick={() => applyTacticalPreset("press")}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
          >
            12s Inbound Press
          </button>

          <button
            onClick={() => applyTacticalPreset("iso")}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
          >
            Corner Clear-Out
          </button>
        </div>
      </div>

      <p className="text-xs text-zinc-400 px-1">Drag athletes to move them. Use Pan Court to move the view. Drag to draw a route, or click its start and end points. Click once to place a screen or trap.</p>
      {/* Regulation Wheelchair Rugby Court (28m x 15m) */}
      <div
        className="relative w-full rounded-2xl overflow-hidden border-2 border-zinc-700 bg-zinc-950 shadow-2xl select-none"
        style={{ aspectRatio: "28 / 15" }}
      >
        <div
          ref={courtRef}
          data-testid="tactical-court"
          style={{ transform: `translate(${courtPan.x}px, ${courtPan.y}px) scale(${courtZoom})`, transformOrigin: "center center" }}
          onPointerDown={handleCourtPointerDown}
          onPointerMove={handleCourtPointerMove}
          onPointerUp={handleCourtPointerUp}
          onPointerCancel={() => { gestureRef.current = null; setPreviewAnnotation(null); }}
          className={`absolute inset-0 touch-none ${drawMode === "pan" ? "cursor-grab active:cursor-grabbing" : drawMode === "select" ? "cursor-default" : "cursor-crosshair"}`}
        >
          {/* Regulation Scaled Court SVG */}
          <svg className="w-full h-full" viewBox="0 0 2800 1500" preserveAspectRatio="none">
            {/* Court boundary & hardwood deck */}
            <rect width="2800" height="1500" fill="#1f2c25" />
            <rect x="50" y="50" width="2700" height="1400" fill="#283b30" stroke="#78927d" strokeWidth="6" />

            {/* Half-Court Line & Center Circle */}
            <line x1="1400" y1="50" x2="1400" y2="1450" stroke="#78927d" strokeWidth="6" strokeDasharray="16 12" />
            <circle cx="1400" cy="750" r="180" fill="none" stroke="#78927d" strokeWidth="6" />
            <circle cx="1400" cy="750" r="12" fill="#a9b9a7" />

            {/* Left Key Area (8m wide x 5.6m high) */}
            <rect x="50" y="470" width="450" height="560" fill="rgba(136, 171, 181, 0.12)" stroke="#88abb5" strokeWidth="5" />
            {/* Left Goal Try Line (8m Red line) */}
            <line x1="50" y1="470" x2="50" y2="1030" stroke="#c67b65" strokeWidth="14" />
            <circle cx="50" cy="470" r="18" fill="#c67b65" />
            <circle cx="50" cy="1030" r="18" fill="#c67b65" />
            <text x="80" y="760" fill="#a9b9a7" fontSize="32" fontFamily="sans-serif" fontWeight="bold">DEFENSE GOAL</text>

            {/* Right Key Area */}
            <rect x="2300" y="470" width="450" height="560" fill="rgba(167, 201, 168, 0.12)" stroke="#a7c9a8" strokeWidth="5" />
            {/* Right Goal Try Line */}
            <line x1="2750" y1="470" x2="2750" y2="1030" stroke="#c67b65" strokeWidth="14" />
            <circle cx="2750" cy="470" r="18" fill="#c67b65" />
            <circle cx="2750" cy="1030" r="18" fill="#c67b65" />
            <text x="2420" y="760" fill="#a9b9a7" fontSize="32" fontFamily="sans-serif" fontWeight="bold">ATTACK GOAL</text>

            {/* Official Table & Penalty Box Zone */}
            <rect x="1200" y="10" width="400" height="40" fill="#27272a" opacity="0.8" />
            <text x="1270" y="34" fill="#a1a1aa" fontSize="22" fontWeight="bold">OFFICIAL SCORE TABLE / PENALTY BOX</text>

            {/* Render Annotations: Drive Arrows, Pass Routes, Screens */}
            {[...annotations, ...(previewAnnotation ? [previewAnnotation] : [])].map((ann, idx) => {
              if (ann.type === "arrow") {
                const sx = (ann.x1 / 100) * 2800;
                const sy = (ann.y1 / 100) * 1500;
                const ex = (ann.x2 / 100) * 2800;
                const ey = (ann.y2 / 100) * 1500;
                return (
                  <g key={idx} data-annotation-type="arrow">
                    <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="#a7c9a8" strokeWidth="8" strokeDasharray="14 8" />
                    <circle cx={ex} cy={ey} r="14" fill="#a7c9a8" />
                  </g>
                );
              }
              if (ann.type === "pass") {
                const sx = (ann.x1 / 100) * 2800;
                const sy = (ann.y1 / 100) * 1500;
                const ex = (ann.x2 / 100) * 2800;
                const ey = (ann.y2 / 100) * 1500;
                return (
                  <g key={idx} data-annotation-type="pass">
                    <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="#88abb5" strokeWidth="6" strokeDasharray="8 8" />
                    <circle cx={ex} cy={ey} r="12" fill="#88abb5" />
                  </g>
                );
              }
              if (ann.type === "screen") {
                const cx = (ann.x / 100) * 2800;
                const cy = (ann.y / 100) * 1500;
                return (
                  <g key={idx} data-annotation-type="screen">
                    <rect x={cx - 50} y={cy - 25} width="100" height="50" rx="10" fill="rgba(197, 139, 81, 0.4)" stroke="#c58b51" strokeWidth="4" />
                    <text x={cx - 38} y={cy + 8} fill="#fef3c7" fontSize="24" fontWeight="bold">BLOCK</text>
                  </g>
                );
              }
              if (ann.type === "trap") {
                const cx = (ann.x / 100) * 2800;
                const cy = (ann.y / 100) * 1500;
                return (
                  <circle key={idx} data-annotation-type="trap" cx={cx} cy={cy} r="100" fill="rgba(239, 68, 68, 0.2)" stroke="#ef4444" strokeWidth="4" strokeDasharray="12 8" />
                );
              }
              return null;
            })}
          </svg>

          {/* Render Active Offense Player Tokens */}
          {activeOffense.map(p => {
            const isSelected = selectedToken?.id === p.id;
            return (
              <div
                key={p.id}
                data-token-id={p.id}
                role="button"
                tabIndex={0}
                aria-label={`Move ${p.name}`}
                onKeyDown={event => {
                  if (drawMode !== "select") return;
                  const step = event.shiftKey ? 5 : 2;
                  const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[event.key as "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown"];
                  if (delta) { event.preventDefault(); moveToken(p, Math.max(3, Math.min(97, p.x + delta[0])), Math.max(5, Math.min(95, p.y + delta[1]))); }
                }}
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing transition-transform duration-100 ${
                  isSelected ? "scale-125 z-40" : "hover:scale-110 z-20"
                }`}
              >
                <div className="relative flex flex-col items-center">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-full font-bold text-sm shadow-2xl border-2 ${
                    isSelected
                      ? "bg-emerald-400 text-zinc-950 border-white ring-4 ring-emerald-500/50"
                      : "bg-emerald-600 text-white border-emerald-300"
                  }`}>
                    #{p.bib}
                  </div>
                  <div className="absolute top-12 whitespace-nowrap rounded bg-zinc-950/90 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/40 shadow-lg pointer-events-none">
                    {p.name.split(" ")[0]} ({p.sportClass.toFixed(1)})
                  </div>
                </div>
              </div>
            );
          })}

          {/* Render Active Defense Player Tokens */}
          {activeDefense.map(p => {
            const isSelected = selectedToken?.id === p.id;
            return (
              <div
                key={p.id}
                data-token-id={p.id}
                role="button"
                tabIndex={0}
                aria-label={`Move ${p.name}`}
                onKeyDown={event => {
                  if (drawMode !== "select") return;
                  const step = event.shiftKey ? 5 : 2;
                  const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[event.key as "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown"];
                  if (delta) { event.preventDefault(); moveToken(p, Math.max(3, Math.min(97, p.x + delta[0])), Math.max(5, Math.min(95, p.y + delta[1]))); }
                }}
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing transition-transform duration-100 ${
                  isSelected ? "scale-125 z-40" : "hover:scale-110 z-20"
                }`}
              >
                <div className="relative flex flex-col items-center">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-full font-bold text-sm shadow-2xl border-2 ${
                    isSelected
                      ? "bg-blue-400 text-zinc-950 border-white ring-4 ring-blue-500/50"
                      : "bg-blue-600 text-white border-blue-300"
                  }`}>
                    #{p.bib}
                  </div>
                  <div className="absolute top-12 whitespace-nowrap rounded bg-zinc-950/90 px-1.5 py-0.5 text-[10px] font-semibold text-blue-300 border border-blue-500/40 shadow-lg pointer-events-none">
                    {p.name.split(" ")[0]} ({p.sportClass.toFixed(1)})
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Player Inspector & Scenario Save Bar */}
      <div className="tactical-footer flex flex-col gap-3 rounded-xl border border-[#456050] bg-[#293e33] p-4 sm:flex-row sm:items-center sm:justify-between">
        {selectedToken ? (
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${
              selectedToken.team === "offense" ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"
            }`}>
              #{selectedToken.bib}
            </div>
            <div>
              <div className="text-sm font-bold text-white">{selectedToken.name}</div>
              <div className="text-xs text-zinc-400">
                Class {selectedToken.sportClass.toFixed(1)} | {selectedToken.team.toUpperCase()} | Drag or click the destination to reposition
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-zinc-400">
            Select any player token to move or swap with bench; use tactical drawing tools to annotate plays.
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="text"
            aria-label="Scenario name"
            value={scenarioName}
            onChange={e => setScenarioName(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none"
          />
          <button
            onClick={saveScenario}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
          >
            <Save className="h-3.5 w-3.5" /> Save Scenario
          </button>
          <button onClick={loadScenario} className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700">Load saved</button>
        </div>
        {scenarioStatus && <p role="status" className="text-xs text-emerald-300">{scenarioStatus}</p>}
      </div>
    </div>
  );
}
