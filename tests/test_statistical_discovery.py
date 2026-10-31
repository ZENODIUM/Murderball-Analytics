"""
Automated Test Suite for Autonomous Statistical Discovery, Machine Learning & Hypothesis Validation
==================================================================================================
AQX Sports Analytics Data Bowl 4.0 - MurderBall Intelligence Platform
"""

import os
import sys
import json
import pytest
from pathlib import Path

# Ensure project root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from backend.api.main import app, load_all_data
from backend.analytics.statistical_discovery import discovery_engine

load_all_data()

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data" / "extracted"

client = TestClient(app)

def test_independent_audit_claims():
    """Verify that prior claims were audited with empirical rigor and skepticism."""
    data = discovery_engine.run_full_discovery_program()
    audit = data.get("independent_audit", {})
    claims = audit.get("audited_claims", [])
    assert len(claims) >= 4

    # Check timeout duality resolution
    to_claim = next((c for c in claims if c["claim_id"] == "AUDIT_02_TIMEOUT_EFFICACY"), None)
    assert to_claim is not None
    assert "TIME-HORIZON DISCREPANCY" in to_claim["independent_verdict"]

    # Check raw plus-minus singularity audit
    pm_claim = next((c for c in claims if c["claim_id"] == "AUDIT_03_RAW_PLUS_MINUS"), None)
    assert pm_claim is not None
    assert "MATHEMATICALLY PROVEN" in pm_claim["independent_verdict"]

    # Check that the nonsignificant dispersion result is stated narrowly.
    disp_claim = next((c for c in claims if c["claim_id"] == "AUDIT_04_LINEUP_DISPERSION_FOLKLORE"), None)
    assert disp_claim is not None
    assert "NO DETECTABLE LINEAR ASSOCIATION" in disp_claim["independent_verdict"]


def test_research_question_universe():
    """Verify research question universe spans all 6 required dimensions."""
    data = discovery_engine.run_full_discovery_program()
    universe = data.get("research_question_universe", {})
    dims = universe.get("dimensions", {})

    expected_dims = [
        "player_performance",
        "lineup_performance",
        "game_strategy",
        "events_and_temporal",
        "competition_and_eras",
        "predictive_research"
    ]
    for ed in expected_dims:
        assert ed in dims, f"Missing dimension {ed}"
        assert len(dims[ed]) >= 4, f"Dimension {ed} has fewer than 4 questions"


def test_fdr_hypotheses_and_multiple_testing_control():
    """Verify 12 falsifiable hypotheses with Benjamini-Hochberg FDR control."""
    data = discovery_engine.run_full_discovery_program()
    hypo_data = data.get("systematic_hypotheses", {})

    assert hypo_data["total_hypotheses_tested"] == 12
    assert hypo_data["fdr_q_level"] == 0.05
    assert hypo_data["statistically_significant_count"] == 8
    assert hypo_data["null_or_inconclusive_count"] == 4

    hypotheses = hypo_data.get("hypotheses", [])
    assert len(hypotheses) == 12

    # Check flagship H01 (0.5 screener)
    h01 = next((h for h in hypotheses if h["id"] == "H01_LOW_POINT_SCREENER_ASYMMETRY"), None)
    assert h01 is not None
    assert h01["survives_fdr_q05"] is True
    assert h01["survives_bonferroni"] is True
    assert h01["raw_p_value"] < 1e-200

    # Check H04 (Dispersion): Must be recognized as authentic null finding
    h04 = next((h for h in hypotheses if h["id"] == "H04_LINEUP_CLASSIFICATION_DISPERSION"), None)
    assert h04 is not None
    assert h04["survives_fdr_q05"] is False
    assert h04["raw_p_value"] > 0.50

    # Check H06 (3-possession timeout): Must be recognized as authentic null finding
    h06 = next((h for h in hypotheses if h["id"] == "H06_TIMEOUT_SUSTAINED_3_POSSESSION_EFFECT"), None)
    assert h06 is not None
    assert h06["survives_fdr_q05"] is False
    assert h06["raw_p_value"] > 0.50


def test_machine_learning_model_tournament():
    """Verify 6-model comparison on the reused 2026 evaluation cohort."""
    data = discovery_engine.run_full_discovery_program()
    tournament = data.get("machine_learning_tournament", {})

    models = tournament.get("candidate_models", [])
    assert len(models) == 6

    # Verify model ranking: lowest Brier score first
    brier_scores = [m["metrics"]["brier_score"] for m in models]
    assert brier_scores == sorted(brier_scores)

    # The reconstructed-rank baseline has the lowest observed Brier score.
    winner = tournament["tournament_winner"]
    assert winner["model_name"] == "Seed/Favorite Baseline"
    assert winner["brier_score"] == 0.1177
    assert tournament["evaluation_design"] == "RETROSPECTIVE_REUSED_COHORT"

    # Over-parameterized trees should have higher Brier score than regularized linear
    rf_model = next((m for m in models if "Random Forest" in m["name"]), None)
    grad_model = next((m for m in models if "Gradient Boosted" in m["name"]), None)
    assert rf_model["metrics"]["brier_score"] > winner["brier_score"]
    assert grad_model["metrics"]["brier_score"] > winner["brier_score"]


def test_scoring_run_poisson_deviation():
    """Verify scoring run clustering rejects memoryless geometric null distribution."""
    data = discovery_engine.run_full_discovery_program()
    temporal = data.get("temporal_and_events", {})
    run_dist = temporal.get("run_length_distribution", {})
    null_test = run_dist.get("poisson_geometric_null_test", {})

    assert null_test["verdict"] == "REJECTED (p < 0.0001)"
    assert null_test["chi2_statistic"] > 50.0
    assert null_test["p_value"] < 1e-10


def test_finding_taxonomy_ranking():
    """Verify finding taxonomy categorizes Primary, Secondary, Exploratory, and Rejected."""
    data = discovery_engine.run_full_discovery_program()
    tax = data.get("finding_taxonomy", {})

    assert "primary_research_contribution" in tax
    assert "secondary_discoveries" in tax
    assert "exploratory_findings" in tax
    assert "rejected_hypotheses" in tax

    assert len(tax["secondary_discoveries"]) >= 3
    assert len(tax["rejected_hypotheses"]) >= 3


def test_rest_api_discovery_endpoints():
    """Verify all 4 new statistical discovery REST endpoints return 200."""
    # 1. Full Audit
    res = client.get("/api/discovery/audit")
    assert res.status_code == 200
    data = res.json()
    assert data["metadata"]["total_matches_analyzed"] == 203

    # 2. Hypotheses with FDR
    res = client.get("/api/discovery/hypotheses")
    assert res.status_code == 200
    h_data = res.json()
    assert h_data["total_hypotheses_tested"] == 12

    # 3. Model Tournament
    res = client.get("/api/discovery/model-tournament")
    assert res.status_code == 200
    t_data = res.json()
    assert len(t_data["candidate_models"]) == 6

    # 4. Findings Taxonomy
    res = client.get("/api/discovery/findings-taxonomy")
    assert res.status_code == 200
    tax_data = res.json()
    assert "primary_research_contribution" in tax_data
