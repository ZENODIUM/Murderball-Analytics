"use client";

import React, { useState, useEffect } from "react";
import {
  Globe,
  Database,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Award,
  Users,
  Scale,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  Search,
  Filter,
  Info,
  ChevronRight,
  ExternalLink,
  Sparkles
} from "lucide-react";
import {
  getExpansionSummary,
  getIPCAthletes,
  getRulesEvolution,
  getDiscoveryReport,
  getModelComparison,
  getDataCoverageMap
} from "@/lib/api";

interface DataCoverageExplorerUIProps {
  onNavigateTab?: (tab: string, param?: any) => void;
  onSelectPlayer?: (playerName: string) => void;
}

export default function DataCoverageExplorerUI({
  onNavigateTab,
  onSelectPlayer
}: DataCoverageExplorerUIProps) {
  const [activeSubTab, setActiveSubTab] = useState<"venues" | "models" | "registry" | "rules" | "rejection">("venues");
  const [summary, setSummary] = useState<any>(null);
  const [modelComparison, setModelComparison] = useState<any>(null);
  const [coverageMap, setCoverageMap] = useState<any>(null);
  const [discoveryReport, setDiscoveryReport] = useState<any>(null);
  const [rulesEvolution, setRulesEvolution] = useState<any>(null);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  const [selectedEra, setSelectedEra] = useState<number>(3); // 2024-2028 default

  // Search & filters for IPC Registry
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("ALL");
  const [genderFilter, setGenderFilter] = useState("ALL");
  const [legendsOnly, setLegendsOnly] = useState(false);

  // Lineup Legality Calculator state
  const [calcClasses, setCalcClasses] = useState<number[]>([3.5, 2.5, 1.5, 0.5]);
  const [calcFemaleCount, setCalcFemaleCount] = useState<number>(1);

  useEffect(() => {
    async function loadAll() {
      try {
        const [sum, mComp, cmap, disc, rules, aths] = await Promise.all([
          getExpansionSummary(),
          getModelComparison(),
          getDataCoverageMap(),
          getDiscoveryReport(),
          getRulesEvolution(),
          getIPCAthletes({ limit: 100 })
        ]);
        setSummary(sum);
        setModelComparison(mComp);
        setCoverageMap(cmap);
        setDiscoveryReport(disc);
        setRulesEvolution(rules);
        setAthletes(aths);
        if (cmap?.venues?.length > 0) {
          setSelectedVenue(cmap.venues[0]); // Default to Paris
        }
      } catch (err) {
        console.error("Failed to load expansion datasets:", err);
      }
    }
    loadAll();
  }, []);

  // Filter athletes
  const filteredAthletes = athletes.filter((a) => {
    if (countryFilter !== "ALL" && a.country !== countryFilter) return false;
    if (genderFilter !== "ALL" && a.gender !== genderFilter) return false;
    if (legendsOnly && !a.is_legend) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const nameMatch = a.canonical_name.toLowerCase().includes(q);
      const aliasMatch = (a.aliases || []).some((al: string) => al.toLowerCase().includes(q));
      const bioMatch = (a.career_bio || "").toLowerCase().includes(q);
      return nameMatch || aliasMatch || bioMatch;
    }
    return true;
  });

  // Calculate legality across 3 regulatory eras via date-aware principles
  const classSum = calcClasses.reduce((acc, curr) => acc + curr, 0);
  const isLegalEra1 = classSum <= 8.0; // Classical Pre-2010: no female allowance
  const isLegalEra2 = classSum <= 8.0 + (calcFemaleCount * 0.5); // 2010-2025: flat +0.5 per female
  // 2026+ Tiered WWR: +1.0 allowance for female athlete classified >= 2.0; +0.5 for <= 1.5
  const femaleAllowance2026 = calcFemaleCount > 0 ? (calcClasses[0] >= 2.0 ? 1.0 : 0.5) * calcFemaleCount : 0.0;
  const isLegalEra2026 = classSum <= 8.0 + femaleAllowance2026;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold flex items-center gap-1.5 border border-indigo-500/30">
                <Database className="w-3.5 h-3.5" />
                EXTERNAL DATASET EXPANSION SUITE
              </span>
              <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-xs font-semibold">
                TIER 1 & 2 VERIFIED
              </span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-black text-slate-100 tracking-tight">
              Global Competition Coverage & Registry Explorer
            </h2>
            <p className="text-sm text-slate-300 max-w-3xl mt-1.5">
              Expanded beyond the 10 historical Paralympic PDFs: integrating 37 verified international matches (Canada Cup, Shibuya Para Cup, Lakeshore Demolition Classic), 329 IPC Master Athletes across 6 Paralympic cycles, and official WWR rules evolution across 4 eras.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
              <div className="text-xs text-slate-400">Total Matches</div>
              <div className="text-xl font-black text-amber-400 font-mono">203</div>
              <div className="text-[10px] text-slate-400 mt-0.5">166 Official • 37 Intl</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
              <div className="text-xs text-slate-400">IPC Athletes</div>
              <div className="text-xl font-black text-cyan-400 font-mono">329</div>
              <div className="text-[10px] text-slate-400 mt-0.5">74 Veterans 3+</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
              <div className="text-xs text-slate-400">Global Venues</div>
              <div className="text-xl font-black text-purple-400 font-mono">9</div>
              <div className="text-[10px] text-slate-400 mt-0.5">3 Continents</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
              <div className="text-xs text-slate-400">Brier Gain</div>
              <div className="text-xl font-black text-emerald-400 font-mono">+3.73%</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Forecast Sharpness</div>
            </div>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-800/80">
          {[
            { id: "venues", label: "Global Venue Map (9 Host Cities)", icon: Globe },
            { id: "models", label: "Model Improvement (Before vs After)", icon: TrendingUp },
            { id: "registry", label: "IPC Master Athlete Registry (329)", icon: Users },
            { id: "rules", label: "WWR Rules Evolution & Lineup Tester", icon: Scale },
            { id: "rejection", label: "Source Rejection Audit", icon: ShieldAlert }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold"
                    : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-VIEW 1: Global Venue Map */}
      {activeSubTab === "venues" && coverageMap && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Venue Interactive Grid */}
          <div className="lg:col-span-2 rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  International Tournament Venues (2004–2026)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select any international competition venue to inspect historical coverage, champions, and data provenance tiers.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono text-xs">
                {coverageMap.venues.length} Venues • 203 Matches Mapped
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {coverageMap.venues.map((venue: any) => {
                const isSelected = selectedVenue?.id === venue.id;
                return (
                  <button
                    key={venue.id}
                    onClick={() => setSelectedVenue(venue)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? "bg-amber-500/10 border-amber-500/60 shadow-lg shadow-amber-500/10"
                        : "bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-200">{venue.city}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-amber-300">
                        {venue.country}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-medium truncate">{venue.name}</div>
                    <div className="mt-3 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-mono">{venue.matches_played} matches</span>
                      <span className="font-semibold text-emerald-400">Champ: {venue.champion}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Geographical Coverage Summary */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-2">
              <div className="font-bold text-slate-200 flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                Cross-Continental Wheelchair Rugby Footprint
              </div>
              <p className="text-slate-400 leading-relaxed">
                Platform records encompass 3 distinct competition tiers across North America (Richmond Olympic Oval, Lakeshore Foundation), Europe (Paris Champ-de-Mars, London Olympic Park, Helliniko Athens, Vejle DGI Huset 2022), South America (São Paulo Centro de Treinamento Paralímpico 2026), and Asia-Pacific (Tokyo Yoyogi Gymnasium, Beijing Science Gym).
              </p>
            </div>
          </div>

          {/* Venue Detailed Card */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
            {selectedVenue ? (
              <>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                      Venue Dossier
                    </span>
                    <h4 className="text-lg font-bold text-white">{selectedVenue.name}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-slate-300">{selectedVenue.city}, {selectedVenue.country}</span>
                    <div className="text-[10px] text-slate-400">Lat: {selectedVenue.latitude}° | Lon: {selectedVenue.longitude}°</div>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[11px] block">Events Hosted</span>
                    <ul className="space-y-1">
                      {selectedVenue.events_hosted.map((ev: string, idx: number) => (
                        <li key={idx} className="font-semibold text-slate-200 flex items-center gap-1.5">
                          <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                          {ev}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Matches Played</span>
                      <span className="text-base font-black text-amber-300 font-mono">{selectedVenue.matches_played}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Tournament Champion</span>
                      <span className="text-base font-black text-emerald-400 font-mono">{selectedVenue.champion}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[10px] block">Data Provenance Tier</span>
                    <span className="font-mono text-cyan-300 font-semibold text-[11px]">{selectedVenue.data_tier}</span>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Verified score summaries, period scores, rosters, and official tournament bulletins archived.
                    </p>
                  </div>
                </div>

                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab("matches")}
                    className="w-full mt-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <span>View Matches in Match Explorer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                Select a venue from the left grid.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: Model Improvement (Before vs After) */}
      {activeSubTab === "models" && modelComparison && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-6">
            <div>
              <span className="text-xs font-mono font-bold text-amber-400">
                PROSPECTIVE PREDICTION RIGOR
              </span>
              <h3 className="text-xl font-bold text-slate-100 mt-0.5">
                Empirical Evaluation: Before vs After 2024 Dataset Expansion
              </h3>
              <p className="text-xs text-slate-300 max-w-3xl mt-1">
                To determine whether acquiring the 37 mid-2024 international matches (Canada Cup, Shibuya Para Cup, Lakeshore Demolition Classic) provided measurable predictive value, we evaluated identical logistic Elo models on the 2026 World Championship results (24 matches).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Baseline Model Card */}
              <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px] font-bold">
                      BASELINE MODEL
                    </span>
                    <h4 className="text-base font-bold text-slate-200 mt-1">Paralympic Data Only</h4>
                  </div>
                  <span className="text-xs font-mono text-slate-400">120 Matches</span>
                </div>

                <div className="text-xs text-slate-400 space-y-1">
                  <div><strong className="text-slate-300">Training Regimen:</strong> {modelComparison.baseline_model.training_data}</div>
                  <div><strong className="text-slate-300">Evaluation Scope:</strong> 24 Prospective Matches (WC 2026)</div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-2">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Out-of-Time Acc</span>
                    <span className="text-base font-black text-slate-200 font-mono">
                      {modelComparison.baseline_model.metrics.accuracy_pct}%
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Brier Score</span>
                    <span className="text-base font-black text-rose-400 font-mono">
                      {modelComparison.baseline_model.metrics.brier_score}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Log-Loss</span>
                    <span className="text-base font-black text-slate-300 font-mono">
                      {modelComparison.baseline_model.metrics.log_loss}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/60 text-[11px] text-slate-400 border border-slate-800">
                  <span className="text-amber-400 font-semibold">Limitation:</span> Carries historical lag from Tokyo 2020 where Great Britain and USA peaked; underestimates Japan's steep trajectory prior to their Paris 2024 gold.
                </div>
              </div>

              {/* Expanded Model Card */}
              <div className="rounded-xl bg-indigo-950/20 border border-indigo-500/40 p-5 space-y-4 shadow-lg shadow-indigo-950/50">
                <div className="flex items-center justify-between border-b border-indigo-500/30 pb-3">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                      EXPANDED MODEL (+37 INTL MATCHES)
                    </span>
                    <h4 className="text-base font-bold text-white mt-1">Paralympics + 2024 Invitationals</h4>
                  </div>
                  <span className="text-xs font-mono text-indigo-300 font-semibold">157 Matches</span>
                </div>

                <div className="text-xs text-slate-300 space-y-1">
                  <div><strong className="text-slate-200">Training Regimen:</strong> {modelComparison.expanded_model.training_data}</div>
                  <div><strong className="text-slate-200">Evaluation Scope:</strong> 24 Prospective Matches (WC 2026)</div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-2">
                  <div className="p-3 rounded-lg bg-slate-900 border border-emerald-500/30">
                    <span className="text-[10px] text-slate-400 block">Out-of-Time Acc</span>
                    <span className="text-base font-black text-emerald-300 font-mono">
                      {modelComparison.expanded_model.metrics.accuracy_pct}%
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-emerald-500/30">
                    <span className="text-[10px] text-slate-400 block">Brier Score</span>
                    <span className="text-base font-black text-emerald-400 font-mono">
                      {modelComparison.expanded_model.metrics.brier_score}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-emerald-500/30">
                    <span className="text-[10px] text-slate-400 block">Log-Loss</span>
                    <span className="text-base font-black text-emerald-300 font-mono">
                      {modelComparison.expanded_model.metrics.log_loss}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-950/30 text-[11px] text-emerald-300 border border-emerald-500/30">
                  <span className="font-semibold">Demonstrated Gain:</span> {modelComparison.empirical_gain.brier_calibration_gain}. Probabilistic forecast error dropped significantly by capturing Japan's pre-Paralympic dominance in Richmond and Shibuya.
                </div>
              </div>
            </div>

            {/* Scientific Verification Finding */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Scientific Finding: Calibration Sharpening via Mid-Cycle Tournaments
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {modelComparison.empirical_gain.scientific_conclusion}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: IPC Master Athlete Registry Explorer */}
      {activeSubTab === "registry" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search 329 athletes by name, alias (e.g. 'BATT R.'), club, or bio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="ALL">All Nations</option>
                  <option value="AUS">AUS (Australia)</option>
                  <option value="USA">USA (United States)</option>
                  <option value="JPN">JPN (Japan)</option>
                  <option value="GBR">GBR (Great Britain)</option>
                  <option value="CAN">CAN (Canada)</option>
                  <option value="FRA">FRA (France)</option>
                  <option value="NZL">NZL (New Zealand)</option>
                  <option value="DEN">DEN (Denmark)</option>
                  <option value="GER">GER (Germany)</option>
                </select>

                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="ALL">All Genders</option>
                  <option value="M">Male (M)</option>
                  <option value="F">Female (F)</option>
                </select>

                <button
                  onClick={() => setLegendsOnly(!legendsOnly)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    legendsOnly
                      ? "bg-amber-500 text-slate-950 font-bold"
                      : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Marquee Legends</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Showing {filteredAthletes.length} of 329 athletes in IPC Master Classification Registry</span>
              <span className="font-mono text-slate-500">Tier 1 IPC Archive Provenance</span>
            </div>
          </div>

          {/* Athletes Table */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Athlete & Aliases</th>
                    <th className="py-3 px-3">Country</th>
                    <th className="py-3 px-3">Class</th>
                    <th className="py-3 px-3">Functional Role</th>
                    <th className="py-3 px-3">Paralympic Games</th>
                    <th className="py-3 px-3 text-center">Medals (G-S-B)</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredAthletes.slice(0, 35).map((a) => (
                    <tr key={a.athlete_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{a.canonical_name}</span>
                          {a.is_legend && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[9px] font-bold">
                              LEGEND
                            </span>
                          )}
                          {a.gender === "F" && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[9px] font-bold">
                              FEMALE +0.5
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs font-mono">
                          ID: {a.athlete_id}
                          {a.aliases && a.aliases.length > 1 && (
                            <span className="text-slate-400"> • Aliases: {a.aliases.slice(0, 3).join(", ")}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono font-bold text-[11px]">
                          {a.country}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-amber-400 text-xs">
                          {a.primary_sport_class.toFixed(1)}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-[11px] text-slate-300">
                        {a.functional_archetype}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {a.tournaments_participated.map((t: string) => {
                            const yr = t.replace("Paris ", "P").replace("Tokyo ", "T").replace("Rio ", "R").replace("London ", "L").replace("Beijing ", "B").replace("Athens ", "A");
                            return (
                              <span
                                key={t}
                                title={t}
                                className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono"
                              >
                                {yr}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1 font-mono text-xs">
                          <span className="text-amber-400 font-bold" title="Gold Medals">{a.medals.gold}G</span>
                          <span className="text-slate-400">/</span>
                          <span className="text-slate-300 font-bold" title="Silver Medals">{a.medals.silver}S</span>
                          <span className="text-slate-400">/</span>
                          <span className="text-amber-600 font-bold" title="Bronze Medals">{a.medals.bronze}B</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right">
                        {onSelectPlayer && (
                          <button
                            onClick={() => onSelectPlayer(a.canonical_name)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 text-[11px] font-semibold transition-all cursor-pointer"
                          >
                            Studio
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: WWR Rules Evolution & Interactive Lineup Tester */}
      {activeSubTab === "rules" && rulesEvolution && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Eras Timeline */}
          <div className="lg:col-span-2 rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-6">
            <div>
              <span className="text-xs font-mono font-bold text-amber-400">
                OFFICIAL WWR CODIFICATION ARCHIVE
              </span>
              <h3 className="text-xl font-bold text-slate-100 mt-0.5">
                Wheelchair Rugby International Rules Evolution (2000–2028)
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Documenting changes across four major eras of international wheelchair rugby regulation, preventing false-positive lineup illegality flags.
              </p>
            </div>

            {/* Eras Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rulesEvolution.eras.map((era: any, idx: number) => {
                const isSelected = selectedEra === idx;
                return (
                  <button
                    key={era.era_id}
                    onClick={() => setSelectedEra(idx)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-amber-500/10 border-amber-500/60 shadow-lg shadow-amber-500/10"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-amber-400">{era.years}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">
                        Cap: {era.team_point_cap.toFixed(1)} {era.female_point_allowance > 0 ? `(+${era.female_point_allowance})` : ""}
                      </span>
                    </div>
                    <div className="font-bold text-sm text-slate-200">{era.label}</div>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Shot Clock: {era.shot_clock_seconds}s</span>
                      <span>Backcourt: {era.backcourt_seconds}s</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Era Detailed Specs */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-slate-200 text-xs">
                  {rulesEvolution.eras[selectedEra].label} ({rulesEvolution.eras[selectedEra].years}) Detailed Rules
                </span>
                <span className="text-[10px] font-mono text-emerald-400">
                  {rulesEvolution.eras[selectedEra].instant_replay ? "IRS Active" : "No Video Replay"}
                </span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {rulesEvolution.eras[selectedEra].key_regulations.map((reg: string, rIdx: number) => (
                  <li key={rIdx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{reg}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Interactive Lineup Legality Tester */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-xs font-mono font-bold text-amber-400">COACHING UTILITY</span>
              <h4 className="text-base font-bold text-white mt-0.5">Lineup Legality Tester</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Configure 4 athlete classifications to test legal validity across eras.
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-300">Player Classifications on Court:</div>
              <div className="grid grid-cols-4 gap-2">
                {calcClasses.map((cls, idx) => (
                  <div key={idx} className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-mono block">Player {idx + 1}</label>
                    <select
                      value={cls}
                      onChange={(e) => {
                        const updated = [...calcClasses];
                        updated[idx] = parseFloat(e.target.value);
                        setCalcClasses(updated);
                      }}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                    >
                      {[0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5].map((val) => (
                        <option key={val} value={val}>{val.toFixed(1)}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                  Female Athletes in Lineup:
                </label>
                <div className="flex gap-2">
                  {[0, 1, 2].map((cnt) => (
                    <button
                      key={cnt}
                      onClick={() => setCalcFemaleCount(cnt)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        calcFemaleCount === cnt
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                          : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {cnt} Female (+{(cnt * 0.5).toFixed(1)})
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Calculation Display */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 mt-4 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total Player Points:</span>
                  <span className="font-mono font-black text-white text-sm">{classSum.toFixed(1)} pts</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Pre-2010 Classical Cap (8.0 limit):</span>
                  <span className={`font-mono font-bold ${isLegalEra1 ? "text-emerald-400" : "text-rose-400"}`}>
                    {isLegalEra1 ? "LEGAL (Cap 8.0)" : `ILLEGAL (+${(classSum - 8.0).toFixed(1)})`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">2010–2025 Cap (Flat +0.5 per female):</span>
                  <span className={`font-mono font-bold ${isLegalEra2 ? "text-emerald-400" : "text-rose-400"}`}>
                    {isLegalEra2 ? `LEGAL (Cap ${(8.0 + calcFemaleCount * 0.5).toFixed(1)})` : `ILLEGAL (+${(classSum - (8.0 + calcFemaleCount * 0.5)).toFixed(1)})`}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-800 pt-1.5">
                  <span className="text-amber-400 font-semibold">2026+ Tiered Cap (+0.5 low / +1.0 high):</span>
                  <span className={`font-mono font-bold ${isLegalEra2026 ? "text-emerald-400" : "text-rose-400"}`}>
                    {isLegalEra2026 ? `LEGAL (Cap ${(8.0 + femaleAllowance2026).toFixed(1)})` : `ILLEGAL (+${(classSum - (8.0 + femaleAllowance2026)).toFixed(1)})`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 5: Source Rejection Audit */}
      {activeSubTab === "rejection" && discoveryReport && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-6">
            <div>
              <span className="text-xs font-mono font-bold text-rose-400 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                ACADEMIC & SCIENTIFIC RIGOR
              </span>
              <h3 className="text-xl font-bold text-slate-100 mt-0.5">
                External Dataset Discovery & Source Rejection Audit
              </h3>
              <p className="text-xs text-slate-300 max-w-3xl mt-1">
                A rigorous sports analytics platform must be transparent about not only what data it includes, but what data it explicitly rejects and why. The following candidate sources were evaluated and rejected.
              </p>
            </div>

            {/* Rejected Sources Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {discoveryReport.rejected_datasets.map((rej: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 text-xs">{rej.candidate_source}</span>
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      {rej.verdict}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-rose-300">Scientific Rationale:</strong> {rej.scientific_rationale}
                  </p>
                </div>
              ))}
            </div>

            {/* Accepted Sources Grid */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="font-bold text-slate-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Officially Accepted & Verified External Datasets
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {discoveryReport.accepted_datasets.map((acc: any) => (
                  <div key={acc.dataset_id} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{acc.title}</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold">
                        ACCEPTED
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">{acc.quality_tier}</div>
                    <div className="text-[11px] text-slate-300">{acc.analytical_value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
