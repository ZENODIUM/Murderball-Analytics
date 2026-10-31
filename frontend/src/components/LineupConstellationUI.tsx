"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getLineupConstellation } from "../lib/api";
import NetworkGraph from "./NetworkGraph";
import {
  Share2, Users, Activity, Filter, ChevronRight,
  ArrowUpRight, Award, Zap, Shield, Sparkles
} from "lucide-react";

interface ConstellationProps {
  onSendToTacticalCourt?: (lineupNames: string[], teamCode: string) => void;
  onSelectPlayer?: (playerName: string) => void;
}

export default function LineupConstellationUI({ onSendToTacticalCourt, onSelectPlayer }: ConstellationProps) {
  const [teamFilter, setTeamFilter] = useState<string>("AUS");
  const [constellation, setConstellation] = useState<any>({ nodes: [], edges: [] });
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>("BATT Ryley");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await getLineupConstellation(teamFilter === "ALL" ? undefined : teamFilter);
        setConstellation(data);
        if (data.nodes.length > 0) {
          // Select player with most minutes
          setSelectedPlayer(data.nodes[0].name);
        }
      } catch (err) {
        console.error("Failed to load constellation:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [teamFilter]);

  const activeNode = constellation.nodes?.find((n: any) => n.name === selectedPlayer);

  // Find all edges connected to selected player
  const connectedEdges = useMemo(() => {
    if (!selectedPlayer) return [];
    return (constellation.edges || []).filter(
      (e: any) => e.source === selectedPlayer || e.target === selectedPlayer
    ).sort((a: any, b: any) => b.shared_minutes - a.shared_minutes);
  }, [constellation, selectedPlayer]);

  const teamsList = ["AUS", "USA", "GBR", "JPN", "CAN", "FRA", "DEN", "GER", "NZL"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Share2 className="w-6 h-6 text-emerald-300" />
              Lineup partnerships
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              See which athletes shared the court and how their recorded net ratings compared.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300">
            Squad
            <select aria-label="Select squad in network" value={teamFilter} onChange={event => setTeamFilter(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-semibold text-white">
              {teamsList.map(team => <option key={team} value={team}>{team}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Focused network visualization */}
        <div className="lg:col-span-8 rounded-xl border border-slate-800 bg-slate-900 p-4 md:p-5 space-y-3 min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Athlete partnerships</h3>
              <p className="text-xs text-slate-400 mt-1">Select a node to see its strongest on-court partners.</p>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-300">
              Athlete
              <select aria-label="Select athlete in network" value={selectedPlayer || ""} onChange={event => setSelectedPlayer(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-2 text-sm text-white max-w-48">
                {(constellation.nodes || []).map((node: any) => <option key={node.name} value={node.name}>{node.name}</option>)}
              </select>
            </label>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
            <span><i className="inline-block h-2.5 w-2.5 rounded-full bg-[#d3a078] mr-1" />High class (3.0+)</span>
            <span><i className="inline-block h-2.5 w-2.5 rounded-full bg-[#88abb5] mr-1" />Mid class (2.0?2.5)</span>
            <span><i className="inline-block h-2.5 w-2.5 rounded-full bg-[#a7c9a8] mr-1" />Low class (0.5?1.5)</span>
          </div>
          {loading ? <div className="h-[500px] flex items-center justify-center text-slate-400">Loading partnerships?</div>
            : constellation.nodes?.length ? <NetworkGraph key={teamFilter} nodes={constellation.nodes} edges={constellation.edges || []} selected={selectedPlayer} onSelect={setSelectedPlayer} />
            : <div className="h-[500px] flex items-center justify-center text-slate-400">No network data for this squad.</div>}
        </div>

        {/* Right: Selected Athlete Co-play Dossier */}
        <div className="lg:col-span-4 space-y-4">
          {activeNode ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                    {activeNode.primary_role}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    {activeNode.name}
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-xs font-bold text-cyan-300">
                  Class {activeNode.classification.toFixed(1)}
                </span>
              </div>

              {/* Career Highlights */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <div className="text-slate-400">Career Paralympic Mins:</div>
                  <div className="text-base font-mono font-bold text-white mt-0.5">
                    {activeNode.career_minutes} min
                  </div>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <div className="text-slate-400">Paralympic Tries:</div>
                  <div className="text-base font-mono font-bold text-cyan-400 mt-0.5">
                    {activeNode.career_tries} tries
                  </div>
                </div>
              </div>

              {/* Top Co-play Partnerships */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Top Co-Play Partners ({connectedEdges.length})
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {connectedEdges.map((e: any, idx: number) => {
                    const partner = e.source === selectedPlayer ? e.target : e.source;
                    const isPositive = e.net_per_100s >= 0;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedPlayer(partner)}
                        className="w-full p-2.5 rounded-lg bg-slate-950/50 border border-slate-800 hover:border-slate-600 flex items-center justify-between text-left text-xs transition-colors"
                      >
                        <div>
                          <div className="font-semibold text-slate-200">{partner}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {e.shared_minutes} min on court
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-mono font-bold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                            {isPositive ? `+${e.net_per_100s}` : e.net_per_100s} / 100s
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Synergy: {e.synergy_score}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Interactive Player Studio Jump */}
              {onSelectPlayer && (
                <button
                  onClick={() => onSelectPlayer(activeNode.name)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Inspect in Player Studio</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-sm">
              Select an athlete node in the constellation orbit to inspect co-play chemistry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
