"""
Automated Test Suite for Frontier Research, Advanced Modeling & Use-Cases
==========================================================================
AQX Sports Analytics Data Bowl 4.0 - MurderBall Intelligence Platform
"""

import os
import sys
import json
import pytest

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from backend.api.main import app, load_all_data
from backend.analytics.frontier_modeling import FrontierModelingEngine

# Ensure data is loaded
load_all_data()

client = TestClient(app)

# -------------------------------------------------------------------------
# 1. Practical Use-Case Inventory Tests
# -------------------------------------------------------------------------

def test_practical_use_case_inventory_coverage():
    """Verify inventory covers 10 distinct user personas with explicit analytical requirements."""
    engine = FrontierModelingEngine()
    inv = engine.get_use_case_inventory()

    assert inv["total_personas_analyzed"] == 10
    personas = inv["personas"]

    required_ids = [
        "USER_HEAD_COACH", "USER_ASSISTANT_COACH", "USER_PERFORMANCE_ANALYST",
        "USER_OPPOSITION_SCOUT", "USER_ATHLETE_DEVELOPMENT", "USER_INDIVIDUAL_ATHLETE",
        "USER_SELECTOR", "USER_TOURNAMENT_ANALYST", "USER_SPORTS_SCIENTIST",
        "USER_CLASSIFICATION_RESEARCHER"
    ]
    for req_id in required_ids:
        p = next((x for x in personas if x["persona_id"] == req_id), None)
        assert p is not None, f"Missing persona: {req_id}"
        assert len(p["real_world_problem"]) > 20
        assert len(p["proposed_solution"]) > 20
        assert len(p["analytical_methods"]) >= 2
        assert "data_limitations" in p
        assert "research_originality" in p

# -------------------------------------------------------------------------
# 2. Bayesian Competing-Risks Possession Model Tests
# -------------------------------------------------------------------------

def test_competing_risks_possession_model():
    """Verify clock-dependent hazard curves and turnover surge under late clock pressure."""
    engine = FrontierModelingEngine()
    model = engine.get_competing_risks_model()

    assert "team_hazard_curves" in model
    curves = model["team_hazard_curves"]

    for team_code in ["USA", "JPN", "AUS", "GBR"]:
        assert team_code in curves
        pts = curves[team_code]["hazard_points"]
        assert len(pts) == 5

        # Verify early clock vs late clock turnover hazard
        early_to = pts[0]["turnover_hazard"]
        late_to = pts[-1]["turnover_hazard"]
        assert late_to > early_to * 3.0, f"Expected turnover hazard surge for {team_code}"
        assert late_to >= 0.20, f"Expected late-clock turnover hazard >= 20% for {team_code}"

        # Verify early clock try hazard is high
        assert pts[0]["try_hazard"] >= 0.25

# -------------------------------------------------------------------------
# 3. Hypergraph Lineup Synergy Decomposition Tests
# -------------------------------------------------------------------------

def test_hypergraph_lineup_synergy_decomposition():
    """Verify non-linear synergy surplus Delta_synergy = NetRating - Sum(RAPM)."""
    engine = FrontierModelingEngine()
    decomp = engine.get_hypergraph_synergy_decomposition()

    lineups = decomp["lineup_synergies"]
    assert len(lineups) >= 4

    # Check Australian Dual High-Pointer lineup
    aus_unit = next(l for l in lineups if l["lineup_id"] == "LINEUP_AUS_DUAL_HIGH")
    assert aus_unit["synergy_surplus"] > 0
    assert aus_unit["p_value_non_linear"] < 0.05
    assert aus_unit["ci_90_surplus"][0] > 0 # Lower bound of surplus > 0

    # Check Japan Lockdown Unit
    jpn_unit = next(l for l in lineups if l["lineup_id"] == "LINEUP_JPN_LOCKDOWN")
    assert jpn_unit["synergy_surplus"] > 0
    assert "KURAHASHI" in str(jpn_unit["athletes"]).upper()
    assert "FUKUSHIMA" not in str(jpn_unit["athletes"]).upper()

# -------------------------------------------------------------------------
# 4. Change-Point Detection (CUSUM & Pettitt Test) Tests
# -------------------------------------------------------------------------

def test_change_point_detection_pettitt_test():
    """Verify distinction between true structural regime shifts and stationary noise."""
    engine = FrontierModelingEngine()
    cp = engine.get_change_point_analytics()

    assert cp["total_runs_analyzed"] == 318
    res = cp["change_point_results"]
    assert res["true_regime_shifts_pct"] < 25.0 # ~19.4%
    assert res["stationary_noise_pct"] > 75.0   # ~80.6%

    # Check timeout effectiveness difference
    assert res["timeout_halt_rate_true_shifts"] > res["timeout_halt_rate_stationary_noise"]
    assert res["timeout_halt_rate_true_shifts"] >= 65.0

    # Check sample cases
    cases = cp["sample_change_point_cases"]
    assert any(c["is_true_change_point"] and c["match_id"] == "PAR24_M20" for c in cases)

# -------------------------------------------------------------------------
# 5. The Most Misleading Statistics Lab Tests
# -------------------------------------------------------------------------

def test_misleading_statistics_lab():
    """Verify empirical contrasts between naive statistics and rigorous modeling."""
    engine = FrontierModelingEngine()
    lab = engine.get_misleading_statistics_lab()

    assert lab["total_studies"] == 4
    studies = lab["studies"]

    # Study 1: Raw Tries vs Assist Blocks
    s1 = next(s for s in studies if s["stat_id"] == "MISLEAD_01_RAW_TRIES")
    assert "28.1%" in s1["visual_contrast"]["rigorous_ab_share_class_0_5"]
    assert "7.6 to 1" in s1["visual_contrast"]["ratio"]

    # Study 2: Raw +/- vs Ridge RAPM
    s2 = next(s for s in studies if s["stat_id"] == "MISLEAD_02_RAW_PLUS_MINUS")
    assert "RAPM" in s2["rigorous_statistic"]

    # Study 3: Small-Sample Win % vs Wilson Shrinkage
    s3 = next(s for s in studies if s["stat_id"] == "MISLEAD_03_SMALL_SAMPLE_LINEUPS")
    assert "[-8.4, +10.4]" in s3["visual_contrast"]["shrunk_confidence_interval"]

# -------------------------------------------------------------------------
# 6. Dynamic Simulation Suite Tests
# -------------------------------------------------------------------------

def test_dynamic_simulation_suite():
    """Verify Probability River, Parallel Universes, and Constraint Playground."""
    engine = FrontierModelingEngine()
    sims = engine.get_dynamic_simulation_suite()

    # 1. Probability River
    river = sims["probability_river"]
    assert len(river) >= 5
    for r in river:
        p_sum = (
            r["p_margin_neg4_or_worse"] + r["p_margin_neg1_to_neg3"] +
            r["p_tie"] + r["p_margin_pos1_to_pos3"] + r["p_margin_pos4_or_more"]
        )
        assert abs(p_sum - 1.0) < 0.05

    # 2. Parallel Universes
    univs = sims["parallel_universes"]
    assert len(univs) >= 3
    assert any("Universe A" in u["label"] for u in univs)
    assert any("ADAM" in str(u["lineup"]).upper() for u in univs)

    # 3. Classification Constraint Playground
    trades = sims["classification_tradeoffs"]
    assert len(trades) >= 3
    assert any("Dual 3.5" in t["base_configuration"] for t in trades)

# -------------------------------------------------------------------------
# 7. REST API Endpoints Tests
# -------------------------------------------------------------------------

def test_frontier_innovation_api_endpoints():
    """Verify all 6 frontier innovation REST endpoints respond with 200."""
    endpoints = [
        "/api/frontier-innovation/use-cases",
        "/api/frontier-innovation/competing-risks",
        "/api/frontier-innovation/hypergraph-synergy",
        "/api/frontier-innovation/change-point",
        "/api/frontier-innovation/misleading-stats",
        "/api/frontier-innovation/simulations"
    ]
    for ep in endpoints:
        res = client.get(ep)
        assert res.status_code == 200, f"Endpoint {ep} failed with status {res.status_code}"
        data = res.json()
        assert len(data) >= 1
