import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = ROOT / "data" / "extracted" / "canonical_research_registry.json"


def load_json(relative_path):
    return json.loads((ROOT / relative_path).read_text(encoding="utf-8"))


def test_registry_is_authoritative_and_reproduced():
    registry = load_json("data/extracted/canonical_research_registry.json")
    research = load_json("data/extracted/research_findings.json")
    predictions = load_json("data/extracted/prediction_level_evaluations.json")

    assert registry["assist_blocks"]["total"] == 1296
    assert registry["assist_blocks"]["class_0_5"] == 364
    assert registry["assist_blocks"]["chi2"] == 1177.7168
    assert registry["female_allowance"]["welch_p_value"] == 0.8923

    h1 = next(h for h in research["hypotheses"] if h["hypothesis_id"] == "H1_LOW_POINT_SCREENERS")
    assert h1["metrics"]["total_assist_blocks"] == registry["assist_blocks"]["total"]
    assert h1["metrics"]["assist_blocks_by_class"]["0.5"] == registry["assist_blocks"]["class_0_5"]
    assert h1["chi2_stat"] == registry["assist_blocks"]["chi2"]

    models = {m["model_name"]: m for m in predictions["model_summary_leaderboard"]}
    assert models["Seed/Favorite Baseline"]["brier_score"] == registry["model_evaluation"]["seed_baseline_brier"]
    assert models["Fitted L2 Logistic"]["brier_score"] == registry["model_evaluation"]["l2_logistic_brier"]
    assert predictions["paired_brier_comparison_l2_vs_seed"]["is_statistically_significant"] is False
    assert predictions["metadata"]["evaluation_status"] == "REUSED_DEVELOPMENT_INFLUENCED_COHORT"


def test_public_discovery_views_match_registry():
    registry = load_json("data/extracted/canonical_research_registry.json")
    discovery = load_json("data/extracted/statistical_discovery_audit.json")
    public_discovery = load_json("frontend/public/data/statistical_discovery_audit.json")

    assert discovery == public_discovery
    leaderboard_text = json.dumps(discovery["research_leaderboard"])
    assert "1,296" in leaderboard_text
    assert "364" in leaderboard_text
    assert "0.1177" in json.dumps(discovery["machine_learning_tournament"])
    assert discovery["metadata"]["version"] == registry["registry_version"]


def test_withdrawn_claims_do_not_reappear_in_product_or_reports():
    targets = [ROOT / "backend", ROOT / "frontend" / "src"]
    files = []
    for target in targets:
        files.extend(p for p in target.rglob("*") if p.suffix in {".py", ".ts", ".tsx"})
    report_files = [
        ROOT / "README.md",
        ROOT / "UPDATED_INTELLIGENCE_REPORT.md",
        ROOT / "RECOMPUTED_RESEARCH_RESULTS.md",
        ROOT / "SOURCE_TO_SCREEN_RECONCILIATION.md",
    ]
    files.extend(p for p in report_files if p.exists())
    text = "\n".join(p.read_text(encoding="utf-8") for p in files)
    banned = [
        "2,505 Assist Blocks",
        "24 Unseen Test Matches",
        "Fitted L2 Logistic (Champion)",
        "call a timeout after a 3-0 run",
        "aggressive keyline pressing",
        "rapid cross-court distribution",
        "coordinated baseline corner trap",
        "heavy bumper trapping",
    ]
    for phrase in banned:
        assert phrase.casefold() not in text.casefold(), phrase


def test_match_narratives_withhold_unobserved_tactics():
    narratives = load_json("data/extracted/match_narratives.json")
    text = json.dumps(narratives).casefold()
    assert "aggressive keyline pressing" not in text
    assert "rapid cross-court distribution" not in text
    assert "heavy bumper trapping" not in text
    assert "not described" in text or "remains a hypothesis" in text


def test_research_leaderboard_uses_bounded_scientific_language():
    discovery = load_json("data/extracted/statistical_discovery_audit.json")
    entries = {entry["rank"]: entry for entry in discovery["research_leaderboard"]["entries"]}

    assert "p=0.66" in entries[2]["statistical_reliability"]
    assert "proving" not in entries[2]["originality"].casefold()

    assert "does not identify the cause" in entries[3]["practical_value"].casefold()
    assert "first" not in entries[3]["originality"].casefold()

    assert "no detectable linear association" in entries[5]["research_candidate"].casefold()
    assert "falsif" not in json.dumps(entries[5]).casefold()

    assert "no absolute rule" in entries[6]["practical_value"].casefold()
    assert "never" not in json.dumps(entries[6]).casefold()

    assert "p=0.8923" in entries[7]["statistical_reliability"]
    assert "5,148" in entries[7]["statistical_reliability"]
    assert "parity" not in entries[7]["decision"].casefold()

    assert "other regularized, constrained, or bayesian" in entries[8]["practical_value"].casefold()
    assert "only statistically valid" not in json.dumps(entries[8]).casefold()

    for entry in entries.values():
        assert "first study" not in entry["originality"].casefold()
        assert "first empirical" not in entry["originality"].casefold()
