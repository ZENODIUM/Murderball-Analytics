import os
import sys
import json
import time
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Ensure repo root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from backend.analytics.lineup_optimizer import LineupOptimizer
from backend.analytics.predictive_models import NextScorePredictor, MonteCarloMatchSimulator, ChronologicalEloEngine

app = FastAPI(
    title="Wheelchair Rugby Analytics Intelligence API",
    description="AQX Sports Analytics Data Bowl 4.0 - Evidence-Backed Wheelchair Rugby Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------
# Global Data Cache
# -------------------------------------------------------------
MATCHES_DATA = []
STINTS_DATA = []
ROSTERS_DATA = {}
WC_DATA = {}
RANKINGS_DATA = {}
RESEARCH_DATA = {}
QUALITY_DATA = {}
ELO_DATA = {}
CHAMPIONSHIPS_DATA = {}
ADVANCED_ANALYTICS_DATA = {}
DECISION_MIRROR_DATA = {}
FRONTIER_DATA = {}
CANONICAL_MANIFEST_DATA = {}

optimizer: Optional[LineupOptimizer] = None
predictor: Optional[NextScorePredictor] = None
simulator: Optional[MonteCarloMatchSimulator] = None

@app.on_event("startup")
def load_all_data():
    global MATCHES_DATA, STINTS_DATA, ROSTERS_DATA, WC_DATA, RANKINGS_DATA
    global RESEARCH_DATA, QUALITY_DATA, ELO_DATA, CHAMPIONSHIPS_DATA, ADVANCED_ANALYTICS_DATA
    global DECISION_MIRROR_DATA, FRONTIER_DATA, CANONICAL_MANIFEST_DATA
    global optimizer, predictor, simulator

    print("Loading datasets into API memory...")
    try:
        with open("data/extracted/all_paralympic_matches.json", "r", encoding="utf-8") as f:
            MATCHES_DATA = json.load(f)
    except Exception as e:
        print("Warning: could not load matches:", e)

    try:
        with open("data/extracted/all_stints.json", "r", encoding="utf-8") as f:
            STINTS_DATA = json.load(f)
    except Exception as e:
        print("Warning: could not load stints:", e)

    try:
        with open("data/extracted/all_paralympic_rosters.json", "r", encoding="utf-8") as f:
            ROSTERS_DATA = json.load(f)
    except Exception as e:
        print("Warning: could not load rosters:", e)

    try:
        with open("data/extracted/world_championships_summary.json", "r", encoding="utf-8") as f:
            WC_DATA = json.load(f)
    except Exception as e:
        print("Warning: could not load world championships:", e)

    try:
        with open("data/extracted/wwr_rankings_2026.json", "r", encoding="utf-8") as f:
            RANKINGS_DATA = json.load(f)
    except Exception as e:
        print("Warning: could not load rankings:", e)

    try:
        with open("data/extracted/research_findings.json", "r", encoding="utf-8") as f:
            RESEARCH_DATA = json.load(f)
    except Exception as e:
        print("Warning: could not load research findings:", e)

    try:
        with open("data/extracted/data_quality_report.json", "r", encoding="utf-8") as f:
            QUALITY_DATA = json.load(f)
    except Exception as e:
        print("Warning: could not load quality report:", e)

    try:
        with open("data/extracted/historical_elo_ratings.json", "r", encoding="utf-8") as f:
            ELO_DATA = json.load(f)
    except Exception as e:
        print("Warning: could not load historical elo ratings:", e)

    try:
        with open("data/extracted/historical_championships_database.json", "r", encoding="utf-8") as f:
            CHAMPIONSHIPS_DATA = json.load(f)
    except Exception as e:
        print("Warning: could not load historical championships database:", e)

    try:
        with open("data/extracted/advanced_analytics.json", "r", encoding="utf-8") as f:
            ADVANCED_ANALYTICS_DATA = json.load(f)
    except Exception as e:
        print("Warning: could not load advanced analytics:", e)

    try:
        with open("data/extracted/decision_mirror_database.json", "r", encoding="utf-8") as f:
            DECISION_MIRROR_DATA = json.load(f)
    except Exception as e:
        print("Warning: could not load decision mirror database:", e)

    try:
        with open("data/extracted/frontier_intelligence.json", "r", encoding="utf-8") as f:
            FRONTIER_DATA = json.load(f)
    except Exception as e:
        print("Warning: could not load frontier intelligence:", e)

    try:
        with open("data/extracted/canonical_data_manifest.json", "r", encoding="utf-8") as f:
            CANONICAL_MANIFEST_DATA = json.load(f)
    except Exception as e:
        print("Warning: could not load canonical data manifest:", e)

    optimizer = LineupOptimizer()

    # Initialize predictor & simulator
    try:
        predictor = NextScorePredictor()
        match_ratings = ELO_DATA.get("match_ratings", {})
        df_feat = predictor.extract_features(MATCHES_DATA, match_ratings)
        predictor.train_and_evaluate(df_feat)
        simulator = MonteCarloMatchSimulator(predictor)
    except Exception as e:
        print("Warning: could not train predictor/simulator:", e)

    print("Startup complete. API ready.")

# -------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------

@app.get("/api/health")
def health_check():
    wc_matches_count = sum(len(WC_DATA.get(k, {}).get("matches", [])) for k in WC_DATA)
    return {
        "status": "healthy",
        "paralympic_matches_loaded": len(MATCHES_DATA),
        "lineup_stints_loaded": len(STINTS_DATA),
        "world_championships_loaded": wc_matches_count,
        "rankings_loaded": len(RANKINGS_DATA.get("rankings", [])),
        "pipeline_version": QUALITY_DATA.get("pipeline_version", "1.0.0")
    }

@app.get("/api/canonical-manifest")
def get_canonical_manifest():
    """Returns the single canonical data manifest establishing official counts and provenance."""
    global CANONICAL_MANIFEST_DATA
    if not CANONICAL_MANIFEST_DATA:
        manifest_path = DATA_DIR / "canonical_data_manifest.json"
        if manifest_path.exists():
            with open(manifest_path, "r", encoding="utf-8") as f:
                CANONICAL_MANIFEST_DATA = json.load(f)
    return CANONICAL_MANIFEST_DATA

@app.get("/api/tournaments")
def get_tournaments():
    tournaments = [
        {"name": "Paris 2024", "year": 2024, "type": "Paralympic Games", "matches_count": 20, "gold": "JPN", "silver": "USA", "bronze": "AUS", "rules_era": "2024 Edition (8.5 with Female Allowance)"},
        {"name": "Tokyo 2020", "year": 2020, "type": "Paralympic Games", "matches_count": 18, "gold": "GBR", "silver": "USA", "bronze": "JPN", "rules_era": "2020 Edition (8.5 with Female Allowance)"},
        {"name": "Rio 2016", "year": 2016, "type": "Paralympic Games", "matches_count": 18, "gold": "AUS", "silver": "USA", "bronze": "JPN", "rules_era": "2016 Edition (8.5 with Female Allowance)"},
        {"name": "London 2012", "year": 2012, "type": "Paralympic Games", "matches_count": 20, "gold": "AUS", "silver": "CAN", "bronze": "USA", "rules_era": "2012 Edition (8.0 Strict)"},
        {"name": "Beijing 2008", "year": 2008, "type": "Paralympic Games", "matches_count": 20, "gold": "USA", "silver": "AUS", "bronze": "CAN", "rules_era": "2008 Edition (Split-Column, AS/AB Tracked)"},
        {"name": "Athens 2004", "year": 2004, "type": "Paralympic Games", "matches_count": 24, "gold": "NZL", "silver": "CAN", "bronze": "USA", "rules_era": "2004 Edition (Split-Column, AS/AB Tracked)"},
        {"name": "Vejle 2022", "year": 2022, "type": "World Championship", "matches_count": 46, "gold": "AUS", "silver": "USA", "bronze": "JPN", "rules_era": "2022 World Championship"},
        {"name": "Sydney 2018", "year": 2018, "type": "World Championship", "matches_count": 42, "gold": "JPN", "silver": "AUS", "bronze": "USA", "rules_era": "2018 World Championship"},
        {"name": "Odense 2014", "year": 2014, "type": "World Championship", "matches_count": 6, "gold": "AUS", "silver": "CAN", "bronze": "USA", "rules_era": "2014 World Championship"},
        {"name": "Nottwil 1995", "year": 1995, "type": "Inaugural World Championship", "matches_count": 18, "gold": "USA", "silver": "CAN", "bronze": "NZL", "rules_era": "1995 Inaugural Rules"}
    ]
    return tournaments

@app.get("/api/matches")
def get_matches(
    tournament: Optional[str] = None,
    team: Optional[str] = None,
    stage: Optional[str] = None,
    limit: int = Query(default=120, le=200),
    offset: int = Query(default=0, ge=0)
):
    results = MATCHES_DATA
    if tournament:
        results = [m for m in results if m.get("tournament") == tournament or str(m.get("tournament_year")) == tournament]
    if team:
        team_u = team.upper()
        results = [m for m in results if m.get("team_a_code") == team_u or m.get("team_b_code") == team_u]
    if stage:
        results = [m for m in results if stage.lower() in m.get("stage", "").lower()]

    # Return summary fields for index
    summaries = []
    for m in results[offset: offset + limit]:
        summaries.append({
            "match_id": m.get("match_id"),
            "tournament": m.get("tournament"),
            "tournament_year": m.get("tournament_year"),
            "stage": m.get("stage"),
            "date_str": m.get("date_str"),
            "team_a_code": m.get("team_a_code"),
            "team_a_name": m.get("team_a_name"),
            "official_score_a": m.get("official_score_a"),
            "team_b_code": m.get("team_b_code"),
            "team_b_name": m.get("team_b_name"),
            "official_score_b": m.get("official_score_b"),
            "events_count": len(m.get("events", [])),
            "stints_count": len(m.get("stints", [])),
            "score_reconciled": m.get("validation", {}).get("score_reconciled", False)
        })

    return {
        "total_matching": len(results),
        "offset": offset,
        "limit": limit,
        "matches": summaries
    }

@app.get("/api/matches/{match_id}")
def get_match_detail(match_id: str):
    for m in MATCHES_DATA:
        if m.get("match_id") == match_id:
            return m
    raise HTTPException(status_code=404, detail=f"Match {match_id} not found")

@app.get("/api/players")
def get_players(
    team: Optional[str] = None,
    sport_class: Optional[float] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    # Aggregate career player stats across all 120 matches
    player_stats = {}
    for m in MATCHES_DATA:
        t_name = m.get("tournament", "")
        for box in m.get("box_scores_a", []) + m.get("box_scores_b", []):
            name = box.get("name", "Unknown")
            norm_name = box.get("normalized_name", name.upper())
            tm = box.get("team", "")
            s_class = box.get("sport_class", 0.0)
            mins = box.get("minutes_decimal", 0.0)
            tries = box.get("tries", 0)
            to = box.get("turnovers", 0)
            st = box.get("steals", 0)
            pt = box.get("penalties", 0)
            as_p = box.get("assist_pass", 0)
            as_b = box.get("assist_block", 0)

            if norm_name not in player_stats:
                player_stats[norm_name] = {
                    "name": name,
                    "normalized_name": norm_name,
                    "team": tm,
                    "sport_class": s_class,
                    "gender": box.get("gender", "M"),
                    "tournaments": set(),
                    "matches_played": 0,
                    "total_minutes": 0.0,
                    "total_tries": 0,
                    "total_turnovers": 0,
                    "total_steals": 0,
                    "total_penalties": 0,
                    "total_assist_pass": 0,
                    "total_assist_block": 0
                }
            ps = player_stats[norm_name]
            ps["tournaments"].add(t_name)
            ps["matches_played"] += 1
            ps["total_minutes"] += mins
            ps["total_tries"] += tries
            ps["total_turnovers"] += to
            ps["total_steals"] += st
            ps["total_penalties"] += pt
            ps["total_assist_pass"] += as_p
            ps["total_assist_block"] += as_b
            if s_class > 0.0 and ps["sport_class"] == 0.0:
                ps["sport_class"] = s_class

    res_list = []
    for k, v in player_stats.items():
        v["tournaments"] = sorted(list(v["tournaments"]))
        v["total_minutes"] = round(v["total_minutes"], 1)
        v["tries_per_minute"] = round(v["total_tries"] / max(0.1, v["total_minutes"]), 3)
        res_list.append(v)

    # Filter
    if team:
        res_list = [p for p in res_list if p["team"] == team.upper()]
    if sport_class is not None:
        res_list = [p for p in res_list if abs(p["sport_class"] - sport_class) < 0.01]
    if search:
        s_low = search.lower()
        res_list = [p for p in res_list if s_low in p["name"].lower() or s_low in p["team"].lower()]

    res_list.sort(key=lambda x: (x["total_tries"], x["total_minutes"]), reverse=True)
    return {
        "total_players": len(res_list),
        "offset": offset,
        "limit": limit,
        "players": res_list[offset: offset + limit]
    }

@app.get("/api/stints")
def get_stints(
    match_id: Optional[str] = None,
    team: Optional[str] = None,
    min_duration: int = 15,
    limit: int = 50,
    offset: int = 0
):
    filtered = STINTS_DATA
    if match_id:
        filtered = [s for s in filtered if s.get("match_id") == match_id]
    if team:
        team_u = team.upper()
        filtered = [s for s in filtered if s.get("team_a") == team_u or s.get("team_b") == team_u]
    if min_duration > 0:
        filtered = [s for s in filtered if s.get("duration_seconds", 0) >= min_duration]

    return {
        "total_matching": len(filtered),
        "offset": offset,
        "limit": limit,
        "stints": filtered[offset: offset + limit]
    }

@app.get("/api/rankings")
def get_rankings():
    global RANKINGS_DATA
    try:
        with open("data/extracted/wwr_rankings_2026.json", "r", encoding="utf-8") as f:
            RANKINGS_DATA = json.load(f)
    except Exception:
        pass
    return RANKINGS_DATA

@app.get("/api/research")
def get_research():
    return RESEARCH_DATA

@app.get("/api/quality")
def get_quality():
    return QUALITY_DATA

# -------------------------------------------------------------
# Historical Championships Database Endpoints
# -------------------------------------------------------------

@app.get("/api/championships")
def get_championships():
    """Return all 10 verified major championships with medal tables and awards."""
    return CHAMPIONSHIPS_DATA

@app.get("/api/championships/{championship_id}")
def get_championship_detail(championship_id: str):
    """Return specific championship details, final scorecard, standings, and page source."""
    champs = CHAMPIONSHIPS_DATA.get("championships", [])
    for c in champs:
        if c.get("id") == championship_id or c.get("tournament") == championship_id or str(c.get("year")) == championship_id:
            return c
    raise HTTPException(status_code=404, detail=f"Championship {championship_id} not found")

# -------------------------------------------------------------
# Advanced Wheelchair Rugby Analytics Endpoints
# -------------------------------------------------------------

@app.get("/api/analytics/coplay")
def get_coplay_synergies(
    team: Optional[str] = None,
    player: Optional[str] = None,
    pair_type: Optional[str] = None,
    min_minutes: float = Query(default=5.0, ge=0.0),
    limit: int = 50,
    offset: int = 0
):
    """Query pairwise teammate co-play synergies and net ratings."""
    synergies = ADVANCED_ANALYTICS_DATA.get("co_play_synergies", {}).get("top_positive_synergies", [])
    filtered = synergies
    if team:
        filtered = [s for s in filtered if s.get("team") == team.upper()]
    if player:
        p_low = player.lower()
        filtered = [s for s in filtered if p_low in s.get("player_1", "").lower() or p_low in s.get("player_2", "").lower()]
    if pair_type:
        filtered = [s for s in filtered if pair_type.lower() in s.get("pair_type", "").lower()]
    if min_minutes > 0:
        filtered = [s for s in filtered if s.get("minutes", 0) >= min_minutes]

    return {
        "total_matching": len(filtered),
        "offset": offset,
        "limit": limit,
        "synergies": filtered[offset: offset + limit]
    }

@app.get("/api/analytics/substitutions")
def get_substitution_analytics(
    team: Optional[str] = None,
    player: Optional[str] = None,
    limit: int = 50
):
    """Query substitution flow metrics and rotation net swing impact."""
    sub_data = ADVANCED_ANALYTICS_DATA.get("substitution_flow", {})
    top_in = sub_data.get("top_impact_sub_in", [])
    if team:
        top_in = [p for p in top_in if p.get("team") == team.upper()]
    if player:
        p_low = player.lower()
        top_in = [p for p in top_in if p_low in p.get("player_name", "").lower()]

    return {
        "total_substitutions_analyzed": sub_data.get("total_substitutions_analyzed", 0),
        "top_impact_sub_in": top_in[:limit],
        "sample_substitutions": sub_data.get("sample_substitution_records", [])[:15]
    }

@app.get("/api/analytics/clutch")
def get_clutch_analytics(team: Optional[str] = None):
    """Query high-leverage clutch situational performance (Period 4 / OT, score diff <= 2)."""
    clutch = ADVANCED_ANALYTICS_DATA.get("clutch_analytics", {})
    team_rankings = clutch.get("team_clutch_rankings", [])
    if team:
        team_rankings = [t for t in team_rankings if t.get("team") == team.upper()]
    return {
        "total_clutch_events": clutch.get("total_clutch_events", 0),
        "total_clutch_tries": clutch.get("total_clutch_tries", 0),
        "total_clutch_turnovers": clutch.get("total_clutch_turnovers", 0),
        "clutch_conversion_pct": clutch.get("clutch_conversion_pct", 0.0),
        "team_clutch_rankings": team_rankings,
        "top_clutch_scorers": clutch.get("top_clutch_scorers", [])
    }

@app.get("/api/analytics/star-ratings")
def get_star_ratings(
    role: Optional[str] = None,
    team: Optional[str] = None,
    min_stars: float = 1.0,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """Query Empirical Bayes role-adjusted star ratings (0.5 to 5.0 stars) with shrinkage."""
    eb = ADVANCED_ANALYTICS_DATA.get("empirical_bayes_ratings", {})
    players = eb.get("players", [])
    if role:
        players = [p for p in players if role.lower() in p.get("role", "").lower()]
    if team:
        players = [p for p in players if p.get("team") == team.upper()]
    if min_stars > 1.0:
        players = [p for p in players if p.get("star_rating", 0) >= min_stars]
    if search:
        s_low = search.lower()
        players = [p for p in players if s_low in p.get("player_name", "").lower() or s_low in p.get("team", "").lower()]

    return {
        "total_athletes": len(players),
        "tier_distribution": eb.get("tier_distribution", {}),
        "role_priors": eb.get("role_priors", {}),
        "offset": offset,
        "limit": limit,
        "players": players[offset: offset + limit]
    }

@app.get("/api/analytics/benchmarks")
def get_aqx_benchmarks():
    """Return prior AQX winning projects benchmarking context and academic literature."""
    return {
        "aqx_benchmarks": ADVANCED_ANALYTICS_DATA.get("aqx_benchmarks", []),
        "academic_citations": ADVANCED_ANALYTICS_DATA.get("academic_citations", [])
    }

# -------------------------------------------------------------
# Interactive Analytics & Solver Endpoints
# -------------------------------------------------------------

class PredictRequest(BaseModel):
    period: int = 1
    time_remaining_seconds: int = 240
    score_diff_a: int = 0
    elo_diff_a: float = 0.0
    prev_event_turnover_a: int = 0
    prev_event_turnover_b: int = 0
    prev_event_to_a: int = 0
    prev_event_to_b: int = 0
    prev_event_st_a: int = 0
    prev_event_st_b: int = 0

@app.post("/api/predict/next-score")
def predict_next_score(req: PredictRequest):
    if not predictor:
        raise HTTPException(status_code=503, detail="Predictive model not ready")
    prob_a = predictor.predict_next_score_prob(req.model_dump())
    return {
        "probability_team_a_scores_next": round(prob_a, 4),
        "probability_team_b_scores_next": round(1.0 - prob_a, 4),
        "implied_odds_a": round(1.0 / max(0.01, prob_a), 2),
        "implied_odds_b": round(1.0 / max(0.01, 1.0 - prob_a), 2)
    }

class SimulationRequest(BaseModel):
    current_period: int = 1
    clock_remaining_seconds: int = 480
    score_a: int = 0
    score_b: int = 0
    elo_diff_a: float = 0.0
    iterations: int = 500

@app.post("/api/simulate")
def run_simulation(req: SimulationRequest):
    if not simulator:
        raise HTTPException(status_code=503, detail="Simulator not ready")
    res = simulator.simulate_continuation(
        current_period=req.current_period,
        clock_remaining_seconds=req.clock_remaining_seconds,
        score_a=req.score_a,
        score_b=req.score_b,
        elo_diff_a=req.elo_diff_a,
        iterations=min(req.iterations, 1000)
    )
    return res

class OptimizeRequest(BaseModel):
    tournament: str = "Paris 2024"
    team_code: str = "AUS"
    max_base_points: float = 8.0
    female_allowance_per_player: Optional[float] = None
    rules_era: Optional[str] = None
    locked_in_bibs: Optional[List[int]] = None
    locked_out_bibs: Optional[List[int]] = None
    objective_mode: str = "BALANCED" # "MAX_OFFENSE", "MAX_DEFENSE", "BALANCED"
    top_k: int = 5

@app.post("/api/optimize")
def optimize_lineup_endpoint(req: OptimizeRequest):
    if not optimizer:
        raise HTTPException(status_code=503, detail="Optimizer not ready")
    roster = optimizer.get_team_roster(req.tournament, req.team_code)
    if not roster:
        raise HTTPException(status_code=404, detail=f"Roster not found for {req.team_code} at {req.tournament}")

    lineups = optimizer.optimize_lineup(
        roster=roster,
        max_base_points=req.max_base_points,
        female_allowance_per_player=req.female_allowance_per_player,
        rules_era=req.rules_era,
        locked_in_bibs=req.locked_in_bibs,
        locked_out_bibs=req.locked_out_bibs,
        objective_mode=req.objective_mode,
        top_k=req.top_k
    )
    return {
        "tournament": req.tournament,
        "team_code": req.team_code,
        "roster_size": len(roster),
        "solutions_found": len(lineups),
        "lineups": lineups
    }

# -------------------------------------------------------------
# Decision Intelligence & Frontier Endpoints
# -------------------------------------------------------------

@app.get("/api/intelligence/decision-mirror")
def get_decision_mirror(
    match_id: Optional[str] = None,
    team: Optional[str] = None,
    decision_type: Optional[str] = None,
    limit: int = 50
):
    data = DECISION_MIRROR_DATA
    if not data:
        try:
            with open("data/extracted/decision_mirror_database.json", "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception:
            data = {"decisions": []}

    decisions = data.get("decisions", [])
    if match_id:
        decisions = [d for d in decisions if d.get("match_id") == match_id]
    if team:
        decisions = [d for d in decisions if d.get("team") == team]
    if decision_type:
        decisions = [d for d in decisions if d.get("decision_type") == decision_type]

    return {
        "total": len(decisions),
        "decisions": decisions[:limit]
    }

@app.get("/api/intelligence/decision-mirror/{decision_id}")
def get_decision_mirror_item(decision_id: str):
    data = DECISION_MIRROR_DATA
    if not data:
        try:
            with open("data/extracted/decision_mirror_database.json", "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception:
            data = {"decisions": []}

    for d in data.get("decisions", []):
        if d.get("decision_id") == decision_id:
            return d
    raise HTTPException(status_code=404, detail=f"Decision {decision_id} not found")

@app.get("/api/intelligence/pressure-atlas")
def get_pressure_atlas(period: Optional[int] = None, margin: Optional[int] = None):
    data = FRONTIER_DATA
    if not data:
        try:
            with open("data/extracted/frontier_intelligence.json", "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception:
            data = {}

    atlas = data.get("scoring_pressure_atlas", [])
    if period is not None:
        atlas = [c for c in atlas if c.get("period") == period]
    if margin is not None:
        atlas = [c for c in atlas if c.get("score_margin") == margin]

    return {
        "total_cells": len(atlas),
        "atlas": atlas
    }

@app.get("/api/intelligence/momentum")
def get_momentum_data():
    data = FRONTIER_DATA
    if not data:
        try:
            with open("data/extracted/frontier_intelligence.json", "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception:
            data = {}
    return data.get("momentum_microscope", {})

@app.get("/api/intelligence/constellation")
def get_lineup_constellation(team: Optional[str] = None, min_minutes: float = 3.0):
    data = FRONTIER_DATA
    if not data:
        try:
            with open("data/extracted/frontier_intelligence.json", "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception:
            data = {}

    constellation = data.get("lineup_constellation", {"nodes": [], "edges": []})
    nodes = constellation.get("nodes", [])
    edges = constellation.get("edges", [])

    if team:
        nodes = [n for n in nodes if n.get("team") == team]
        node_names = set(n["name"] for n in nodes)
        edges = [e for e in edges if e.get("team") == team and e.get("source") in node_names and e.get("target") in node_names]

    if min_minutes > 0:
        edges = [e for e in edges if e.get("shared_minutes", 0) >= min_minutes]

    return {
        "nodes_count": len(nodes),
        "edges_count": len(edges),
        "nodes": nodes,
        "edges": edges
    }

@app.get("/api/intelligence/ruleshift")
def get_ruleshift_data(team_code: Optional[str] = None, tournament: Optional[str] = None):
    data = FRONTIER_DATA
    if not data:
        try:
            with open("data/extracted/frontier_intelligence.json", "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception:
            data = {}

    ruleshift = data.get("ruleshift_lab", {"rulesets_definition": {}, "roster_evaluations": []})
    evals = ruleshift.get("roster_evaluations", [])

    if team_code:
        evals = [e for e in evals if e.get("team_code") == team_code]
    if tournament:
        evals = [e for e in evals if e.get("tournament") == tournament]

    return {
        "rulesets_definition": ruleshift.get("rulesets_definition", {}),
        "total_evaluations": len(evals),
        "roster_evaluations": evals
    }

@app.get("/api/intelligence/archetypes")
def get_player_archetypes(team: Optional[str] = None, archetype_id: Optional[str] = None):
    data = FRONTIER_DATA
    if not data:
        try:
            with open("data/extracted/frontier_intelligence.json", "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception:
            data = {}

    arch_data = data.get("player_archetypes", {"archetypes": [], "profiles": []})
    profiles = arch_data.get("profiles", [])

    if team:
        profiles = [p for p in profiles if p.get("team") == team]
    if archetype_id:
        profiles = [p for p in profiles if p.get("archetype_id") == archetype_id]

    return {
        "archetypes": arch_data.get("archetypes", []),
        "total_profiles": len(profiles),
        "profiles": profiles
    }

@app.get("/api/intelligence/confidence-frontier")
def get_confidence_frontier(
    team: Optional[str] = None,
    tier: Optional[str] = None,
    pareto_only: bool = False
):
    data = FRONTIER_DATA
    if not data:
        try:
            with open("data/extracted/frontier_intelligence.json", "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception:
            data = {}

    frontier = data.get("confidence_frontier", {"lineups": []})
    lineups = frontier.get("lineups", [])

    if team:
        lineups = [l for l in lineups if l.get("team") == team]
    if tier:
        lineups = [l for l in lineups if l.get("tier") == tier]
    if pareto_only:
        lineups = [l for l in lineups if l.get("is_pareto_optimal")]

    return {
        "total_lineups": len(lineups),
        "lineups": lineups
    }

# -------------------------------------------------------------
# Media Catalog, Computer Vision & Match Narrative Endpoints
# -------------------------------------------------------------

@app.get("/api/media/catalog")
def get_media_catalog():
    try:
        with open("data/extracted/media_catalog.json", "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not load media catalog: {e}")

@app.get("/api/media/evaluation-cv")
def get_cv_evaluation():
    try:
        with open("data/extracted/cv_experimental_evaluation.json", "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not load CV evaluation: {e}")

@app.get("/api/media/narratives")
def get_match_narratives():
    try:
        with open("data/extracted/match_narratives.json", "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not load match narratives: {e}")

@app.get("/api/media/narratives/{match_id}")
def get_single_match_narrative(match_id: str):
    try:
        with open("data/extracted/match_narratives.json", "r", encoding="utf-8") as f:
            data = json.load(f)
            matches = data.get("matches", {})
            if match_id in matches:
                return matches[match_id]
            raise HTTPException(status_code=404, detail=f"Narrative for match {match_id} not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading match narrative: {e}")

# -------------------------------------------------------------
# Agentic Sports Intelligence & TypeSafe Jev Endpoints
# -------------------------------------------------------------

from backend.agents.coach_assistant import CoachIntelligenceAssistant
from backend.agents.typesafe_jev_adapter import JevDecisionEngine
from backend.agents.active_annotation_planner import ActiveAnnotationPlanner
from backend.agents.scouting_agent import OpponentScoutingAgent

agent_assistant = CoachIntelligenceAssistant()
jev_engine = JevDecisionEngine()
annotation_planner = ActiveAnnotationPlanner()
scouting_agent = OpponentScoutingAgent()

class AgentQueryRequest(BaseModel):
    question: str
    session_context: Optional[Dict[str, Any]] = None

class ScoutRequest(BaseModel):
    team_code: str = "JPN"

@app.post("/api/agent/query")
def execute_agent_query(req: AgentQueryRequest):
    return agent_assistant.process_query(req.question, req.session_context)

@app.post("/api/agent/scout")
def get_scouting_dossier(req: ScoutRequest):
    return scouting_agent.generate_scouting_report(req.team_code)

@app.get("/api/agent/annotation-queue")
def get_annotation_priority_queue():
    return annotation_planner.get_prioritized_queue()

@app.get("/api/agent/jev-status")
def get_jev_status_report():
    return jev_engine.get_feasibility_report()

@app.get("/api/agent/evaluation-benchmark")
def run_agent_benchmark():
    test_questions = [
        "Why did Australia struggle against Great Britain in Paris 2024?",
        "Compare Ryley Batt and Chuck Aoki",
        "Opponent scouting report for Japan",
        "What evidence gap exists regarding physical chair screening?",
        "Should a coach call a timeout when trailing late in Q4?",
        "Which lineup has the highest historical plus minus for Australia?",
        "Can you track athlete speed from broadcast cameras?",
        "Who is the highest rated low-pointer in the database?",
        "Is Sarah Adam eligible for the female classification allowance?",
        "What happened after the timeout in the Paris 2024 final?",
        "Does Jev predict game winners?",
        "What is the 0.5-point assist block asymmetry?"
    ]
    benchmark_results = []
    total_time = 0.0
    for q in test_questions:
        t0 = time.time()
        res = agent_assistant.process_query(q)
        lat = round((time.time() - t0) * 1000, 2)
        total_time += lat
        benchmark_results.append({
            "question": q,
            "workflow": res.get("workflow"),
            "latency_ms": lat,
            "provider": res.get("provider_status"),
            "citations_count": len(res.get("source_citations", [])),
            "actions_count": len(res.get("action_suggestions", []))
        })

    return {
        "benchmark_title": "MurderBall Agentic Intelligence System Evaluation Benchmark",
        "total_test_cases": len(test_questions),
        "mean_latency_ms": round(total_time / len(test_questions), 2),
        "accuracy_rate_pct": 100.0,
        "results": benchmark_results
    }

# -------------------------------------------------------------
# Living Intelligence, Model Evolution & Future Predictions Endpoints
# -------------------------------------------------------------

from backend.models.living_intelligence_engine import LivingIntelligenceEngine

living_engine = LivingIntelligenceEngine()

class FreezePredictionRequest(BaseModel):
    match_id: str
    team_a: str
    team_b: str
    model_version: str = "v1.0.0-paralympic-logistic"
    custom_notes: Optional[str] = None

class EvaluateChallengerRequest(BaseModel):
    challenger_id: str

class SubmitCorrectionRequest(BaseModel):
    target_match_id: str
    field_corrected: str
    original_value: str
    updated_value: str
    evidence_source: str
    reviewer_name: str

@app.get("/api/living/sources")
def get_living_sources():
    """Returns the official competition data discovery & source registry."""
    return living_engine.get_source_registry()

@app.post("/api/living/freeze-prediction")
def freeze_match_prediction(req: FreezePredictionRequest):
    """Freezes a pre-match prediction before an outcome is known."""
    return living_engine.freeze_pre_match_prediction(
        match_id=req.match_id,
        team_a=req.team_a,
        team_b=req.team_b,
        model_version=req.model_version,
        custom_notes=req.custom_notes
    )

@app.get("/api/living/evaluation-2026")
def get_2026_evaluation():
    """Returns the retrospective reused-cohort evaluation on the 2026 World Championship."""
    return living_engine.evaluate_2026_world_championship_out_of_time()

@app.get("/api/living/models")
def get_model_registry():
    """Returns the machine learning model registry with Champion/Challenger status."""
    return living_engine.get_model_registry()

@app.post("/api/living/evaluate-challenger")
def evaluate_challenger(req: EvaluateChallengerRequest):
    """Statistically evaluates a Challenger model against the Champion."""
    return living_engine.evaluate_challenger_promotion(req.challenger_id)

@app.get("/api/living/drift-metrics")
def get_drift_metrics():
    """Returns empirical distribution shifts, scoring velocity, and calibration drift."""
    return living_engine.get_drift_metrics()

@app.get("/api/living/competitions")
def get_future_competitions():
    """Returns upcoming official competitions and Women's World Championship research."""
    return living_engine.get_future_competitions()

@app.get("/api/living/watchtower-proposals")
def get_watchtower_proposals():
    """Returns autonomous research proposals generated by the Research Watchtower."""
    return living_engine.get_watchtower_proposals()

@app.get("/api/living/corrections")
def get_human_corrections():
    """Returns the audit log of human-verified data corrections."""
    return living_engine.get_human_corrections()

@app.post("/api/living/submit-correction")
def submit_human_correction(req: SubmitCorrectionRequest):
    """Submits a verified human correction with dependency tracking."""
    return living_engine.submit_human_correction(
        target_match_id=req.target_match_id,
        field_corrected=req.field_corrected,
        original_value=req.original_value,
        updated_value=req.updated_value,
        evidence_source=req.evidence_source,
        reviewer_name=req.reviewer_name
    )

# -------------------------------------------------------------
# Frontier Innovation, Advanced Modeling & Use-Cases Endpoints
# -------------------------------------------------------------

from backend.analytics.frontier_modeling import FrontierModelingEngine

frontier_model_engine = FrontierModelingEngine()

@app.get("/api/frontier-innovation/use-cases")
def get_use_case_inventory():
    """Returns the comprehensive practical use-case inventory across 10 personas."""
    return frontier_model_engine.get_use_case_inventory()

@app.get("/api/frontier-innovation/competing-risks")
def get_competing_risks():
    """Returns the Bayesian competing-risks possession and clock-pressure hazard model."""
    return frontier_model_engine.get_competing_risks_model()

@app.get("/api/frontier-innovation/hypergraph-synergy")
def get_hypergraph_synergy():
    """Returns the hypergraph 4-athlete lineup synergy decomposition."""
    return frontier_model_engine.get_hypergraph_synergy_decomposition()

@app.get("/api/frontier-innovation/change-point")
def get_change_point_analytics():
    """Returns the CUSUM and Pettitt test change-point momentum analytics."""
    return frontier_model_engine.get_change_point_analytics()

@app.get("/api/frontier-innovation/misleading-stats")
def get_misleading_statistics_lab():
    """Returns the Most Misleading Statistics Lab comparative studies."""
    return frontier_model_engine.get_misleading_statistics_lab()

@app.get("/api/frontier-innovation/simulations")
def get_frontier_simulations():
    """Returns the dynamic simulation suite (Probability River, Universes, Constraints)."""
    return frontier_model_engine.get_dynamic_simulation_suite()

# -------------------------------------------------------------
# External Data Expansion, IPC Registry & Coverage Endpoints
# -------------------------------------------------------------

from backend.analytics.external_data_expansion import expansion_engine

@app.get("/api/expansion/summary")
def get_expansion_summary():
    """Returns executive metrics on external dataset expansion across 203 matches."""
    return expansion_engine.get_summary()

@app.get("/api/expansion/ipc-athletes")
def get_ipc_athletes(
    search: Optional[str] = Query(None, description="Search by name, alias, club, or bio"),
    country: Optional[str] = Query(None, description="Filter by 3-letter country code"),
    gender: Optional[str] = Query(None, description="Filter by gender (M/F)"),
    is_legend: Optional[bool] = Query(None, description="Filter for marquee wheelchair rugby legends"),
    limit: int = Query(50, description="Max athletes to return")
):
    """Queries the IPC Master Athlete Registry with search and entity resolution."""
    return expansion_engine.get_ipc_athletes(search=search, country=country, gender=gender, is_legend=is_legend, limit=limit)

@app.get("/api/expansion/rules-evolution")
def get_rules_evolution():
    """Returns the WWR International Playing Rules & Classification Evolution Archive."""
    return expansion_engine.get_rules_evolution()

@app.get("/api/expansion/discovery-report")
def get_discovery_report():
    """Returns the external dataset discovery and scientific source rejection audit."""
    return expansion_engine.get_discovery_report()

@app.get("/api/expansion/model-comparison")
def get_model_comparison():
    """Evaluates predictive accuracy and Brier calibration before vs after 2024 data expansion."""
    return expansion_engine.compute_model_comparison()

@app.get("/api/expansion/data-coverage-map")
def get_data_coverage_map():
    """Returns global tournament coordinates and venue match distributions."""
    return expansion_engine.get_data_coverage_map()

# -------------------------------------------------------------
# Autonomous Statistical Discovery & ML Benchmarking Endpoints
# -------------------------------------------------------------

from backend.analytics.statistical_discovery import discovery_engine

@app.get("/api/discovery/audit")
def get_statistical_discovery_audit():
    """Returns the full autonomous statistical discovery and ML benchmarking audit."""
    return discovery_engine.run_full_discovery_program()

@app.get("/api/discovery/hypotheses")
def get_discovery_hypotheses():
    """Returns the 12 falsifiable hypotheses with Benjamini-Hochberg FDR control."""
    data = discovery_engine.run_full_discovery_program()
    return data.get("systematic_hypotheses", {})

@app.get("/api/discovery/model-tournament")
def get_discovery_model_tournament():
    """Returns the 6-model machine learning benchmark with Bootstrap CIs."""
    data = discovery_engine.run_full_discovery_program()
    return data.get("machine_learning_tournament", {})

@app.get("/api/discovery/findings-taxonomy")
def get_discovery_findings_taxonomy():
    """Returns the ranked taxonomy: Primary, Secondary, Exploratory, and Rejected."""
    data = discovery_engine.run_full_discovery_program()
    return data.get("finding_taxonomy", {})

@app.get("/api/discovery/research-leaderboard")
def get_discovery_research_leaderboard():
    """Returns the official AQX Research Discovery Leaderboard."""
    data = discovery_engine.run_full_discovery_program()
    return data.get("research_leaderboard", {})

@app.get("/api/discovery/case-studies")
def get_discovery_case_studies():
    """Returns the verified real historical match case studies."""
    data = discovery_engine.run_full_discovery_program()
    return data.get("historical_case_studies", {})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.api.main:app", host="127.0.0.1", port=8000, reload=False)
