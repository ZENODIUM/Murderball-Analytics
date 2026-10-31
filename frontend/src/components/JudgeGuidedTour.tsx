"use client";

import React, { useState } from "react";
import {
  Award, ArrowRight, ArrowLeft, CheckCircle2,
  HelpCircle, Sparkles, Eye, X, BookOpen, GitCommit, Play
} from "lucide-react";

interface JudgeTourProps {
  onNavigateTab: (tab: string) => void;
  onDismiss: () => void;
}

export default function JudgeGuidedTour({ onNavigateTab, onDismiss }: JudgeTourProps) {
  const [currentStep, setCurrentStep] = useState<number>(0);

  const steps = [
    {
      title: "1. The Practical Coaching Dilemma",
      subtitle: "Tactical decision-making under late-game championship pressure",
      description: "In wheelchair rugby, possessions alternate virtually 50/50. When an opponent puts together a 3-0 or 4-1 scoring run in the 4th quarter, coaches face an immediate high-stakes decision: Should they spend a critical 30-second timeout immediately, or trust their on-court lineup to regain momentum naturally?",
      actionLabel: "Step 2: Inspect Real Match Evidence",
      targetTab: "theatre",
      insightHighlight: "Does calling a timeout actually freeze opponent transition momentum?"
    },
    {
      title: "2. Real Historical Evidence in Match Theatre",
      subtitle: "Paris 2024 Paralympic Gold Medal Game: Japan vs United States",
      description: "In the Paris 2024 Gold Medal Match (PAR24_M20), Japan led 48-41. We can view the official IPC broadcast replay synchronized directly with official play-by-play events, reconstructed 4v4 lineups, and time-anchored decision points without fabricated tracking.",
      actionLabel: "Step 3: Investigate the Decision Moment",
      targetTab: "theatre",
      insightHighlight: "Synchronized broadcast replay paired with reconstructed 4v4 lineups"
    },
    {
      title: "3. The Critical Decision Point (Paris 2024 Q4 - 5:31)",
      subtitle: "Coaching intervention with a 5-point deficit (JPN 39 - USA 34)",
      description: "Trailing 34-39 with 5:31 remaining in the 4th quarter following an Ike try, USA called a 60-second tactical timeout and substituted Sarah Adam (2.5) for Josh Wheeler (2.5). Our Decision Mirror captures the exact official pre-decision timeline and the observed subsequent aftermath.",
      actionLabel: "Step 4: Explore Counterfactual Lineups",
      targetTab: "decision_mirror",
      insightHighlight: "Exact pre/post timeline reconstructed from official Paris 2024 results book (p. 132)"
    },
    {
      title: "4. Decision Mirror: Evidence-Backed Counterfactuals",
      subtitle: "Evaluating legal alternative lineups with Ridge RAPM and Bootstrap 90% CIs",
      description: "Rather than post-hoc speculation, the Decision Mirror computes mathematically valid counterfactual alternative lineups within the 8.0/8.5 cap, complete with bootstrap 90% confidence intervals and historical minutes exposure.",
      actionLabel: "Step 5: Review Empirical Statistical Discoveries",
      targetTab: "decision_mirror",
      insightHighlight: "Uncertainty-bounded counterfactual projections, not cherry-picked claims"
    },
    {
      title: "5. Empirical Observations: 318 Scoring Runs Analyzed",
      subtitle: "Observational analysis of timeout patterns across 120 Paralympic matches",
      description: "The adjusted scoring-run analysis across 120 Paralympic matches reports p = 0.66. It does not establish that a timeout causes a run to end, so timeout timing remains a context-dependent coaching decision.",
      actionLabel: "Step 6: Discover the 0.5-Point Asymmetry",
      targetTab: "pressure_atlas",
      insightHighlight: "Observational association: +21.6 pp higher next-possession snap rate (non-causal)"
    },
    {
      title: "6. Flagship Discovery: The 0.5-Point Screener Asymmetry",
      subtitle: "Quantifying recorded low-pointer assist blocks beyond personal try-scoring",
      description: "Class 0.5 support athletes score just 0.1% of all tries, yet account for 28.1% of all recorded Assist Blocks (AB) in official Paralympic C73 box scores (p < 10⁻²⁴⁰). Support athletes sacrifice body and chair to execute picks rather than cross the try line.",
      actionLabel: "Step 7: Autonomous Coach Assistant",
      targetTab: "command",
      insightHighlight: "Low-pointers execute 28.1% of recorded assist blocks; high-pointers score tries"
    },
    {
      title: "7. Autonomous AI Coach Assistant & Epistemic Audit",
      subtitle: "Multi-step reasoning, adversarial critique, and active annotation queue",
      description: "Ask open-ended sports questions, generate multi-dimensional opponent scouting dossiers, and inspect unannotated historical video clips prioritized by expected information gain. Features typed decision primitives with 100% offline fallback certainty.",
      actionLabel: "Step 8: Living Sports Intelligence",
      targetTab: "assistant",
      insightHighlight: "Typed decision primitives, adversarial critique, and active video annotation"
    },
    {
      title: "8. Living Intelligence, Time Machine & 2026 Out-of-Time Validation",
      subtitle: "Prospective pre-match freezing, model drift observatory, and future competitions",
      description: "Moving beyond historical local PDFs, our living architecture evaluates 24 matches from the August 2026 World Championship without data leakage (87.5% accuracy; USA 57 - 51 AUS correctly predicted), tracks tactical drift, and investigates the inaugural Women's World Championship (Paris Dec 2026).",
      actionLabel: "Step 9: Frontier Modeling & Misleading Stats",
      targetTab: "living",
      insightHighlight: "Retrospective 2026 model review, deployment comparisons, and drift tracking"
    },
    {
      title: "9. Frontier Statistical Research & Misleading Statistics Lab",
      subtitle: "Hypergraph synergy, competing-risks hazards, and statistical literacy for coaches",
      description: "Explore exploratory lineup-interaction estimates, clock-pressure summaries, change-point analyses, and educational examples of uncertainty. These analyses describe the available sample and do not establish causal mechanisms.",
      actionLabel: "Step 10: Inspect External Data Expansion",
      targetTab: "frontier_lab",
      insightHighlight: "Non-linear hypergraph synergy, Bayesian survival hazards, and Pettitt change-points"
    },
    {
      title: "10. External Dataset Expansion & Global Coverage",
      subtitle: "37 newly integrated international matches, 329 IPC athletes, and source rejection audit",
      description: "Expanding beyond the 10 Paralympic PDFs: integrating 37 verified international matches across Canada Cup, Shibuya Para Cup, and Lakeshore Classic alongside 46 World Championship 2026 matches (bringing total platform competition coverage to 203 matches). Demonstrates measurable model improvement (Brier calibration error reduced by +3.73%), an IPC Master Athlete Registry of 329 athletes, and transparent scientific rejection of incompatible datasets.",
      actionLabel: "Complete Tour: Explore Full Platform",
      targetTab: "coverage",
      insightHighlight: "203 matches across 9 global venues, +3.73% Brier calibration gain, and 329 IPC athletes"
    }
  ];

  const activeStep = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1);
      onNavigateTab(steps[currentStep + 1].targetTab);
    } else {
      onDismiss();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
      onNavigateTab(steps[currentStep - 1].targetTab);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-xl w-full mx-4 sm:mx-0 bg-slate-900/95 backdrop-blur-xl border-2 border-amber-500/50 rounded-2xl p-6 shadow-2xl text-slate-100 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              AQX DATA BOWL 4.0 &bull; GUIDED JUDGE EXPLORATION
            </div>
            <div className="text-sm font-bold text-white">
              {activeStep.title}
            </div>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          title="Dismiss guided tour"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Step Content */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-cyan-400">
          {activeStep.subtitle}
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {activeStep.description}
        </p>
        <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-[11px] font-semibold text-amber-300 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{activeStep.insightHighlight}</span>
        </div>
      </div>

      {/* Stepper Progress Dots & Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5">
          {steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentStep(idx);
                onNavigateTab(steps[idx].targetTab);
              }}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                currentStep === idx
                  ? "bg-amber-400 w-5"
                  : idx < currentStep
                  ? "bg-emerald-400"
                  : "bg-slate-700"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          {currentStep > 0 && (
            <button
              onClick={handlePrev}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back</span>
            </button>
          )}

          <button
            onClick={handleNext}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-amber-950/30"
          >
            <span>{currentStep === steps.length - 1 ? "Finish & Explore" : activeStep.actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
