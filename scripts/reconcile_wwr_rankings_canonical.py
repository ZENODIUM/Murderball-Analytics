import json
import os
import shutil
from bs4 import BeautifulSoup

def reconcile_rankings():
    html_path = "scripts/wwr_rankings.html"
    with open(html_path, "r", encoding="utf-8") as f:
        html = f.read()

    soup = BeautifulSoup(html, "html.parser")
    ranklist_divs = soup.find_all("div", class_="ranklist")

    ranked_countries = []
    unranked_countries = []
    separator_entries = []

    for div in ranklist_divs:
        spans = [s.get_text().strip() for s in div.find_all("span")]
        if not spans:
            continue
        country = spans[0]

        # Parse fields
        entry = {
            "country": country,
            "raw_spans": spans
        }
        for s in spans[1:]:
            if ":" in s:
                k, v = s.split(":", 1)
                clean_k = k.strip().lower().replace(" ", "_")
                entry[clean_k] = v.strip()
            else:
                entry["extra"] = s

        # Check if separator
        if "end of ranked" in country.lower() or "separator" in country.lower():
            separator_entries.append(entry)
            continue

        rank_val = entry.get("rank", "").strip()
        points_val = entry.get("points", "").strip()

        # Check if unranked (rank is '-' or empty, or points is 0 with '-' previous)
        if rank_val in ("-", "") or (points_val == "0" and rank_val not in [str(i) for i in range(1, 33)]):
            entry["status"] = "Unranked / Non-Active"
            entry["data_quality_flag"] = "UNRANKED"
            unranked_countries.append(entry)
        else:
            # Ranked country (Ranks 1 to 32)
            # Add data quality flags for anomalies
            if country.lower() == "israel":
                entry["data_quality_flag"] = "MALFORMED_POINTS_STRING"
                entry["notes"] = "Official WWR published points as 'c' instead of numerical rating. Preserved raw from source."
            elif country.lower() == "poland":
                entry["data_quality_flag"] = "ARITHMETIC_INCONSISTENCY"
                entry["notes"] = "Points listed as 41.60 with previous 4.60, but difference listed as 0. Preserved raw from source."
            else:
                entry["data_quality_flag"] = "NORMAL"
            ranked_countries.append(entry)

    print(f"Ranked countries: {len(ranked_countries)} (Expected: 32)")
    print(f"Unranked countries: {len(unranked_countries)} (Expected: 8)")
    print(f"Separator entries: {len(separator_entries)} (Expected: 1)")

    output_payload = {
        "snapshot_date": "August 29, 2026",
        "source_url": "https://worldwheelchair.rugby/world-rankings/",
        "note": "Official snapshot as of August 29, 2026. Anomalies preserved and documented.",
        "metadata": {
            "title": "Official World Wheelchair Rugby (WWR) World Rankings",
            "snapshot_date": "August 29, 2026",
            "source_url": "https://worldwheelchair.rugby/world-rankings/",
            "total_raw_elements": len(ranklist_divs),
            "total_ranked_members": len(ranked_countries),
            "total_unranked_members": len(unranked_countries),
            "curator": "MurderBall Independent Audit Engine",
            "anomalies_preserved": ["Israel points='c'", "Poland diff=0 (41.60 vs 4.60)"]
        },
        "ranked_countries": ranked_countries,
        "unranked_countries": unranked_countries,
        "separator_divider": separator_entries[0] if separator_entries else None,
        "rankings": ranked_countries, # For backward compatibility with legacy consumers expecting .rankings
        "data_anomalies_investigation": {
            "total_anomalies": 2,
            "flagged_anomalies": [
                {
                    "anomaly_id": "WWR_ANOMALY_01",
                    "country": "Israel",
                    "field": "points",
                    "raw_value": "c",
                    "expected_type": "float",
                    "description": "Malformed character 'c' present in official WWR DOM snapshot instead of numeric float.",
                    "status": "PRESERVED_RAW"
                },
                {
                    "anomaly_id": "WWR_ANOMALY_02",
                    "country": "Poland",
                    "field": "difference",
                    "points": "41.60",
                    "previous": "4.60",
                    "difference": "0",
                    "description": "Internal arithmetic mismatch: 41.60 - 4.60 = 37.00, but official difference recorded as 0.",
                    "status": "PRESERVED_RAW"
                }
            ]
        }
    }

    # Save to data/extracted/wwr_rankings_2026.json
    os.makedirs("data/extracted", exist_ok=True)
    with open("data/extracted/wwr_rankings_2026.json", "w", encoding="utf-8") as f:
        json.dump(output_payload, f, indent=2)

    # Sync to frontend/public/data/wwr_rankings_2026.json
    os.makedirs("frontend/public/data", exist_ok=True)
    shutil.copy("data/extracted/wwr_rankings_2026.json", "frontend/public/data/wwr_rankings_2026.json")
    print("Successfully saved and synced canonical wwr_rankings_2026.json!")

if __name__ == "__main__":
    reconcile_rankings()
