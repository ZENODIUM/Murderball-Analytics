import json
import pytest
import os
import sys

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.analytics.lineup_optimizer import LineupOptimizer
from backend.analytics.predictive_models import NextScorePredictor, MonteCarloMatchSimulator
from fastapi.testclient import TestClient
from backend.api.main import app, load_all_data

# =====================================================================
# 1. DATA QUALITY & RECONCILIATION TESTS
# =====================================================================

def test_data_quality_reconciliation():
    with open("data/extracted/data_quality_report.json", "r", encoding="utf-8") as f:
        report = json.load(f)

    assert report["paralympic_matches_expected"] == 120
    assert report["paralympic_matches_extracted"] == 120
    assert report["score_reconciled_count"] == 120
    assert report["score_reconciliation_rate"] == 1.0, "Score reconciliation rate must be 100.0%"
    assert report["total_lineup_stints_reconstructed"] >= 5000
    assert report["total_play_by_play_events"] >= 25000
    assert report["total_championship_summary_matches"] == 112


def test_benchmark_paris_2024_match_1():
    """Verify Paris 2024 Match 1: Australia 55, Great Britain 58; exactly 113 scoring events."""
    with open("data/extracted/matches/PAR24_M01.json", "r", encoding="utf-8") as f:
        m = json.load(f)

    assert m["official_score_a"] == 55
    assert m["official_score_b"] == 58
    assert m["team_a_code"] == "AUS"
    assert m["team_b_code"] == "GBR"

    scoring = [e for e in m["events"] if e["event_type"] in ["TRY", "PENALTY_TRY"]]
    assert len(scoring) == 113, f"Expected exactly 113 scoring events, found {len(scoring)}"

    # Exactly 23 paired substitutions
    subs = [e for e in m["events"] if e["event_type"] == "SUBSTITUTION"]
    assert len(subs) == 23, f"Expected exactly 23 substitutions, found {len(subs)}"

    # Score reconciliation check
    assert m["validation"]["score_reconciled"] is True


def test_benchmark_tokyo_2020_match_1():
    """Verify Tokyo 2020 Match 1: USA 63, New Zealand 35; exactly 98 scoring events."""
    with open("data/extracted/matches/TKY20_M01.json", "r", encoding="utf-8") as f:
        m = json.load(f)

    assert m["official_score_a"] == 63
    assert m["official_score_b"] == 35
    assert m["team_a_code"] == "USA"
    assert m["team_b_code"] == "NZL"

    scoring = [e for e in m["events"] if e["event_type"] in ["TRY", "PENALTY_TRY"]]
    assert len(scoring) == 98, f"Expected exactly 98 scoring events, found {len(scoring)}"
    assert m["validation"]["score_reconciled"] is True


# =====================================================================
# 2. ROSTER INTEGRITY TESTS
# =====================================================================

def test_roster_integrity():
    with open("data/extracted/all_paralympic_rosters.json", "r", encoding="utf-8") as f:
        rosters = json.load(f)

    assert len(rosters) == 6, "Must contain all 6 Paralympic tournaments"
    total_teams = 0
    total_athletes = 0

    for tourn, teams in rosters.items():
        for tm_code, data in teams.items():
            total_teams += 1
            players = data.get("players", [])
            assert len(players) >= 8, f"{tm_code} at {tourn} has fewer than 8 players"
            total_athletes += len(players)
            for p in players:
                assert "bib" in p
                assert "sport_class" in p
                assert 0.5 <= p["sport_class"] <= 3.5, f"Invalid class {p['sport_class']} for {p['name']}"
                assert p["gender"] in ["M", "F"]

    assert total_teams == 48, f"Expected 48 national team rosters, found {total_teams}"


# =====================================================================
# 3. CP-SAT LINEUP OPTIMIZER LEGALITY TESTS
# =====================================================================

def test_cpsat_optimizer_legality():
    optimizer = LineupOptimizer()
    aus_roster = optimizer.get_team_roster("Paris 2024", "AUS")
    assert len(aus_roster) >= 8

    # Solve with standard balanced mode
    solutions = optimizer.optimize_lineup(
        aus_roster,
        max_base_points=8.0,
        female_allowance_per_player=0.5,
        objective_mode="BALANCED",
        top_k=3
    )

    assert len(solutions) >= 1
    for sol in solutions:
        assert len(sol["players"]) == 4, "Every lineup must contain exactly 4 athletes"
        females = sol["female_count"]
        allowed_cap = 8.0 + females * 0.5
        assert sol["total_classification_points"] <= allowed_cap + 1e-5, f"Lineup exceeded allowed cap: {sol['total_classification_points']} > {allowed_cap}"
        assert sol["legal"] is True


def test_cpsat_optimizer_forced_inclusion():
    optimizer = LineupOptimizer()
    aus_roster = optimizer.get_team_roster("Paris 2024", "AUS")

    # Force bib 3 (Ryley Batt, 3.5) to be locked in
    solutions = optimizer.optimize_lineup(
        aus_roster,
        max_base_points=8.0,
        female_allowance_per_player=0.5,
        locked_in_bibs=[3],
        top_k=2
    )

    assert len(solutions) >= 1
    for sol in solutions:
        assert 3 in sol["bibs"], "Forced player #3 must be present in every generated lineup"
        assert sol["legal"] is True


# =====================================================================
# 4. PREDICTIVE MODELS & ELO TESTS
# =====================================================================

def test_chronological_elo_ratings():
    with open("data/extracted/historical_elo_ratings.json", "r", encoding="utf-8") as f:
        elo_data = json.load(f)

    ratings = elo_data["latest_ratings"]
    assert "USA" in ratings
    assert "JPN" in ratings
    assert "AUS" in ratings
    assert "GBR" in ratings

    # Elite teams should have Elo >= 1600
    assert ratings["USA"] >= 1600
    assert ratings["JPN"] >= 1600


def test_monte_carlo_simulator_bounds():
    predictor = NextScorePredictor()
    simulator = MonteCarloMatchSimulator(predictor)

    sim = simulator.simulate_continuation(
        current_period=4,
        clock_remaining_seconds=60,
        score_a=50,
        score_b=45,
        elo_diff_a=50.0,
        iterations=100
    )

    assert 0.0 <= sim["win_probability_a"] <= 1.0
    assert 0.0 <= sim["win_probability_b"] <= 1.0
    assert abs(sim["win_probability_a"] + sim["win_probability_b"] - 1.0) < 0.05
    # Team with 5-point lead with 1 min remaining should have win prob > 0.85
    assert sim["win_probability_a"] >= 0.85


# =====================================================================
# 5. RESEARCH FINDINGS INTEGRITY TESTS
# =====================================================================

def test_research_findings_portfolio():
    with open("data/extracted/research_findings.json", "r", encoding="utf-8") as f:
        rf = json.load(f)

    assert len(rf["hypotheses"]) == 5
    h1 = rf["hypotheses"][0]
    assert h1["hypothesis_id"] == "H1_LOW_POINT_SCREENERS"
    assert h1["flagship"] is True
    # 0.5 try share ~0.1%, block share ~28.1%
    metrics = h1["metrics"]
    assert metrics["class_0_5_try_share"] <= 0.01
    assert metrics["class_0_5_block_share"] >= 0.25
    assert h1["p_value"] < 0.001


# =====================================================================
# 6. FASTAPI API TESTCLIENT ENDPOINTS
# =====================================================================

def test_api_endpoints():
    load_all_data()
    client = TestClient(app)

    # Health
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"
    assert r.json()["paralympic_matches_loaded"] == 120

    # Tournaments
    r = client.get("/api/tournaments")
    assert r.status_code == 200
    assert len(r.json()) == 10

    # Matches filter
    r = client.get("/api/matches?tournament=Tokyo%202020")
    assert r.status_code == 200
    assert r.json()["total_matching"] == 18

    # Match detail
    r = client.get("/api/matches/PAR24_M01")
    assert r.status_code == 200
    assert r.json()["match_id"] == "PAR24_M01"

    # Solver endpoint
    r = client.post("/api/optimize", json={
        "tournament": "Paris 2024",
        "team_code": "AUS",
        "objective_mode": "BALANCED",
        "top_k": 2
    })
    assert r.status_code == 200
    assert r.json()["solutions_found"] >= 1
