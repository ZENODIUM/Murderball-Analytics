"""
World Championships Summary Parser.
AQX Sports Analytics Data Bowl 4.0.
Extracts matches, tournament standings, and awards from the four World Championship documents:
- 1995 Nottwil
- 2014 Odense
- 2018 Sydney
- 2022 Vejle
"""

import pymupdf
import re
import os
import json
import sys
from typing import List, Dict, Any

sys.stdout.reconfigure(encoding='utf-8')

def parse_wc_2022(pdf_path: str) -> Dict[str, Any]:
    doc = pymupdf.open(pdf_path)
    matches = []
    standings = []
    awards = []

    # Page 1 and 2: Schedule and results
    for p_idx in [0, 1]:
        page = doc[p_idx]
        text = page.get_text("text")
        lines = [l.strip() for l in text.split("\n") if l.strip()]

        i = 0
        while i < len(lines):
            line = lines[i]
            m = re.match(r'^(\d{1,2})(?:\s*\(.*?\))?$', line)
            if m:
                game_num = int(m.group(1))
                if i + 4 < len(lines):
                    t_a = lines[i+1]
                    s_a = lines[i+2]
                    t_b = lines[i+3]
                    s_b = lines[i+4]
                    if s_a.isdigit() and s_b.isdigit():
                        matches.append({
                            "tournament": "World Championship 2022",
                            "year": 2022,
                            "game_number": game_num,
                            "team_a": re.sub(r'\s*\(\d+.*?\)', '', t_a).strip(),
                            "score_a": int(s_a),
                            "team_b": re.sub(r'\s*\(\d+.*?\)', '', t_b).strip(),
                            "score_b": int(s_b),
                            "source_pdf": "Results-Wolrds-2022.pdf",
                            "source_page": p_idx + 1
                        })
                        i += 5
                        continue
            i += 1

    # Page 3: Placings
    p3 = doc[2]
    p3_lines = [l.strip() for l in p3.get_text("text").split("\n") if l.strip()]
    i = 0
    while i < len(p3_lines):
        line = p3_lines[i]
        if line.isdigit() and int(line) <= 12 and i + 1 < len(p3_lines):
            standings.append({
                "rank": int(line),
                "team": p3_lines[i+1]
            })
            i += 2
            continue
        i += 1

    # Page 4: Awards
    p4 = doc[3]
    p4_lines = [l.strip() for l in p4.get_text("text").split("\n") if l.strip()]
    for i, line in enumerate(p4_lines):
        if line.startswith("Best ") or line == "Most Valuable Player":
            award_name = line
            player = p4_lines[i+1] if i + 1 < len(p4_lines) else ""
            country = p4_lines[i+2] if i + 2 < len(p4_lines) else ""
            awards.append({
                "award": award_name,
                "player": player,
                "country": country
            })

    doc.close()
    return {"matches": matches, "standings": standings, "awards": awards}


def parse_wc_2018(pdf_path: str) -> Dict[str, Any]:
    doc = pymupdf.open(pdf_path)
    matches = []
    standings = []
    awards = []

    # Pages 2 and 3: Game schedule and results (1..42)
    for p_idx in [1, 2]:
        page = doc[p_idx]
        text = page.get_text("text")
        lines = [l.strip() for l in text.split("\n") if l.strip()]

        i = 0
        while i < len(lines):
            line = lines[i]
            if re.match(r'^\d{1,2}$', line):
                game_num = int(line)
                window = lines[i+1:i+8]
                digit_indices = [idx for idx, w in enumerate(window) if w.isdigit()]
                if len(digit_indices) >= 2:
                    d1_idx = digit_indices[0]
                    d2_idx = digit_indices[1]
                    s_a = int(window[d1_idx])
                    s_b = int(window[d2_idx])
                    t_a_parts = [w for w in window[:d1_idx] if not re.search(r'(?:AM|PM|\d+:\d+)', w)]
                    t_b_parts = [w for w in window[d1_idx+1:d2_idx] if not re.search(r'(?:AM|PM|\d+:\d+)', w)]
                    t_a = " ".join(t_a_parts)
                    t_b = " ".join(t_b_parts)
                    if t_a and t_b and s_a > 10 and s_b > 10:
                        matches.append({
                            "tournament": "World Championship 2018",
                            "year": 2018,
                            "game_number": game_num,
                            "team_a": t_a,
                            "score_a": s_a,
                            "team_b": t_b,
                            "score_b": s_b,
                            "source_pdf": "TD-Results-summary-report-WC-2018.pdf",
                            "source_page": p_idx + 1
                        })
                        i += d2_idx + 1
                        continue
            i += 1

    # Page 4: Overall placings
    p4 = doc[3]
    p4_lines = [l.strip() for l in p4.get_text("text").split("\n") if l.strip()]
    in_placings = False
    for i, line in enumerate(p4_lines):
        if "Overall placings" in line:
            in_placings = True
            continue
        if in_placings:
            m = re.match(r'^(\d{1,2})\*?$', line)
            if m and i + 1 < len(p4_lines) and not p4_lines[i+1].isdigit():
                rank = int(m.group(1))
                team = p4_lines[i+1]
                if not any(s["rank"] == rank for s in standings):
                    standings.append({"rank": rank, "team": team})

    # Page 5: Awards
    p5 = doc[4]
    p5_lines = [l.strip() for l in p5.get_text("text").split("\n") if l.strip()]
    for i, line in enumerate(p5_lines):
        if line.startswith("Best ") or line == "Most Valuable Player":
            award_name = line
            player = p5_lines[i+1] if i + 1 < len(p5_lines) else ""
            country = p5_lines[i+2] if i + 2 < len(p5_lines) else ""
            awards.append({
                "award": award_name,
                "player": player,
                "country": country
            })

    doc.close()
    return {"matches": matches, "standings": standings, "awards": awards}


def parse_wc_2014(pdf_path: str) -> Dict[str, Any]:
    doc = pymupdf.open(pdf_path)
    matches = []
    standings = []

    p1 = doc[0]
    p1_lines = [l.strip() for l in p1.get_text("text").split("\n") if l.strip()]

    for i, line in enumerate(p1_lines):
        if line.isdigit() and int(line) <= 12 and i + 1 < len(p1_lines):
            t_name = re.sub(r'\s*\(.*?\)', '', p1_lines[i+1]).strip()
            standings.append({"rank": int(line), "team": t_name})

        m = re.search(r'(?:Gold Medal|Bronze Medal|Semi-final|5th/6th|7th/8th|9th|11th)\s*[–—]\s*(?:\d+\s+[A-Za-z]+)?:\s*([A-Za-z\s]+)\s*(\d+)[–—\-](\d+)\s*([A-Za-z\s]+)', line)
        if m:
            matches.append({
                "tournament": "World Championship 2014",
                "year": 2014,
                "team_a": m.group(1).strip(),
                "score_a": int(m.group(2)),
                "team_b": m.group(4).strip(),
                "score_b": int(m.group(3)),
                "source_pdf": "WWR_2014_Odense_results.pdf",
                "source_page": 1
            })

    doc.close()
    return {"matches": matches, "standings": standings}


def parse_wc_1995(pdf_path: str) -> Dict[str, Any]:
    doc = pymupdf.open(pdf_path)
    matches = []
    standings = []

    p1 = doc[0]
    p1_text = p1.get_text("text")
    lines = [l.strip() for l in p1_text.split("\n") if l.strip()]

    i = 0
    while i < len(lines):
        line = lines[i]
        score_m = re.match(r'^(\d{2})\s*-\s*(\d{2})$', line)
        if score_m and i >= 2:
            s_a = int(score_m.group(1))
            s_b = int(score_m.group(2))
            t_b = re.sub(r'\/.*', '', lines[i-1]).strip()
            t_a_line = lines[i-2]
            t_a = re.sub(r'\/.*', '', t_a_line).replace("vs.", "").replace("vs", "").strip()
            if t_a and t_b and t_a != t_b:
                matches.append({
                    "tournament": "World Championship 1995",
                    "year": 1995,
                    "team_a": t_a,
                    "score_a": s_a,
                    "team_b": t_b,
                    "score_b": s_b,
                    "source_pdf": "WWRC_1995_Nottwil_Switzerland_results.pdf",
                    "source_page": 1
                })
        i += 1

    p2 = doc[1]
    p2_lines = [l.strip() for l in p2.get_text("text").split("\n") if l.strip()]
    for i, line in enumerate(p2_lines):
        if re.match(r'^\d\.$', line) and i + 1 < len(p2_lines):
            rank = int(line.replace(".", ""))
            t_name = re.sub(r'\/.*', '', p2_lines[i+1]).split("(")[0].strip()
            standings.append({"rank": rank, "team": t_name})

    doc.close()
    return {"matches": matches, "standings": standings}

if __name__ == "__main__":
    docs_dir = r"V:\Projects\MurderBall\Docs"

    wc22 = parse_wc_2022(os.path.join(docs_dir, "Results-Wolrds-2022.pdf"))
    wc18 = parse_wc_2018(os.path.join(docs_dir, "TD-Results-summary-report-WC-2018.pdf"))
    wc14 = parse_wc_2014(os.path.join(docs_dir, "WWR_2014_Odense_results.pdf"))
    wc95 = parse_wc_1995(os.path.join(docs_dir, "WWRC_1995_Nottwil_Switzerland_results.pdf"))

    print(f"WC 2022: {len(wc22['matches'])} matches, {len(wc22['standings'])} standings, {len(wc22['awards'])} awards")
    print(f"WC 2018: {len(wc18['matches'])} matches, {len(wc18['standings'])} standings, {len(wc18['awards'])} awards")
    print(f"WC 2014: {len(wc14['matches'])} matches, {len(wc14['standings'])} standings")
    print(f"WC 1995: {len(wc95['matches'])} matches, {len(wc95['standings'])} standings")

    all_wc = {
        "wc_2022": wc22,
        "wc_2018": wc18,
        "wc_2014": wc14,
        "wc_1995": wc95
    }
    with open("data/extracted/world_championships_summary.json", "w", encoding="utf-8") as f:
        json.dump(all_wc, f, indent=2)
    print("Saved to data/extracted/world_championships_summary.json")
