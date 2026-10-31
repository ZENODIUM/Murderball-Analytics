"""
Automated Test Suite for Living Sports Intelligence & Continuous Model Evolution
================================================================================
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
from backend.models.living_intelligence_engine import LivingIntelligenceEngine

# Ensure data is loaded
load_all_data()

client = TestClient(app)

# -------------------------------------------------------------------------
# 1. Source Discovery Registry & Tiered Coverage Tests
# -------------------------------------------------------------------------

def test_source_discovery_registry_and_coverage_tiers():
    """Verify source registry covers official publishers with explicit coverage tiers."""
    engine = LivingIntelligenceEngine()
    reg = engine.get_source_registry()

    assert reg["total_sources"] >= 10
    sources = reg["sources"]

    # Check key official publishers
    publishers = [s["publisher"] for s in sources]
    assert any("World Wheelchair Rugby" in p for p in publishers)
    assert any("Japan Wheelchair Rugby Federation" in p for p in publishers)
    assert any("USA Wheelchair Rugby" in p for p in publishers)
    assert any("Wheelchair Rugby Canada" in p for p in publishers)
    assert any("International Paralympic Committee" in p for p in publishers)

    # Check coverage tiers are defined
    tiers = reg["coverage_tiers"]
    assert "TIER_1" in tiers
    assert "TIER_2" in tiers
    assert "TIER_6" in tiers

    # Check 2026 World Championship tier boundary (Tier 2 only)
    wc26 = next(s for s in sources if s["source_id"] == "SRC_WWR_WC2026")
    assert wc26["data_completeness_tier"] == "TIER_2"
    assert wc26["ingestion_status"] == "APPROVED"
    assert "no play-by-play" in wc26["notes"].lower()

# -------------------------------------------------------------------------
# 2. 2026 WWR World Championship Out-of-Time Independent Validation Tests
# -------------------------------------------------------------------------

def test_2026_world_championship_out_of_time_evaluation():
    """Verify out-of-time evaluation on 2026 World Championship strictly prevents data leakage."""
    engine = LivingIntelligenceEngine()
    eval_res = engine.evaluate_2026_world_championship_out_of_time()

    assert eval_res["sample_size_matches"] >= 16
    assert eval_res["temporal_cutoff"] == "September 2024 (Paris 2024 Paralympics)"

    # Data leakage check
    leakage_notes = " ".join(eval_res["data_leakage_prevented"])
    assert "Rankings were NOT used" in leakage_notes
    assert "Tier 2" in leakage_notes

    # Performance metrics on genuine official match observations
    assert eval_res["champion_accuracy_pct"] >= 70.0
    assert eval_res["champion_mean_brier"] < eval_res["naive_baseline_brier"]
    assert eval_res["brier_improvement_over_baseline"] > 0.0

    # Check Gold Medal Game (USA 57 - 51 AUS)
    gold = eval_res["gold_medal_evaluation"]
    assert gold is not None
    assert gold["actual_winner"] == "USA"
    assert gold["final_score"] == "57 - 51"
    assert gold["predicted_winner"] == "USA"
    assert gold["predicted_win_prob_a"] > 0.50
    assert gold["winner_correct"] is True

# -------------------------------------------------------------------------
# 3. Prediction Time Machine (Pre-Match Freezing) Tests
# -------------------------------------------------------------------------

def test_prediction_time_machine_freezing():
    """Verify predictions are frozen with pre-match features, immutable timestamps, and uncertainty."""
    engine = LivingIntelligenceEngine()

    pred = engine.freeze_pre_match_prediction(
        match_id="FUTURE_MATCH_2026_01",
        team_a="USA",
        team_b="AUS",
        model_version="v1.0.0-paralympic-logistic",
        custom_notes="Pre-match test forecast"
    )

    assert pred["prediction_id"].startswith("PRED_FUTURE_MATCH_2026_01")
    assert pred["evaluation_status"] == "FROZEN_PENDING_OUTCOME"
    assert pred["team_a"] == "USA"
    assert pred["team_b"] == "AUS"
    assert pred["predicted_win_probability_a"] > 0.50
    assert len(pred["uncertainty_factors"]) >= 2
    assert "ci_90_spread" in pred
    assert pred["feature_snapshot"]["historical_h2h_matches_considered"] == 120

# -------------------------------------------------------------------------
# 4. Model Registry & Champion vs Challenger Evaluation Tests
# -------------------------------------------------------------------------

def test_model_registry_champion_challenger():
    """Verify Champion vs Challenger evaluation rules and statistical parsimony."""
    engine = LivingIntelligenceEngine()
    reg = engine.get_model_registry()

    assert reg["current_champion"] == "v1.0.0-paralympic-logistic"
    models = reg["models"]
    assert len(models) >= 3

    # Test Challenger 1 (Hierarchical Bayes): Out-of-time Brier did not improve with p < 0.05
    res1 = engine.evaluate_challenger_promotion("v2.0.0-hierarchical-bayes")
    assert res1["promotion_verdict"] == "REJECTED_RETAIN_CHAMPION"
    assert res1["brier_delta"] > 0.0 # Worse Brier

    # Test Challenger 2 (Ridge RAPM Hybrid): Ineligible for global promotion due to Tier 6 data requirements
    res2 = engine.evaluate_challenger_promotion("v2.1.0-ridge-rapm-hybrid")
    assert res2["promotion_verdict"] == "INELIGIBLE_FOR_GLOBAL_PROMOTION"
    assert "Tier 6" in res2["explanation"]

# -------------------------------------------------------------------------
# 5. Model Drift Observatory Tests
# -------------------------------------------------------------------------

def test_model_drift_observatory():
    """Verify distribution shifts across eras and tactical feature drift tracking."""
    engine = LivingIntelligenceEngine()
    drift = engine.get_drift_metrics()

    assert len(drift["era_shifts"]) >= 4
    # Verify scoring velocity trend: 78.4 -> 103.5
    eras = drift["era_shifts"]
    assert eras[0]["mean_tries_per_game"] < eras[-1]["mean_tries_per_game"]

    # Verify turnover rate trend: 14.2% -> 8.9%
    assert eras[0]["turnover_rate_pct"] > eras[-1]["turnover_rate_pct"]

    # Verify drift signals
    signals = drift["drift_signals"]
    assert any(s["feature"] == "tries_per_game" for s in signals)
    assert any(s["feature"] == "turnovers_per_game" for s in signals)
    assert any(s["feature"] == "average_winning_margin" for s in signals)

# -------------------------------------------------------------------------
# 6. Future Competitions & Inaugural Women's World Championship Research
# -------------------------------------------------------------------------

def test_future_competitions_and_womens_championship():
    """Verify future competition calendar and Women's World Championship cold-start dossier."""
    engine = LivingIntelligenceEngine()
    comp = engine.get_future_competitions()

    events = comp["upcoming_events"]
    assert len(events) >= 3

    # Find Women's World Championship
    womens_event = next(e for e in events if e["event_id"] == "EVT_WWR_WOMEN_2026")
    assert womens_event["status"] == "CONFIRMED_UPCOMING"
    assert womens_event["host_city"] == "Paris"

    dossier = womens_event["special_research_dossier"]
    assert "Cold-Start" in dossier["analytical_challenge"]
    assert "Sarah Adam" in str(dossier["standout_athletes_to_watch"])
    assert "REFUSES to generate overconfident" in dossier["epistemic_recommendation"]

# -------------------------------------------------------------------------
# 7. Autonomous Research Watchtower Tests
# -------------------------------------------------------------------------

def test_research_watchtower_proposals():
    """Verify autonomous monitoring agent flags anomalous outcomes and structures experiments."""
    engine = LivingIntelligenceEngine()
    watch = engine.get_watchtower_proposals()

    assert watch["active_proposals_count"] >= 3
    proposals = watch["proposals"]

    # Check USA rebound proposal
    prop_usa = next(p for p in proposals if p["proposal_id"] == "WATCH_2026_01")
    assert "USA" in prop_usa["title"]
    assert len(prop_usa["required_analytical_tools"]) >= 2
    assert "uncertainty_rating" in prop_usa

# -------------------------------------------------------------------------
# 8. Human-Verified Correction System Tests
# -------------------------------------------------------------------------

def test_human_correction_system():
    """Verify human corrections are logged with provenance and dependency tracking."""
    engine = LivingIntelligenceEngine()

    # Retrieve pre-seeded corrections
    corr_log = engine.get_human_corrections()
    assert corr_log["total_corrections"] >= 2

    # Submit new correction
    res = engine.submit_human_correction(
        target_match_id="PAR24_M20",
        field_corrected="chair_contact_timestamp",
        original_value="Q4 4:12 Fukushima contact recorded at 4720s",
        updated_value="Reconciled to 4728s based on arena shot clock pause",
        evidence_source="Official IPC Video Broadcast Frame 141840",
        reviewer_name="Dr. Eleanor Vance (AQX Research Judge)"
    )
    assert res["status"] == "RECORDED"
    assert res["correction"]["target_match_id"] == "PAR24_M20"
    assert "all_stints.json" in res["correction"]["affected_analyses"]

# -------------------------------------------------------------------------
# 9. REST API Endpoints Tests
# -------------------------------------------------------------------------

def test_living_intelligence_api_endpoints():
    """Verify all living intelligence endpoints return status 200 with schema compliance."""
    # 1. Sources Endpoint
    r_src = client.get("/api/living/sources")
    assert r_src.status_code == 200
    assert r_src.json()["total_sources"] >= 10

    # 2. Freeze Prediction Endpoint
    r_freeze = client.post("/api/living/freeze-prediction", json={
        "match_id": "TEST_LA28_01",
        "team_a": "USA",
        "team_b": "JPN",
        "model_version": "v1.0.0-paralympic-logistic",
        "custom_notes": "API freeze test"
    })
    assert r_freeze.status_code == 200
    assert r_freeze.json()["evaluation_status"] == "FROZEN_PENDING_OUTCOME"

    # 3. 2026 Evaluation Endpoint
    r_eval = client.get("/api/living/evaluation-2026")
    assert r_eval.status_code == 200
    assert r_eval.json()["sample_size_matches"] >= 16

    # 4. Models Endpoint
    r_mod = client.get("/api/living/models")
    assert r_mod.status_code == 200
    assert r_mod.json()["current_champion"] == "v1.0.0-paralympic-logistic"

    # 5. Evaluate Challenger Endpoint
    r_chal = client.post("/api/living/evaluate-challenger", json={"challenger_id": "v2.0.0-hierarchical-bayes"})
    assert r_chal.status_code == 200
    assert r_chal.json()["promotion_verdict"] == "REJECTED_RETAIN_CHAMPION"

    # 6. Drift Metrics Endpoint
    r_drift = client.get("/api/living/drift-metrics")
    assert r_drift.status_code == 200
    assert len(r_drift.json()["era_shifts"]) >= 4

    # 7. Competitions Endpoint
    r_comp = client.get("/api/living/competitions")
    assert r_comp.status_code == 200
    assert len(r_comp.json()["upcoming_events"]) >= 3

    # 8. Watchtower Endpoint
    r_watch = client.get("/api/living/watchtower-proposals")
    assert r_watch.status_code == 200
    assert r_watch.json()["active_proposals_count"] >= 3

    # 9. Corrections Endpoints
    r_corr = client.get("/api/living/corrections")
    assert r_corr.status_code == 200
    assert r_corr.json()["total_corrections"] >= 2

    r_sub = client.post("/api/living/submit-correction", json={
        "target_match_id": "PAR24_M01",
        "field_corrected": "test_field",
        "original_value": "old_val",
        "updated_value": "new_val",
        "evidence_source": "test_source",
        "reviewer_name": "Test Reviewer"
    })
    assert r_sub.status_code == 200
    assert r_sub.json()["status"] == "RECORDED"
