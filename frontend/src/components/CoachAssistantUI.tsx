"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bot, Send, Sparkles, Activity, Shield, Users, Clock,
  ArrowRight, ExternalLink, ThumbsUp, ThumbsDown, Bookmark,
  ChevronRight, RefreshCw, Terminal, Layers, CheckCircle2,
  AlertCircle, HelpCircle, Eye, Compass, Trophy
} from "lucide-react";
import { queryCoachAssistant, getJevStatusReport } from "../lib/api";

interface AssistantProps {
  onNavigateTab?: (tab: string, param?: string) => void;
  onSendToTacticalCourt?: (lineupNames: string[], teamCode: string) => void;
}

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  workflow?: string;
  provider?: string;
  latency_ms?: number;
  actions?: any[];
  citations?: string[];
  findings?: string[];
  trace?: any[];
  isBookmarked?: boolean;
}

export default function CoachAssistantUI({ onNavigateTab, onSendToTacticalCourt }: AssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome_01",
      sender: "assistant",
      text: "Welcome to the **MurderBall Coach Intelligence Assistant**. I am an evidence-grounded agent with safe, typed access to our 120 Paralympic matches, 5,148 reconstructed stints, and calibrated predictive models. Ask me complex match questions, request opponent scouting dossiers, explore counterfactual lineup alternatives, or audit evidence gaps.",
      timestamp: "Just now",
      workflow: "general_coaching_advice",
      provider: "OFFLINE_DETERMINISTIC_ENGINE",
      latency_ms: 10.2,
      actions: [
        { label: "Why did Australia struggle vs Great Britain?", prompt: "Why did Australia struggle against Great Britain in Paris 2024?" },
        { label: "Scout Japan's Tactical Vulnerabilities", prompt: "Opponent scouting report for Japan" },
        { label: "Compare Ryley Batt & Chuck Aoki", prompt: "Compare Ryley Batt and Chuck Aoki" },
        { label: "Audit Evidence Gap on Screening", prompt: "What evidence gap exists regarding physical chair screening?" }
      ],
      citations: ["Official IPC Paralympic Results Books (Athens 2004 – Paris 2024)"]
    }
  ]);

  const [inputText, setInputText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [activeMode, setActiveMode] = useState<"coach" | "research" | "scout" | "gap">("coach");
  const [showTraceModal, setShowTraceModal] = useState<boolean>(false);
  const [selectedTrace, setSelectedTrace] = useState<any[] | null>(null);
  const [jevStatus, setJevStatus] = useState<any | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadJev() {
      try {
        const res = await getJevStatusReport();
        setJevStatus(res);
      } catch (err) {
        console.error("Failed to load Jev status:", err);
      }
    }
    loadJev();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (questionText?: string) => {
    const q = (questionText || inputText).trim();
    if (!q || loading) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      const res = await queryCoachAssistant(q);
      const assistantMsg: Message = {
        id: `asst_${Date.now()}`,
        sender: "assistant",
        text: res.synthesis || "Analysis complete.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        workflow: res.workflow,
        provider: res.provider_status || "OFFLINE_DETERMINISTIC_ENGINE",
        latency_ms: res.execution_latency_ms,
        actions: res.action_suggestions || [],
        citations: res.source_citations || [],
        findings: res.quantitative_findings || [],
        trace: res.execution_trace || []
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Error executing query:", err);
      setMessages(prev => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: "assistant",
          text: "I encountered an issue processing your analytical query. Offline deterministic engines remain operational.",
          timestamp: "Just now",
          provider: "OFFLINE_DETERMINISTIC_ENGINE"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (act: any) => {
    if (act.prompt) {
      handleSend(act.prompt);
      return;
    }
    if (act.action === "open_theatre" && onNavigateTab) {
      onNavigateTab("theatre", act.param);
    } else if (act.action === "open_decision_mirror" && onNavigateTab) {
      onNavigateTab("decision_mirror", act.param);
    } else if (act.action === "open_court" && onNavigateTab) {
      onNavigateTab("court", act.param);
    } else if (act.action === "open_players" && onNavigateTab) {
      onNavigateTab("players", act.param);
    } else if (act.action === "open_annotation_planner" && onNavigateTab) {
      onNavigateTab("annotation_planner");
    } else if (act.action === "open_pressure_atlas" && onNavigateTab) {
      onNavigateTab("pressure_atlas");
    } else if (act.action === "open_research" && onNavigateTab) {
      onNavigateTab("research");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-wider">
                AGENTIC SPORTS INTELLIGENCE
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                TYPESAFE JEV PRIMITIVES (CHOICE &bull; NOUL &bull; SCORE)
              </span>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30">
                OFFLINE ZERO-KEY OPERATIONAL
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Bot className="w-7 h-7 text-cyan-400" />
              MurderBall Coach Intelligence Assistant
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-4xl leading-relaxed">
              Multi-step analytical reasoning engine for coaches, athletes, and researchers. Safe typed tools, adversarial decision critiques, epistemic evidence-gap auditing, and deep application navigation.
            </p>
          </div>

          {/* Mode Pill Switcher */}
          <div className="flex items-center bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveMode("coach")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${activeMode === "coach" ? "bg-cyan-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"}`}
            >
              Coach
            </button>
            <button
              onClick={() => setActiveMode("research")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${activeMode === "research" ? "bg-purple-500 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
            >
              Research
            </button>
            <button
              onClick={() => setActiveMode("scout")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${activeMode === "scout" ? "bg-amber-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"}`}
            >
              Scout
            </button>
            <button
              onClick={() => setActiveMode("gap")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${activeMode === "gap" ? "bg-rose-500 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
            >
              Evidence Gap
            </button>
          </div>
        </div>
      </div>

      {/* Main Conversation Feed & Right Observability Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chat Feed (col-span-8) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[700px] shadow-2xl overflow-hidden">
          {/* Messages Scroll Area */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {messages.map(msg => {
              const isAssistant = msg.sender === "assistant";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isAssistant ? "items-start" : "items-end"}`}
                >
                  <div
                    className={`max-w-[90%] p-4 rounded-2xl border transition-all ${
                      isAssistant
                        ? "bg-slate-950/80 border-slate-800 text-slate-200"
                        : "bg-cyan-950/50 border-cyan-500/40 text-white"
                    }`}
                  >
                    {/* Assistant Metadata Header */}
                    {isAssistant && (
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-[11px] font-mono">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-cyan-400 flex items-center gap-1">
                            <Bot className="w-3.5 h-3.5" />
                            MurderBall Agent
                          </span>
                          {msg.workflow && (
                            <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                              {msg.workflow}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          {msg.latency_ms && <span>{msg.latency_ms}ms</span>}
                          {msg.trace && msg.trace.length > 0 && (
                            <button
                              onClick={() => {
                                setSelectedTrace(msg.trace || []);
                                setShowTraceModal(true);
                              }}
                              className="text-cyan-400 hover:text-cyan-300 font-sans text-xs underline cursor-pointer"
                            >
                              Trace Logs ({msg.trace.length})
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Message Body (Markdown formatted) */}
                    <div className="text-xs leading-relaxed space-y-2">
                      <p className="whitespace-pre-line">{msg.text}</p>
                    </div>

                    {/* Quantitative Findings Badges */}
                    {msg.findings && msg.findings.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Quantitative Evidence:
                        </div>
                        <div className="space-y-1">
                          {msg.findings.map((f: string, fIdx: number) => (
                            <div key={fIdx} className="text-[11px] font-mono text-cyan-300 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                              <span>{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Suggestion Buttons */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5">
                        <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Connected Application Actions:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {msg.actions.map((act: any, aIdx: number) => (
                            <button
                              key={aIdx}
                              onClick={() => handleActionClick(act)}
                              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-all hover:border-cyan-500 cursor-pointer"
                            >
                              <span>{act.label}</span>
                              <ArrowRight className="w-3 h-3 text-cyan-400" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Citations Footer */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-800/60 text-[10px] text-slate-500 font-mono">
                        Source: {msg.citations.join(" | ")}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-600 mt-1 px-1">{msg.timestamp}</span>
                </div>
              );
            })}
            {loading && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                <Activity className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Orchestrating multi-step research workflow and consulting analytical tools...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-4 bg-slate-950 border-t border-slate-800">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-3"
            >
              <input
                type="text"
                aria-label="Ask a coaching or analytical question"
                placeholder="Ask about lineups, opponent scouting, decision mirrors, or statistical evidence..."
                className="flex-1 bg-slate-900 border border-slate-700 focus:border-cyan-500 px-4 py-2.5 rounded-xl text-xs text-slate-100 placeholder-slate-500 outline-none transition-all"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !inputText.trim()}
                className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-cyan-950/30"
              >
                <span>Investigate</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Side Telemetry & Observability Drawer (col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Agent Architecture Dossier */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                Agent Decision Engine Status
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <div className="text-slate-400">Current Provider:</div>
                <div className="font-mono font-bold text-white text-[11px]">
                  {jevStatus?.status || "OFFLINE_DETERMINISTIC_ENGINE"}
                </div>
                <div className="text-[10px] text-slate-500">
                  Zero external API key dependencies for local evaluation.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="text-slate-400">Supported Decision Primitives:</div>
                <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">Choice (Intent Routing)</span>
                  <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">Score (Reliability Rubric)</span>
                  <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">Noul (Ambiguity Check)</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <div className="text-slate-400">Available Analytical Tools:</div>
                <div className="text-[11px] text-slate-300 font-mono">
                  10 Typed Tools (Matches, Stints, RAPM, CP-SAT Solver, Decision Mirror, Evidence Gaps)
                </div>
              </div>
            </div>
          </div>

          {/* Quick Investigation Presets */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Benchmark Coaching Scenarios
            </span>
            <div className="space-y-2">
              {[
                { title: "Defensive Timeout Efficacy", q: "Should a coach call a timeout when trailing late in Q4?" },
                { title: "Japan Scouting Report", q: "Opponent scouting report for Japan" },
                { title: "0.5 Screener Asymmetry", q: "What is the 0.5-point assist block asymmetry?" },
                { title: "Batt vs Aoki RAPM Comparison", q: "Compare Ryley Batt and Chuck Aoki" },
                { title: "Physical Tracking Evidence Gap", q: "What evidence gap exists regarding physical chair screening?" }
              ].map((scen, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(scen.q)}
                  className="w-full p-2.5 rounded-xl bg-slate-950/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition-all text-xs flex items-center justify-between group cursor-pointer"
                >
                  <span className="text-slate-300 group-hover:text-white font-medium">{scen.title}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Observability Execution Trace Modal */}
      {showTraceModal && selectedTrace && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Agent Multi-Step Execution Trace</h3>
              </div>
              <button onClick={() => setShowTraceModal(false)} className="text-slate-400 hover:text-white text-xs">Close</button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto font-mono text-xs pr-1">
              {selectedTrace.map((log: any, idx: number) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-cyan-400 font-bold">
                    <span>Step {log.step}: {log.phase}</span>
                    {log.primitive && <span className="text-[10px] text-slate-500">{log.primitive}</span>}
                  </div>
                  <pre className="text-[11px] text-slate-300 overflow-x-auto">
                    {JSON.stringify(log, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
