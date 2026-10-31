"""
Independent Negative Tests & Scientific Verification Gate
=========================================================
AQX Sports Analytics Data Bowl 4.0 - Critical Scientific Repair Verification

Tests official source ground truths against potential bugs, synthetic fabrications,
lookahead data leakage, rule violations, and denominator inconsistencies.
"""

import os
import sys
import json
import pytest
import numpy as np
from datetime import datetime

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.analytics.classification_rules import (
    determine_rules_era,
    get_female_allowance,
    evaluate_lineup_legality,
    RULES_ERAS
)

# -----------------------------------------------------------------------------
# 1. CANONICAL PARIS 2024 GOLD MEDAL MATCH VERIFICATION & NEGATIVE TESTS
# -----------------------------------------------------------------------------

def test_paris_2024_canonical_gold_medal_match_scores():
    match_file = os.path.join(BASE_DIR, "data/extracted/matches/PAR24_M20.json")
    assert os.path.exists(match_file), "PAR24_M20.json must exist"

    with open(match_file, "r", encoding="utf-8") as f:
        match = json.load(f)

    # Official final score: Japan 48 - 41 USA
    assert match["official_score_a"] == 48
    assert match["official_score_b"] == 41
    assert match["team_a_code"] == "JPN"
    assert match["team_b_code"] == "USA"

    # Verify period scores
    p_scores = match["period_scores"]
    assert len(p_scores) == 4
    sum_a = sum(p["score_a"] for p in p_scores)
    sum_b = sum(p["score_b"] for p in p_scores)
    assert sum_a == 48, f"Period sum for JPN must be 48 (got {sum_a})"
    assert sum_b == 41, f"Period sum for USA must be 41 (got {sum_b})"

    # Exact official period scores from Results Book page 129
    assert p_scores[0] == {"period": 1, "score_a": 11, "score_b": 14}
    assert p_scores[1] == {"period": 2, "score_a": 13, "score_b": 9}
    assert p_scores[2] == {"period": 3, "score_a": 11, "score_b": 9}
    assert p_scores[3] == {"period": 4, "score_a": 13, "score_b": 9}


def test_paris_2024_negative_gate_rejection_of_fictional_4_12_event():
    """
    Negative Test Gate:
    Deliberately asserts that the erroneous '4:12 remaining, JPN 42 - USA 39'
    event DOES NOT exist in the official Paris 2024 Gold Medal play-by-play.
    """
    match_file = os.path.join(BASE_DIR, "data/extracted/matches/PAR24_M20.json")
    with open(match_file, "r", encoding="utf-8") as f:
        match = json.load(f)

    p4_events = [e for e in match.get("events", []) if e.get("period") == 4]

    # Negative assertion: No event at 4:12 in Q4
    events_at_412 = [e for e in p4_events if e.get("clock") == "4:12"]
    assert len(events_at_412) == 0, "Fictional 4:12 event must NOT exist in official Q4 play-by-play!"

    # Negative assertion: Score was never 42-39 in Q4
    bogus_scores = [e for e in p4_events if e.get("score_a") == 42 and e.get("score_b") == 39]
    assert len(bogus_scores) == 0, "Score was never JPN 42 - USA 39 in Q4!"

    # Negative assertion: Subsequent substitutions were NOT at 4:32 (they were at 4:50)
    subs_at_432 = [e for e in p4_events if e.get("clock") == "4:32" and "SUBSTITUTION" in e.get("event_type", "")]
    assert len(subs_at_432) == 0, "Substitutions were not at 4:32; they occurred at 4:50!"


def test_paris_2024_canonical_fourth_period_exact_sequence():
    """
    Validates the exact official play-by-play sequence in Period 4 (Page 132):
    - 5:31: Japan scores to lead 39-34 (Ike try)
    - 5:31: USA calls a 60-second timeout
    - 5:31: Sarah Adam exits, Josh Wheeler enters
    - 5:20: USA scores, 39-35 (O'Neill try)
    - 5:04: Japan scores, 40-35 (Hashimoto try)
    - 4:50: Josh Wheeler commits a turnover (out of bounds)
    - 4:50: Lee Fredette exits, Jeff Butler enters; Josh O'Neill exits, Sarah Adam enters
    - 4:40: Japan scores, 41-35 (Ike try)
    - 4:40: Sarah Adam equipment timeout
    - 4:20: USA scores, 41-36 (Aoki try)
    - 3:59: Japan scores, 42-36 (Ike try)
    """
    match_file = os.path.join(BASE_DIR, "data/extracted/matches/PAR24_M20.json")
    with open(match_file, "r", encoding="utf-8") as f:
        match = json.load(f)

    p4_events = [e for e in match.get("events", []) if e.get("period") == 4]

    # 5:31 sequence
    ev_531_try = [e for e in p4_events if e.get("clock") == "5:31" and e.get("event_type") == "TRY"]
    assert len(ev_531_try) >= 1 and ev_531_try[0]["score_a"] == 39 and ev_531_try[0]["score_b"] == 34

    ev_531_to = [e for e in p4_events if e.get("clock") == "5:31" and e.get("event_type") == "TIMEOUT"]
    assert len(ev_531_to) >= 1 and "60s" in ev_531_to[0]["description"]

    ev_531_sub = [e for e in p4_events if e.get("clock") == "5:31" and "SUBSTITUTION" in e.get("event_type", "")]
    assert len(ev_531_sub) >= 1 and "WHEELER" in ev_531_sub[0]["description"]

    # 5:20 sequence
    ev_520 = [e for e in p4_events if e.get("clock") == "5:20"]
    assert len(ev_520) >= 1 and ev_520[0]["score_a"] == 39 and ev_520[0]["score_b"] == 35

    # 5:04 sequence
    ev_504 = [e for e in p4_events if e.get("clock") == "5:04"]
    assert len(ev_504) >= 1 and ev_504[0]["score_a"] == 40 and ev_504[0]["score_b"] == 35

    # 4:50 sequence: Wheeler turnover AND substitutions
    ev_450_to = [e for e in p4_events if e.get("clock") == "4:50" and e.get("event_type") == "TURNOVER"]
    assert len(ev_450_to) >= 1 and ev_450_to[0]["athlete"] == "WHEELER J"
    assert ev_450_to[0]["score_a"] == 40 and ev_450_to[0]["score_b"] == 35

    ev_450_sub = [e for e in p4_events if e.get("clock") == "4:50" and "SUBSTITUTION" in e.get("event_type", "")]
    assert len(ev_450_sub) >= 1

    # 4:40 sequence: Ike try 41-35
    ev_440 = [e for e in p4_events if e.get("clock") == "4:40" and e.get("event_type") == "TRY"]
    assert len(ev_440) >= 1 and ev_440[0]["score_a"] == 41 and ev_440[0]["score_b"] == 35

    # 4:20 sequence: Aoki try 41-36
    ev_420 = [e for e in p4_events if e.get("clock") == "4:20"]
    assert len(ev_420) >= 1 and ev_420[0]["score_a"] == 41 and ev_420[0]["score_b"] == 36

    # 3:59 sequence: Ike try 42-36
    ev_359 = [e for e in p4_events if e.get("clock") == "3:59"]
    assert len(ev_359) >= 1 and ev_359[0]["score_a"] == 42 and ev_359[0]["score_b"] == 36


def test_paris_2024_negative_gate_roster_authenticity():
    """
    Negative & Positive Test Gate for Paris 2024 Official Rosters (Page 129):
    - Chuck Melton is classified 2.0 (NOT 0.5)
    - Christopher Scott does NOT appear on the official USA final-match roster
    - Clayton Brackett appears on the official USA final-match roster (2.5 M)
    - Japan's roster includes Shunya Nakamachi (2.0 M) (NOT Hidefumi Nakamoto)
    - Japan's roster includes Hidefumi Wakayama (1.0 M) and Yuki Hasegawa (0.5 M)
    - Rejects fictional names 'Sarah Fredette' and 'Fukushima Daisuke'
    """
    match_file = os.path.join(BASE_DIR, "data/extracted/matches/PAR24_M20.json")
    with open(match_file, "r", encoding="utf-8") as f:
        match = json.load(f)

    roster_a = match.get("box_scores_a", [])
    roster_b = match.get("box_scores_b", [])

    map_a = {p["name"]: p for p in roster_a}
    map_b = {p["name"]: p for p in roster_b}

    # 1. Check USA Roster
    assert "MELTON Chuck" in map_b, "Chuck Melton must be in USA roster"
    assert map_b["MELTON Chuck"]["classification"] == 2.0, "Chuck Melton must be classified 2.0 in Paris 2024 (NOT 0.5!)"

    assert "BRACKETT Clayton" in map_b, "Clayton Brackett must be in official USA roster"
    assert map_b["BRACKETT Clayton"]["classification"] == 2.5, "Clayton Brackett is classified 2.5"

    assert "SCOTT Christopher" not in map_b, "Christopher Scott did NOT appear on Paris 2024 Gold Medal roster"
    assert "FREDETTE Sarah" not in map_b, "Fictional athlete 'Sarah Fredette' must not exist"
    assert "SCATURRO Adam" not in map_b, "Adam Scaturro was assistant coach, not active player in Paris 2024"

    # 2. Check Japan Roster
    assert "NAKAMACHI Shunya" in map_a, "Japan roster must include NAKAMACHI Shunya (2.0)"
    assert map_a["NAKAMACHI Shunya"]["classification"] == 2.0
    assert "NAKAMOTO Hidefumi" not in map_a, "Hidefumi Nakamoto does NOT exist on Japan 2024 roster"
    assert "FUKUSHIMA Daisuke" not in map_a, "Fukushima Daisuke does NOT exist on Japan 2024 roster"

    assert "WAKAYAMA Hidefumi" in map_a, "Japan roster must preserve WAKAYAMA Hidefumi (1.0)"
    assert map_a["WAKAYAMA Hidefumi"]["classification"] == 1.0

    assert "HASEGAWA Yuki" in map_a, "Japan roster must preserve HASEGAWA Yuki (0.5)"
    assert map_a["HASEGAWA Yuki"]["classification"] == 0.5

    assert "KURAHASHI Kae" in map_a, "Japan roster must include KURAHASHI Kae (0.5 F)"
    assert map_a["KURAHASHI Kae"]["classification"] == 0.5
    assert map_a["KURAHASHI Kae"]["gender"] == "F"

    # Verify both rosters have exactly 12 athletes
    assert len(roster_a) == 12, f"Japan roster must have exactly 12 athletes (got {len(roster_a)})"
    assert len(roster_b) == 12, f"USA roster must have exactly 12 athletes (got {len(roster_b)})"


# -----------------------------------------------------------------------------
# 2. DATE-AWARE CLASSIFICATION LEGALITY ENGINE & FEMALE ALLOWANCE RULES
# -----------------------------------------------------------------------------

def test_classification_rules_historical_evolution():
    # Pre-2010 Classical: no female allowance
    assert determine_rules_era(2004) == "ERA_PRE_2010"
    assert determine_rules_era("Beijing 2008") == "ERA_PRE_2010"
    assert get_female_allowance(2.5, is_female=True, rules_era="ERA_PRE_2010") == 0.0

    # 2010-2025 Era: flat +0.5 allowance
    assert determine_rules_era(2024) == "ERA_2010_2025"
    assert determine_rules_era("Paris 2024") == "ERA_2010_2025"
    assert get_female_allowance(0.5, is_female=True, rules_era="ERA_2010_2025") == 0.5
    assert get_female_allowance(2.5, is_female=True, rules_era="ERA_2010_2025") == 0.5

    # 2026+ Modern WWR Rules: tiered allowance (+0.5 for 0.5-1.5, +1.0 for 2.0-3.5)
    assert determine_rules_era(2026) == "ERA_2026_MODERN"
    assert determine_rules_era("São Paulo 2026") == "ERA_2026_MODERN"
    assert get_female_allowance(0.5, is_female=True, rules_era="ERA_2026_MODERN") == 0.5
    assert get_female_allowance(1.5, is_female=True, rules_era="ERA_2026_MODERN") == 0.5
    assert get_female_allowance(2.0, is_female=True, rules_era="ERA_2026_MODERN") == 1.0
    assert get_female_allowance(2.5, is_female=True, rules_era="ERA_2026_MODERN") == 1.0
    assert get_female_allowance(3.5, is_female=True, rules_era="ERA_2026_MODERN") == 1.0

def test_lineup_legality_tiered_female_allowance_2026_vs_historical():
    """
    Test lineup: Aoki (3.0 M), Adam (2.5 F), Wheeler (2.5 M), Cohn (1.0 M)
    Raw sum: 3.0 + 2.5 + 2.5 + 1.0 = 9.0 points.
    - Pre-2010: Cap is 8.0 -> ILLEGAL (9.0 > 8.0)
    - 2024 Paris Era: Cap is 8.0 + 0.5 = 8.5 -> ILLEGAL (9.0 > 8.5)
    - 2026 Modern Era: Sarah Adam is 2.5 F, gets +1.0 allowance -> Cap is 8.0 + 1.0 = 9.0 -> LEGAL!
    """
    lineup = [
        {"name": "AOKI Chuck", "classification": 3.0, "gender": "M"},
        {"name": "ADAM Sarah", "classification": 2.5, "gender": "F"},
        {"name": "WHEELER Josh", "classification": 2.5, "gender": "M"},
        {"name": "COHN Chad", "classification": 1.0, "gender": "M"}
    ]

    res_pre2010 = evaluate_lineup_legality(lineup, "ERA_PRE_2010")
    assert res_pre2010["is_legal"] is False
    assert res_pre2010["effective_cap"] == 8.0

    res_2024 = evaluate_lineup_legality(lineup, "ERA_2010_2025")
    assert res_2024["is_legal"] is False
    assert res_2024["effective_cap"] == 8.5

    res_2026 = evaluate_lineup_legality(lineup, "ERA_2026_MODERN")
    assert res_2026["is_legal"] is True
    assert res_2026["effective_cap"] == 9.0


# -----------------------------------------------------------------------------
# 3. 2026 WORLD CHAMPIONSHIP REGISTRY & NEGATIVE GATE
# -----------------------------------------------------------------------------

def test_2026_world_championship_registry_sao_paulo():
    """
    Validates:
    - Host City: São Paulo, Brazil
    - Venue: Centro de Treinamento Paralímpico Brasileiro
    - 46 Total Tournament Matches:
        - Games 1 to 30: Group Competition (Pool A 1-15, Pool B 16-30)
        - Games 31 to 46: Placement and Knockout Competition
    - Documented Primary Evaluation Cohort: Games 1 to 24 (WC26_M01 - WC26_M24)
    - Rejection of Vejle, Denmark for 2026
    """
    wc_file = os.path.join(BASE_DIR, "data/extracted/world_championship_2026_results.json")
    with open(wc_file, "r", encoding="utf-8") as f:
        wc26 = json.load(f)

    meta = wc26["metadata"]
    assert "São Paulo" in meta["host_city"]
    assert "Brazil" in meta["host_country"]
    assert "Centro de Treinamento Paralímpico Brasileiro" in meta["venue"]

    # Negative check: Must NOT be labeled as Vejle Denmark for 2026
    assert meta["host_city"] != "Vejle", "2026 World Championship was NOT in Vejle!"
    assert meta["host_country"] != "Denmark", "2026 World Championship was NOT in Denmark!"

    # Total matches check
    assert meta["total_tournament_matches"] == 46
    assert len(wc26["matches"]) == 46

    # Breakdown verification
    breakdown = meta["tournament_breakdown"]
    assert breakdown["group_competition_matches"] == 30, "Group competition must have 30 matches (Games 1 to 30)!"
    assert breakdown["placement_and_knockout_matches"] == 16, "Placement/Knockout must have 16 matches (Games 31 to 46)!"

    # Cohort documentation
    cohorts = meta["evaluation_cohorts"]
    assert cohorts["full_tournament_cohort"]["count"] == 46
    assert cohorts["group_competition_cohort"]["count"] == 30
    assert cohorts["primary_prospective_24_cohort"]["count"] == 24
    assert cohorts["placement_and_knockout_cohort"]["count"] == 16


# -----------------------------------------------------------------------------
# 4. STRICT OUT-OF-TIME PREDICTION BENCHMARK & NO FUTURE LEAKAGE GATE
# -----------------------------------------------------------------------------

def test_predictive_benchmark_no_future_leakage():
    pred_file = os.path.join(BASE_DIR, "data/extracted/prediction_level_evaluations.json")
    assert os.path.exists(pred_file), "prediction_level_evaluations.json must exist"

    with open(pred_file, "r", encoding="utf-8") as f:
        benchmark = json.load(f)

    eval_matches = benchmark.get("match_level_evaluations", [])
    assert len(eval_matches) == 46, "Benchmark must cover all 46 matches of 2026 World Championship"

    # Verify 24 matches in primary cohort
    primary_matches = [m for m in eval_matches if m.get("in_primary_24_cohort")]
    assert len(primary_matches) == 24, "Primary prospective benchmark cohort must contain exactly 24 matches"

    meta = benchmark.get("metadata", {})
    assert meta.get("evaluation_status") == "REUSED_DEVELOPMENT_INFLUENCED_COHORT"
    assert "post-tournament" in meta.get("rank_feature_provenance", "")
    assert "no separately dated pre-event snapshot" in meta.get("rank_feature_provenance", "")
    assert "2026-08-29" not in meta.get("pre_tournament_rankings_snapshot", ""), "Post-tournament snapshot must NEVER leak!"


# -----------------------------------------------------------------------------
# 5. INCONSISTENT RESEARCH DENOMINATORS RECONCILIATION
# -----------------------------------------------------------------------------

def test_research_denominators_reconciled():
    with open(os.path.join(BASE_DIR, "data/extracted/statistical_discovery_audit.json"), "r", encoding="utf-8") as f:
        audit = json.load(f)

    findings = audit.get("systematic_hypotheses", {}).get("hypotheses", [])
    h_map = {h["id"]: h for h in findings}

    # H01: Assist Blocks
    # Reconciled: 1,296 Assist Blocks in Athens/Beijing 44-match box score cohort
    # 2,505 total blocks in all-match reconstructed event database
    assert "H01_LOW_POINT_SCREENER_ASYMMETRY" in h_map

    # H05/H06: Timeouts
    # Reconciled: 330 total 3+ unanswered runs; 318 filtered runs with >= 90s remaining
    h05 = h_map.get("H05_TIMEOUT_IMMEDIATE_RUN_HALTING", {})
    assert "318" in h05.get("sample_size", "")

    # Scientific language gate: Rejects dogmatic 'accepted' or 'guaranteed'
    audit_text = json.dumps(audit)
    assert "NULL ACCEPTED" not in audit_text, "Statistical reports must use 'Failed to reject null', not 'Null accepted'!"
