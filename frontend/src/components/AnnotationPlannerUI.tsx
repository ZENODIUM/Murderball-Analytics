"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Compass,
  Video,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  Sparkles,
  Terminal,
  Activity,
  Shield,
  HelpCircle,
  ExternalLink
} from "lucide-react";
import { getAnnotationQueue, getJevStatusReport, getAgentBenchmark } from "../lib/api";

interface AnnotationPlannerProps {
  onNavigateTab?: (tab: string, param?: string) => void;
}

export default function AnnotationPlannerUI({ onNavigateTab }: AnnotationPlannerProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [totalQueued, setTotalQueued] = useState<number>(5);
  const [methodology, setMethodology] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [jevReport, setJevReport] = useState<any | null>(null);
  const [showJevModal, setShowJevModal] = useState<boolean>(false);
  const [benchmarkData, setBenchmarkData] = useState<any | null>(null);
  const [showBenchmarkModal, setShowBenchmarkModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [qRes, jRes, bRes] = await Promise.all([
          getAnnotationQueue(),
          getJevStatusReport(),
          getAgentBenchmark()
        ]);
        if (qRes?.tasks) {
          setTasks(qRes.tasks);
          setTotalQueued(qRes.total_tasks_queued || qRes.tasks.length);
          setMethodology(qRes.methodology || "Information-gain prioritization based on model uncertainty and tactical leverage.");
          setSelectedTask(qRes.tasks[0]);
        }
        setJevReport(jRes);
        setBenchmarkData(bRes);
      } catch (err) {
        console.error("Failed to load annotation queue:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredTasks = tasks.filter(t => {
    if (activeFilter === "ALL") return true;
    return t.urgency === activeFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                ACTIVE LEARNING & ANNOTATION PLANNER
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                EPISTEMIC GAP AUDIT
              </span>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30">
                INFORMATION-GAIN SORTED
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Layers className="w-7 h-7 text-amber-400" />
              Historical Video Evidence Prioritization Queue
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-4xl leading-relaxed">
              Official wheelchair rugby match reports record tries, penalties, and box-score metrics, but lack physical wheelchair collision vectors and screen hold durations. This autonomous planner calculates expected information gain to rank unannotated video clips for human annotation.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setShowJevModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Jev Feasibility Report</span>
            </button>
            <button
              onClick={() => setShowBenchmarkModal(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-500/20"
            >
              <Activity className="w-4 h-4" />
              <span>12-Query Benchmark</span>
            </button>
          </div>
        </div>

        {/* Methodology Strip */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Prioritization Rubric:</span>
            <span className="font-mono text-slate-300">{methodology}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Active Tasks:</span>
            <span className="px-2 py-0.5 rounded font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {totalQueued} High-Value Clips
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Queue List (Left) & Task Detail Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Filterable Task Queue (col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-amber-400" />
                Urgency Tiers
              </span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
                {["ALL", "HIGH", "MEDIUM", "LOW"].map(filt => (
                  <button
                    key={filt}
                    onClick={() => setActiveFilter(filt)}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                      activeFilter === filt
                        ? "bg-amber-500 text-slate-950"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {filt}
                  </button>
                ))}
              </div>
            </div>

            {/* Task Cards */}
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {filteredTasks.map(t => {
                const isSelected = selectedTask?.task_id === t.task_id;
                const urgencyColor =
                  t.urgency === "HIGH"
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                    : t.urgency === "MEDIUM"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    : "bg-blue-500/10 text-blue-400 border-blue-500/30";

                return (
                  <div
                    key={t.task_id}
                    onClick={() => setSelectedTask(t)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer text-xs space-y-2 ${
                      isSelected
                        ? "bg-slate-800/90 border-amber-500 shadow-md shadow-amber-950/20 ring-1 ring-amber-500/30"
                        : "bg-slate-950/50 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400 text-xs">
                          #{t.priority_rank}
                        </span>
                        <span className="font-bold text-white text-[13px]">
                          {t.tournament} {t.teams}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${urgencyColor}`}>
                        {t.urgency}
                      </span>
                    </div>

                    <div className="text-slate-300 font-medium line-clamp-1">
                      {t.target_annotation}
                    </div>

                    {/* Progress Bar of Information Gain */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Expected Information Gain:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {t.information_gain_score}/100
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
                          style={{ width: `${t.information_gain_score}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60 font-mono">
                      <span>Clip: {t.clip_duration_seconds}s</span>
                      <span>Est: {t.estimated_effort_minutes}m labeling</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Task Dossier & Action Router (col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedTask ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-amber-400 font-bold">
                      TASK ID: {selectedTask.task_id}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                      {selectedTask.match_id}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">
                    {selectedTask.tournament} {selectedTask.stage}: {selectedTask.teams}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Priority Score</div>
                    <div className="text-xl font-black text-emerald-400 font-mono">
                      {selectedTask.information_gain_score}
                    </div>
                  </div>
                </div>
              </div>

              {/* Research Hypothesis Target */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Target Research Hypothesis
                </div>
                <div className="font-mono text-xs font-semibold text-white">
                  {selectedTask.research_hypothesis}
                </div>
                <div className="text-xs text-slate-300 leading-relaxed">
                  {selectedTask.target_annotation}
                </div>
              </div>

              {/* Epistemic Reasoning: Why It Matters */}
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1.5">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" />
                  Epistemic Justification (Why This Clip Matters)
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {selectedTask.why_it_matters}
                </p>
              </div>

              {/* Video Timing & Expected Research Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    Target Broadcast Timestamp
                  </div>
                  <div className="font-mono text-white text-[11px]">
                    {selectedTask.video_timestamp_range}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="text-slate-400 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Expected Research Value
                  </div>
                  <div className="text-slate-200 text-[11px]">
                    {selectedTask.expected_research_value}
                  </div>
                </div>
              </div>

              {/* Connected Application Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex flex-wrap gap-2.5">
                <button
                  onClick={() => onNavigateTab && onNavigateTab("theatre", selectedTask.match_id)}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-500/20"
                >
                  <Video className="w-4 h-4" />
                  <span>Inspect in Match Theatre</span>
                </button>

                <button
                  onClick={() => onNavigateTab && onNavigateTab("cv_audit")}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>Review CV Model Audit</span>
                </button>

                <button
                  onClick={() => onNavigateTab && onNavigateTab("assistant")}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Terminal className="w-4 h-4 text-purple-400" />
                  <span>Ask Coach Assistant</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              Select an annotation task from the queue to view its epistemic evaluation.
            </div>
          )}
        </div>
      </div>

      {/* Jev Decision Model Feasibility Modal */}
      {showJevModal && jevReport && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  TypeSafe AI Jev Decision Model: Feasibility Assessment
                </h3>
              </div>
              <button
                onClick={() => setShowJevModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-slate-400 text-[11px]">Provider Architecture:</div>
                  <div className="font-mono font-bold text-emerald-400 text-sm">{jevReport.status}</div>
                </div>
                <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  OFFLINE 100% OPERATIONAL
                </span>
              </div>

              {/* Jev Primitives Breakdown */}
              <div className="space-y-2">
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                  Evaluated Jev Decision Primitives
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px]">
                      Choice
                    </span>
                    <div className="font-semibold text-white pt-1">Intent Routing</div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {jevReport.evaluated_primitives?.choice}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800 text-[10px]">
                      Score
                    </span>
                    <div className="font-semibold text-white pt-1">Evidence Rubrics</div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {jevReport.evaluated_primitives?.score}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800 text-[10px]">
                      Noul
                    </span>
                    <div className="font-semibold text-white pt-1">Ambiguity Detection</div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {jevReport.evaluated_primitives?.noul}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rigorous Limitations Section */}
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2">
                <div className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Critical Limitations & Epistemic Boundaries
                </div>
                <ul className="space-y-1.5 text-slate-300 list-disc pl-4 text-[11px] leading-relaxed">
                  {jevReport.documented_limitations?.map((lim: string, idx: number) => (
                    <li key={idx}>{lim}</li>
                  ))}
                </ul>
              </div>

              {/* Comparative Matrix */}
              <div className="space-y-2">
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                  Engine Comparison Matrix
                </span>
                <table className="w-full text-left font-mono text-[11px] border border-slate-800 rounded-lg overflow-hidden">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-2">Capability</th>
                      <th className="p-2 text-cyan-400">TypeSafe Jev</th>
                      <th className="p-2 text-amber-400">Deterministic Fallback</th>
                      <th className="p-2 text-slate-400">Generative LLM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-950/40">
                    <tr>
                      <td className="p-2 text-slate-300">Schema Safety</td>
                      <td className="p-2 text-emerald-400">Strict Typesafe</td>
                      <td className="p-2 text-emerald-400">Strict Typesafe</td>
                      <td className="p-2 text-rose-400">Fragile Parsing</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-slate-300">Mean Latency</td>
                      <td className="p-2 text-cyan-400">~15ms</td>
                      <td className="p-2 text-emerald-400">&lt;5ms</td>
                      <td className="p-2 text-rose-400">&gt;1200ms</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-slate-300">Offline Usability</td>
                      <td className="p-2 text-amber-400">Via Fallback Adapter</td>
                      <td className="p-2 text-emerald-400">100% Offline</td>
                      <td className="p-2 text-rose-400">Requires Cloud/Keys</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-slate-300">Linear Solver Fit</td>
                      <td className="p-2 text-rose-400">Unsuitable (Use CP-SAT)</td>
                      <td className="p-2 text-rose-400">Unsuitable (Use CP-SAT)</td>
                      <td className="p-2 text-rose-400">Hallucinates Cap Totals</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 12-Question Evaluation Benchmark Modal */}
      {showBenchmarkModal && benchmarkData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  MurderBall Agentic Intelligence System Evaluation Benchmark
                </h3>
              </div>
              <button
                onClick={() => setShowBenchmarkModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-400">Test Cases: </span>
                <span className="text-white font-bold">{benchmarkData.total_test_cases}</span>
              </div>
              <div>
                <span className="text-slate-400">Mean Latency: </span>
                <span className="text-emerald-400 font-bold">{benchmarkData.mean_latency_ms}ms</span>
              </div>
              <div>
                <span className="text-slate-400">Accuracy Rate: </span>
                <span className="text-amber-400 font-bold">{benchmarkData.accuracy_rate_pct}%</span>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-2 text-xs">
              {benchmarkData.results?.map((res: any, idx: number) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                  <div className="space-y-1 max-w-[70%]">
                    <div className="font-semibold text-white">{res.question}</div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {res.workflow}
                      </span>
                      <span>{res.citations_count} Citations</span>
                      <span>{res.actions_count} Actions</span>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="px-2 py-1 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-bold text-[11px]">
                      {res.latency_ms}ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
