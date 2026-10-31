"""
Canonical Data Manifest Generator
AQX Sports Analytics Data Bowl 4.0 - MurderBall Intelligence Platform

Establishes the single source of truth for platform-wide metrics, counts, provenance tiers,
and tournament registries. Prevents conflicting counts across UI headers, backend APIs,
and research documents.
"""

import json
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data" / "extracted"
FRONTEND_DATA_DIR = BASE_DIR / "frontend" / "public" / "data"

def generate_canonical_manifest():
    # 1. Load Paralympic matches
    with open(DATA_DIR / "all_paralympic_matches.json", "r", encoding="utf-8") as f:
        par_matches = json.load(f)

    # 2. Load World Championship 2026 matches
    with open(DATA_DIR / "world_championship_2026_results.json", "r", encoding="utf-8") as f:
        wc_data = json.load(f)
    wc_matches = wc_data.get("matches", [])

    # 3. Load Expanded International matches
    with open(DATA_DIR / "expanded_international_matches.json", "r", encoding="utf-8") as f:
        exp_data = json.load(f)
    exp_tournaments = exp_data.get("tournaments", [])
    exp_matches_count = sum(len(t.get("matches", [])) for t in exp_tournaments)

    # 4. Load stints
    with open(DATA_DIR / "all_stints.json", "r", encoding="utf-8") as f:
        stints = json.load(f)

    # 5. Load IPC Master Registry
    with open(DATA_DIR / "ipc_athlete_master_registry.json", "r", encoding="utf-8") as f:
        ipc_registry = json.load(f)
    athletes = ipc_registry.get("athletes", [])

    # Boxscore unique athletes across Paralympic matches
    boxscore_athletes = set()
    for m in par_matches:
        for b in m.get("box_scores_a", []) + m.get("box_scores_b", []):
            name = b.get("name") or b.get("athlete_name")
            if name:
                boxscore_athletes.add(name.strip().upper())

    # Build tournament breakdown
    tournaments_breakdown = {
        "Athens 2004": {"matches": 24, "year": 2004, "governing_body": "IPC", "tier": "TIER_1_OFFICIAL_RESULTS_BOOK"},
        "Beijing 2008": {"matches": 20, "year": 2008, "governing_body": "IPC", "tier": "TIER_1_OFFICIAL_RESULTS_BOOK"},
        "London 2012": {"matches": 20, "year": 2012, "governing_body": "IPC", "tier": "TIER_1_OFFICIAL_RESULTS_BOOK"},
        "Rio 2016": {"matches": 18, "year": 2016, "governing_body": "IPC", "tier": "TIER_1_OFFICIAL_RESULTS_BOOK"},
        "Tokyo 2020": {"matches": 18, "year": 2020, "governing_body": "IPC", "tier": "TIER_1_OFFICIAL_RESULTS_BOOK"},
        "Paris 2024": {"matches": 20, "year": 2024, "governing_body": "IPC", "tier": "TIER_1_OFFICIAL_RESULTS_BOOK"},
        "2026 World Championship": {"matches": 46, "year": 2026, "governing_body": "WWR", "tier": "TIER_2_OFFICIAL_COMPETITION_DATA"},
        "Canada Cup / Lakeshore / Shibuya Invitationals": {"matches": exp_matches_count, "year": 2024, "governing_body": "Invitational", "tier": "TIER_3_INVITATIONAL_RESULTS"}
    }

    manifest = {
        "metadata": {
            "title": "MurderBall Canonical Data & Provenance Manifest",
            "version": "v4.0.0-canonical-integrity",
            "last_reconciled": "2026-10-30",
            "governance": "AQX Sports Analytics Data Bowl 4.0 Independent Review Standard"
        },
        "canonical_counts": {
            "paralympic_matches_reconciled": len(par_matches),
            "world_championship_2026_matches": len(wc_matches),
            "expanded_invitational_matches": exp_matches_count,
            "total_official_tournament_matches": len(par_matches) + len(wc_matches),
            "total_platform_matches_cataloged": len(par_matches) + len(wc_matches) + exp_matches_count,
            "total_continuous_stints": len(stints),
            "total_master_registry_athletes": len(athletes),
            "unique_paralympic_boxscore_athletes": len(boxscore_athletes),
            "total_recorded_events": sum(len(m.get("events", [])) for m in par_matches),
            "total_recorded_timeouts": sum(sum(1 for e in m.get("events", []) if e.get("event_type") == "TIMEOUT") for m in par_matches),
            "total_recorded_turnovers": sum(sum(1 for e in m.get("events", []) if e.get("event_type") in ["TURNOVER", "STEAL"]) for m in par_matches)
        },
        "count_discrepancy_resolutions": {
            "header_181_matches_explanation": (
                "The 181 figure in legacy headers was computed as 120 Paralympic matches + 37 Invitational matches + 24 WC 2026 group stage matches. "
                "The canonical count is 166 official international championship matches (120 Paralympic + 46 World Championship 2026) "
                "or 203 total matches when including the 37 invitational matches."
            ),
            "athletes_329_vs_204_explanation": (
                "329 is the comprehensive count of registered international athletes in the IPC Master Registry (ipc_athlete_master_registry.json). "
                "204 is the subset of unique athlete profiles appearing in Paralympic match box scores across Athens 2004 to Paris 2024."
            ),
            "stints_5148_vs_5123_explanation": (
                "5,148 is the verified total continuous stint intervals in all_stints.json. "
                "The 5,123 count previously seen was caused by match PAR24_M20 in all_paralympic_matches.json holding an older 13-stint extract instead of its full 38 stints. "
                "PAR24_M20 has now been canonically synchronized, establishing 5,148 stints across both datasets."
            )
        },
        "tournament_breakdown": tournaments_breakdown,
        "epistemic_trust_tiers": {
            "VERIFIED_OBSERVATION": "Directly extracted from and reconciled against official IPC results books or JWRF/WWR official publications.",
            "REPRODUCED_ANALYSIS": "Derived mathematically and statistically from verified observations using fully executable, deterministic code.",
            "VALIDATED_PREDICTION": "Predictive model forecast strictly evaluated against out-of-time, un-leaked historical competition outcomes.",
            "MODEL_DERIVED_ESTIMATE": "Statistical output dependent on explicit model assumptions (e.g., win probability models, Elo updates).",
            "EXPLORATORY_RESULT": "Statistical association that reveals interesting patterns but lacks definitive causal confirmation or exhibits confounding.",
            "HYPOTHETICAL_SCENARIO": "Counterfactual tactical simulation or hypothetical decision that did not occur in recorded history.",
            "UNSUPPORTED_OR_WITHDRAWN": "Claims lacking empirical measurement in official records (e.g., 'uncontested tries' without tracking data)."
        }
    }

    out1 = DATA_DIR / "canonical_data_manifest.json"
    out2 = FRONTEND_DATA_DIR / "canonical_data_manifest.json"

    with open(out1, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print(f"Wrote canonical data manifest to {out1}")

    with open(out2, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print(f"Synced canonical data manifest to {out2}")

    return manifest

if __name__ == "__main__":
    m = generate_canonical_manifest()
    print("Canonical Counts:")
    for k, v in m["canonical_counts"].items():
        print(f"  {k}: {v}")
