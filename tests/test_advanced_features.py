"""
test_advanced_features.py
=========================
Rigorous automated test suite for MurderBall Advanced Features:
1. Historical Championships Database (10 Major Tournaments)
2. Official WWR Rankings & Anomaly Preservation (August 29, 2026)
3. Player Co-Play Synergy Matrix
4. Dynamic Substitution Impact Tracking
5. Clutch / High-Leverage Analysis (Period 4 / OT, diff <= 2)
6. Empirical Bayes Role-Adjusted Star Ratings (0.5 - 5.0 Stars)
7. Prior AQX Benchmark & Academic Literature Alignment
8. FastAPI Endpoints Verification
"""

import json
import os
import pytest
from fastapi.testclient import TestClient
from backend.api.main import app, load_all_data

# Initialize TestClient
load_all_data()
client = TestClient(app)

# =====================================================================
# 1. HISTORICAL CHAMPIONSHIPS DATABASE TESTS
# =====================================================================

def test_championships_database_coverage():
    """Verify all 10 major championships are extracted and verified."""
    with open("data/extracted/historical_championships_database.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    assert data["metadata"]["championships_count"] == 10
    champs = data["championships"]
    assert len(champs) == 10

    # Verify all 10 tournament IDs are present
    expected_ids = ["PAR24", "WC22", "TKY20", "WC18", "RIO16", "WC14", "LON12", "BEI08", "ATH04", "WC95"]
    extracted_ids = [c["id"] for c in champs]
    for cid in expected_ids:
        assert cid in extracted_ids, f"Missing championship ID: {cid}"

    # Verify medal table has top countries
    medal_table = data["all_time_medal_table"]
    assert len(medal_table) >= 6
    teams_in_table = [m["code"] for m in medal_table]
    assert "USA" in teams_in_table
    assert "AUS" in teams_in_table
    assert "JPN" in teams_in_table
    assert "NZL" in teams_in_table
    assert "GBR" in teams_in_table
    assert "CAN" in teams_in_table


def test_championship_gold_match_and_traceability():
    """Verify gold medal matches have exact scores, margins, and PDF source pages."""
    with open("data/extracted/historical_championships_database.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    for champ in data["championships"]:
        gold = champ["gold_match"]
        assert gold["score_a"] > 0
        assert gold["score_b"] > 0
        assert gold["margin"] == abs(gold["score_a"] - gold["score_b"])
        assert gold["source_pdf"].endswith(".pdf")
        assert len(gold["source_pages"]) > 0

    # Specific check for Rio 2016 double-overtime thriller (AUS 59 - 58 USA)
    rio = next(c for c in data["championships"] if c["id"] == "RIO16")
    assert rio["gold_match"]["score_a"] == 59
    assert rio["gold_match"]["score_b"] == 58
    assert rio["gold_match"]["overtime"] is True
    assert rio["champion"]["code"] == "AUS"
    assert rio["runner_up"]["code"] == "USA"


# =====================================================================
# 2. OFFICIAL WWR RANKINGS & ANOMALIES TESTS
# =====================================================================

def test_wwr_rankings_snapshot_and_anomalies():
    """Verify 32 ranked + 8 unranked countries, and authentic anomaly preservation."""
    with open("data/extracted/wwr_rankings_2026.json", "r", encoding="utf-8") as f:
        rankings = json.load(f)

    assert rankings["snapshot_date"] == "August 29, 2026"
    all_ranks = rankings["rankings"]
    assert len(all_ranks) >= 32

    # Japan rank 1
    japan = next(c for c in all_ranks if c["country"] == "Japan")
    assert japan["rank"] in ["01", "1", 1]
    assert float(japan["points"]) == 657.25

    # Israel anomaly verification
    israel = next(c for c in all_ranks if c["country"] == "Israel")
    assert israel["rank"] in ["23", 23]
    assert israel["points"] == "c", "Israel points field must preserve raw malformed 'c'"

    # Poland anomaly verification
    poland = next(c for c in all_ranks if c["country"] == "Poland")
    assert poland["rank"] in ["26", 26]
    assert float(poland["points"]) == 41.60
    assert float(poland["previous"]) == 4.60
    assert float(poland["difference"]) == 0.00


# =====================================================================
# 3. ADVANCED ANALYTICS ENGINE TESTS
# =====================================================================

def test_coplay_synergies():
    """Verify player pairwise synergy calculation."""
    with open("data/extracted/advanced_analytics.json", "r", encoding="utf-8") as f:
        adv = json.load(f)

    coplay = adv["co_play_synergies"]
    assert coplay["total_pairs_evaluated"] >= 1000
    top_pairs = coplay["top_positive_synergies"]
    assert len(top_pairs) >= 20

    for pair in top_pairs[:10]:
        assert pair["minutes"] >= 3.0
        assert pair["points_for"] >= 0
        assert pair["points_against"] >= 0
        assert pair["net_diff"] == pair["points_for"] - pair["points_against"]
        assert pair["pair_type"] in [
            "Low-High (Screener + Finisher)", "Dual Low (Containment Unit)",
            "Dual High (Offensive Blitz)", "Mid-Mid (Balanced Core)", "Flexible Hybrid"
        ]


def test_clutch_high_leverage_analytics():
    """Verify high-leverage Period 4 / OT situational calculations."""
    with open("data/extracted/advanced_analytics.json", "r", encoding="utf-8") as f:
        adv = json.load(f)

    clutch = adv["clutch_analytics"]
    assert clutch["total_clutch_events"] >= 5000
    assert clutch["total_clutch_tries"] >= 1500
    assert clutch["total_clutch_turnovers"] >= 200
    assert 75.0 <= clutch["clutch_conversion_pct"] <= 95.0

    team_ranks = clutch["team_clutch_rankings"]
    assert len(team_ranks) >= 6
    for t in team_ranks:
        assert 0.0 <= t["clutch_conversion_pct"] <= 100.0


def test_empirical_bayes_star_ratings():
    """Verify role-stratified shrinkage ratings for all 289 athletes."""
    with open("data/extracted/advanced_analytics.json", "r", encoding="utf-8") as f:
        adv = json.load(f)

    eb = adv["empirical_bayes_ratings"]
    assert eb["total_athletes_rated"] >= 280
    players = eb["players"]

    for p in players:
        assert 1.0 <= p["star_rating"] <= 5.0
        assert p["star_rating"] % 0.5 == 0.0, "Star ratings must be in half-star increments"
        assert p["tier"] in ["World Class Elite", "International Starter", "Key Rotation Impact", "Developing Reserve"]
        assert 0.0 <= p["shrinkage_weight_sample"] <= 1.0

        # Verify radar dimensions are normalized (0 - 100)
        radar = p["radar"]
        for dim in ["scoring_efficiency", "assist_screening", "ball_security", "defensive_disruption", "net_rapm_value"]:
            assert 0.0 <= radar[dim] <= 100.0

    # Ensure flagship veterans are in elite or starter tier
    names = {p["player_name"]: p for p in players}
    assert "BATT Ryley" in names
    assert names["BATT Ryley"]["star_rating"] >= 4.5
    assert names["BATT Ryley"]["tier"] == "World Class Elite"


def test_aqx_benchmarks_and_literature():
    """Verify AQX benchmark comparative matrices and academic citations."""
    with open("data/extracted/advanced_analytics.json", "r", encoding="utf-8") as f:
        adv = json.load(f)

    bms = adv["aqx_benchmarks"]
    assert len(bms) == 5
    bm_names = [b["project_name"] for b in bms]
    assert "THE HOOK" in bm_names
    assert "Load Watch" in bm_names
    assert "Ice in His Veins" in bm_names
    assert "CapCraft AI" in bm_names
    assert "UNDER PRESSURE" in bm_names

    citations = adv["academic_citations"]
    assert len(citations) >= 4


# =====================================================================
# 4. FASTAPI ENDPOINTS VERIFICATION
# =====================================================================

def test_api_championships_endpoints():
    res = client.get("/api/championships")
    assert res.status_code == 200
    data = res.json()
    assert data["metadata"]["championships_count"] == 10

    # Test single championship detail
    res_detail = client.get("/api/championships/PAR24")
    assert res_detail.status_code == 200
    assert res_detail.json()["year"] == 2024
    assert res_detail.json()["champion"]["code"] == "JPN"


def test_api_analytics_endpoints():
    # Co-play query
    res_coplay = client.get("/api/analytics/coplay?min_minutes=5.0&limit=5")
    assert res_coplay.status_code == 200
    assert len(res_coplay.json()["synergies"]) == 5

    # Substitution analytics
    res_subs = client.get("/api/analytics/substitutions?limit=5")
    assert res_subs.status_code == 200
    assert len(res_subs.json()["top_impact_sub_in"]) == 5

    # Clutch analytics
    res_clutch = client.get("/api/analytics/clutch")
    assert res_clutch.status_code == 200
    assert res_clutch.json()["clutch_conversion_pct"] > 80.0

    # Star ratings query
    res_stars = client.get("/api/analytics/star-ratings?min_stars=4.0&limit=10")
    assert res_stars.status_code == 200
    stars_data = res_stars.json()
    assert stars_data["total_athletes"] > 0
    for p in stars_data["players"]:
        assert p["star_rating"] >= 4.0

    # Benchmarks
    res_bench = client.get("/api/analytics/benchmarks")
    assert res_bench.status_code == 200
    assert len(res_bench.json()["aqx_benchmarks"]) == 5
