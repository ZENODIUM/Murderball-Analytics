import json
import sys
from typing import List, Dict, Any, Optional
from ortools.sat.python import cp_model

from backend.analytics.classification_rules import determine_rules_era, get_female_allowance, RULES_ERAS

sys.stdout.reconfigure(encoding='utf-8')

class LineupOptimizer:
    def __init__(self, rosters_path: str = "data/extracted/all_paralympic_rosters.json"):
        with open(rosters_path, "r", encoding="utf-8") as f:
            self.rosters = json.load(f)

        # Load player RAPM ratings if available
        self.player_ratings = {}
        try:
            with open("data/extracted/research_findings.json", "r", encoding="utf-8") as rf:
                r_data = json.load(rf)
                for h in r_data.get("hypotheses", []):
                    if h.get("hypothesis_id") == "H2_RAPM_COLLINEARITY":
                        for p in h.get("top_impact_players", []):
                            self.player_ratings[p["player_name"].upper()] = p["rapm_coefficient"]
        except Exception:
            pass

    def get_team_roster(self, tournament: str, team_code: str) -> List[Dict[str, Any]]:
        return self.rosters.get(tournament, {}).get(team_code, {}).get("players", [])

    def optimize_lineup(
        self,
        roster: List[Dict[str, Any]],
        max_base_points: float = 8.0,
        female_allowance_per_player: Optional[float] = None,
        rules_era: Optional[str] = None,
        locked_in_bibs: Optional[List[int]] = None,
        locked_out_bibs: Optional[List[int]] = None,
        objective_mode: str = "BALANCED", # "MAX_OFFENSE", "MAX_DEFENSE", "BALANCED"
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Solves for the optimal legal 4-player wheelchair rugby lineup using Google OR-Tools CP-SAT.
        Enforces date-aware classification rules (Historical 8.0 flat vs Modern 2026+ tiered allowances).
        All point constraints are scaled by 2 to enforce exact integer arithmetic.
        """
        era_id = determine_rules_era(rules_era)
        locked_in = set(locked_in_bibs or [])
        locked_out = set(locked_out_bibs or [])

        n_players = len(roster)
        if n_players < 4:
            return []

        solutions = []
        excluded_combinations = []

        # CP-SAT integer scaling: multiply classification by 2
        base_cap_scaled = int(round(max_base_points * 2))

        for sol_idx in range(top_k):
            model = cp_model.CpModel()
            x = [model.NewBoolVar(f"x_{i}") for i in range(n_players)]

            # Constraint 1: Exactly 4 players on court
            model.Add(sum(x) == 4)

            # Constraint 2: Classification point cap with date-aware female allowance
            class_weights_scaled = [int(round(p.get("sport_class", 2.0) * 2)) for p in roster]
            if female_allowance_per_player is not None and rules_era is None:
                # User-specified manual allowance override
                allowance_scaled = int(round(female_allowance_per_player * 2))
                female_bonuses_scaled = [allowance_scaled if p.get("gender") == "F" else 0 for p in roster]
            else:
                # Date-aware rules engine
                female_bonuses_scaled = [
                    int(round(get_female_allowance(p.get("sport_class", 2.0), p.get("gender") == "F", era_id) * 2))
                    for p in roster
                ]

            # total_points_scaled <= base_cap_scaled + total_female_bonus_scaled
            model.Add(
                sum(class_weights_scaled[i] * x[i] for i in range(n_players)) <=
                base_cap_scaled + sum(female_bonuses_scaled[i] * x[i] for i in range(n_players))
            )

            # Constraint 3: User forced inclusion / exclusion
            for i, p in enumerate(roster):
                bib = p.get("bib")
                if bib in locked_in:
                    model.Add(x[i] == 1)
                elif bib in locked_out:
                    model.Add(x[i] == 0)

            # Constraint 4: Exclude previous solutions to get top K distinct lineups
            for prev_sol in excluded_combinations:
                model.Add(sum(x[i] for i in prev_sol) <= 3)

            # Objective function
            # Assign player performance weights (RAPM + class role value)
            scores = []
            for i, p in enumerate(roster):
                p_name = p.get("name", "").upper()
                c = p.get("sport_class", 2.0)
                rapm = self.player_ratings.get(p_name, 0.0)

                if objective_mode == "MAX_OFFENSE":
                    # Value high pointers & scorers heavily
                    val = int(round((c * 15.0 + rapm * 100.0) * 10))
                elif objective_mode == "MAX_DEFENSE":
                    # Value low pointer screeners & defensive impact
                    val = int(round(((4.0 - c) * 10.0 + rapm * 100.0) * 10))
                else: # BALANCED
                    # Synergy: maximize effective point utilization (closer to 8.0) + RAPM impact
                    val = int(round((c * 8.0 + rapm * 100.0 + 10.0) * 10))
                scores.append(val)

            model.Maximize(sum(scores[i] * x[i] for i in range(n_players)))

            solver = cp_model.CpSolver()
            solver.parameters.max_time_in_seconds = 2.0
            status = solver.Solve(model)

            if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
                selected_indices = [i for i in range(n_players) if solver.Value(x[i]) == 1]
                excluded_combinations.append(selected_indices)

                selected_players = [roster[i] for i in selected_indices]
                classes = [p.get("sport_class", 0.0) for p in selected_players]
                fem_count = sum(1 for p in selected_players if p.get("gender") == "F")
                total_class = sum(classes)
                if female_allowance_per_player is not None:
                    allowance_total = fem_count * female_allowance_per_player
                else:
                    allowance_total = sum(get_female_allowance(p.get("sport_class", 2.0), p.get("gender") == "F", era_id) for p in selected_players)
                allowed_cap = max_base_points + allowance_total

                # Determine tactical archetype
                high_pt = sum(1 for c in classes if c >= 3.0)
                low_pt = sum(1 for c in classes if c <= 1.5)
                archetype = "Balanced Unit"
                if high_pt == 2 and low_pt == 2:
                    archetype = "Dual High-Pointer + Twin Screeners"
                elif high_pt == 1 and low_pt == 3:
                    archetype = "Solo Carry + Triple Screeners"
                elif high_pt >= 2:
                    archetype = "High-Paced Offensive Lineup"
                elif low_pt >= 3:
                    archetype = "Defensive Wall / Lockdown Unit"

                solutions.append({
                    "rank": sol_idx + 1,
                    "players": selected_players,
                    "bibs": [p.get("bib") for p in selected_players],
                    "player_names": [p.get("name") for p in selected_players],
                    "classes": classes,
                    "female_count": fem_count,
                    "total_classification_points": round(total_class, 1),
                    "allowed_classification_cap": round(allowed_cap, 1),
                    "legal": bool(total_class <= allowed_cap),
                    "objective_score": solver.ObjectiveValue(),
                    "tactical_archetype": archetype
                })
            else:
                break

        return solutions

if __name__ == "__main__":
    optimizer = LineupOptimizer()
    # Test on Australia Paris 2024 roster
    aus_roster = optimizer.get_team_roster("Paris 2024", "AUS")
    print(f"Loaded AUS Paris 2024 roster with {len(aus_roster)} athletes.")

    top_lineups = optimizer.optimize_lineup(
        aus_roster,
        max_base_points=8.0,
        female_allowance_per_player=0.5,
        objective_mode="BALANCED",
        top_k=3
    )
    print("\nTop 3 Optimal Legal Lineups for Australia (Paris 2024):")
    for l in top_lineups:
        print(f"Rank {l['rank']} ({l['tactical_archetype']}):")
        print(f"  Athletes: {', '.join([f'{p['name']} ({p['sport_class']})' for p in l['players']])}")
        print(f"  Points: {l['total_classification_points']} / {l['allowed_classification_cap']} (Legal: {l['legal']})\n")
