"""Generate five source-checked Murderball Analytics slide figures (dark/light PNG + SVG).

Run from any directory:
    python Docs/presentation_assets/generate_figures.py

Dependencies: matplotlib>=3.9, Pillow>=10. No network, API keys, or app runtime.
"""

from __future__ import annotations

import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, FancyArrowPatch, FancyBboxPatch, Rectangle
from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
WIDTH, HEIGHT, DPI = 1920, 1080, 120
plt.rcParams.update({"font.family": "DejaVu Sans", "svg.fonttype": "path", "savefig.pad_inches": 0})

REGISTRY = json.loads((ROOT / "data/extracted/canonical_research_registry.json").read_text(encoding="utf-8"))
MANIFEST = json.loads((ROOT / "data/extracted/canonical_data_manifest.json").read_text(encoding="utf-8"))
QUALITY = json.loads((ROOT / "data/extracted/data_quality_report.json").read_text(encoding="utf-8"))
EVALUATION = json.loads((ROOT / "data/extracted/prediction_level_evaluations.json").read_text(encoding="utf-8"))
MATCH = json.loads((ROOT / "data/extracted/matches/PAR24_M20.json").read_text(encoding="utf-8"))

DARK = {
    "bg": "#111c19", "panel": "#1d2d27", "panel2": "#253a31", "ink": "#f3f1e9",
    "muted": "#acbcb0", "faint": "#658074", "rule": "#476254", "gold": "#e0bd77",
    "sage": "#9ec9ad", "rust": "#e59475", "blue": "#8eb6c2", "ghost": "#33483d",
}
LIGHT = {
    "bg": "#f6f6f0", "panel": "#ffffff", "panel2": "#e9efe8", "ink": "#162820",
    "muted": "#4c6254", "faint": "#6b8071", "rule": "#bdd0c0", "gold": "#9c6d1e",
    "sage": "#2d7654", "rust": "#a95036", "blue": "#356d80", "ghost": "#dae5d9",
}


def verify_sources() -> None:
    a = REGISTRY["assist_blocks"]
    assert (a["matches"], a["total"], a["class_0_5"], a["tries_total"], a["class_0_5_tries"]) == (44, 1296, 364, 2459, 3)
    assert round(100 * a["class_0_5"] / a["total"], 1) == 28.1
    assert round(100 * a["class_0_5_tries"] / a["tries_total"], 2) == 0.12
    assert REGISTRY["model_evaluation"]["evaluation_design"] == "RETROSPECTIVE_REUSED_COHORT"
    assert REGISTRY["model_evaluation"]["superiority_established"] is False
    assert [int(MANIFEST["tournament_breakdown"][name]["matches"]) for name in TOURNAMENTS] == [24, 20, 20, 18, 18, 20]
    assert QUALITY["score_reconciled_count"] == QUALITY["paralympic_matches_extracted"] == 120
    assert QUALITY["minutes_reconciled_count"] == 26
    assert QUALITY["total_lineup_stints_reconstructed"] == MANIFEST["canonical_counts"]["total_continuous_stints"] == 5148
    assert sum(QUALITY["tournaments"][name]["total_events"] for name in TOURNAMENTS) == 26876
    assert MANIFEST["canonical_counts"]["total_recorded_events"] == 26878
    assert MATCH["match_id"] == "PAR24_M20" and (MATCH["official_score_a"], MATCH["official_score_b"]) == (48, 41)
    assert (MATCH["team_a_code"], MATCH["team_b_code"]) == ("JPN", "USA")
    for clock, team, kind, score in TIMELINE_CHECKS:
        found = [e for e in MATCH["events"] if e["period"] == 4 and e["clock"] == clock and e["team"] == team and e["event_type"] == kind]
        assert found, (clock, team, kind)
        if score is not None:
            assert any((e["score_a"], e["score_b"]) == score for e in found), (clock, score)
    scores = {row["model_name"]: row["brier_score"] for row in EVALUATION["model_summary_leaderboard"]}
    for name, value in MODELS:
        assert scores[name] == value, (name, scores.get(name))
    assert all(row["sample_size"] == 24 for row in EVALUATION["model_summary_leaderboard"])
    paired = EVALUATION["paired_brier_comparison_l2_vs_seed"]
    assert paired["mean_paired_difference"] == 0.0256 and paired["sample_size"] == 24
    assert paired["ci_95_t_distribution"][0] < 0 < paired["ci_95_t_distribution"][1]
    assert paired["is_statistically_significant"] is False
    # The source book is linked from README.md, not redistributed with this public package.


TOURNAMENTS = ["Athens 2004", "Beijing 2008", "London 2012", "Rio 2016", "Tokyo 2020", "Paris 2024"]
MODELS = [
    ("Seed/Favorite Baseline", 0.1177),
    ("Fitted L2 Logistic", 0.1433),
    ("Fitted Random Forest", 0.1513),
    ("Dynamic State-Space Elo", 0.1771),
    ("Gradient Boosted Decision Tree", 0.2062),
    ("Constant Prior Baseline (50/50)", 0.2500),
]
TIMELINE_CHECKS = [
    ("6:15", "JPN", "TRY", (38, 33)),
    ("6:02", "USA", "TRY", (38, 34)),
    ("5:31", "JPN", "TRY", (39, 34)),
    ("5:31", "USA", "TIMEOUT", (39, 34)),
    ("5:31", "USA", "SUBSTITUTION_OUT", (39, 34)),
    ("5:20", "USA", "TRY", (39, 35)),
    ("5:04", "JPN", "TRY", (40, 35)),
    ("4:50", "USA", "TURNOVER", (40, 35)),
    ("4:40", "JPN", "TRY", (41, 35)),
    ("4:20", "USA", "TRY", (41, 36)),
    ("3:59", "JPN", "TRY", (42, 36)),
]


def canvas(theme: dict, number: str, section: str, title: str, subtitle: str):
    fig = plt.figure(figsize=(WIDTH / DPI, HEIGHT / DPI), dpi=DPI, facecolor=theme["bg"])
    ax = fig.add_axes([0, 0, 1, 1], facecolor=theme["bg"])
    ax.set_xlim(0, WIDTH)
    ax.set_ylim(HEIGHT, 0)
    ax.axis("off")
    txt(ax, 92, 58, "MURDERBALL ANALYTICS", 14, theme["sage"], weight="bold", ls=2)
    txt(ax, 1828, 58, f"AQX DATA BOWL 4.0  /  {number}", 12, theme["muted"], ha="right", weight="bold", ls=1)
    ax.plot([92, 1828], [82, 82], color=theme["rule"], lw=1.2)
    txt(ax, 92, 111, section.upper(), 13, theme["gold"], weight="bold", ls=1.6)
    txt(ax, 92, 145, title, 33, theme["ink"], weight="bold")
    txt(ax, 92, 205, subtitle, 15, theme["muted"])
    return fig, ax


def txt(ax, x, y, string, size, color, *, weight="normal", ha="left", va="top", ls=0, linespacing=1.35):
    return ax.text(x, y, string, fontsize=size, color=color, weight=weight, ha=ha, va=va,
                   linespacing=linespacing, fontfamily="DejaVu Sans", zorder=10)


def box(ax, x, y, w, h, fill, edge=None, radius=18, lw=1.2):
    patch = FancyBboxPatch((x, y), w, h, boxstyle=f"round,pad=0,rounding_size={radius}",
                           facecolor=fill, edgecolor=edge or fill, linewidth=lw)
    ax.add_patch(patch)
    return patch


def line(ax, x1, y1, x2, y2, color, lw=1.2, alpha=1):
    ax.plot([x1, x2], [y1, y2], color=color, lw=lw, alpha=alpha, solid_capstyle="round")


def dot(ax, x, y, r, color, edge=None, lw=0):
    ax.add_patch(Circle((x, y), r, facecolor=color, edgecolor=edge or color, linewidth=lw))


def arrow(ax, x1, y1, x2, y2, color, lw=2.4):
    ax.add_patch(FancyArrowPatch((x1, y1), (x2, y2), arrowstyle="-|>", mutation_scale=20,
                                 linewidth=lw, color=color, shrinkA=0, shrinkB=0))


def footer(ax, theme, source: str, caveat: str):
    box(ax, 92, 925, 1736, 56, theme["panel2"], radius=10)
    txt(ax, 112, 943, caveat, 12, theme["ink"])
    line(ax, 92, 1001, 1828, 1001, theme["rule"])
    txt(ax, 92, 1019, source, 11, theme["muted"])
    txt(ax, 1828, 1019, "MURDERBALL ANALYTICS  /  RESEARCH SHOWCASE", 10, theme["faint"], ha="right", weight="bold", ls=1)


def figure_01(t):
    a = REGISTRY["assist_blocks"]
    ab_pct = 100 * a["class_0_5"] / a["total"]
    try_pct = 100 * a["class_0_5_tries"] / a["tries_total"]
    fig, ax = canvas(t, "01", "Flagship discovery", "The overlooked class 0.5 contribution",
                     "Same 44-match cohort  ·  Athens 2004 + Beijing 2008  ·  official player box scores")
    box(ax, 92, 260, 1736, 106, t["panel"], edge=t["rule"])
    txt(ax, 124, 288, "CLASS 0.5", 14, t["gold"], weight="bold", ls=1.5)
    txt(ax, 124, 320, "A large share of recorded Assist Blocks; almost no tries", 20, t["ink"], weight="bold")
    x0, xmax, span = 740, 1750, 1010
    rows = [
        (425, "ASSIST BLOCKS", a["class_0_5"], a["total"], ab_pct, t["gold"]),
        (645, "TRIES SCORED", a["class_0_5_tries"], a["tries_total"], try_pct, t["rust"]),
    ]
    for y, label, count, total, pct, color in rows:
        box(ax, 92, y - 20, 1736, 180, t["panel"], edge=t["rule"])
        txt(ax, 124, y + 5, label, 13, t["muted"], weight="bold", ls=1.4)
        txt(ax, 124, y + 40, f"{count:,}", 36, color, weight="bold")
        txt(ax, 288, y + 67, f"of {total:,}", 18, t["ink"])
        txt(ax, 660, y + 47, f"{pct:.1f}%" if label == "ASSIST BLOCKS" else f"{pct:.2f}%", 29, color, weight="bold", ha="right")
        box(ax, x0, y + 61, span, 38, t["ghost"], radius=18)
        width = max(4, span * pct / 30)
        box(ax, x0, y + 61, width, 38, color, radius=min(18, width / 2))
    for v in [0, 10, 20, 30]:
        x = x0 + span * v / 30
        line(ax, x, 817, x, 827, t["muted"], lw=1.2)
        txt(ax, x, 839, f"{v}%", 11, t["muted"], ha="center")
    txt(ax, x0, 884, "SHARE OF EACH RECORDED EVENT TYPE   ·   COMMON 0–30% SCALE", 11, t["muted"], weight="bold", ls=1)
    footer(ax, t, "Source: official Athens 2004 + Beijing 2008 C73 box scores; canonical_research_registry.json",
           "DESCRIPTIVE ONLY  ·  Assist Blocks were recorded; spatial lane creation and causal effects on tries were not measured.")
    return fig


def timeline_event(ax, t, x, y, w, clock, label, score=None, accent=None):
    dot(ax, x, y + 17, 5, accent or t["sage"])
    txt(ax, x + 20, y, clock, 14, t["gold"], weight="bold")
    txt(ax, x + 100, y, label, 13, t["ink"])
    if score:
        txt(ax, x + w, y, score, 13, t["muted"], ha="right", weight="bold")


def figure_02(t):
    fig, ax = canvas(t, "02", "Historical decision", "A recorded moment, not a reconstructed tactic",
                     "Paris 2024 gold medal match  ·  Japan vs United States  ·  fourth quarter clock")
    columns = [(92, 500), (622, 540), (1192, 636)]
    for x, w in columns:
        box(ax, x, 275, w, 625, t["panel"], edge=t["rule"])
    txt(ax, 124, 304, "BEFORE", 13, t["sage"], weight="bold", ls=1.5)
    txt(ax, 654, 304, "RECORDED DECISION", 13, t["gold"], weight="bold", ls=1.5)
    txt(ax, 1224, 304, "OBSERVED AFTERMATH", 13, t["sage"], weight="bold", ls=1.5)
    line(ax, 124, 351, 560, 351, t["rule"])
    line(ax, 654, 351, 1130, 351, t["rule"])
    line(ax, 1224, 351, 1796, 351, t["rule"])
    for y, vals in zip([399, 493, 587], [
        ("6:15", "JPN · Ike try", "38–33"),
        ("6:02", "USA · Aoki try", "38–34"),
        ("5:31", "JPN · Ike try", "39–34"),
    ]):
        timeline_event(ax, t, 124, y, 436, *vals)
    txt(ax, 124, 744, "Score shown as JPN–USA", 12, t["muted"])
    txt(ax, 124, 775, "Selected official events", 12, t["muted"])
    box(ax, 654, 380, 476, 119, t["panel2"], edge=t["gold"])
    txt(ax, 682, 397, "Q4  ·  5:31", 16, t["gold"], weight="bold")
    txt(ax, 682, 432, "JAPAN 39  —  USA 34", 21, t["ink"], weight="bold")
    dot(ax, 680, 563, 8, t["gold"])
    txt(ax, 708, 541, "USA timeout · 60 seconds", 17, t["ink"], weight="bold")
    line(ax, 680, 573, 680, 677, t["gold"], lw=2)
    dot(ax, 680, 685, 8, t["gold"])
    txt(ax, 708, 649, "Substitution", 13, t["muted"], weight="bold", ls=1)
    txt(ax, 708, 683, "Sarah Adam out", 18, t["ink"])
    txt(ax, 708, 721, "Josh Wheeler in", 18, t["ink"])
    txt(ax, 654, 833, "Official record · same timestamp", 12, t["muted"])
    after = [
        ("5:20", "USA · O'Neill try", "39–35"),
        ("5:04", "JPN · Hashimoto try", "40–35"),
        ("4:50", "USA · Wheeler turnover", "40–35"),
        ("4:40", "JPN · Ike try", "41–35"),
        ("4:20", "USA · Aoki try", "41–36"),
        ("3:59", "JPN · Ike try", "42–36"),
    ]
    for y, vals in zip([384, 463, 542, 621, 700, 779], after):
        timeline_event(ax, t, 1224, y, 572, *vals, accent=t["rust"] if vals[0] == "4:50" else None)
    footer(ax, t, "Source: Official Paris 2024 Wheelchair Rugby Results Book, JPN–USA gold final; parsed PAR24_M20 event record",
           "SELECTED EVENTS ONLY  ·  The record does not show a causal effect of the timeout or verify any press, pass, or screen route.")
    return fig


def figure_03(t):
    fig, ax = canvas(t, "03", "Historical evidence", "Six tournaments. Every final score reconciled.",
                     "Paralympic wheelchair rugby  ·  Athens 2004 through Paris 2024")
    cards = [(92, "120", "DETAILED MATCHES"), (670, "120 / 120", "FINAL SCORES RECONCILED"), (1248, "5,148", "RECONSTRUCTED STINTS")]
    for x, value, label in cards:
        box(ax, x, 261, 540, 134, t["panel"], edge=t["rule"])
        txt(ax, x + 25, 280, value, 32, t["gold"] if x == 670 else t["ink"], weight="bold")
        txt(ax, x + 25, 347, label, 12, t["muted"], weight="bold", ls=1)
    box(ax, 92, 426, 1736, 453, t["panel"], edge=t["rule"])
    txt(ax, 120, 447, "TOURNAMENT", 11, t["muted"], weight="bold", ls=1.2)
    txt(ax, 566, 447, "MATCHES  /  OFFICIAL SCORES", 11, t["muted"], weight="bold", ls=1.2)
    txt(ax, 1336, 447, "EVENT ROWS*", 11, t["muted"], weight="bold", ls=1.2, ha="right")
    txt(ax, 1748, 447, "STINTS*", 11, t["muted"], weight="bold", ls=1.2, ha="right")
    line(ax, 120, 480, 1800, 480, t["rule"])
    for i, name in enumerate(TOURNAMENTS):
        q = QUALITY["tournaments"][name]
        y = 502 + 59 * i
        txt(ax, 120, y, name, 16, t["ink"], weight="bold")
        box(ax, 566, y + 3, 475, 16, t["ghost"], radius=8)
        box(ax, 566, y + 3, 475 * q["parsed_matches"] / 24, 16, t["sage"], radius=8)
        txt(ax, 1063, y - 1, f"{q['parsed_matches']:>2} / {q['score_reconciled']:>2}", 15, t["sage"], weight="bold")
        txt(ax, 1336, y - 1, f"{q['total_events']:,}", 15, t["ink"], ha="right")
        txt(ax, 1748, y - 1, f"{q['total_stints']:,}", 15, t["ink"], ha="right")
        if i < 5:
            line(ax, 120, y + 42, 1800, y + 42, t["rule"], alpha=.45)
    txt(ax, 120, 853, "*Extracted/reconstructed coverage; field completeness varies by tournament.", 11, t["muted"])
    footer(ax, t, "Source: canonical_data_manifest.json + data_quality_report.json; six official Paralympic Results Books",
           "QUALITY LIMIT  ·  Athlete minutes reconcile in 26/120 matches. Quality report itemizes 26,876 events; manifest lists 26,878.")
    return fig


def figure_04(t):
    fig, ax = canvas(t, "04", "Predictive modeling", "Lower observed error. No validated winner.",
                     "Brier score  ·  24 reused 2026 World Championship matches  ·  lower is better")
    box(ax, 92, 266, 1736, 573, t["panel"], edge=t["rule"])
    names = [
        "Reconstructed ranking baseline", "L2 logistic regression", "Random forest",
        "Dynamic Elo", "Gradient boosting", "Constant baseline",
    ]
    x0, span = 732, 895
    for i, ((_, value), name) in enumerate(zip(MODELS, names)):
        y = 306 + i * 82
        color = t["gold"] if i == 0 else (t["sage"] if i == 1 else t["blue"] if i < 4 else t["faint"])
        txt(ax, 128, y + 2, name, 17, t["ink"], weight="bold" if i == 0 else "normal")
        box(ax, x0, y + 6, span, 27, t["ghost"], radius=13)
        box(ax, x0, y + 6, span * value / .27, 27, color, radius=13)
        txt(ax, 1752, y - 3, f"{value:.4f}", 18, color, ha="right", weight="bold")
        if i == 0:
            txt(ax, 128, y + 34, "Lowest observed Brier", 11, t["gold"], weight="bold")
        if i < 5:
            line(ax, 128, y + 70, 1788, y + 70, t["rule"], alpha=.35)
    for value in [0, .05, .10, .15, .20, .25]:
        x = x0 + span * value / .27
        line(ax, x, 801, x, 813, t["muted"])
        txt(ax, x, 820, f"{value:.2f}", 10, t["muted"], ha="center")
    txt(ax, 92, 865, "LOGISTIC MINUS RANKING: +0.0256 BRIER  ·  PAIRED 95% INTERVAL SPANS ZERO", 13, t["gold"], weight="bold")
    footer(ax, t, "Source: prediction_level_evaluations.json + canonical_research_registry.json (24-match reused cohort)",
           "RETROSPECTIVE  ·  Cohort influenced development; ranking field comes from a post-tournament snapshot. No superiority claim.")
    return fig


def figure_05(t):
    fig, ax = canvas(t, "05", "Decision workflow", "From an official record to a better question",
                     "Paris 2024 gold final  ·  one recorded decision  ·  hypotheses remain clearly labeled")
    cards = [
        (92, "01", "OFFICIAL MATCH\nRECORD", ["Q4 · 5:31", "Japan 39 – USA 34", "Official score + event log"], "RECORDED", t["sage"]),
        (533, "02", "HISTORICAL\nDECISION", ["USA 60-second timeout", "Sarah Adam out", "Josh Wheeler in"], "RECORDED", t["sage"]),
        (974, "03", "OBSERVED\nAFTERMATH", ["5:20 · USA try · 39–35", "4:50 · USA turnover", "3:59 · JPN try · 42–36"], "RECORDED", t["sage"]),
        (1415, "04", "LEGAL LINEUP\nEXPLORATION", ["Select four athletes", "Check classification cap", "Sketch a possible setup"], "HYPOTHETICAL", t["gold"]),
    ]
    for x, number, title, details, status, accent in cards:
        box(ax, x, 303, 412, 503, t["panel"], edge=accent if number == "04" else t["rule"], radius=20, lw=1.6)
        txt(ax, x + 28, 328, number, 15, accent, weight="bold", ls=1.4)
        box(ax, x + 258, 324, 125, 31, t["panel2"], radius=15)
        txt(ax, x + 320, 329, status, 8.5, accent, ha="center", weight="bold")
        txt(ax, x + 28, 390, title, 23, t["ink"], weight="bold", linespacing=1.18)
        line(ax, x + 28, 490, x + 384, 490, t["rule"])
        for j, detail in enumerate(details):
            dot(ax, x + 37, 544 + j * 70, 4, accent)
            txt(ax, x + 55, 529 + j * 70, detail, 14, t["ink"])
    for x in [510, 951, 1392]:
        arrow(ax, x, 558, x + 17, 558, t["gold"] if x == 1392 else t["sage"], lw=2.7)
    txt(ax, 92, 845, "RECORDED EVIDENCE", 12, t["sage"], weight="bold", ls=1.2)
    line(ax, 310, 853, 1350, 853, t["sage"], alpha=.6)
    txt(ax, 1415, 845, "MODEL / PLANNING", 12, t["gold"], weight="bold", ls=1.2)
    footer(ax, t, "Source: Official Paris 2024 Results Book (PAR24_M20); Decision Mirror + Tactical Court workflow",
           "BOUNDARY  ·  Any court sketch is a hypothetical lineup exercise, never a historical player-tracking reconstruction.")
    return fig


FIGURES = [
    ("01_assist_block_discovery", figure_01),
    ("02_paris_decision_timeline", figure_02),
    ("03_historical_coverage", figure_03),
    ("04_model_comparison", figure_04),
    ("05_evidence_to_decision", figure_05),
]


def export_figures() -> None:
    for stem, builder in FIGURES:
        fig = builder(DARK)
        fig.savefig(OUT / f"{stem}.png", dpi=DPI, facecolor=DARK["bg"], format="png")
        fig.savefig(OUT / f"{stem}.svg", facecolor=DARK["bg"], format="svg")
        plt.close(fig)
        light_fig = builder(LIGHT)
        light_fig.savefig(OUT / f"{stem}_light.png", dpi=DPI, facecolor=LIGHT["bg"], format="png")
        plt.close(light_fig)
        for name in [f"{stem}.png", f"{stem}_light.png"]:
            with Image.open(OUT / name) as image:
                assert image.size == (WIDTH, HEIGHT), (name, image.size)
        print(f"Wrote {stem}: 1920×1080 PNG, SVG, 1920×1080 light PNG")


def contact_sheet() -> None:
    bg = Image.new("RGB", (1920, 1910), DARK["bg"])
    draw = ImageDraw.Draw(bg)
    font_path = Path("C:/Windows/Fonts/segoeuib.ttf")
    font = ImageFont.truetype(str(font_path), 44) if font_path.exists() else ImageFont.load_default()
    small = ImageFont.truetype(str(font_path), 23) if font_path.exists() else ImageFont.load_default()
    draw.text((86, 44), "MURDERBALL ANALYTICS  /  FIVE-FIGURE CONTACT SHEET", font=font, fill=DARK["ink"])
    for i, (stem, _) in enumerate(FIGURES):
        col, row = i % 2, i // 2
        x, y = 80 + col * 895, 150 + row * 565
        with Image.open(OUT / f"{stem}.png") as src:
            thumb = ImageOps.fit(src.convert("RGB"), (850, 478), method=Image.Resampling.LANCZOS)
            bg.paste(thumb, (x, y))
        draw.rectangle((x - 1, y - 1, x + 851, y + 479), outline=DARK["rule"], width=2)
        draw.text((x, y + 491), stem.replace("_", " ").upper(), font=small, fill=DARK["muted"])
    draw.text((970, 1760), "Five source-checked figures  ·  dark PNG / SVG / light PNG", font=small, fill=DARK["muted"])
    bg.save(OUT / "contact_sheet.png", optimize=True)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    verify_sources()
    export_figures()
    contact_sheet()
    print("PASS: source checks, exact output dimensions, and five-figure contact sheet")


if __name__ == "__main__":
    main()
