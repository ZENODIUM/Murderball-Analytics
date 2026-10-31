"""
Tests for MurderBall External Dataset Discovery, Expansion Engine, and UI Refinement
AQX Sports Analytics Data Bowl 4.0
"""

import pytest
import json
import os
import sys
from pathlib import Path

# Ensure project root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from backend.api.main import app, load_all_data
from backend.analytics.external_data_expansion import expansion_engine

load_all_data()

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data" / "extracted"

client = TestClient(app)

def test_expanded_international_matches_integrity():
    """Verify expanded international matches contain 37 matches across 3 tournaments."""
    matches_file = DATA_DIR / "expanded_international_matches.json"
    assert matches_file.exists()
    with open(matches_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    meta = data.get("metadata", {})
    assert meta["total_new_matches"] == 37
    assert meta["overall_platform_matches_count"] == 203
    assert len(data["tournaments"]) == 3

    # Check Canada Cup 2024
    can_cup = next((t for t in data["tournaments"] if t["tournament_id"] == "CAN_CUP_2024"), None)
    assert can_cup is not None
    assert len(can_cup["matches"]) == 15
    assert can_cup["champion"] == "JPN"

    # Check Shibuya 2024
    shibuya = next((t for t in data["tournaments"] if t["tournament_id"] == "SHIBUYA_2024"), None)
    assert shibuya is not None
    assert len(shibuya["matches"]) == 10
    assert shibuya["champion"] == "JPN"

    # Check Lakeshore 2024
    lakeshore = next((t for t in data["tournaments"] if t["tournament_id"] == "LAKESHORE_2024"), None)
    assert lakeshore is not None
    assert len(lakeshore["matches"]) == 12
    assert lakeshore["champion"] == "USA"


def test_ipc_master_athlete_registry_integrity():
    """Verify IPC Master Athlete Registry catalogs 300+ athletes with medals and aliases."""
    ipc_file = DATA_DIR / "ipc_athlete_master_registry.json"
    assert ipc_file.exists()
    with open(ipc_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    meta = data.get("metadata", {})
    assert meta["total_registered_athletes"] >= 300
    assert meta["multi_cycle_veterans_3_plus"] >= 50
    assert meta["female_athletes_total"] >= 10

    athletes = data.get("athletes", [])
    assert len(athletes) >= 300

    # Test Marquee Legend: Ryley Batt
    batt = next((a for a in athletes if "BATT" in a["canonical_name"].upper()), None)
    assert batt is not None
    assert batt["country"] == "AUS"
    assert batt["primary_sport_class"] == 3.5
    assert batt["paralympic_appearances_count"] == 6  # 2004 to 2024
    assert batt["medals"]["gold"] >= 2  # 2012, 2016
    assert batt["is_legend"] is True
    assert any("BATT R." in alias for alias in batt["aliases"])

    # Test Marquee Legend: Chuck Aoki
    aoki = next((a for a in athletes if "AOKI" in a["canonical_name"].upper()), None)
    assert aoki is not None
    assert aoki["country"] == "USA"
    assert aoki["medals"]["silver"] >= 2
    assert aoki["paralympic_appearances_count"] >= 3


def test_wwr_rules_evolution_archive():
    """Verify rules evolution covers 4 distinct eras and mathematically models caps."""
    rules_file = DATA_DIR / "official_rules_evolution.json"
    assert rules_file.exists()
    with open(rules_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    eras = data.get("eras", [])
    assert len(eras) == 4

    # Era 1: Foundation (no female allowance)
    era1 = eras[0]
    assert era1["team_point_cap"] == 8.0
    assert era1["female_point_allowance"] == 0.0
    assert era1["assist_blocks_recorded"] is True

    # Era 3: Female allowance introduced
    era3 = eras[2]
    assert era3["team_point_cap"] == 8.0
    assert era3["female_point_allowance"] == 0.5
    assert era3["assist_blocks_recorded"] is False

    # Era 4: Contemporary (IRS active)
    era4 = eras[3]
    assert era4["instant_replay"] is True


def test_external_dataset_discovery_report():
    """Verify accepted and rejected datasets are explicitly audited with scientific reasons."""
    report_file = DATA_DIR / "external_dataset_discovery_report.json"
    assert report_file.exists()
    with open(report_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    accepted = data.get("accepted_datasets", [])
    assert len(accepted) >= 3

    rejected = data.get("rejected_datasets", [])
    assert len(rejected) >= 3

    # Ensure Wheelchair Rugby League is explicitly rejected
    wrl = next((r for r in rejected if "RUGBY LEAGUE" in r["candidate_source"].upper()), None)
    assert wrl is not None
    assert wrl["verdict"] == "STRICTLY REJECTED"
    assert "tag rugby" in wrl["scientific_rationale"].lower() or "different sport" in wrl["scientific_rationale"].lower()

    # Ensure Wheelchair Basketball is explicitly rejected
    wb = next((r for r in rejected if "BASKETBALL" in r["candidate_source"].upper()), None)
    assert wb is not None
    assert wb["verdict"] == "STRICTLY REJECTED"
    assert "14.0" in wb["scientific_rationale"] or "non-contact" in wb["scientific_rationale"].lower()


def test_before_vs_after_model_improvement():
    """Verify that mid-2024 expansion yields measurable calibration gain."""
    res = expansion_engine.compute_model_comparison()
    gain = res.get("empirical_gain", {})

    brier_gain_str = gain.get("brier_calibration_gain", "")
    assert "reduction in Brier forecast error" in brier_gain_str

    base_brier = res["baseline_model"]["metrics"]["brier_score"]
    exp_brier = res["expanded_model"]["metrics"]["brier_score"]
    assert exp_brier < base_brier  # Proving error decreased


def test_rest_api_expansion_endpoints():
    """Verify all 6 expansion REST endpoints return 200 with valid schemas."""
    # 1. Summary
    res = client.get("/api/expansion/summary")
    assert res.status_code == 200
    s_data = res.json()
    assert s_data["total_platform_matches"] == 203
    assert s_data["original_paralympic_matches"] == 120
    assert s_data["newly_integrated_matches"] == 37

    # 2. IPC Athletes
    res = client.get("/api/expansion/ipc-athletes?country=AUS&limit=10")
    assert res.status_code == 200
    athletes = res.json()
    assert len(athletes) > 0
    assert all(a["country"] == "AUS" for a in athletes)

    # 3. Rules Evolution
    res = client.get("/api/expansion/rules-evolution")
    assert res.status_code == 200
    rules = res.json()
    assert len(rules["eras"]) == 4

    # 4. Discovery Report
    res = client.get("/api/expansion/discovery-report")
    assert res.status_code == 200
    disc = res.json()
    assert len(disc["rejected_datasets"]) >= 3

    # 5. Model Comparison
    res = client.get("/api/expansion/model-comparison")
    assert res.status_code == 200
    comp = res.json()
    assert "empirical_gain" in comp

    # 6. Data Coverage Map
    res = client.get("/api/expansion/data-coverage-map")
    assert res.status_code == 200
    cmap = res.json()
    assert cmap["total_global_venues"] >= 9
    assert cmap["total_matches_mapped"] >= 203
