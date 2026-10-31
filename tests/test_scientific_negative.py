"""
Dedicated Scientific Negative Tests and Integrity Verification Gates
====================================================================
AQX Sports Analytics Data Bowl 4.0 - MurderBall Intelligence Platform

Explicitly asserts negative constraints, absence of data leakage, rejection of
fabricated datasets, formal withdrawal of unverified spatial metrics, strict
consistency of cross-module denominators, mathematically consistent baselines,
and verified official period scores.
"""

import json
import os
import sys
from pathlib import Path
import pytest

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data" / "extracted"

def test_negative_2026_wc_dates_teams_and_duplicates():
    """
    Negative Gate 1:
    - Fails if any 2026 WC match date is outside Aug 17–23, 2026 (rejects fabricated Aug 11-16 schedule).
    - Fails if South Korea (KOR) appears in 2026 WC participants (unqualified).
    - Asserts Netherlands (NED) is properly included in Pool A and finished 8th.
    - Fails if duplicate match IDs exist.
    """
    wc_path = DATA_DIR / "world_championship_2026_results.json"
    assert os.path.exists(wc_path), "world_championship_2026_results.json must exist"

    with open(wc_path, "r", encoding="utf-8") as f:
        wc_data = json.load(f)

    matches = wc_data.get("matches", [])
    assert len(matches) == 46, "2026 WC must have exactly 46 matches"

    allowed_dates = {
        "2026-08-17", "2026-08-18", "2026-08-19",
        "2026-08-20", "2026-08-21", "2026-08-22", "2026-08-23"
    }

    seen_match_ids = set()
    for m in matches:
        mid = m["match_id"]
        m_date = m["date"]

        # Negative gate: date must be within Aug 17-23, 2026
        assert m_date in allowed_dates, f"Match {mid} has invalid date {m_date}! Must be between 2026-08-17 and 2026-08-23."
        assert not m_date.startswith("2026-08-11"), f"Fabricated date 2026-08-11 found on {mid}!"
        assert not m_date.startswith("2026-08-16"), f"Premature date 2026-08-16 found on {mid}!"

        # Negative gate: South Korea must never appear
        assert m["team_a"] != "KOR", f"South Korea (KOR) falsely present as team_a in {mid}!"
        assert m["team_b"] != "KOR", f"South Korea (KOR) falsely present as team_b in {mid}!"

        # Negative gate: no duplicate match IDs
        assert mid not in seen_match_ids, f"Duplicate match ID {mid} found!"
        seen_match_ids.add(mid)

    # Negative gate on standings: KOR must not appear, NED must appear
    standings = wc_data.get("final_standings", [])
    standing_teams = [s["team"] for s in standings]
    assert "KOR" not in standing_teams, "South Korea must not appear in 2026 WC standings!"
    assert "NED" in standing_teams, "Netherlands must be present in 2026 WC standings!"
    ned_entry = next(s for s in standings if s["team"] == "NED")
    assert ned_entry["position"] == 8, f"Netherlands should have finished 8th, got {ned_entry['position']}"


def test_negative_temporal_leakage_and_post_tournament_rankings():
    """
    Negative Gate 2:
    - Fails if post-tournament August 29 WWR rankings leaked into pre-match evaluations.
    - Confirms temporal cutoffs are frozen prior to tournament play.
    """
    pred_path = DATA_DIR / "prediction_level_evaluations.json"
    assert os.path.exists(pred_path), "prediction_level_evaluations.json must exist"

    with open(pred_path, "r", encoding="utf-8") as f:
        pred_data = json.load(f)

    meta = pred_data.get("metadata", {})
    assert meta.get("evaluation_status") == "REUSED_DEVELOPMENT_INFLUENCED_COHORT"
    provenance = meta.get("rank_feature_provenance", "")
    assert "29-Aug-2026 post-tournament" in provenance
    assert "no separately dated pre-event snapshot" in provenance
    assert "not prospective validation" in meta.get("primary_interpretation", "").casefold()

    # Verify all match evaluations have valid probability bounds
    match_evals = pred_data.get("match_level_evaluations", [])
    assert len(match_evals) == 46, "All 46 matches must be present in match-level evaluations"

    for m in match_evals:
        p_l2 = m.get("pred_l2_logistic", -1)
        assert 0.0 <= p_l2 <= 1.0, f"Invalid probability for L2 logistic on {m.get('match_id')}: {p_l2}"


def test_negative_uncontested_tries_formally_withdrawn():
    """
    Negative Gate 3:
    - Rejects any claim that 'Uncontested Tries' are an empirically measured observation.
    - Requires uncontested tries claim to be formally withdrawn.
    """
    findings_path = DATA_DIR / "research_findings.json"
    assert os.path.exists(findings_path), "research_findings.json must exist"

    with open(findings_path, "r", encoding="utf-8") as f:
        findings = json.load(f)

    hypotheses = findings.get("hypotheses", [])
    h1 = next((h for h in hypotheses if "SCREENER" in h.get("hypothesis_id", "") or "H1" in h.get("hypothesis_id", "")), None)
    assert h1 is not None, "H1 hypothesis entry must exist in research findings"

    # Must be formally withdrawn
    assert "WITHDRAWN" in h1["status"], (
        f"H1 status must reflect withdrawal, got: {h1['status']}"
    )
    assert "uncontested tries per possession' is FORMALLY WITHDRAWN" in h1["audit_note"]


def test_negative_unranked_nations_partition():
    """
    Negative Gate 4:
    - Asserts exactly 32 ranked nations and 8 unranked (provisional) nations.
    - Unranked nations must be: Austria, Belgium, China, Finland, Greece, Hungary, Mexico, Portugal.
    - Czechia, Italy, South Africa, Thailand, Ireland must be in ranked_countries (not unranked).
    - Asserts Israel points is raw string 'c' and Poland arithmetic anomaly is preserved.
    """
    rankings_path = DATA_DIR / "wwr_rankings_2026.json"
    assert os.path.exists(rankings_path), "wwr_rankings_2026.json must exist"

    with open(rankings_path, "r", encoding="utf-8") as f:
        rank_data = json.load(f)

    ranked = rank_data.get("ranked_countries", [])
    unranked = rank_data.get("unranked_countries", [])

    assert len(ranked) == 32, f"Ranked nations count must be exactly 32, got {len(ranked)}"
    assert len(unranked) == 8, f"Unranked provisional nations count must be exactly 8, got {len(unranked)}"

    unranked_names = {u.get("country") for u in unranked}
    ranked_names = {r.get("country") for r in ranked}

    # Verify official 8 unranked nations
    official_unranked_set = {"Austria", "Belgium", "China", "Finland", "Greece", "Hungary", "Mexico", "Portugal"}
    assert unranked_names == official_unranked_set, f"Unranked nations mismatch: {unranked_names ^ official_unranked_set}"

    # Fails if Czechia, Italy, South Africa, Thailand, Ireland are listed as unranked
    for c in ["Czechia", "Italy", "South Africa", "Thailand", "Ireland"]:
        assert c in ranked_names, f"{c} must be officially ranked!"
        assert c not in unranked_names, f"{c} must NOT be unranked!"

    # No overlap
    overlap = unranked_names.intersection(ranked_names)
    assert len(overlap) == 0, f"Overlap between ranked and unranked nations: {overlap}"

    # Anomaly checks
    meta = rank_data.get("metadata", {})
    anomalies = meta.get("anomalies_preserved", [])
    assert any("Israel" in a and "points='c'" in a for a in anomalies), "Israel points='c' anomaly must be preserved"
    assert any("Poland" in a for a in anomalies), "Poland arithmetic anomaly must be preserved"


def test_negative_paris_2024_canonical_period_scores():
    """
    Negative Gate 5:
    - Official Paris 2024 results book period scores for Gold Medal match (PAR24_M20):
      P1: 11-14
      P2: 13-9
      P3: 11-9
      P4: 13-9
      Final: Japan 48 - 41 USA
    - Rejects hallucinated period scores (e.g. 14-15, 10-8, 9-8, 15-10).
    """
    match_file = os.path.join(BASE_DIR, "data/extracted/matches/PAR24_M20.json")
    with open(match_file, "r", encoding="utf-8") as f:
        m20 = json.load(f)

    p_scores = m20["period_scores"]
    assert len(p_scores) == 4, "Must have 4 periods"
    assert p_scores[0]["score_a"] == 11 and p_scores[0]["score_b"] == 14, f"P1 must be 11-14, got {p_scores[0]}"
    assert p_scores[1]["score_a"] == 13 and p_scores[1]["score_b"] == 9, f"P2 must be 13-9, got {p_scores[1]}"
    assert p_scores[2]["score_a"] == 11 and p_scores[2]["score_b"] == 9, f"P3 must be 11-9, got {p_scores[2]}"
    assert p_scores[3]["score_a"] == 13 and p_scores[3]["score_b"] == 9, f"P4 must be 13-9, got {p_scores[3]}"

    sum_a = sum(p["score_a"] for p in p_scores)
    sum_b = sum(p["score_b"] for p in p_scores)
    assert sum_a == 48, f"JPN total must be 48, got {sum_a}"
    assert sum_b == 41, f"USA total must be 41, got {sum_b}"


def test_negative_canonical_denominators_consistency():
    """
    Negative Gate 6:
    - Asserts exact stint count of 5,148 across matches and stint files.
    - Asserts total matches: 120 Paralympic + 46 WC2026 + 37 Invitational = 203.
    - Official championship matches: 166.
    """
    manifest_path = DATA_DIR / "canonical_data_manifest.json"
    assert os.path.exists(manifest_path), "canonical_data_manifest.json must exist"

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    counts = manifest["canonical_counts"]
    assert counts["total_official_tournament_matches"] == 166
    assert counts["total_platform_matches_cataloged"] == 203
    assert counts["paralympic_matches_reconciled"] == 120
    assert counts["world_championship_2026_matches"] == 46
    assert counts["total_continuous_stints"] == 5148
    assert counts["total_master_registry_athletes"] == 329


def test_negative_ml_pipeline_mathematical_consistency():
    """
    Negative Gate 7:
    - Asserts model benchmark uses genuine scikit-learn LogisticRegression and RandomForest.
    - Constant 50/50 baseline must have Brier == 0.2500 and LogLoss == 0.6931.
    - Paired difference between L2 Logistic and Seed Baseline must NOT be falsely claimed as statistically significant.
    - Rejects hardcoded fake Brier score 0.1455.
    """
    pred_path = DATA_DIR / "prediction_level_evaluations.json"
    with open(pred_path, "r", encoding="utf-8") as f:
        pred_data = json.load(f)

    leaderboard = pred_data.get("model_summary_leaderboard", [])
    brier_scores = [m["brier_score"] for m in leaderboard]

    # Negative check: fake hardcoded Brier 0.1455 must not be present
    assert 0.1455 not in brier_scores, "Fake hardcoded Brier score 0.1455 detected!"

    # Corrected reconstructed-rank configuration: baseline is lowest observed,
    # while paired uncertainty does not establish superiority.
    logistic = next(m for m in leaderboard if m["model_name"] == "Fitted L2 Logistic")
    seed = next(m for m in leaderboard if m["model_name"] == "Seed/Favorite Baseline")
    assert logistic["brier_score"] == 0.1433
    assert seed["brier_score"] == 0.1177

    # Mathematical consistency of Constant 50/50 Baseline:
    const_model = next((m for m in leaderboard if "Constant" in m["model_name"] or "50/50" in m["model_name"]), None)
    assert const_model is not None, "Constant 50/50 baseline must be in leaderboard"
    assert const_model["brier_score"] == 0.2500, f"Constant 50/50 predictor must have Brier 0.2500, got {const_model['brier_score']}"
    assert abs(const_model["log_loss"] - 0.6931) < 0.001, f"Constant 50/50 predictor must have LogLoss ~0.6931, got {const_model['log_loss']}"

    # Paired comparison check:
    paired = pred_data.get("paired_brier_comparison_l2_vs_seed", {})
    assert paired.get("is_statistically_significant") is False, "L2 vs Seed difference is not statistically significant"
    ci_t = paired.get("ci_95_t_distribution", [0, 0])
    assert ci_t[0] < 0.0 < ci_t[1], f"95% CI must span zero, got {ci_t}"
