"""
Canonical Reconciliation Script for the 2026 WWR World Championship
Source: Japan Wheelchair Rugby Federation (JWRF) Official Publication
URL: https://jwrf.jp/national_team/2026wwrworldchampionship/
Host: Brazilian Paralympic Training Centre, São Paulo, Brazil
Dates: August 17 to August 23, 2026
"""

import json
import os
import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data" / "extracted"
FRONTEND_DATA_DIR = BASE_DIR / "frontend" / "public" / "data"

TEAM_MAP = {
    "オーストラリア": "AUS",
    "アメリカ": "USA",
    "日本": "JPN",
    "イギリス": "GBR",
    "フランス": "FRA",
    "カナダ": "CAN",
    "ブラジル": "BRA",
    "デンマーク": "DEN",
    "ドイツ": "GER",
    "ニュージーランド": "NZL",
    "コロンビア": "COL",
    "オランダ": "NED"
}

POOL_A_TEAMS = ["AUS", "USA", "CAN", "NED", "BRA", "NZL"]
POOL_B_TEAMS = ["JPN", "GBR", "FRA", "DEN", "GER", "COL"]

STAGE_MAP = {
    31: ("Quarter-Final 1 (Q1)", "Knockout - Quarterfinals"),
    32: ("9-12th Placement Crossover", "Placement 9-12"),
    33: ("Quarter-Final 2 (Q2)", "Knockout - Quarterfinals"),
    34: ("9-12th Placement Crossover", "Placement 9-12"),
    35: ("Quarter-Final 3 (Q3)", "Knockout - Quarterfinals"),
    36: ("Quarter-Final 4 (Q4)", "Knockout - Quarterfinals"),
    37: ("5-8th Placement Crossover", "Placement 5-8"),
    38: ("11th-12th Place Match", "Placement 11-12"),
    39: ("5-8th Placement Crossover", "Placement 5-8"),
    40: ("9th-10th Place Match", "Placement 9-10"),
    41: ("Semi-Final 1", "Knockout - Semifinals"),
    42: ("Semi-Final 2", "Knockout - Semifinals"),
    43: ("7th-8th Place Match", "Placement 7-8"),
    44: ("5th-6th Place Match", "Placement 5-6"),
    45: ("Bronze Medal Match (3rd-4th)", "Medals - Bronze"),
    46: ("Gold Medal Match (1st-2nd)", "Medals - Gold")
}

def parse_jwrf_text():
    txt_path = BASE_DIR / "jwrf_2026.txt"
    with open(txt_path, "r", encoding="utf-8") as f:
        content = f.read()

    lines = [l.strip() for l in content.splitlines() if l.strip()]

    date_patterns = {
        "8月17日": "2026-08-17",
        "8月18日": "2026-08-18",
        "8月19日": "2026-08-19",
        "8月20日": "2026-08-20",
        "8月21日": "2026-08-21",
        "8月22日": "2026-08-22",
        "8月23日": "2026-08-23"
    }

    current_date = None
    raw_games = {}

    for i, line in enumerate(lines):
        for dp, dt in date_patterns.items():
            if dp in line:
                current_date = dt
                break

        m = re.match(r"^Game\s*(4[0-6]|[1-3]\d|[1-9])(.*)", line)
        if m:
            gnum = int(m.group(1))
            extra = m.group(2)
            time_val = ""
            if i > 0 and re.match(r"^\d{1,2}:\d{2}$", lines[i-1]):
                time_val = lines[i-1]

            # Forward window
            forward = lines[i+1:i+25]
            found_teams = []
            found_scores = []

            j = 0
            while j < len(forward):
                fl = forward[j]
                matched_team = None
                for t_jp, t_code in TEAM_MAP.items():
                    if t_jp in fl:
                        matched_team = t_code
                        break
                if matched_team:
                    found_teams.append(matched_team)
                    # Next line might be score
                    if j + 1 < len(forward) and forward[j+1].isdigit():
                        found_scores.append(int(forward[j+1]))
                        j += 1
                j += 1

            raw_games[gnum] = {
                "game_num": gnum,
                "date": current_date,
                "time": time_val,
                "extra": extra,
                "teams": found_teams[:2],
                "scores": found_scores[:2]
            }

    return raw_games

def build_canonical_database():
    raw_games = parse_jwrf_text()
    assert len(raw_games) == 46, f"Expected 46 games, found {len(raw_games)}"

    matches = []
    for gnum in sorted(raw_games.keys()):
        g = raw_games[gnum]
        teams = g["teams"]
        scores = g["scores"]
        assert len(teams) == 2, f"Game {gnum} teams count error: {teams}"
        assert len(scores) == 2, f"Game {gnum} scores count error: {scores}"

        t1, t2 = teams[0], teams[1]
        s1, s2 = scores[0], scores[1]
        mid = f"WC26_M{gnum:02d}"

        # Determine stage and pool
        if gnum <= 30:
            if t1 in POOL_A_TEAMS and t2 in POOL_A_TEAMS:
                pool = "Pool A"
            elif t1 in POOL_B_TEAMS and t2 in POOL_B_TEAMS:
                pool = "Pool B"
            else:
                pool = "Group Competition"
            stage_desc = f"Group Competition ({pool})"
            stage_category = "Preliminary Round"
        else:
            stage_desc, stage_category = STAGE_MAP.get(gnum, ("Classification/Knockout", "Knockout"))
            pool = "Knockout/Placement"

        court = "Court 1" if "コート1" in g["extra"] else ("Court 2" if "コート2" in g["extra"] else "Court 1")

        winner = t1 if s1 > s2 else t2
        margin = abs(s1 - s2)

        match_record = {
            "match_id": mid,
            "match_number": gnum,
            "stage": stage_desc,
            "stage_category": stage_category,
            "pool": pool,
            "date": g["date"],
            "time": g["time"],
            "court": court,
            "team_a": t1,
            "team_b": t2,
            "score_a": s1,
            "score_b": s2,
            "final_score": f"{s1} - {s2}",
            "winner": winner,
            "margin": margin,
            "evidence_tier": "VERIFIED_OBSERVATION",
            "verification_status": "OFFICIALLY_VERIFIED",
            "source": "Japan Wheelchair Rugby Federation (JWRF) Official 2026 WWR World Championship Results",
            "source_url": "https://jwrf.jp/national_team/2026wwrworldchampionship/",
            "in_primary_24_cohort": gnum <= 24
        }
        matches.append(match_record)

    # Standings & Awards directly from JWRF official report
    final_standings = [
        {"position": 1, "team": "USA", "medal": "Gold", "country": "United States", "wins": 8, "losses": 1},
        {"position": 2, "team": "AUS", "medal": "Silver", "country": "Australia", "wins": 7, "losses": 1},
        {"position": 3, "team": "JPN", "medal": "Bronze", "country": "Japan", "wins": 7, "losses": 1},
        {"position": 4, "team": "GBR", "medal": "None", "country": "Great Britain", "wins": 5, "losses": 3},
        {"position": 5, "team": "FRA", "medal": "None", "country": "France", "wins": 5, "losses": 3},
        {"position": 6, "team": "DEN", "medal": "None", "country": "Denmark", "wins": 3, "losses": 5},
        {"position": 7, "team": "CAN", "medal": "None", "country": "Canada", "wins": 3, "losses": 5},
        {"position": 8, "team": "NED", "medal": "None", "country": "Netherlands", "wins": 2, "losses": 6},
        {"position": 9, "team": "GER", "medal": "None", "country": "Germany", "wins": 3, "losses": 4},
        {"position": 10, "team": "COL", "medal": "None", "country": "Colombia", "wins": 1, "losses": 6},
        {"position": 11, "team": "BRA", "medal": "None", "country": "Brazil", "wins": 3, "losses": 4},
        {"position": 12, "team": "NZL", "medal": "None", "country": "New Zealand", "wins": 0, "losses": 7}
    ]

    awards = {
        "mvp": {"name": "Charles Aoki", "classification": 3.0, "team": "USA"},
        "all_tournament_team": [
            {"position_class": 0.5, "name": "Jack Smith", "team": "GBR"},
            {"position_class": 1.0, "name": "Hitoshi Ogawa", "team": "JPN"},
            {"position_class": 1.5, "name": "Hector Loma", "team": "NED"},
            {"position_class": 2.0, "name": "Cody Caldwell", "team": "CAN"},
            {"position_class": 2.5, "name": "Alejandro Pabon", "team": "USA"},
            {"position_class": 3.0, "name": "Yukinobu Ike", "team": "JPN"},
            {"position_class": 3.5, "name": "Katsuya Hashimoto", "team": "JPN"}
        ]
    }

    payload = {
        "metadata": {
            "tournament_name": "2026 WWR World Championship",
            "edition": 9,
            "governing_body": "World Wheelchair Rugby (WWR)",
            "host_city": "São Paulo",
            "host_country": "Brazil",
            "venue": "Centro de Treinamento Paralímpico Brasileiro (Brazilian Paralympic Training Centre)",
            "dates": "August 17–23, 2026",
            "total_matches": 46,
            "total_tournament_matches": 46,
            "participating_countries": 12,
            "evidence_tier": "VERIFIED_OBSERVATION",
            "reconciliation_source": "https://jwrf.jp/national_team/2026wwrworldchampionship/",
            "reconciliation_date": "2026-10-30",
            "tournament_breakdown": {
                "group_competition_matches": 30,
                "placement_and_knockout_matches": 16
            },
            "evaluation_cohorts": {
                "full_tournament_cohort": {"count": 46},
                "group_competition_cohort": {"count": 30},
                "primary_prospective_24_cohort": {"count": 24},
                "placement_and_knockout_cohort": {"count": 16}
            },
            "discrepancy_repair_summary": [
                "Corrected championship dates from August 11–16, 2026 to official August 17–23, 2026.",
                "Removed South Korea (unqualified / did not participate) and accurately added Netherlands (Pool A participant, finished 8th).",
                "Reconciled all 46 match fixtures, dates, courts, and official scores against JWRF official tournament results publication.",
                "Game 1 canonically reconciled as AUS 50 - 41 CAN on August 17 (previously USA 58 - 42 BRA on August 11).",
                "Game 2 canonically reconciled as BRA 47 - 49 NED on August 17 (previously GBR 54 - 46 GER).",
                "Game 24 canonically reconciled as AUS 54 - 44 USA on August 20 (previously DEN 54 - 43 COL).",
                "Game 45 Bronze Medal match canonically reconciled as GBR 47 - 54 JPN on August 23 (previously JPN 54 - 47 GBR on August 16).",
                "Game 46 Gold Medal match canonically reconciled as AUS 51 - 57 USA on August 23 (previously dated August 16)."
            ]
        },
        "podium": {
            "gold": {"team": "USA", "country": "United States", "final_score": "57 - 51", "runner_up": "AUS"},
            "silver": {"team": "AUS", "country": "Australia"},
            "bronze": {"team": "JPN", "country": "Japan", "bronze_score": "54 - 47", "fourth": "GBR"}
        },
        "final_standings": final_standings,
        "individual_awards": awards,
        "matches": matches
    }

    # Save to data/extracted and frontend/public/data
    out_path1 = DATA_DIR / "world_championship_2026_results.json"
    out_path2 = FRONTEND_DATA_DIR / "world_championship_2026_results.json"

    with open(out_path1, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
    print(f"Wrote canonical database to {out_path1}")

    with open(out_path2, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
    print(f"Synced canonical database to {out_path2}")

    return matches

if __name__ == "__main__":
    matches = build_canonical_database()
    print(f"Successfully generated and reconciled {len(matches)} official 2026 WC matches.")
    print("Match 1:", matches[0])
    print("Match 2:", matches[1])
    print("Match 24:", matches[23])
    print("Match 45:", matches[44])
    print("Match 46:", matches[45])
