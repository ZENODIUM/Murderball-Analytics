"""
Data models for wheelchair rugby analytics pipeline.
AQX Sports Analytics Data Bowl 4.0.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class PeriodScore(BaseModel):
    period: int
    score_a: int
    score_b: int

class PlayerBoxScore(BaseModel):
    team: str
    bib: int
    name: str
    normalized_name: str
    sport_class: float
    gender: str = "M" # M or F
    minutes_str: str = "00:00"
    minutes_decimal: float = 0.0
    tries: int = 0
    penalties: int = 0
    offensive_fouls: int = 0
    defensive_fouls: int = 0
    turnovers: int = 0
    steals: int = 0
    assist_pass: int = 0
    assist_block: int = 0

class MatchEvent(BaseModel):
    event_id: str
    match_id: str
    period: int
    clock: str # mm:ss
    descending_seconds: int
    elapsed_period_seconds: int
    elapsed_game_seconds: int
    team: Optional[str] = None
    player_bib: Optional[int] = None
    player_name: Optional[str] = None
    event_type: str # TRY, PENALTY_TRY, TURNOVER, STEAL, FOUL, TIMEOUT, SUBSTITUTION, BLOCK, VIOLATION
    detail: str
    score_a: int
    score_b: int
    score_diff: int
    scoring_team: Optional[str] = None
    sub_out_bib: Optional[int] = None
    sub_in_bib: Optional[int] = None
    raw_text: str
    page: int

class LineupStint(BaseModel):
    stint_id: str
    match_id: str
    tournament: str
    period: int
    start_clock: str
    end_clock: str
    start_game_seconds: int
    end_game_seconds: int
    duration_seconds: int
    team_a: str
    team_b: str
    lineup_a_bibs: List[int]
    lineup_a_names: List[str]
    lineup_a_classes: List[float]
    lineup_a_points_sum: float
    lineup_a_female_count: int
    lineup_a_legal: bool
    lineup_b_bibs: List[int]
    lineup_b_names: List[str]
    lineup_b_classes: List[float]
    lineup_b_points_sum: float
    lineup_b_female_count: int
    lineup_b_legal: bool
    score_a_start: int
    score_b_start: int
    score_a_end: int
    score_b_end: int
    team_a_points_scored: int
    team_b_points_scored: int
    net_diff_a: int # team_a_points_scored - team_b_points_scored
    turnovers_a: int
    turnovers_b: int
    steals_a: int
    steals_b: int
    data_confidence: str # "VERIFIED", "RECONSTRUCTED", "INCOMPLETE"

class ValidationResult(BaseModel):
    match_id: str
    score_reconciled: bool
    final_score_match: bool
    period_scores_match: bool
    total_scoring_events_match: bool
    athlete_minutes_reconciled: bool
    team_a_minutes_total: float
    team_b_minutes_total: float
    expected_minutes_per_team: float
    starters_found_all_periods: bool
    lineup_reconstruction_rate: float
    notes: List[str] = []

class MatchRecord(BaseModel):
    match_id: str
    tournament: str
    tournament_year: int
    rules_era: str
    match_number: int
    stage: str
    date_str: str
    start_time: str
    venue: str
    team_a_code: str
    team_a_name: str
    team_b_code: str
    team_b_name: str
    official_score_a: int
    official_score_b: int
    period_scores: List[PeriodScore]
    referees: List[str]
    commissioner: Optional[str] = None
    box_scores_a: List[PlayerBoxScore]
    box_scores_b: List[PlayerBoxScore]
    events: List[MatchEvent]
    stints: List[LineupStint] = []
    validation: Optional[ValidationResult] = None
    source_pdf: str
    source_pages: List[int]

class ChampionshipMatchSummary(BaseModel):
    tournament: str
    year: int
    match_number: Optional[int] = None
    date_str: Optional[str] = None
    stage: Optional[str] = None
    team_a: str
    team_b: str
    score_a: int
    score_b: int
    notes: Optional[str] = None
    source_pdf: str
    source_page: int
