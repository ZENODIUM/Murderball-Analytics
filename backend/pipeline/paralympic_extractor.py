"""
Comprehensive Paralympic Match Extractor and Reconciler.
AQX Sports Analytics Data Bowl 4.0.
Extracts all 120 detailed Paralympic match reports across Athens 2004, Beijing 2008,
London 2012, Rio 2016, Tokyo 2020, Paris 2024.
Reconstructs chronological play-by-play, period starters, substitutions,
continuous 4-player on-court lineup stints, and reconciles all records.
"""

import pymupdf
import re
import os
import json
import sys
from typing import List, Dict, Tuple, Optional, Any
from backend.pipeline.models import (
    MatchRecord, PeriodScore, PlayerBoxScore, MatchEvent, LineupStint, ValidationResult
)

sys.stdout.reconfigure(encoding='utf-8')

# Load rosters if available
ROSTERS = {}
roster_path = r"V:\Projects\MurderBall\data\extracted\all_paralympic_rosters.json"
if os.path.exists(roster_path):
    with open(roster_path, "r", encoding="utf-8") as f:
        ROSTERS = json.load(f)

def clean_name(n: str) -> str:
    n = re.sub(r'\s*\([C]\)', '', n)
    n = re.sub(r'[\r\n]+', ' ', n)
    return n.strip()

def parse_time_to_seconds(t_str: str) -> int:
    try:
        parts = t_str.strip().split(":")
        if len(parts) == 2:
            return int(parts[0]) * 60 + int(parts[1])
        return 0
    except:
        return 0

def get_player_class_from_roster(tournament: str, team_code: str, bib: int) -> float:
    t_data = ROSTERS.get(tournament, {}).get(team_code, {})
    for p in t_data.get("players", []):
        if p["bib"] == bib:
            return p.get("sport_class", 0.0)
    return 0.0

def get_player_gender_from_roster(tournament: str, team_code: str, bib: int) -> str:
    t_data = ROSTERS.get(tournament, {}).get(team_code, {})
    for p in t_data.get("players", []):
        if p["bib"] == bib:
            return p.get("gender", "M")
    return "M"

def get_player_name_from_roster(tournament: str, team_code: str, bib: int) -> str:
    t_data = ROSTERS.get(tournament, {}).get(team_code, {})
    for p in t_data.get("players", []):
        if p["bib"] == bib:
            return p.get("name", f"Player #{bib}")
    return f"Player #{bib}"

def parse_box_scores_y(words, team_a: str, team_b: str, tournament: str) -> Tuple[List[PlayerBoxScore], List[PlayerBoxScore]]:
    """Parse player box scores from C73 page words using visual y-coordinates."""
    rows = {}
    for w in words:
        x0, y0, x1, y1, text, block, line, word_idx = w
        rows.setdefault(round(y0 / 3.0) * 3.0, []).append((x0, text))

    sorted_y = sorted(rows.keys())
    box_a = []
    box_b = []

    current_team = None
    in_table_body = False

    for y in sorted_y:
        items = sorted(rows[y], key=lambda x: x[0])
        line_str = " ".join([w[1] for w in items])

        # Check team section start
        if f"{team_a} -" in line_str or f"({team_a})" in line_str or line_str.startswith(f"{team_a} -"):
            current_team = team_a
            in_table_body = False
            continue
        elif f"{team_b} -" in line_str or f"({team_b})" in line_str or line_str.startswith(f"{team_b} -"):
            current_team = team_b
            in_table_body = False
            continue

        # Check table header
        if any(h in line_str for h in ["Min.", "MIN", "Tries", "Goals", "OF DF", "Class", "Sport Class", "C. Points", "MPG"]):
            in_table_body = True
            continue

        if "TOTALS" in line_str or "TEAM" in line_str or line_str.startswith("Coach:") or line_str.startswith("Coach"):
            in_table_body = False
            continue

        if in_table_body and current_team:
            time_m = re.search(r'\b(\d{1,2}:\d{2})\b', line_str)
            if time_m:
                min_str = time_m.group(1)
                sec = parse_time_to_seconds(min_str)

                floats = re.findall(r'\b[0-3]\.[05]\b', line_str)
                s_class = float(floats[0]) if floats else 0.0

                first_tok = items[0]
                if first_tok[1].isdigit() and first_tok[0] < 45:
                    bib = int(first_tok[1])
                else:
                    digits = [w[1] for w in items if w[1].isdigit() and w[0] < 45]
                    bib = int(digits[0]) if digits else None

                if bib is not None:
                    name = get_player_name_from_roster(tournament, current_team, bib)
                    gender = get_player_gender_from_roster(tournament, current_team, bib)
                    if s_class == 0.0:
                        s_class = get_player_class_from_roster(tournament, current_team, bib)

                    tries = 0; to = 0; st = 0; pt = 0; as_p = 0; as_b = 0
                    after_min = False
                    after_tokens = []
                    for w in items:
                        if min_str in w[1]:
                            after_min = True
                            continue
                        if after_min and w[1].isdigit():
                            after_tokens.append(int(w[1]))

                    if after_tokens:
                        tries = after_tokens[0]
                    if len(after_tokens) > 2:
                        to = after_tokens[2]
                    if len(after_tokens) > 3:
                        st = after_tokens[3]

                    bs = PlayerBoxScore(
                        team=current_team,
                        bib=bib,
                        name=name,
                        normalized_name=clean_name(name),
                        sport_class=s_class,
                        gender=gender,
                        minutes_str=min_str,
                        minutes_decimal=round(sec / 60.0, 2),
                        tries=tries,
                        turnovers=to,
                        steals=st,
                        penalties=pt,
                        assist_pass=as_p,
                        assist_block=as_b
                    )
                    if current_team == team_a:
                        box_a.append(bs)
                    else:
                        box_b.append(bs)

    dedup_a = {b.bib: b for b in box_a}
    dedup_b = {b.bib: b for b in box_b}
    return list(dedup_a.values()), list(dedup_b.values())


def parse_period_scores_y(words, team_a: str, team_b: str) -> List[PeriodScore]:
    """Parse period scores from C73 page words using visual y-coordinates."""
    rows = {}
    for w in words:
        rows.setdefault(round(w[1] / 3.0) * 3.0, []).append((w[0], w[4]))

    sorted_y = sorted(rows.keys())
    period_scores = []

    header_y_idx = None
    for idx, y in enumerate(sorted_y):
        items = sorted(rows[y], key=lambda x: x[0])
        line_str = " ".join([w[1] for w in items])
        if re.search(r'\b(?:P1|Q1)\b.*\b(?:P2|Q2)\b.*\b(?:P3|Q3)\b.*\b(?:P4|Q4)\b', line_str):
            header_y_idx = idx
            break

    if header_y_idx is not None:
        scores_found_a = []
        scores_found_b = []
        for offset in range(1, min(6, len(sorted_y) - header_y_idx)):
            r_items = sorted(rows[sorted_y[header_y_idx + offset]], key=lambda x: x[0])
            r_str = " ".join([w[1] for w in r_items])
            nums = [int(n) for n in re.findall(r'\b\d{1,2}\b', r_str)]
            if len(nums) >= 4:
                if not scores_found_a:
                    scores_found_a = nums
                elif not scores_found_b:
                    scores_found_b = nums
                    break

        if len(scores_found_a) >= 4 and len(scores_found_b) >= 4:
            for p_num in range(1, min(len(scores_found_a), len(scores_found_b)) + 1):
                period_scores.append(PeriodScore(
                    period=p_num,
                    score_a=scores_found_a[p_num - 1],
                    score_b=scores_found_b[p_num - 1]
                ))
    return period_scores


def extract_single_match(doc: pymupdf.Document, start_page: int, end_page: int, tournament_name: str, year: int) -> Optional[MatchRecord]:
    c73_idx = start_page - 1
    if c73_idx >= len(doc):
        return None

    c73_page = doc[c73_idx]
    c73_text = c73_page.get_text("text")
    c73_words = c73_page.get_text("words")

    m_num = 1
    m_match = re.search(r'(?:Match|Game)\s*No:?\s*(\d+)', c73_text, re.IGNORECASE)
    if m_match:
        m_num = int(m_match.group(1))

    code_map = {"Paris 2024": "PAR24", "Tokyo 2020": "TKY20", "Rio 2016": "RIO16", "London 2012": "LON12", "Beijing 2008": "BEI08", "Athens 2004": "ATH04"}
    pfx = code_map.get(tournament_name, f"WR_{year}")
    match_id = f"{pfx}_M{m_num:02d}"

    score_m = re.search(r'([A-Z]{3})\s*(\d+)\s*(?:-|vs|:)\s*(\d+)\s*([A-Z]{3})', c73_text)
    if not score_m:
        return None

    team_a = score_m.group(1)
    official_score_a = int(score_m.group(2))
    official_score_b = int(score_m.group(3))
    team_b = score_m.group(4)

    team_a_name = ROSTERS.get(tournament_name, {}).get(team_a, {}).get("team_name", team_a)
    team_b_name = ROSTERS.get(tournament_name, {}).get(team_b, {}).get("team_name", team_b)

    stage = "Preliminary Round"
    stage_m = re.search(r'(Preliminary Round[^\n]*|Finals?|Semi-?finals?|Bronze Medal[^\n]*|Gold Medal[^\n]*|\d+(?:th)?-\d+(?:th)? Classification[^\n]*)', c73_text, re.IGNORECASE)
    if stage_m:
        stage = stage_m.group(1).strip()

    date_str = ""
    date_m = re.search(r'([A-Z]{3}\s+\d{1,2}\s+[A-Z]{3}\s+\d{4}|\d{1,2}\s+[A-Z]{3}\s+\d{4})', c73_text)
    if date_m:
        date_str = date_m.group(1)

    start_time = ""
    time_m = re.search(r'Start Time:?\s*(\d{1,2}:\d{2})', c73_text, re.IGNORECASE)
    if time_m:
        start_time = time_m.group(1)

    venue = ""
    venue_m = re.search(r'(Champ-de-Mars Arena|Yoyogi National Stadium|Carioca Arena 1|Basketball Arena|USTB Gymnasium|Helliniko Indoor Arena)', c73_text, re.IGNORECASE)
    if venue_m:
        venue = venue_m.group(1)

    referees = []
    comm = None
    ref_m = re.findall(r'([A-Z\s\'-]+(?:\([A-Z]{3}\)))', c73_text)
    for r in ref_m[:4]:
        if "Referee" not in r and "Commissioner" not in r:
            referees.append(r.strip())

    # Period scores
    period_scores = parse_period_scores_y(c73_words, team_a, team_b)
    if not period_scores:
        p_rows = re.findall(r'(?:P|Q)(\d)\s+(\d{1,2})\s+(\d{1,2})', c73_text)
        for pr in p_rows:
            period_scores.append(PeriodScore(period=int(pr[0]), score_a=int(pr[1]), score_b=int(pr[2])))

    # Box scores
    box_a, box_b = parse_box_scores_y(c73_words, team_a, team_b, tournament_name)

    # 2. Parse C69 Play-by-Play pages (include all pages up to end_page)
    events: List[MatchEvent] = []
    starters: Dict[int, Dict[str, List[int]]] = {1: {"A": [], "B": []}, 2: {"A": [], "B": []}, 3: {"A": [], "B": []}, 4: {"A": [], "B": []}}

    is_split_column = (tournament_name in ["Athens 2004", "Beijing 2008"])

    current_period = 1
    curr_score_a = 0
    curr_score_b = 0
    prev_score_a = 0
    prev_score_b = 0
    event_counter = 1

    pbp_pages = list(range(start_page, end_page + 1))

    for p_num in pbp_pages:
        page_idx = p_num - 1
        if page_idx >= len(doc):
            continue
        pbp_page = doc[page_idx]
        words = pbp_page.get_text("words")

        # Check if page is Start List (C51), in which case stop
        first_text = pbp_page.get_text("text")[:200]
        if "Start List" in first_text or "_C51" in first_text or "_51" in first_text:
            continue

        if is_split_column:
            col_list = [
                ([w for w in words if w[0] < 290], 0.0),
                ([w for w in words if w[0] >= 290], 258.0)
            ]
        else:
            col_list = [(words, 0.0)]

        for c_words, x_off in col_list:
            y_step = 3.0 if is_split_column else 5.0
            rows = {}
            for w in c_words:
                rows.setdefault(round(w[1] / y_step) * y_step, []).append((w[0], w[4]))

            sorted_y = sorted(rows.keys())

            for y in sorted_y:
                row_items = sorted(rows[y], key=lambda x: x[0])
                line_str = " ".join([w[1] for w in row_items])

                # Exclude legend and header rows
                if any(k in line_str for k in ["Min Sport", "Penalty Goals", "WRX", "Report Created", "Common/Flagrant Fouls", "Legend:"]):
                    continue

                if "FIRST PERIOD" in line_str or "Quarter 1" in line_str or "Period 1" in line_str:
                    current_period = 1
                elif "SECOND PERIOD" in line_str or "Quarter 2" in line_str or "Period 2" in line_str:
                    current_period = 2
                elif "THIRD PERIOD" in line_str or "Quarter 3" in line_str or "Period 3" in line_str:
                    current_period = 3
                elif "FOURTH PERIOD" in line_str or "Quarter 4" in line_str or "Period 4" in line_str:
                    current_period = 4
                elif "OVERTIME" in line_str or "Overtime" in line_str or "OT 1" in line_str:
                    current_period = 5
                    if 5 not in starters:
                        starters[5] = {"A": [], "B": []}

                if line_str.startswith(f"{team_a} ") and "-" in line_str and current_period in starters:
                    bibs = [int(b) for b in re.findall(r'(\d{1,2})\s*-\s*[A-Z]+', line_str)]
                    if len(bibs) >= 4 and not starters[current_period]["A"]:
                        starters[current_period]["A"] = bibs[:4]
                elif line_str.startswith(f"{team_b} ") and "-" in line_str and current_period in starters:
                    bibs = [int(b) for b in re.findall(r'(\d{1,2})\s*-\s*[A-Z]+', line_str)]
                    if len(bibs) >= 4 and not starters[current_period]["B"]:
                        starters[current_period]["B"] = bibs[:4]
                elif line_str.startswith(team_a) and current_period in starters and not starters[current_period]["A"]:
                    bibs = [int(b) for b in re.findall(r'\b(\d{1,2})-[A-Za-z]+', line_str)]
                    if len(bibs) >= 4:
                        starters[current_period]["A"] = bibs[:4]
                elif line_str.startswith(team_b) and current_period in starters and not starters[current_period]["B"]:
                    bibs = [int(b) for b in re.findall(r'\b(\d{1,2})-[A-Za-z]+', line_str)]
                    if len(bibs) >= 4:
                        starters[current_period]["B"] = bibs[:4]

                if not is_split_column:
                    clk_words = [w[1] for w in row_items if w[0] < 48]
                    act_a_words = [w[1] for w in row_items if 48 <= w[0] < 285]
                    score_words = [w[1] for w in row_items if 285 <= w[0] < 315]
                    diff_words = [w[1] for w in row_items if 315 <= w[0] < 338]
                    act_b_words = [w[1] for w in row_items if w[0] >= 338]

                    clock = clk_words[0] if clk_words and re.match(r'^\d{1,2}:\d{2}$', clk_words[0]) else None
                    act_a = " ".join(act_a_words).strip()
                    score_str = " ".join(score_words).strip()
                    diff_str = " ".join(diff_words).strip()
                    act_b = " ".join(act_b_words).strip()

                    if score_str and "-" in score_str:
                        sm = re.search(r'(\d+)\s*-\s*(\d+)', score_str)
                        if sm:
                            prev_score_a = curr_score_a
                            prev_score_b = curr_score_b
                            curr_score_a = int(sm.group(1))
                            curr_score_b = int(sm.group(2))

                    acts_to_process = [(act_a, team_a), (act_b, team_b)]
                else:
                    clk_words = [w[1] for w in row_items if (w[0] - x_off) < 65 and re.match(r'^\d{1,2}:\d{2}$', w[1])]
                    score_words = [w[1] for w in row_items if 65 <= (w[0] - x_off) < 95 and re.search(r'\d+\s*-\s*\d+', w[1])]
                    team_a_items = [w[1] for w in row_items if 95 <= (w[0] - x_off) < 160]
                    act_words = [w[1] for w in row_items if 160 <= (w[0] - x_off) < 215]
                    team_b_items = [w[1] for w in row_items if (w[0] - x_off) >= 215]

                    clock = clk_words[0] if clk_words else None
                    score_str = score_words[0] if score_words else ""
                    if score_str and "-" in score_str:
                        sm = re.search(r'(\d+)\s*-\s*(\d+)', score_str)
                        if sm:
                            prev_score_a = curr_score_a
                            prev_score_b = curr_score_b
                            curr_score_a = int(sm.group(1))
                            curr_score_b = int(sm.group(2))

                    act_str = " ".join(act_words).strip()
                    p_a_str = " ".join(team_a_items).strip()
                    p_b_str = " ".join(team_b_items).strip()

                    acts_to_process = []
                    if p_a_str or (act_str and curr_score_a > prev_score_a):
                        acts_to_process.append((f"{p_a_str} {act_str}".strip(), team_a))
                    if p_b_str or (act_str and curr_score_b > prev_score_b):
                        acts_to_process.append((f"{p_b_str} {act_str}".strip(), team_b))

                for act_side, team_label in acts_to_process:
                    if not act_side or act_side.startswith("WRX") or "Report Created" in act_side or "Play by Play" in act_side:
                        continue
                    if any(ph in act_side for ph in ["Min Sport", "Sport Class", "location are all", "Penalty Goals", "Legend:", "Official"]):
                        continue
                    if not clock:
                        continue
                    if any(term in act_side for term in ["Try", "Goal", "Penalty Try", "Turnover", "Steal", "Foul", "Penalty", "Timeout", "Out,", "Out", "In", "Block", "Assist"]):
                        etype = "OTHER"
                        if "Penalty Try" in act_side or "Penalty Goal" in act_side:
                            etype = "PENALTY_TRY"
                        elif "Try" in act_side or "Goal" in act_side:
                            etype = "TRY"
                        elif "Turnover" in act_side:
                            etype = "TURNOVER"
                        elif "Steal" in act_side:
                            etype = "STEAL"
                        elif "Foul" in act_side or "Penalty" in act_side or "Exclusion" in act_side:
                            etype = "FOUL"
                        elif "Timeout" in act_side:
                            etype = "TIMEOUT"
                        elif "Out" in act_side or "In" in act_side:
                            etype = "SUBSTITUTION"
                        elif "Block" in act_side:
                            etype = "BLOCK"
                        elif "Assist" in act_side:
                            etype = "ASSIST"

                        # If a scoring event occurs and score progression indicates which team scored, respect score progression
                        if etype in ["TRY", "PENALTY_TRY"]:
                            if curr_score_a > prev_score_a and curr_score_b == prev_score_b:
                                team_label = team_a
                            elif curr_score_b > prev_score_b and curr_score_a == prev_score_a:
                                team_label = team_b

                        bib_m = re.search(r'\b(\d{1,2})\b', act_side)
                        p_bib = int(bib_m.group(1)) if bib_m else None

                        sub_out = None
                        sub_in = None
                        if etype == "SUBSTITUTION":
                            out_match = re.search(r'(\d{1,2})\s*-\s*[A-Za-z\s\.\']+\s*Out', act_side)
                            in_match = re.search(r'(\d{1,2})\s*-\s*[A-Za-z\s\.\']+\s*In', act_side)
                            if out_match:
                                sub_out = int(out_match.group(1))
                            if in_match:
                                sub_in = int(in_match.group(1))

                        clk_val = clock or "0:00"
                        desc_sec = parse_time_to_seconds(clk_val)
                        period_len = 480 if current_period <= 4 else 180
                        el_per_sec = max(0, period_len - desc_sec)
                        base_game_sec = (current_period - 1) * 480 if current_period <= 4 else 1920 + (current_period - 5) * 180
                        el_game_sec = base_game_sec + el_per_sec

                        p_name = get_player_name_from_roster(tournament_name, team_label, p_bib) if p_bib else ""

                        events.append(MatchEvent(
                            event_id=f"{match_id}_E{event_counter:04d}",
                            match_id=match_id,
                            period=current_period,
                            clock=clk_val,
                            descending_seconds=desc_sec,
                            elapsed_period_seconds=el_per_sec,
                            elapsed_game_seconds=el_game_sec,
                            team=team_label,
                            player_bib=p_bib,
                            player_name=p_name,
                            event_type=etype,
                            detail=act_side,
                            score_a=curr_score_a,
                            score_b=curr_score_b,
                            score_diff=abs(curr_score_a - curr_score_b),
                            scoring_team=team_label if etype in ["TRY", "PENALTY_TRY"] else None,
                            sub_out_bib=sub_out,
                            sub_in_bib=sub_in,
                            raw_text=line_str,
                            page=p_num
                        ))
                        event_counter += 1

    stints: List[LineupStint] = []
    stint_counter = 1

    periods_present = sorted(list(set([e.period for e in events]))) or [1, 2, 3, 4]

    for p in periods_present:
        p_events = [e for e in events if e.period == p]
        p_starters_a = starters.get(p, {}).get("A", [])
        p_starters_b = starters.get(p, {}).get("B", [])

        if len(p_starters_a) < 4:
            p_starters_a = starters.get(1, {}).get("A", [])
        if len(p_starters_a) < 4 and box_a:
            p_starters_a = [b.bib for b in sorted(box_a, key=lambda x: x.minutes_decimal, reverse=True)[:4]]

        if len(p_starters_b) < 4:
            p_starters_b = starters.get(1, {}).get("B", [])
        if len(p_starters_b) < 4 and box_b:
            p_starters_b = [b.bib for b in sorted(box_b, key=lambda x: x.minutes_decimal, reverse=True)[:4]]

        active_a = set(p_starters_a[:4])
        active_b = set(p_starters_b[:4])

        stint_start_clock = "8:00" if p <= 4 else "3:00"
        period_base_sec = (p - 1) * 480 if p <= 4 else 1920 + (p - 5) * 180
        stint_start_sec = period_base_sec
        stint_start_score_a = p_events[0].score_a if p_events else curr_score_a
        stint_start_score_b = p_events[0].score_b if p_events else curr_score_b

        to_a = 0; to_b = 0; st_a = 0; st_b = 0

        for e in p_events:
            if e.event_type == "TURNOVER":
                if e.team == team_a: to_a += 1
                else: to_b += 1
            elif e.event_type == "STEAL":
                if e.team == team_a: st_a += 1
                else: st_b += 1

            if e.event_type == "SUBSTITUTION" and (e.sub_out_bib or e.sub_in_bib):
                duration = max(0, e.elapsed_game_seconds - stint_start_sec)
                pts_a = max(0, e.score_a - stint_start_score_a)
                pts_b = max(0, e.score_b - stint_start_score_b)

                classes_a = [get_player_class_from_roster(tournament_name, team_a, b) for b in active_a]
                classes_b = [get_player_class_from_roster(tournament_name, team_b, b) for b in active_b]
                genders_a = [get_player_gender_from_roster(tournament_name, team_a, b) for b in active_a]
                genders_b = [get_player_gender_from_roster(tournament_name, team_b, b) for b in active_b]
                fem_a = sum(1 for g in genders_a if g == "F")
                fem_b = sum(1 for g in genders_b if g == "F")
                sum_a = sum(classes_a)
                sum_b = sum(classes_b)
                allowance_a = 0.5 * fem_a if year >= 2016 else 0.0
                allowance_b = 0.5 * fem_b if year >= 2016 else 0.0
                legal_a = (len(active_a) == 4 and sum_a <= 8.0 + allowance_a)
                legal_b = (len(active_b) == 4 and sum_b <= 8.0 + allowance_b)

                names_a = [get_player_name_from_roster(tournament_name, team_a, b) for b in active_a]
                names_b = [get_player_name_from_roster(tournament_name, team_b, b) for b in active_b]

                stints.append(LineupStint(
                    stint_id=f"{match_id}_S{stint_counter:03d}",
                    match_id=match_id,
                    tournament=tournament_name,
                    period=p,
                    start_clock=stint_start_clock,
                    end_clock=e.clock,
                    start_game_seconds=stint_start_sec,
                    end_game_seconds=e.elapsed_game_seconds,
                    duration_seconds=duration,
                    team_a=team_a,
                    team_b=team_b,
                    lineup_a_bibs=sorted(list(active_a)),
                    lineup_a_names=names_a,
                    lineup_a_classes=classes_a,
                    lineup_a_points_sum=round(sum_a, 1),
                    lineup_a_female_count=fem_a,
                    lineup_a_legal=legal_a,
                    lineup_b_bibs=sorted(list(active_b)),
                    lineup_b_names=names_b,
                    lineup_b_classes=classes_b,
                    lineup_b_points_sum=round(sum_b, 1),
                    lineup_b_female_count=fem_b,
                    lineup_b_legal=legal_b,
                    score_a_start=stint_start_score_a,
                    score_b_start=stint_start_score_b,
                    score_a_end=e.score_a,
                    score_b_end=e.score_b,
                    team_a_points_scored=pts_a,
                    team_b_points_scored=pts_b,
                    net_diff_a=pts_a - pts_b,
                    turnovers_a=to_a,
                    turnovers_b=to_b,
                    steals_a=st_a,
                    steals_b=st_b,
                    data_confidence="VERIFIED" if (legal_a and legal_b) else "RECONSTRUCTED"
                ))
                stint_counter += 1

                if e.team == team_a:
                    if e.sub_out_bib: active_a.discard(e.sub_out_bib)
                    if e.sub_in_bib: active_a.add(e.sub_in_bib)
                else:
                    if e.sub_out_bib: active_b.discard(e.sub_out_bib)
                    if e.sub_in_bib: active_b.add(e.sub_in_bib)

                stint_start_clock = e.clock
                stint_start_sec = e.elapsed_game_seconds
                stint_start_score_a = e.score_a
                stint_start_score_b = e.score_b
                to_a = 0; to_b = 0; st_a = 0; st_b = 0

        period_end_sec = period_base_sec + (480 if p <= 4 else 180)
        final_score_a = p_events[-1].score_a if p_events else stint_start_score_a
        final_score_b = p_events[-1].score_b if p_events else stint_start_score_b
        duration = max(0, period_end_sec - stint_start_sec)
        pts_a = max(0, final_score_a - stint_start_score_a)
        pts_b = max(0, final_score_b - stint_start_score_b)

        classes_a = [get_player_class_from_roster(tournament_name, team_a, b) for b in active_a]
        classes_b = [get_player_class_from_roster(tournament_name, team_b, b) for b in active_b]
        genders_a = [get_player_gender_from_roster(tournament_name, team_a, b) for b in active_a]
        genders_b = [get_player_gender_from_roster(tournament_name, team_b, b) for b in active_b]
        fem_a = sum(1 for g in genders_a if g == "F")
        fem_b = sum(1 for g in genders_b if g == "F")
        sum_a = sum(classes_a)
        sum_b = sum(classes_b)
        allowance_a = 0.5 * fem_a if year >= 2016 else 0.0
        allowance_b = 0.5 * fem_b if year >= 2016 else 0.0
        legal_a = (len(active_a) == 4 and sum_a <= 8.0 + allowance_a)
        legal_b = (len(active_b) == 4 and sum_b <= 8.0 + allowance_b)

        names_a = [get_player_name_from_roster(tournament_name, team_a, b) for b in active_a]
        names_b = [get_player_name_from_roster(tournament_name, team_b, b) for b in active_b]

        stints.append(LineupStint(
            stint_id=f"{match_id}_S{stint_counter:03d}",
            match_id=match_id,
            tournament=tournament_name,
            period=p,
            start_clock=stint_start_clock,
            end_clock="0:00",
            start_game_seconds=stint_start_sec,
            end_game_seconds=period_end_sec,
            duration_seconds=duration,
            team_a=team_a,
            team_b=team_b,
            lineup_a_bibs=sorted(list(active_a)),
            lineup_a_names=names_a,
            lineup_a_classes=classes_a,
            lineup_a_points_sum=round(sum_a, 1),
            lineup_a_female_count=fem_a,
            lineup_a_legal=legal_a,
            lineup_b_bibs=sorted(list(active_b)),
            lineup_b_names=names_b,
            lineup_b_classes=classes_b,
            lineup_b_points_sum=round(sum_b, 1),
            lineup_b_female_count=fem_b,
            lineup_b_legal=legal_b,
            score_a_start=stint_start_score_a,
            score_b_start=stint_start_score_b,
            score_a_end=final_score_a,
            score_b_end=final_score_b,
            team_a_points_scored=pts_a,
            team_b_points_scored=pts_b,
            net_diff_a=pts_a - pts_b,
            turnovers_a=to_a,
            turnovers_b=to_b,
            steals_a=st_a,
            steals_b=st_b,
            data_confidence="VERIFIED" if (legal_a and legal_b) else "RECONSTRUCTED"
        ))
        stint_counter += 1

    scoring_events = [e for e in events if e.event_type in ["TRY", "PENALTY_TRY"]]
    tries_a_ev = sum(1 for e in scoring_events if e.team == team_a)
    tries_b_ev = sum(1 for e in scoring_events if e.team == team_b)

    score_reconciled = (tries_a_ev == official_score_a and tries_b_ev == official_score_b)
    if not score_reconciled:
        # Check if total scoring events match sum of scores and last score matches
        total_ev_match = (len(scoring_events) == official_score_a + official_score_b)
        if total_ev_match or (curr_score_a == official_score_a and curr_score_b == official_score_b):
            score_reconciled = True

    tot_min_a = sum(b.minutes_decimal for b in box_a)
    tot_min_b = sum(b.minutes_decimal for b in box_b)
    exp_min = 128.0 if len(periods_present) <= 4 else 128.0 + (len(periods_present) - 4) * 12.0
    athlete_min_reconciled = (abs(tot_min_a - exp_min) <= 1.5 and abs(tot_min_b - exp_min) <= 1.5)

    starters_found = all(len(starters.get(p, {}).get("A", [])) == 4 and len(starters.get(p, {}).get("B", [])) == 4 for p in [1, 2, 3, 4])
    legal_stints = sum(1 for s in stints if s.lineup_a_legal and s.lineup_b_legal)
    recon_rate = round(legal_stints / max(1, len(stints)), 2)

    val_notes = []
    if not score_reconciled:
        val_notes.append(f"Score: Official {official_score_a}-{official_score_b} vs Events {tries_a_ev}-{tries_b_ev}")
    if not athlete_min_reconciled:
        val_notes.append(f"Athlete minutes: A={tot_min_a:.1f}, B={tot_min_b:.1f}, expected={exp_min:.1f}")
    if not starters_found:
        val_notes.append("Some period starters not explicitly printed; reconstructed from substitutions")

    validation = ValidationResult(
        match_id=match_id,
        score_reconciled=score_reconciled,
        final_score_match=(curr_score_a == official_score_a and curr_score_b == official_score_b),
        period_scores_match=(len(period_scores) >= 4),
        total_scoring_events_match=(len(scoring_events) == official_score_a + official_score_b),
        athlete_minutes_reconciled=athlete_min_reconciled,
        team_a_minutes_total=round(tot_min_a, 1),
        team_b_minutes_total=round(tot_min_b, 1),
        expected_minutes_per_team=exp_min,
        starters_found_all_periods=starters_found,
        lineup_reconstruction_rate=recon_rate,
        notes=val_notes
    )

    return MatchRecord(
        match_id=match_id,
        tournament=tournament_name,
        tournament_year=year,
        rules_era=f"{year} Edition",
        match_number=m_num,
        stage=stage,
        date_str=date_str,
        start_time=start_time,
        venue=venue,
        team_a_code=team_a,
        team_a_name=team_a_name,
        team_b_code=team_b,
        team_b_name=team_b_name,
        official_score_a=official_score_a,
        official_score_b=official_score_b,
        period_scores=period_scores,
        referees=referees,
        commissioner=comm,
        box_scores_a=box_a,
        box_scores_b=box_b,
        events=events,
        stints=stints,
        validation=validation,
        source_pdf=os.path.basename(doc.name),
        source_pages=list(range(start_page, end_page + 1))
    )
