"""
Automated Test Suite for Frontier Tactical Intelligence & Decision Mirror
=========================================================================
AQX Sports Analytics Data Bowl 4.0 - MurderBall Wheelchair Rugby Intelligence
"""

import os
import sys
import json
import pytest

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from backend.api.main import app, load_all_data

# Ensure data is loaded
load_all_data()

client = TestClient(app)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def test_decision_mirror_database_integrity():
    path = os.path.join(BASE_DIR, "data", "extracted", "decision_mirror_database.json")
    assert os.path.exists(path), f"Decision mirror database missing at {path}"
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert "decisions" in data
    decisions = data["decisions"]
    assert len(decisions) >= 30, f"Expected >= 30 decisions, got {len(decisions)}"

    # Check first decision structure
    d = decisions[0]
    required_keys = [
        "decision_id", "match_id", "tournament", "period", "clock", "team",
        "score_at_decision", "decision_type", "prior_120s_context",
        "observed_subsequent_120s_outcome", "alternatives_evaluated"
    ]
    for k in required_keys:
        assert k in d, f"Missing key {k} in decision"

    # Check counterfactual alternatives
    alts = d["alternatives_evaluated"]
    assert len(alts) >= 1
    for alt in alts:
        assert "player_names" in alt
        assert "classes" in alt
        assert "total_points" in alt
        assert "modeled_120s_margin_mean" in alt
        assert "modeled_120s_margin_ci90" in alt
        assert len(alt["modeled_120s_margin_ci90"]) == 2

def test_frontier_intelligence_payload_integrity():
    path = os.path.join(BASE_DIR, "data", "extracted", "frontier_intelligence.json")
    assert os.path.exists(path), f"Frontier intelligence payload missing at {path}"
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    required_sections = [
        "scoring_pressure_atlas",
        "momentum_microscope",
        "lineup_constellation",
        "ruleshift_lab",
        "player_archetypes",
        "confidence_frontier"
    ]
    for sec in required_sections:
        assert sec in data, f"Missing section {sec} in frontier intelligence"

def test_scoring_pressure_atlas():
    path = os.path.join(BASE_DIR, "data", "extracted", "frontier_intelligence.json")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    atlas = data["scoring_pressure_atlas"]
    assert len(atlas) == 85, f"Expected 85 cells (5 periods x 17 margins), got {len(atlas)}"
    for cell in atlas:
        assert 1 <= cell["period"] <= 5
        assert -8 <= cell["score_margin"] <= 8
        assert 0.0 <= cell["p_team_a_scores_next"] <= 1.0
        assert 0.0 <= cell["turnover_hazard_rate"] <= 1.0

def test_momentum_microscope_runs():
    path = os.path.join(BASE_DIR, "data", "extracted", "frontier_intelligence.json")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    momentum = data["momentum_microscope"]
    assert momentum["total_scoring_runs"] > 50
    assert "runs_with_conceding_timeout_pct" in momentum
    assert len(momentum["sample_runs"]) > 0

def test_ruleshift_combinatorics():
    path = os.path.join(BASE_DIR, "data", "extracted", "frontier_intelligence.json")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    ruleshift = data["ruleshift_lab"]
    evals = ruleshift["roster_evaluations"]
    assert len(evals) >= 40, f"Expected >= 40 evaluations, got {len(evals)}"

    # Check that 2024 female bonus allows >= 2004 legacy cap
    for ev in evals:
        cur_legal = ev["ruleset_breakdown"]["current_2024"]["legal_lineups_count"]
        leg_legal = ev["ruleset_breakdown"]["legacy_2004"]["legal_lineups_count"]
        assert cur_legal >= leg_legal, f"Current legal {cur_legal} < legacy {leg_legal} for {ev['team_code']}"

def test_player_archetypes_clustering():
    path = os.path.join(BASE_DIR, "data", "extracted", "frontier_intelligence.json")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    arch = data["player_archetypes"]
    assert len(arch["archetypes"]) == 5
    profiles = arch["profiles"]
    assert len(profiles) > 100, f"Expected > 100 player profiles, got {len(profiles)}"

    for p in profiles[:10]:
        assert "name" in p
        assert "team" in p
        assert "pca_x" in p
        assert "pca_y" in p
        assert "radar" in p
        for r_dim in ["scoring_thrust", "chair_screening", "defensive_disruption", "ball_security", "minutes_gravity"]:
            assert r_dim in p["radar"]
            assert 0 <= p["radar"][r_dim] <= 100

def test_lineup_confidence_frontier():
    path = os.path.join(BASE_DIR, "data", "extracted", "frontier_intelligence.json")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    frontier = data["confidence_frontier"]
    lineups = frontier["lineups"]
    assert len(lineups) >= 100
    assert frontier["pareto_optimal_count"] >= 3

    for l in lineups[:10]:
        assert len(l["player_names"]) == 4
        assert "net_per_100s" in l
        assert "court_seconds" in l
        assert "ci_90" in l
        assert len(l["ci_90"]) == 2
        assert l["ci_90"][0] <= l["ci_90"][1]

def test_api_intelligence_endpoints():
    # 1. Decision Mirror list
    res = client.get("/api/intelligence/decision-mirror?limit=5")
    assert res.status_code == 200
    json_data = res.json()
    assert "decisions" in json_data
    assert len(json_data["decisions"]) == 5
    sample_id = json_data["decisions"][0]["decision_id"]

    # 2. Decision Mirror item
    res_item = client.get(f"/api/intelligence/decision-mirror/{sample_id}")
    assert res_item.status_code == 200
    assert res_item.json()["decision_id"] == sample_id

    # 3. Pressure Atlas
    res_atlas = client.get("/api/intelligence/pressure-atlas?period=4")
    assert res_atlas.status_code == 200
    assert res_atlas.json()["total_cells"] == 17

    # 4. Momentum
    res_mom = client.get("/api/intelligence/momentum")
    assert res_mom.status_code == 200
    assert "total_scoring_runs" in res_mom.json()

    # 5. Constellation
    res_const = client.get("/api/intelligence/constellation?team=AUS")
    assert res_const.status_code == 200
    assert res_const.json()["nodes_count"] > 0

    # 6. RuleShift
    res_rule = client.get("/api/intelligence/ruleshift?team_code=AUS")
    assert res_rule.status_code == 200
    assert res_rule.json()["total_evaluations"] > 0

    # 7. Archetypes
    res_arch = client.get("/api/intelligence/archetypes?archetype_id=apex_carrier")
    assert res_arch.status_code == 200
    assert res_arch.json()["total_profiles"] > 0

    # 8. Confidence Frontier
    res_front = client.get("/api/intelligence/confidence-frontier?pareto_only=true")
    assert res_front.status_code == 200
    assert res_front.json()["total_lineups"] >= 3
