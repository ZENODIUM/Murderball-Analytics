"""
Full Orchestrator for Wheelchair Rugby Data Pipeline.
AQX Sports Analytics Data Bowl 4.0.
Extracts, validates, reconciles, and exports:
- 120 detailed Paralympic matches across 6 tournaments
- 4 World Championship tournament results
- Lineup stints with continuous 4-player tracking
- Comprehensive data quality audit
"""

import sys
sys.path.insert(0, r"V:\Projects\MurderBall")
sys.stdout.reconfigure(encoding='utf-8')

import os
import json
import pymupdf
import pandas as pd
from typing import Dict, List, Tuple, Any
from backend.pipeline.paralympic_extractor import extract_single_match
from backend.pipeline.wc_parser import parse_wc_2022, parse_wc_2018, parse_wc_2014, parse_wc_1995

DOCS_DIR = r"V:\Projects\MurderBall\Docs"

TOURNAMENTS_CONFIG = [
    {
        "name": "Paris 2024",
        "year": 2024,
        "pdf": os.path.join(DOCS_DIR, "PG2024-Overall-results-book.pdf"),
        "expected_matches": 20
    },
    {
        "name": "Tokyo 2020",
        "year": 2020,
        "pdf": os.path.join(DOCS_DIR, "2020-Tokyo-Wheelchair-Rugby-Results-Book.pdf"),
        "expected_matches": 18
    },
    {
        "name": "Rio 2016",
        "year": 2016,
        "pdf": os.path.join(DOCS_DIR, "2016_Rio_Wheelchair_Rugby_Results_Book.pdf"),
        "expected_matches": 18
    },
    {
        "name": "London 2012",
        "year": 2012,
        "pdf": os.path.join(DOCS_DIR, "2012_London_Wheelchair_Rugby_Results_Book.pdf"),
        "expected_matches": 20
    },
    {
        "name": "Beijing 2008",
        "year": 2008,
        "pdf": os.path.join(DOCS_DIR, "2008_Beijing_Wheelchair_Rugby_Results_Book.pdf"),
        "expected_matches": 20
    },
    {
        "name": "Athens 2004",
        "year": 2004,
        "pdf": os.path.join(DOCS_DIR, "2004_Athens_Wheelchair_Rugby_Results_Book.pdf"),
        "expected_matches": 24
    }
]

def find_match_ranges_in_doc(doc: pymupdf.Document) -> List[Tuple[int, int]]:
    """Identifies the start (C73) and end (before next C73 or section end) page of each match."""
    c73_pages = []
    for p_idx in range(len(doc)):
        p_num = p_idx + 1
        text = doc[p_idx].get_text("text")

        is_c73 = False
        if ("_C73" in text or "_73" in text or "C73" in text) and ("Match No" in text or "Game No" in text):
            is_c73 = True
        elif ("Match No:" in text or "Game No:" in text) and ("Referees:" in text or "Referees :" in text) and ("P1" in text or "Q1" in text):
            is_c73 = True

        if is_c73:
            c73_pages.append(p_num)

    # Remove consecutive pages if C69 also had C73 text
    # In Paralympic books, C73 is separated by at least 4 pages
    filtered_c73 = []
    for p in c73_pages:
        if not filtered_c73 or p - filtered_c73[-1] >= 4:
            filtered_c73.append(p)

    ranges = []
    for i in range(len(filtered_c73)):
        start_p = filtered_c73[i]
        if i + 1 < len(filtered_c73):
            end_p = filtered_c73[i+1] - 1
        else:
            # Last match ends before Cumulative Statistics / Overall Statistics
            end_p = min(start_p + 8, len(doc))
        ranges.append((start_p, end_p))
    return ranges

def run_extraction_pipeline():
    print("================================================================")
    print("STARTING FULL WHEELCHAIR RUGBY EXTRACTION PIPELINE")
    print("================================================================")

    os.makedirs("data/extracted/matches", exist_ok=True)
    os.makedirs("data/extracted/tournaments", exist_ok=True)
    os.makedirs("data/extracted/stints", exist_ok=True)
    os.makedirs("data/extracted/players", exist_ok=True)

    all_extracted_matches = []
    all_stints_list = []
    tournament_summaries = {}

    total_expected = 120
    total_parsed = 0
    total_score_reconciled = 0
    total_minutes_reconciled = 0

    for cfg in TOURNAMENTS_CONFIG:
        t_name = cfg["name"]
        year = cfg["year"]
        pdf_path = cfg["pdf"]
        expected = cfg["expected_matches"]

        print(f"\nProcessing {t_name} ({year})...")
        doc = pymupdf.open(pdf_path)
        ranges = find_match_ranges_in_doc(doc)
        print(f"  Identified {len(ranges)} match page ranges (Expected: {expected})")

        t_matches = []
        t_score_rec = 0
        t_min_rec = 0
        t_stints = 0
        t_events = 0

        for r_idx, (start_p, end_p) in enumerate(ranges):
            match_rec = extract_single_match(doc, start_p, end_p, t_name, year)
            if match_rec:
                t_matches.append(match_rec)
                all_extracted_matches.append(match_rec)

                # Collect stints
                for s in match_rec.stints:
                    all_stints_list.append(s.model_dump())

                t_stints += len(match_rec.stints)
                t_events += len(match_rec.events)

                if match_rec.validation.score_reconciled:
                    t_score_rec += 1
                if match_rec.validation.athlete_minutes_reconciled:
                    t_min_rec += 1

                # Save individual match JSON
                match_file = f"data/extracted/matches/{match_rec.match_id}.json"
                with open(match_file, "w", encoding="utf-8") as mf:
                    json.dump(match_rec.model_dump(), mf, indent=2)

        doc.close()

        total_parsed += len(t_matches)
        total_score_reconciled += t_score_rec
        total_minutes_reconciled += t_min_rec

        tournament_summaries[t_name] = {
            "year": year,
            "expected_matches": expected,
            "parsed_matches": len(t_matches),
            "score_reconciled": t_score_rec,
            "score_reconciliation_rate": round(t_score_rec / max(1, len(t_matches)), 3),
            "minutes_reconciled": t_min_rec,
            "minutes_reconciliation_rate": round(t_min_rec / max(1, len(t_matches)), 3),
            "total_events": t_events,
            "total_stints": t_stints
        }

        print(f"  Done: Parsed {len(t_matches)}/{expected} | Score Reconciled: {t_score_rec}/{len(t_matches)} | Total Events: {t_events} | Total Stints: {t_stints}")

    # Process World Championships
    print("\nProcessing World Championships Summary Material...")
    wc22 = parse_wc_2022(os.path.join(DOCS_DIR, "Results-Wolrds-2022.pdf"))
    wc18 = parse_wc_2018(os.path.join(DOCS_DIR, "TD-Results-summary-report-WC-2018.pdf"))
    wc14 = parse_wc_2014(os.path.join(DOCS_DIR, "WWR_2014_Odense_results.pdf"))
    wc95 = parse_wc_1995(os.path.join(DOCS_DIR, "WWRC_1995_Nottwil_Switzerland_results.pdf"))

    total_wc_matches = len(wc22['matches']) + len(wc18['matches']) + len(wc14['matches']) + len(wc95['matches'])
    print(f"  World Championships Matches Extracted: {total_wc_matches}")

    # Export all_stints dataframe and parquet
    df_stints = pd.DataFrame(all_stints_list)
    df_stints.to_parquet("data/extracted/all_stints.parquet", index=False)
    with open("data/extracted/all_stints.json", "w", encoding="utf-8") as sf:
        json.dump(all_stints_list, sf)
    print(f"\nExported {len(all_stints_list)} lineup stints to data/extracted/all_stints.parquet and json")

    # Save all matches summary
    all_matches_dict = [m.model_dump() for m in all_extracted_matches]
    with open("data/extracted/all_paralympic_matches.json", "w", encoding="utf-8") as amf:
        json.dump(all_matches_dict, amf)
    print(f"Exported {len(all_matches_dict)} detailed Paralympic matches to data/extracted/all_paralympic_matches.json")

    # Build complete Quality Audit Report
    quality_report = {
        "pipeline_version": "1.0.0",
        "total_documents_processed": 10,
        "detailed_paralympic_tournaments": 6,
        "world_championships_summary_tournaments": 4,
        "paralympic_matches_expected": total_expected,
        "paralympic_matches_extracted": total_parsed,
        "paralympic_extraction_rate": round(total_parsed / total_expected, 3),
        "score_reconciled_count": total_score_reconciled,
        "score_reconciliation_rate": round(total_score_reconciled / max(1, total_parsed), 3),
        "minutes_reconciled_count": total_minutes_reconciled,
        "minutes_reconciliation_rate": round(total_minutes_reconciled / max(1, total_parsed), 3),
        "total_play_by_play_events": sum(len(m.events) for m in all_extracted_matches),
        "total_scoring_events": sum(len([e for e in m.events if e.event_type in ["TRY", "PENALTY_TRY"]]) for m in all_extracted_matches),
        "total_lineup_stints_reconstructed": len(all_stints_list),
        "total_championship_summary_matches": total_wc_matches,
        "tournaments": tournament_summaries
    }

    with open("data/extracted/data_quality_report.json", "w", encoding="utf-8") as qf:
        json.dump(quality_report, qf, indent=2)
    print("\n================================================================")
    print("EXTRACTION COMPLETE - QUALITY REPORT:")
    print(json.dumps(quality_report, indent=2))
    print("================================================================")

if __name__ == "__main__":
    run_extraction_pipeline()
