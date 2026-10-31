"use client";

import React, { useState, useEffect } from "react";
import {
  Trophy,
  Shield,
  Activity,
  Users,
  Sliders,
  BookOpen,
  CheckCircle2,
  FileSpreadsheet,
  LayoutDashboard,
  Medal,
  Globe
} from "lucide-react";

import TacticalCourt from "@/components/TacticalCourt";
import CommandCenter from "@/components/CommandCenter";
import MatchExplorer from "@/components/MatchExplorer";
import PlayerStudio from "@/components/PlayerStudio";
import LineupOptimizerUI from "@/components/LineupOptimizerUI";
import ScenarioLab from "@/components/ScenarioLab";
import ResearchHub from "@/components/ResearchHub";
import DataQualityExplorer from "@/components/DataQualityExplorer";
import { ChampionshipsExplorer } from "@/components/ChampionshipsExplorer";
import { RankingsAdvanced } from "@/components/RankingsAdvanced";

import DecisionMirrorUI from "@/components/DecisionMirrorUI";
import PressureAtlasUI from "@/components/PressureAtlasUI";
import LineupConstellationUI from "@/components/LineupConstellationUI";
import RuleShiftLabUI from "@/components/RuleShiftLabUI";
import ArchetypeExplorerUI from "@/components/ArchetypeExplorerUI";
import ConfidenceFrontierUI from "@/components/ConfidenceFrontierUI";
import MatchTheatre from "@/components/MatchTheatre";
import CVEvaluationViewer from "@/components/CVEvaluationViewer";
import JudgeGuidedTour from "@/components/JudgeGuidedTour";
import CoachAssistantUI from "@/components/CoachAssistantUI";
import AnnotationPlannerUI from "@/components/AnnotationPlannerUI";
import LivingIntelligenceUI from "@/components/LivingIntelligenceUI";
import FrontierInnovationLabUI from "@/components/FrontierInnovationLabUI";
import DataCoverageExplorerUI from "@/components/DataCoverageExplorerUI";
import RugbyMark from "@/components/RugbyMark";

import {
  GitCommit,
  Grid,
  Share2,
  Scale,
  Compass,
  TrendingUp,
  Play,
  Eye,
  Award,
  Bot,
  Layers,
  Clock,
  Zap,
  Database
} from "lucide-react";

import { getRankings, getDataQualityReport, getResearchFindings, getCanonicalManifest } from "@/lib/api";

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("theatre");
  const [activeArea, setActiveArea] = useState<"workspace" | "research">("workspace");
  const [showJudgeTour, setShowJudgeTour] = useState<boolean>(false);
  const [rankings, setRankings] = useState<any | null>(null);
  const [qualityReport, setQualityReport] = useState<any | null>(null);
  const [researchData, setResearchData] = useState<any | null>(null);
  const [manifestData, setManifestData] = useState<any | null>(null);
  const [targetMatchId, setTargetMatchId] = useState<string | undefined>("PAR24_M20");
  const [courtPreset, setCourtPreset] = useState<{ names: string[]; team: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [r, q, res, m] = await Promise.all([
          getRankings(),
          getDataQualityReport(),
          getResearchFindings(),
          getCanonicalManifest().catch(() => null)
        ]);
        setRankings(r);
        setQualityReport(q);
        setResearchData(res);
        setManifestData(m);
      } catch (err) {
        console.error("Initial load error:", err);
      }
    }
    loadData();
  }, []);

  const handleSendToTacticalCourt = (lineupNames: string[], teamCode: string) => {
    setCourtPreset({ names: lineupNames, team: teamCode });
    setActiveTab("court");
  };

  const navGroups = {
    workspace: [
      { title: "Watch & explore", items: [
        { id: "theatre", label: "Match Theatre", icon: Play },
        { id: "matches", label: "Match Explorer", icon: FileSpreadsheet },
        { id: "players", label: "Player Studio", icon: Users },
        { id: "championships", label: "Championships", icon: Medal },
        { id: "rankings", label: "World Rankings", icon: Globe },
      ] },
      { title: "Plan & decide", items: [
        { id: "court", label: "Tactical Court", icon: Shield },
        { id: "optimizer", label: "Lineup Optimizer", icon: Sliders },
        { id: "simulator", label: "Scenario Lab", icon: Activity },
        { id: "assistant", label: "Coach Assistant", icon: Bot },
        { id: "decision_mirror", label: "Decision Mirror", icon: GitCommit },
      ] },
      { title: "Advanced analysis", items: [
        { id: "pressure_atlas", label: "Pressure Atlas", icon: Grid },
        { id: "constellation", label: "Lineup Constellation", icon: Share2 },
        { id: "frontier", label: "Confidence Frontier", icon: TrendingUp },
        { id: "ruleshift", label: "RuleShift Lab", icon: Scale },
        { id: "archetypes", label: "Archetypes", icon: Compass },
      ] },
    ],
    research: [
      { title: "Findings", items: [
        { id: "command", label: "Overview", icon: LayoutDashboard },
        { id: "research", label: "Research Hub", icon: BookOpen },
        { id: "living", label: "Living Intelligence", icon: Clock },
        { id: "frontier_lab", label: "Frontier Lab", icon: Zap },
      ] },
      { title: "Data & validation", items: [
        { id: "coverage", label: "Data Coverage", icon: Database },
        { id: "quality", label: "Data Quality", icon: CheckCircle2 },
        { id: "cv_audit", label: "CV Evaluation", icon: Eye },
        { id: "annotation_planner", label: "Annotation Queue", icon: Layers },
      ] },
    ],
  };

  const researchIds = new Set<string>(navGroups.research.flatMap(group => group.items.map(item => item.id)));
  useEffect(() => {
    setActiveArea(researchIds.has(activeTab) ? "research" : "workspace");
  }, [activeTab]);
  const currentItem = navGroups[activeArea].flatMap(group => group.items).find(item => item.id === activeTab);

  return (
    <div className="app-shell min-h-screen flex flex-col font-sans">
      <header className="app-header sticky top-0 z-50 px-4 lg:px-8">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3">
            <div className="app-logo w-10 h-10 rounded-xl flex items-center justify-center"><RugbyMark className="w-7 h-7" /></div>
            <div>
              <h1 className="font-black text-lg tracking-tight leading-tight">MurderBall</h1>
              <p className="text-xs app-muted">Wheelchair rugby intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="app-data-badge hidden sm:inline-flex">{manifestData?.canonical_counts?.total_official_tournament_matches ?? 166} official matches</span>
            <button onClick={() => setShowJudgeTour(true)} className="app-tour-button inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold">
              <Award className="w-4 h-4" /> Guided tour
            </button>
          </div>
        </div>
        <div className="max-w-[1600px] mx-auto flex gap-2 pb-3" role="tablist" aria-label="Application areas">
          <button role="tab" aria-selected={activeArea === "workspace"} onClick={() => { setActiveArea("workspace"); setActiveTab("theatre"); }} className={`app-area-tab ${activeArea === "workspace" ? "is-active" : ""}`}>
            <Sliders className="w-4 h-4" /> Workspace <span className="hidden sm:inline font-normal opacity-70">· tools for matches and teams</span>
          </button>
          <button role="tab" aria-selected={activeArea === "research"} onClick={() => { setActiveArea("research"); setActiveTab("research"); }} className={`app-area-tab ${activeArea === "research" ? "is-active" : ""}`}>
            <BookOpen className="w-4 h-4" /> Research & Data <span className="hidden sm:inline font-normal opacity-70">· findings and evidence</span>
          </button>
        </div>
      </header>

      <div className="app-layout flex-1 w-full max-w-[1600px] mx-auto lg:grid lg:grid-cols-[230px_minmax(0,1fr)] gap-5 px-4 lg:px-8 py-5">
        <aside className="app-sidebar rounded-2xl p-3 mb-4 lg:mb-0 lg:self-start lg:sticky lg:top-[125px]" aria-label={`${activeArea === "workspace" ? "Workspace" : "Research and data"} features`}>
          <div className="px-3 pt-2 pb-3">
            <div className="text-[10px] uppercase tracking-[0.18em] font-bold app-muted">{activeArea === "workspace" ? "Your workspace" : "Research & data"}</div>
            <p className="text-xs app-muted mt-1">Choose a feature below</p>
          </div>
          <div className="lg:hidden px-2 pb-2">
            <select aria-label="Choose feature" value={activeTab} onChange={event => setActiveTab(event.target.value)} className="app-feature-select w-full rounded-lg px-3 py-2.5 text-sm">
              {navGroups[activeArea].map(group => <optgroup key={group.title} label={group.title}>{group.items.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</optgroup>)}
            </select>
          </div>
          <nav className="hidden lg:block space-y-4">
            {navGroups[activeArea].map(group => <div key={group.title}>
              <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] app-muted">{group.title}</div>
              <div className="space-y-1">{group.items.map(item => {
                const Icon = item.icon;
                return <button key={item.id} onClick={() => setActiveTab(item.id)} aria-current={activeTab === item.id ? "page" : undefined} className={`app-feature-link w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm ${activeTab === item.id ? "is-active" : ""}`}><Icon className="w-4 h-4 shrink-0" /><span>{item.label}</span></button>;
              })}</div>
            </div>)}
          </nav>
        </aside>

        <main className="app-content min-w-0 w-full">
          <div className="app-page-heading rounded-2xl px-5 py-4 mb-5">
            <div className="text-[11px] uppercase tracking-[0.15em] font-bold app-muted">{activeArea === "workspace" ? "Workspace" : "Research & Data"}</div>
            <h2 className="text-xl font-bold mt-1">{currentItem?.label || "MurderBall"}</h2>
          </div>
        {activeTab === "theatre" && (
          <MatchTheatre
            initialMatchId={targetMatchId || "PAR24_M20"}
            onNavigateToDecisionMirror={() => setActiveTab("decision_mirror")}
            onNavigateToTacticalCourt={handleSendToTacticalCourt}
          />
        )}
        {activeTab === "living" && (
          <LivingIntelligenceUI
            onNavigateTab={(tab, param) => {
              if (param) setTargetMatchId(param);
              setActiveTab(tab);
            }}
          />
        )}
        {activeTab === "frontier_lab" && (
          <FrontierInnovationLabUI
            onNavigateTab={(tab, param) => {
              if (param) setTargetMatchId(param);
              setActiveTab(tab);
            }}
            onSendToTacticalCourt={handleSendToTacticalCourt}
          />
        )}
        {activeTab === "coverage" && (
          <DataCoverageExplorerUI
            onNavigateTab={(tab, param) => {
              if (param) setTargetMatchId(param);
              setActiveTab(tab);
            }}
            onSelectPlayer={() => setActiveTab("players")}
          />
        )}
        {activeTab === "assistant" && (
          <CoachAssistantUI
            onNavigateTab={(tab, param) => {
              if (param) setTargetMatchId(param);
              setActiveTab(tab);
            }}
            onSendToTacticalCourt={handleSendToTacticalCourt}
          />
        )}
        {activeTab === "annotation_planner" && (
          <AnnotationPlannerUI
            onNavigateTab={(tab, param) => {
              if (param) setTargetMatchId(param);
              setActiveTab(tab);
            }}
          />
        )}
        {activeTab === "command" && (
          <CommandCenter
            onNavigateTab={setActiveTab}
            rankings={rankings}
            qualityReport={qualityReport}
            researchData={researchData}
          />
        )}
        {activeTab === "decision_mirror" && (
          <DecisionMirrorUI onSendToTacticalCourt={handleSendToTacticalCourt} />
        )}
        {activeTab === "pressure_atlas" && (
          <PressureAtlasUI
            onSelectMatch={(mid) => {
              setTargetMatchId(mid);
              setActiveTab("theatre");
            }}
          />
        )}
        {activeTab === "constellation" && (
          <LineupConstellationUI
            onSendToTacticalCourt={handleSendToTacticalCourt}
            onSelectPlayer={() => setActiveTab("players")}
          />
        )}
        {activeTab === "frontier" && (
          <ConfidenceFrontierUI onSendToTacticalCourt={handleSendToTacticalCourt} />
        )}
        {activeTab === "ruleshift" && (
          <RuleShiftLabUI onSendToTacticalCourt={handleSendToTacticalCourt} />
        )}
        {activeTab === "archetypes" && (
          <ArchetypeExplorerUI onSelectPlayer={() => setActiveTab("players")} />
        )}
        {activeTab === "cv_audit" && <CVEvaluationViewer />}
        {activeTab === "court" && (
          <TacticalCourt
            initialLineupNames={courtPreset?.names}
            initialTeamCode={courtPreset?.team}
            onNavigateToResearch={() => setActiveTab("research")}
            onNavigateToDecisionMirror={() => setActiveTab("decision_mirror")}
          />
        )}
        {activeTab === "matches" && <MatchExplorer initialMatchId={targetMatchId} />}
        {activeTab === "players" && (
          <PlayerStudio
            onSendToCourt={() => setActiveTab("court")}
          />
        )}
        {activeTab === "championships" && (
          <ChampionshipsExplorer
            onSelectTeam={() => setActiveTab("players")}
            onSelectMatch={(mid) => {
              setTargetMatchId(mid);
              setActiveTab("theatre");
            }}
          />
        )}
        {activeTab === "rankings" && (
          <RankingsAdvanced
            onSelectCountry={() => setActiveTab("matches")}
          />
        )}
        {activeTab === "optimizer" && <LineupOptimizerUI />}
        {activeTab === "simulator" && <ScenarioLab />}
        {activeTab === "research" && (
          <ResearchHub
            researchData={researchData}
            onNavigateTab={(tab, param) => {
              if (param) setTargetMatchId(param);
              setActiveTab(tab);
            }}
          />
        )}
        {activeTab === "quality" && <DataQualityExplorer qualityReport={qualityReport} />}
      </main>
      </div>

      {/* Floating Judge Guided Tour Experience */}
      {showJudgeTour && (
        <JudgeGuidedTour
          onNavigateTab={setActiveTab}
          onDismiss={() => setShowJudgeTour(false)}
        />
      )}

      {/* Footer */}
      <footer className="app-footer px-4 lg:px-8 py-5 text-center text-xs space-y-2">
        <p>
          MurderBall Wheelchair Rugby Analytics • Built for the <strong>AQX Sports Analytics Data Bowl 4.0</strong>
        </p>
        <p className="text-[11px] text-slate-400">
          Source: Official World Wheelchair Rugby (WWR) Results Books (Athens 2004 – Paris 2024), World Championships 1995–2022, and WWR Rankings Snapshot.
        </p>
      </footer>
    </div>
  );
}
