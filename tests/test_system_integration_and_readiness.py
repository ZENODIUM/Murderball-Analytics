"""
Automated End-to-End System Integration, Scientific Consistency & AQX Readiness Test Suite
===========================================================================================
AQX Sports Analytics Data Bowl 4.0 - MurderBall Wheelchair Rugby Platform
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

def test_research_leaderboard_integrity():
    """Verify the Research Discovery Leaderboard structure, rankings, and decision taxonomy."""
    data = discovery_engine.run_full_discovery_program()
    lbd = data.get("research_leaderboard", {})
    entries = lbd.get("entries", [])
    assert len(entries) >= 8, f"Expected at least 8 entries, got {len(entries)}"

    # Rank 1 must be the 0.5 Screener Asymmetry (Flagship)
    rank1 = entries[0]
    assert rank1["rank"] == 1
    assert "0.5 Screener" in rank1["research_candidate"]
    assert "FLAGSHIP" in rank1["decision"]
    assert "1,296" in rank1["statistical_reliability"]
    assert "3.18e-251" in rank1["statistical_reliability"]
    assert rank1["badge"] == "PRIMARY FLAGSHIP"

    # Rank 2 must disclose that timeout evidence is inconclusive.
    rank2 = entries[1]
    assert rank2["rank"] == 2
    assert "Timeout" in rank2["research_candidate"]
    assert "EXPLORATORY" in rank2["decision"]
    assert "p=0.66" in rank2["statistical_reliability"]

    # Rank 3 must be Rejection of Poisson Null Model
    rank3 = entries[2]
    assert rank3["rank"] == 3
    assert "Poisson" in rank3["research_candidate"]
    assert "SECONDARY" in rank3["decision"]

    # Verify every entry has required fields populated with real experiment results
    for e in entries:
        assert e["rank"] >= 1
        assert len(e["research_candidate"]) > 5
        assert len(e["statistical_reliability"]) > 5
        assert len(e["practical_value"]) > 10
        assert len(e["originality"]) > 10
        assert len(e["decision"]) > 3


def test_historical_case_studies_integrity():
    """Verify the 3 real historical match case studies demonstrate practical coaching decisions."""
    data = discovery_engine.run_full_discovery_program()
    cs_data = data.get("historical_case_studies", {})
    cases = cs_data.get("case_studies", [])
    assert len(cases) == 3

    # Paris 2024 Case Study
    paris_case = next((c for c in cases if c["case_id"] == "CASE_01_PARIS_2024_FINAL"), None)
    assert paris_case is not None
    assert paris_case["match_id"] == "PAR24_M20"
    assert "Japan 48 - 41" in paris_case["match_title"]
    assert "5:31" in paris_case["decision_moment"]
    assert "4:12" not in paris_case["decision_moment"]
    assert "Sarah Adam" in paris_case["historical_action"]
    assert len(paris_case["counterfactual_analysis"]) > 20
    assert len(paris_case["uncertainty_and_limitations"]) > 10

    # Tokyo 2020 Case Study
    tokyo_case = next((c for c in cases if c["case_id"] == "CASE_02_TOKYO_2020_FINAL"), None)
    assert tokyo_case is not None
    assert tokyo_case["match_id"] == "TKY20_M20"
    assert "Great Britain 54 - 49" in tokyo_case["match_title"]
    assert "official record" in tokyo_case["historical_action"].lower()
    assert "tactical" in tokyo_case["uncertainty_and_limitations"].lower()

    # Rio 2016 Case Study
    rio_case = next((c for c in cases if c["case_id"] == "CASE_03_RIO_2016_FINAL"), None)
    assert rio_case is not None
    assert rio_case["match_id"] == "RIO16_M20"
    assert "Double Overtime" in rio_case["match_title"]
    assert "official lineup" in rio_case["historical_action"].lower()
    assert "hypothesis" in rio_case["counterfactual_analysis"].lower()
    assert "spatial data" in rio_case["measured_evidence"].lower()


def test_analytical_consistency_across_subsystems():
    """Verify that player classifications and team rosters match across all extracted files."""
    with open(DATA_DIR / "ipc_athlete_master_registry.json", "r", encoding="utf-8") as f:
        ipc_data = json.load(f)
    with open(DATA_DIR / "all_paralympic_rosters.json", "r", encoding="utf-8") as f:
        rosters_data = json.load(f)

    # Cross-reference marquee athletes
    batt_ipc = next((a for a in ipc_data["athletes"] if "BATT" in a["canonical_name"].upper()), None)
    assert batt_ipc is not None
    assert batt_ipc["primary_sport_class"] == 3.5
    assert batt_ipc["country"] == "AUS"

    aoki_ipc = next((a for a in ipc_data["athletes"] if "AOKI" in a["canonical_name"].upper()), None)
    assert aoki_ipc is not None
    assert aoki_ipc["primary_sport_class"] == 3.0
    assert aoki_ipc["country"] == "USA"

    # Verify Paris 2024 roster matches IPC registry class
    paris_aus_players = rosters_data.get("Paris 2024", {}).get("AUS", {}).get("players", [])
    batt_roster = next((p for p in paris_aus_players if "BATT" in p["name"].upper()), None)
    assert batt_roster is not None
    assert float(batt_roster["sport_class"]) == 3.5


def test_end_to_end_rest_api_leaderboard_and_cases():
    """Verify REST API endpoints for research leaderboard and historical case studies."""
    # 1. Research Leaderboard
    res1 = client.get("/api/discovery/research-leaderboard")
    assert res1.status_code == 200
    lbd = res1.json()
    assert len(lbd["entries"]) >= 8
    assert lbd["entries"][0]["rank"] == 1

    # 2. Case Studies
    res2 = client.get("/api/discovery/case-studies")
    assert res2.status_code == 200
    cs = res2.json()
    assert len(cs["case_studies"]) == 3

    # 3. Overall Platform Match Count Integrity
    res3 = client.get("/api/expansion/summary")
    assert res3.status_code == 200
    assert res3.json()["total_platform_matches"] == 203


def test_strict_out_of_time_segregation_no_leakage():
    """Verify that 2026 World Championship results are never leaked into training features."""
    with open(DATA_DIR / "world_championship_2026_results.json", "r", encoding="utf-8") as f:
        wc26 = json.load(f)

    assert "matches" in wc26
    assert len(wc26["matches"]) >= 16

    # Ensure none of the 2026 match IDs appear in all_paralympic_matches.json
    with open(DATA_DIR / "all_paralympic_matches.json", "r", encoding="utf-8") as f:
        para_matches = json.load(f)

    para_match_ids = {m["match_id"] for m in para_matches}
    for wm in wc26["matches"]:
        assert wm["match_id"] not in para_match_ids, f"Leakage detected: {wm['match_id']} found in historical matches"
