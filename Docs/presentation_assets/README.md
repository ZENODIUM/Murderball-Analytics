# Murderball Analytics presentation figures

Five 16:9 research figures for AQX Data Bowl 4.0 slides and the Markdown showcase. Each figure has a **1920 × 1080 dark PNG**, a **high-quality SVG**, and a **1920 × 1080 light PNG**. The [contact sheet](contact_sheet.png) previews the five dark versions.

## Files and suggested use

| # | Slide title | Slide PNG | SVG | Light PNG | Suggested caption |
|---|---|---|---|---|---|
| 1 | **The overlooked class 0.5 contribution** | [Dark](01_assist_block_discovery.png) | [Vector](01_assist_block_discovery.svg) | [Light](01_assist_block_discovery_light.png) | Across 44 Athens 2004/Beijing 2008 box-score matches, class 0.5 athletes recorded 364 of 1,296 Assist Blocks (28.1%) but only 3 of 2,459 tries (0.12%). This is a descriptive difference in recorded roles, not evidence that the blocks caused tries or created spatial lanes. |
| 2 | **A recorded moment, not a reconstructed tactic** | [Dark](02_paris_decision_timeline.png) | [Vector](02_paris_decision_timeline.svg) | [Light](02_paris_decision_timeline_light.png) | Selected official Q4 events in the Paris 2024 Japan–USA gold final. At 5:31 Japan led 39–34; the USA took a 60-second timeout and substituted Sarah Adam out for Josh Wheeler. Later events are observed sequence, not a measured effect of the decision. |
| 3 | **Six tournaments. Every final score reconciled.** | [Dark](03_historical_coverage.png) | [Vector](03_historical_coverage.svg) | [Light](03_historical_coverage_light.png) | The six detailed Paralympic tournaments contain 120 matches, with 120/120 final scores reconciled. Event rows and 5,148 lineup stints are extracted/reconstructed coverage and vary by field and era; athlete minutes reconcile in 26/120 matches. |
| 4 | **Lower observed error. No validated winner.** | [Dark](04_model_comparison.png) | [Vector](04_model_comparison.svg) | [Light](04_model_comparison_light.png) | Six Brier scores on 24 reused, development-influenced 2026 matches. The reconstructed-ranking baseline has the lowest observed score (0.1177) versus 0.1433 for L2 logistic regression, but paired uncertainty spans zero; no statistically established superiority or prospective validation is claimed. |
| 5 | **From an official record to a better question** | [Dark](05_evidence_to_decision.png) | [Vector](05_evidence_to_decision.svg) | [Light](05_evidence_to_decision_light.png) | Murderball Analytics moves from the verified Paris 2024 record to a recorded decision and observed aftermath, then to a *hypothetical* legal-lineup exercise. The fourth stage is planning, not historical player tracking. |

The workflow figure is an original vector diagram. It deliberately uses no screenshot: the recorded facts and hypothetical court exploration remain visually separate, and no app screenshot can be mistaken for observed spatial tracking.

## Markdown embedding examples

From a Markdown file in the project root, use the light version on a conventional white page:

```md
![Class 0.5 athletes: 364 of 1,296 Assist Blocks versus 3 of 2,459 tries](Docs/presentation_assets/01_assist_block_discovery_light.png)

![Five Murderball Analytics presentation figures](Docs/presentation_assets/contact_sheet.png)
```

From a Markdown file inside `Docs/`, use `presentation_assets/01_assist_block_discovery_light.png`. For presentation software, insert the dark PNG. Use the SVG when a scalable vector asset is supported.

## Source and scientific notes

- **Assist Blocks:** [`data/extracted/canonical_research_registry.json`](../../data/extracted/canonical_research_registry.json), based on official Athens 2004/Beijing 2008 player box scores. The 44-match denominator is specific to the Assist Block analysis.
- **Paris timeline/workflow:** [`data/extracted/matches/PAR24_M20.json`](../../data/extracted/matches/PAR24_M20.json), checked against [the official WWR Results Book](https://worldwheelchair.rugby/wp-content/uploads/2025/05/PG2024-Overall-results-book.pdf). Times are fourth-quarter clock values. Figures show selected events, not a complete play-by-play.
- **Coverage:** [`canonical_data_manifest.json`](../../data/extracted/canonical_data_manifest.json) and [`data_quality_report.json`](../../data/extracted/data_quality_report.json). The itemized tournament event rows sum to **26,876** in the quality report; the canonical manifest lists **26,878** recorded events. The two-event difference is unresolved here and is disclosed in Figure 3. Reconstructed stints total **5,148** in both files.
- **Model comparison:** [`prediction_level_evaluations.json`](../../data/extracted/prediction_level_evaluations.json) and the canonical registry. All six scores come from the same 24 reused matches. The reconstructed ranking feature uses a previous-rank field in a post-tournament snapshot; no separately dated pre-event ranking snapshot is present in the repository.

## Reproduce and verify

From the project root:

```powershell
python -m pip install "matplotlib>=3.9" "Pillow>=10"
python Docs\presentation_assets\generate_figures.py
```

The [generation script](generate_figures.py) reads the local source files, asserts all headline counts, percentages, tournament match counts, Brier scores, paired-interval conclusion, Paris timestamps/scores, and 1920 × 1080 PNG dimensions, then recreates all exports and the contact sheet. It uses no API keys, network calls, generated sports data, or app code. SVG text is saved as vector paths for stable rendering across machines. All dark and light PNG exports were visually inspected after generation.
