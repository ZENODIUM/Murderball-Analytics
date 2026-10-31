"""
Centrally Maintained, Date-Aware Classification Legality Engine
Implements official World Wheelchair Rugby (WWR) classification regulations across historical eras.

Era 1: Pre-2010 (Athens 2004, Beijing 2008)
    - Base maximum classification sum: 8.0 points.
    - Female athlete point allowance: 0.0 points (no allowance).

Era 2: 2010 - 2025 (London 2012, Rio 2016, Tokyo 2020, Paris 2024)
    - Base maximum classification sum: 8.0 points.
    - Female athlete point allowance: +0.5 points per female athlete regardless of classification.
    - Maximum allowed with 1 female: 8.5 points; 2 females: 9.0 points.

Era 3: 2026+ WWR Rules Cycle (São Paulo 2026 World Championship, LA 2028 cycle)
    - Base maximum classification sum: 8.0 points.
    - Tiered female athlete point allowance:
        * 0.5 - 1.5 classification: +0.5 point allowance per female athlete.
        * 2.0 - 3.5 classification: +1.0 point allowance per female athlete.
"""

from typing import List, Dict, Any, Union, Optional
from datetime import datetime

RULES_ERAS = {
    "ERA_PRE_2010": {
        "name": "Historical Classical Era (Pre-2010: Athens 2004 & Beijing 2008)",
        "effective_start": "1995-01-01",
        "effective_end": "2009-12-31",
        "base_cap": 8.0,
        "female_allowance_mode": "NONE",
        "description": "Strict 8.0 cap. No point modification for female athletes."
    },
    "ERA_2010_2025": {
        "name": "Flat Allowance Era (2010-2025: London 2012, Rio 2016, Tokyo 2020, Paris 2024)",
        "effective_start": "2010-01-01",
        "effective_end": "2025-12-31",
        "base_cap": 8.0,
        "female_allowance_mode": "FLAT_0_5",
        "description": "8.0 base cap + 0.5 points per female athlete on court."
    },
    "ERA_2026_MODERN": {
        "name": "Tiered Modern Era (2026+: São Paulo 2026 World Championship & Beyond)",
        "effective_start": "2026-01-01",
        "effective_end": "2099-12-31",
        "base_cap": 8.0,
        "female_allowance_mode": "TIERED_CLASS",
        "description": "8.0 base cap + 0.5 for female athletes 0.5-1.5; +1.0 for female athletes 2.0-3.5."
    }
}

def determine_rules_era(date_or_year: Union[int, str, None]) -> str:
    """Resolves rules era from year, ISO date string, or era code."""
    if not date_or_year:
        return "ERA_2026_MODERN"

    if isinstance(date_or_year, int):
        if date_or_year < 2010:
            return "ERA_PRE_2010"
        elif date_or_year <= 2025:
            return "ERA_2010_2025"
        else:
            return "ERA_2026_MODERN"

    date_str = str(date_or_year).strip()
    if date_str in RULES_ERAS:
        return date_str

    # Check for tournament name hints
    if any(k in date_str for k in ["Athens", "2004", "Beijing", "2008"]):
        return "ERA_PRE_2010"
    if any(k in date_str for k in ["London", "2012", "Rio", "2016", "Tokyo", "2020", "Paris", "2024"]):
        return "ERA_2010_2025"
    if any(k in date_str for k in ["2026", "São Paulo", "Sao Paulo", "LA28", "2028"]):
        return "ERA_2026_MODERN"

    # Try parsing ISO date
    try:
        dt = datetime.fromisoformat(date_str[:10])
        if dt.year < 2010:
            return "ERA_PRE_2010"
        elif dt.year <= 2025:
            return "ERA_2010_2025"
        else:
            return "ERA_2026_MODERN"
    except Exception:
        pass

    return "ERA_2026_MODERN"

def get_female_allowance(classification: float, is_female: bool, rules_era: str) -> float:
    """Calculates the specific point allowance granted to an individual athlete."""
    if not is_female:
        return 0.0

    era = RULES_ERAS.get(rules_era, RULES_ERAS["ERA_2026_MODERN"])
    mode = era["female_allowance_mode"]

    if mode == "NONE":
        return 0.0
    elif mode == "FLAT_0_5":
        return 0.5
    elif mode == "TIERED_CLASS":
        if classification <= 1.5:
            return 0.5
        else:
            # 2.0 - 3.5 female athletes receive 1.0 point allowance under 2026 rules
            return 1.0

    return 0.0

def evaluate_lineup_legality(athletes: List[Dict[str, Any]], date_or_era: Union[int, str, None] = None) -> Dict[str, Any]:
    """
    Evaluates a 4-player lineup's classification legality under the specified rules era.
    Each athlete dict must contain 'classification' (or 'sportClass') and optionally 'gender' or 'is_female'.
    """
    era_id = determine_rules_era(date_or_era)
    era_meta = RULES_ERAS[era_id]

    raw_class_sum = 0.0
    total_allowance = 0.0
    female_count = 0
    athlete_details = []

    for a in athletes:
        c_val = float(a.get("classification") or a.get("sportClass") or a.get("class") or 0.0)
        is_fem = bool(a.get("is_female") or a.get("gender") == "F" or a.get("female_allowance", 0) > 0)
        allowance = get_female_allowance(c_val, is_fem, era_id)

        if is_fem:
            female_count += 1
            total_allowance += allowance

        raw_class_sum += c_val
        athlete_details.append({
            "name": a.get("name", "Unknown"),
            "classification": c_val,
            "is_female": is_fem,
            "individual_allowance": allowance,
            "effective_points": max(0.0, c_val - allowance)
        })

    base_cap = era_meta["base_cap"]
    effective_cap = base_cap + total_allowance
    is_legal_count = (len(athletes) == 4)
    is_legal_points = (raw_class_sum <= effective_cap + 1e-5)

    return {
        "is_legal": bool(is_legal_count and is_legal_points),
        "athlete_count": len(athletes),
        "raw_classification_sum": round(raw_class_sum, 1),
        "base_cap": base_cap,
        "total_female_allowance": round(total_allowance, 1),
        "effective_cap": round(effective_cap, 1),
        "female_athlete_count": female_count,
        "rules_era": era_id,
        "rules_era_name": era_meta["name"],
        "rules_description": era_meta["description"],
        "athletes": athlete_details,
        "disqualification_reasons": (
            ([] if len(athletes) == 4 else [f"Lineup must contain exactly 4 athletes (found {len(athletes)})"]) +
            ([] if raw_class_sum <= effective_cap + 1e-5 else [f"Classification sum {round(raw_class_sum, 1)} exceeds effective cap {round(effective_cap, 1)} by {round(raw_class_sum - effective_cap, 1)} pts under {era_meta['name']}"])
        )
    }
