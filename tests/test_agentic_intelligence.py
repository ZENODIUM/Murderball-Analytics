"""
Automated Test Suite for Agentic Sports Intelligence & TypeSafe Jev Exploration
================================================================================
AQX Sports Analytics Data Bowl 4.0 - MurderBall Intelligence Platform
"""

import os
import sys
import json
import pytest

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from backend.api.main import app, load_all_data
from backend.agents.typesafe_jev_adapter import JevDecisionEngine
from backend.agents.tools_registry import ToolsRegistry
from backend.agents.coach_assistant import CoachIntelligenceAssistant
from backend.agents.active_annotation_planner import ActiveAnnotationPlanner
from backend.agents.scouting_agent import OpponentScoutingAgent

# Ensure data is loaded
load_all_data()

client = TestClient(app)

# -------------------------------------------------------------------------
# 1. TypeSafe Jev Decision Primitives & Feasibility Assessment Tests
# -------------------------------------------------------------------------

def test_jev_intent_routing_choice_primitive():
    """Verify that Jev Choice primitive accurately routes diverse natural language queries."""
    engine = JevDecisionEngine()

    test_cases = [
        ("Opponent scouting report for Japan", "opponent_scouting"),
        ("What evidence gap exists regarding physical chair screening?", "evidence_gap_audit"),
        ("Should a coach call a timeout when trailing late in Q4?", "decision_mirror_inquiry"),
        ("Find the optimal 8.0 lineup solver for Australia", "lineup_optimization"),
        ("Compare Ryley Batt and Chuck Aoki", "player_comparison"),
        ("What is the 0.5-point screener assist block asymmetry?", "research_investigation"),
        ("Paris 2024 final match analysis", "match_analysis")
    ]

    for query, expected_choice in test_cases:
        res = engine.route_query_intent(query)
        assert res["primitive"] == "choice"
        assert res["choice"] == expected_choice, f"Query '{query}' expected '{expected_choice}', got '{res['choice']}'"
        assert res["confidence"] >= 0.80
        assert "probabilities" in res
        prob_sum = sum(res["probabilities"].values())
        assert abs(prob_sum - 1.0) < 0.05
        assert res["provider"] == "OFFLINE_DETERMINISTIC_ENGINE"
        assert res["latency_ms"] >= 0.0

def test_jev_noul_ambiguity_primitive():
    """Verify that Jev Noul [0, 1] detects ambiguous vs well-specified questions."""
    engine = JevDecisionEngine()

    # Ambiguous / underspecified
    ambig_res = engine.evaluate_ambiguity("lineup?")
    assert ambig_res["primitive"] == "noul"
    assert ambig_res["requires_clarification"] is True
    assert ambig_res["noul"] > 0.5
    assert ambig_res["clarification_prompt"] is not None

    # Clear, well-specified
    clear_res = engine.evaluate_ambiguity("Analyze the 4th quarter performance of Australia in the Paris 2024 Gold Medal match")
    assert clear_res["primitive"] == "noul"
    assert clear_res["requires_clarification"] is False
    assert clear_res["noul"] < 0.5

def test_jev_score_evidence_reliability_rubric():
    """Verify Jev Score primitive maps sample size and provenance to evidence levels."""
    engine = JevDecisionEngine()

    r_unverified = engine.evaluate_evidence_reliability(sample_size=10, has_official_source=False)
    assert r_unverified["level"] == "unverified"
    assert r_unverified["score"] == 0.0

    r_weak = engine.evaluate_evidence_reliability(sample_size=15, has_official_source=True)
    assert r_weak["level"] == "weak_sample"
    assert r_weak["score"] == 0.33

    r_mod = engine.evaluate_evidence_reliability(sample_size=60, has_official_source=True)
    assert r_mod["level"] == "moderate"
    assert r_mod["score"] == 0.66

    r_high = engine.evaluate_evidence_reliability(sample_size=200, has_official_source=True)
    assert r_high["level"] == "high_evidence"
    assert r_high["score"] == 1.0

def test_jev_feasibility_report_and_limitations():
    """Verify that the Jev feasibility assessment clearly documents sports analytics boundaries."""
    engine = JevDecisionEngine()
    report = engine.get_feasibility_report()

    assert report["title"] == "TypeSafe AI Jev Decision Model: Sports Analytics Feasibility Assessment"
    assert report["offline_mode_active"] is True
    assert "choice" in report["evaluated_primitives"]
    assert "score" in report["evaluated_primitives"]
    assert "noul" in report["evaluated_primitives"]

    # Crucial scientific check: Jev confidence != game win probability
    limitations_text = " ".join(report["documented_limitations"])
    assert "NOT an outcome prediction model" in limitations_text
    assert "Google OR-Tools CP-SAT" in limitations_text
    assert "offline" in limitations_text.lower()

# -------------------------------------------------------------------------
# 2. Typed Analytical Tools Registry Tests
# -------------------------------------------------------------------------

def test_tools_registry_search_and_profiles():
    """Verify read-only analytical tools execute cleanly and return valid citations."""
    tools = ToolsRegistry()

    # 1. Search Matches
    m_res = tools.search_matches(tournament="Paris 2024", team="JPN")
    assert m_res["matches_found"] >= 1
    assert any("PAR24" in m["match_id"] for m in m_res["results"])
    assert m_res["data_confidence"] == "100% RECONCILED OFFICIAL RECORDS"

    # 2. Player Profile
    p_res = tools.get_player_profile("BATT Ryley")
    assert p_res["player_name"] == "BATT Ryley"
    assert p_res["classification"] == 3.5
    assert p_res["star_rating"] >= 4.0

    # 3. Lineup Performance
    l_res = tools.get_lineup_performance(["BATT Ryley", "BOND Chris", "VERNON Beau", "McQUILLAN James"])
    assert l_res["historical_stints_count"] >= 0
    assert "court_exposure_minutes" in l_res
    assert "net_per_100s" in l_res

def test_tools_registry_decision_mirror_and_evidence_gap():
    """Verify decision mirror query and epistemic evidence gap auditor."""
    tools = ToolsRegistry()

    # Decision Mirror
    dm_res = tools.inspect_decision_mirror(match_id="PAR24_M01")
    assert dm_res.get("decision_id") is not None
    assert dm_res.get("match_id") == "PAR24_M01"
    assert len(dm_res.get("counterfactual_alternatives", [])) >= 1

    # Evidence Gap Audit
    gap_res = tools.audit_evidence_gap("physical chair screening and speed")
    assert gap_res["epistemic_audit"] == "EVIDENCE GAP IDENTIFIED"
    assert len(gap_res["gaps"]) >= 1
    assert "synthetic coordinates" in gap_res["scientific_integrity_notice"].lower()

def test_tools_registry_coaching_decision_critique():
    """Verify adversarial coaching decision critique stage."""
    tools = ToolsRegistry()

    critique = tools.coaching_decision_critique(
        proposed_lineup=["BATT Ryley", "BOND Chris", "VERNON Beau", "McQUILLAN James"],
        context="Trailing by 3 late in Q4"
    )
    assert critique["tool"] == "coaching_decision_critique"
    assert "critique_verdict" in critique
    assert len(critique["critique_points"]) >= 1
    assert "alternative_lineup_to_investigate" in critique

# -------------------------------------------------------------------------
# 3. Coach Intelligence Assistant Reasoning Engine Tests
# -------------------------------------------------------------------------

def test_coach_assistant_full_reasoning_pipeline():
    """Verify end-to-end multi-step assistant reasoning."""
    assistant = CoachIntelligenceAssistant()

    # Test Question 1: Paris 2024 tactical struggle
    res1 = assistant.process_query("Why did Australia struggle against Great Britain in Paris 2024?")
    assert res1["workflow"] == "match_analysis"
    assert len(res1["execution_trace"]) >= 4
    assert len(res1["quantitative_findings"]) >= 1
    assert len(res1["source_citations"]) >= 1
    assert len(res1["action_suggestions"]) >= 1
    assert any(a["action"] == "open_theatre" for a in res1["action_suggestions"])

    # Test Question 2: Physical screening evidence gap
    res2 = assistant.process_query("What evidence gap exists regarding physical chair screening?")
    assert res2["workflow"] == "evidence_gap_audit"
    assert "camera tracking" in res2["synthesis"].lower() or "optical" in res2["synthesis"].lower()
    assert any(a["action"] == "open_annotation_planner" for a in res2["action_suggestions"])

# -------------------------------------------------------------------------
# 4. Active Annotation Planner Priority Queue Tests
# -------------------------------------------------------------------------

def test_active_annotation_priority_queue():
    """Verify that annotation tasks are ranked by information gain score."""
    planner = ActiveAnnotationPlanner()
    queue = planner.get_prioritized_queue()

    assert queue["total_tasks_queued"] >= 5
    tasks = queue["tasks"]

    # Check that priority ranks are 1..5 in order
    ranks = [t["priority_rank"] for t in tasks]
    assert ranks == list(range(1, len(tasks) + 1))

    # Check that information gain scores decrease monotonically
    scores = [t["information_gain_score"] for t in tasks]
    for i in range(len(scores) - 1):
        assert scores[i] >= scores[i+1]

    # Check top task is Paris 2024 final scrum
    assert tasks[0]["match_id"] == "PAR24_M20"
    assert tasks[0]["urgency"] == "HIGH"
    assert "Norimatsu" in tasks[0]["why_it_matters"] or "Kurahashi" in tasks[0]["why_it_matters"]
    assert "Fukushima" not in tasks[0]["why_it_matters"]

# -------------------------------------------------------------------------
# 5. Opponent Scouting Agent Tests
# -------------------------------------------------------------------------

def test_opponent_scouting_agent():
    """Verify autonomous structured scouting generation for major squads."""
    scout = OpponentScoutingAgent()

    for team_code in ["JPN", "USA", "GBR", "AUS"]:
        dossier = scout.generate_scouting_report(team_code)
        assert dossier["team_code"] == team_code
        assert dossier["current_rank"] >= 1
        assert len(dossier["tactical_archetype"]) > 0
        assert len(dossier["primary_lineups"]) >= 1
        assert len(dossier["vulnerabilities"]) >= 2
        assert len(dossier["recommended_gameplan"]) > 0

    # Test unknown team fallback
    fallback = scout.generate_scouting_report("XYZ")
    assert fallback["team_code"] == "XYZ"
    assert "Standard International Rotation" in fallback["tactical_archetype"]

# -------------------------------------------------------------------------
# 6. REST API Endpoints Tests
# -------------------------------------------------------------------------

def test_agent_api_endpoints():
    """Verify all agent HTTP endpoints respond with 200 and schema parity."""
    # 1. Query Endpoint
    r_query = client.post("/api/agent/query", json={"question": "Opponent scouting report for Japan"})
    assert r_query.status_code == 200
    q_data = r_query.json()
    assert q_data["workflow"] == "opponent_scouting"
    assert "synthesis" in q_data

    # 2. Scout Endpoint
    r_scout = client.post("/api/agent/scout", json={"team_code": "JPN"})
    assert r_scout.status_code == 200
    s_data = r_scout.json()
    assert s_data["team_name"] == "Japan"

    # 3. Annotation Queue Endpoint
    r_queue = client.get("/api/agent/annotation-queue")
    assert r_queue.status_code == 200
    assert r_queue.json()["total_tasks_queued"] >= 5

    # 4. Jev Status Endpoint
    r_jev = client.get("/api/agent/jev-status")
    assert r_jev.status_code == 200
    assert r_jev.json()["status"] == "OFFLINE_DETERMINISTIC_ENGINE"

    # 5. Benchmark Endpoint
    r_bench = client.get("/api/agent/evaluation-benchmark")
    assert r_bench.status_code == 200
    b_data = r_bench.json()
    assert b_data["total_test_cases"] == 12
    assert b_data["accuracy_rate_pct"] == 100.0
    assert b_data["mean_latency_ms"] < 100.0
