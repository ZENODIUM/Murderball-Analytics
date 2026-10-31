"""
Roster Parser for Wheelchair Rugby Paralympic Results Books.
Extracts official rosters with sport class, bib numbers, names, gender, DOB, club, coaching staff.
"""

import pymupdf
import re
import os
import json
import sys
from typing import Dict, List, Any

sys.stdout.reconfigure(encoding='utf-8')

def parse_rosters_for_tournament(tournament_name: str, pdf_path: str, roster_pages: range) -> Dict[str, Any]:
    doc = pymupdf.open(pdf_path)
    teams = {}

    for p_no in roster_pages:
        if p_no >= len(doc):
            continue
        page = doc[p_no]
        text = page.get_text("text")
        lines = [l.strip() for l in text.split("\n") if l.strip()]

        # Identify country code and name
        team_code = None
        team_name = None

        for line in lines[:15]:
            m = re.search(r'([A-Z]{3})\s*-\s*([A-Za-z\s]+)', line)
            if m and len(m.group(1)) == 3:
                team_code = m.group(1).strip()
                team_name = m.group(2).strip()
                break
            m2 = re.search(r'([A-Za-z\s]+)\s*\(([A-Z]{3})\)', line)
            if m2 and len(m2.group(2)) == 3:
                team_name = m2.group(1).strip()
                team_code = m2.group(2).strip()
                break

        if not team_code:
            continue

        # Parse coaching staff
        coach = None
        assistant_coach = None
        for i, line in enumerate(lines):
            if re.match(r'^Coach:?$', line, re.IGNORECASE) and i + 1 < len(lines):
                coach = lines[i+1]
            elif re.match(r'^Assistant Coach:?$', line, re.IGNORECASE) and i + 1 < len(lines):
                assistant_coach = lines[i+1]

        # Parse team colours
        uniform_1 = {}
        uniform_2 = {}
        for i, line in enumerate(lines):
            if "Uniform 1" in line and i + 2 < len(lines):
                uniform_1 = {"top": lines[i+1], "bottom": lines[i+2]}
            elif "Uniform 2" in line and i + 2 < len(lines):
                uniform_2 = {"top": lines[i+1], "bottom": lines[i+2]}
            elif "Dark" in line and i + 2 < len(lines):
                uniform_1 = {"top": lines[i+1], "bottom": lines[i+2]}
            elif "Light" in line and i + 2 < len(lines):
                uniform_2 = {"top": lines[i+1], "bottom": lines[i+2]}

        players = []

        # 1. Strategy A: Line-by-line state machine for London and Beijing
        # Matches:
        # Bib (or "Bib Name") -> Name (if separate) -> Class (0.5..3.5) -> DOB -> Gender (optional) -> Club
        i = 0
        while i < len(lines):
            line = lines[i]

            # Check for combined "10 BOND Chris"
            comb_m = re.match(r'^(\d{1,2})\s+([A-Za-z\s,\.\'\-]+)$', line)
            if comb_m and i + 1 < len(lines) and re.match(r'^(?:0\.5|1\.0|1\.5|2\.0|2\.5|3\.0|3\.5)$', lines[i+1]):
                bib = int(comb_m.group(1))
                name = comb_m.group(2).strip()
                sclass = float(lines[i+1])
                gender = "M"
                dob = ""
                club = ""
                offset = 2
                if i + offset < len(lines) and re.search(r'\d{1,2}\s+[A-Z]{3}\s+\d{4}', lines[i+offset]):
                    dob = lines[i+offset]
                    offset += 1
                if i + offset < len(lines) and lines[i+offset] in ["M", "F"]:
                    gender = lines[i+offset]
                    offset += 1
                if i + offset < len(lines) and not re.match(r'^(?:\d|Coach|Legend|Team|Shorts|Shirts|Dark|Light|WRX)', lines[i+offset]):
                    club = lines[i+offset]

                clean_name = re.sub(r'\s*\([C]\)', '', name).strip()
                players.append({
                    "bib": bib,
                    "name": clean_name,
                    "raw_name": name,
                    "is_captain": "(C)" in name,
                    "sport_class": sclass,
                    "gender": gender,
                    "dob": dob,
                    "club": club
                })
                i += offset
                continue

            # Check for separate Bib on line, Name on next line, Class on next line
            if re.match(r'^\d{1,2}$', line) and i + 2 < len(lines):
                bib_candidate = int(line)
                name_candidate = lines[i+1]
                class_candidate = lines[i+2]
                if re.match(r'^(?:0\.5|1\.0|1\.5|2\.0|2\.5|3\.0|3\.5)$', class_candidate) and not re.match(r'^\d', name_candidate):
                    bib = bib_candidate
                    name = name_candidate
                    sclass = float(class_candidate)
                    gender = "M"
                    dob = ""
                    club = ""
                    offset = 3
                    if i + offset < len(lines) and re.search(r'\d{1,2}\s+[A-Z]{3}\s+\d{4}', lines[i+offset]):
                        dob = lines[i+offset]
                        offset += 1
                    if i + offset < len(lines) and lines[i+offset] in ["M", "F"]:
                        gender = lines[i+offset]
                        offset += 1
                    if i + offset < len(lines) and not re.match(r'^(?:\d|Coach|Legend|Team|Class|WHEELCHAIR|WRX)', lines[i+offset]):
                        club = lines[i+offset]

                    clean_name = re.sub(r'\s*\([C]\)', '', name).strip()
                    players.append({
                        "bib": bib,
                        "name": clean_name,
                        "raw_name": name,
                        "is_captain": "(C)" in name,
                        "sport_class": sclass,
                        "gender": gender,
                        "dob": dob,
                        "club": club
                    })
                    i += offset
                    continue

            # Check for Class first format (Paris/Tokyo): Class -> Bib -> Name -> Gender -> DOB -> Club
            if re.match(r'^(?:0\.5|1\.0|1\.5|2\.0|2\.5|3\.0|3\.5)$', line) and i + 2 < len(lines):
                if re.match(r'^\d{1,2}$', lines[i+1]):
                    sclass = float(line)
                    bib = int(lines[i+1])
                    name = lines[i+2]
                    gender = "M"
                    dob = ""
                    club = ""
                    offset = 3
                    if i + offset < len(lines) and lines[i+offset] in ["M", "F"]:
                        gender = lines[i+offset]
                        offset += 1
                    elif i + offset + 1 < len(lines) and lines[i+offset+1] in ["M", "F"]:
                        offset += 1
                        gender = lines[i+offset]
                        offset += 1

                    if i + offset < len(lines) and re.search(r'\d{1,2}\s+[A-Z]{3}\s+\d{4}', lines[i+offset]):
                        dob = lines[i+offset]
                        offset += 1
                    if i + offset < len(lines) and not re.match(r'^(?:0\.5|1\.0|1\.5|2\.0|2\.5|3\.0|3\.5|Coach|Legend|Team)', lines[i+offset]):
                        club = lines[i+offset]

                    clean_name = re.sub(r'\s*\([C]\)', '', name).strip()
                    players.append({
                        "bib": bib,
                        "name": clean_name,
                        "raw_name": name,
                        "is_captain": "(C)" in name,
                        "sport_class": sclass,
                        "gender": gender,
                        "dob": dob,
                        "club": club
                    })
                    i += offset
                    continue

            # Athens 2004 format: "1  SABLJAK Ella  2.5"
            m_ath = re.match(r'^(\d{1,2})\s+([A-Za-z\s,\.\'\-]+?)\s+([0-3]\.[05])$', line)
            if m_ath:
                players.append({
                    "bib": int(m_ath.group(1)),
                    "name": m_ath.group(2).strip(),
                    "raw_name": m_ath.group(2).strip(),
                    "is_captain": "(C)" in line,
                    "sport_class": float(m_ath.group(3)),
                    "gender": "M",
                    "dob": "",
                    "club": ""
                })
            i += 1

        # Deduplicate players by bib
        unique_players = {}
        for p in players:
            if p["bib"] not in unique_players:
                unique_players[p["bib"]] = p

        teams[team_code] = {
            "team_code": team_code,
            "team_name": team_name,
            "coach": coach,
            "assistant_coach": assistant_coach,
            "uniform_1": uniform_1,
            "uniform_2": uniform_2,
            "players": sorted(list(unique_players.values()), key=lambda x: x["bib"]),
            "player_count": len(unique_players)
        }

    doc.close()
    return teams

if __name__ == "__main__":
    tourneys = [
        ("Paris 2024", r"V:\Projects\MurderBall\Docs\PG2024-Overall-results-book.pdf", range(5, 13)),
        ("Tokyo 2020", r"V:\Projects\MurderBall\Docs\2020-Tokyo-Wheelchair-Rugby-Results-Book.pdf", range(11, 19)),
        ("Rio 2016", r"V:\Projects\MurderBall\Docs\2016_Rio_Wheelchair_Rugby_Results_Book.pdf", range(7, 15)),
        ("London 2012", r"V:\Projects\MurderBall\Docs\2012_London_Wheelchair_Rugby_Results_Book.pdf", range(4, 12)),
        ("Beijing 2008", r"V:\Projects\MurderBall\Docs\2008_Beijing_Wheelchair_Rugby_Results_Book.pdf", range(4, 12)),
        ("Athens 2004", r"V:\Projects\MurderBall\Docs\2004_Athens_Wheelchair_Rugby_Results_Book.pdf", range(4, 12))
    ]

    all_tourney_rosters = {}
    for t_name, path, prange in tourneys:
        res = parse_rosters_for_tournament(t_name, path, prange)
        print(f"\n{t_name}: Found rosters for {len(res)} teams:")
        for tcode, tdata in res.items():
            print(f"  {tcode} ({tdata['team_name']}): {tdata['player_count']} players | Coach: {tdata['coach']}")
        all_tourney_rosters[t_name] = res

    with open("data/extracted/all_paralympic_rosters.json", "w", encoding="utf-8") as f:
        json.dump(all_tourney_rosters, f, indent=2)
    print("\nSaved all rosters to data/extracted/all_paralympic_rosters.json")
