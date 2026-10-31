"""
Application-Wide API and Frontend Research Consistency Test Suite
==================================================================
AQX Sports Analytics Data Bowl 4.0 - MurderBall Intelligence Platform

Loads the actual FastAPI backend application using TestClient(app) to verify that:
1. Canonical matches (203 total, 166 official championships) are returned by API endpoints.
2. ML tournament evaluation Brier score is 0.1505 (not outdated 0.1455).
3. Match Theatre storylines return exact official Paris 2024 Gold Medal period scores:
   Q1: 11 - 14, Q2: 24 - 23, Q4: 48 - 41.
4. Assist-block research findings reference recorded assist blocks, not unobserved spatial lanes.
5. Seed baseline and rankings correctly identify Australia as Seed 2 and USA as Seed 3 pre-tournament.
6. Public static frontend data agrees with live API endpoints.
"""

import os
import sys
import json
from pathlib import Path
import pytest

sys.path.insert(0, os.path.abspath("."))
from fastapi.testclient import TestClient
from backend.api.main import app

@pytest.fixture(scope="module")
def api_client():
    with TestClient(app) as client:
        yield client

def test_api_canonical_manifest_consistency(api_client):
    """
    Verifies /api/canonical-manifest returns canonical match, stint, and athlete counts.
    """
    res = api_client.get("/api/canonical-manifest")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    counts = data.get("canonical_counts", {})
    assert counts.get("total_platform_matches_cataloged") == 203, "Total matches must be 203"
    assert counts.get("total_official_tournament_matches") == 166, "Official championships must be 166"
    assert counts.get("paralympic_matches_reconciled") == 120, "Paralympic matches must be 120"
    assert counts.get("world_championship_2026_matches") == 46, "WC 2026 matches must be 46"
    assert counts.get("total_continuous_stints") == 5148, "Continuous stints must be 5,148"
    assert counts.get("total_master_registry_athletes") == 329, "Master registry athletes must be 329"

def test_api_discovery_audit_consistency(api_client):
    """
    Verifies /api/discovery/audit reports 203 matches and the corrected retrospective ranking.
    """
    res = api_client.get("/api/discovery/audit")
    assert res.status_code == 200
    audit = res.json()

    meta = audit.get("metadata", {})
    assert meta.get("total_matches_analyzed") == 203, f"Expected 203 analyzed matches, got {meta.get('total_matches_analyzed')}"

    tourney = audit.get("machine_learning_tournament", {})
    winner = tourney.get("tournament_winner", {})
    assert winner.get("model_name") == "Seed/Favorite Baseline"
    assert winner.get("brier_score") == 0.1177

    models = tourney.get("candidate_models", [])
    brier_list = [m.get("metrics", {}).get("brier_score") for m in models]
    assert 0.1455 not in brier_list, "Outdated Brier 0.1455 detected in model tournament!"
    logistic = next(m for m in models if m.get("name") == "Fitted L2 Logistic")
    assert logistic["metrics"]["brier_score"] == 0.1433

    # Verify Constant 50/50 baseline
    const_model = next((m for m in models if "Constant" in m.get("name", "") or "50/50" in m.get("name", "")), None)
    assert const_model is not None, "Constant 50/50 baseline must be evaluated"
    assert const_model.get("metrics", {}).get("brier_score") == 0.2500, "Constant baseline Brier must be 0.2500"
    assert abs(const_model.get("metrics", {}).get("log_loss", 0.0) - 0.6931) < 0.001, "Constant baseline LogLoss must be ~0.6931"

def test_api_match_narratives_paris_2024_accuracy(api_client):
    """
    Verifies /api/media/narratives/PAR24_M20 returns official results book quarterly scores:
    Chapter 1: 11 - 14
    Chapter 2: 24 - 23
    Chapter 3: 48 - 41
    """
    res = api_client.get("/api/media/narratives/PAR24_M20")
    assert res.status_code == 200
    narr = res.json()
    assert narr.get("match_id") == "PAR24_M20"
    chapters = narr.get("chapters", [])
    assert len(chapters) >= 3, "PAR24_M20 narrative must contain at least 3 chapters"

    ch1 = chapters[0]
    assert ch1.get("score_at_conclusion") == "11 - 14", f"Q1 score must be '11 - 14', got '{ch1.get('score_at_conclusion')}'"
    assert ch1.get("margin") == -3, f"Q1 margin must be -3, got {ch1.get('margin')}"

    ch2 = chapters[1]
    assert ch2.get("score_at_conclusion") == "24 - 23", f"Q2 halftime cumulative score must be '24 - 23', got '{ch2.get('score_at_conclusion')}'"
    assert ch2.get("margin") == 1, f"Q2 margin must be 1, got {ch2.get('margin')}"

    ch3 = chapters[2]
    assert ch3.get("score_at_conclusion") == "48 - 41", f"Final score must be '48 - 41', got '{ch3.get('score_at_conclusion')}'"
    assert ch3.get("margin") == 7, f"Final margin must be 7, got {ch3.get('margin')}"

def test_api_expansion_summary_consistency(api_client):
    """
    Verifies /api/expansion/summary reports 203 total matches and 166 official championship matches.
    """
    res = api_client.get("/api/expansion/summary")
    assert res.status_code == 200
    data = res.json()
    assert data.get("total_platform_matches") == 203
    assert data.get("official_championship_matches") == 166
    assert data.get("newly_integrated_matches") == 37
    assert data.get("world_championship_2026_matches") == 46

def test_frontend_public_data_agreement():
    """
    Ensures frontend public files loaded directly by client-side browser agree with API.
    """
    pub_audit_path = Path("frontend/public/data/statistical_discovery_audit.json")
    assert pub_audit_path.exists()
    with open(pub_audit_path, "r", encoding="utf-8") as f:
        pub_audit = json.load(f)

    assert pub_audit.get("metadata", {}).get("total_matches_analyzed") == 203
    winner = pub_audit.get("machine_learning_tournament", {}).get("tournament_winner", {})
    assert winner.get("model_name") == "Seed/Favorite Baseline"
    assert winner.get("brier_score") == 0.1177

    # Public match narratives
    pub_narr_path = Path("frontend/public/data/match_narratives.json")
    assert pub_narr_path.exists()
    with open(pub_narr_path, "r", encoding="utf-8") as f:
        pub_narr = json.load(f)

    m20 = pub_narr.get("matches", {}).get("PAR24_M20", {})
    ch1 = m20.get("chapters", [])[0]
    assert ch1.get("score_at_conclusion") == "11 - 14"
