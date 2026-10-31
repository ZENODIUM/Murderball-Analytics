# MurderBall: technical evidence and limits

This appendix supports the [submission README](../README.md). Headline research claims follow the [authoritative registry](../data/extracted/canonical_research_registry.json), not older narrative reports. Counts from different cohorts are kept separate.

## Data coverage and reconciliation

| Source cohort | What is present | Verified boundary |
| --- | --- | --- |
| Six Paralympic tournaments, Athens 2004–Paris 2024 | **120** detailed matches; **120/120** final scores reconciled against official results; **5,148** reconstructed lineup stints | Athlete minutes reconciled in **26/120** matches. Event, box-score, and stint fields vary by era and match; no full spatial tracking is claimed. |
| 2026 World Championship | **46** matches in the canonical catalog | Result-level coverage is distinct from the six detailed Paralympic tournaments. |
| Invitational competitions | **37** cataloged matches | These are not part of the 166 official championship-match subtotal. |

The [canonical manifest](../data/extracted/canonical_data_manifest.json) counts **203 cataloged matches** in total (120 + 46 + 37) and **26,878 recorded events**. The [data quality report](../data/extracted/data_quality_report.json) totals **26,876 play-by-play event rows** across the six detailed tournaments. The two-event difference has not been reconciled by event definition; this appendix and the [coverage figure](presentation_assets/03_historical_coverage.png) disclose it rather than treating the numbers as interchangeable. The report also lists four older World Championship *summary* tournaments; those summary rows are a different coverage layer, not additional detailed Paralympic matches.

The original books are available from [World Wheelchair Rugby](https://worldwheelchair.rugby/results/). The [reconstructed Paris 2024 match record](../data/extracted/matches/PAR24_M20.json) preserves the event sequence used by the application.

## Flagship result: class 0.5 Assist Blocks

| Measure | Class 0.5 | Cohort total | Share |
| --- | ---: | ---: | ---: |
| Officially recorded Assist Blocks | **364** | **1,296** | **28.1%** |
| Tries | **3** | **2,459** | **0.12%** |

The unit is the official player box-score event in **44 Athens 2004 and Beijing 2008 matches**. A Pearson chi-square comparison of the functional-class distributions of tries and Assist Blocks yields **χ²(6) = 1177.7168**, **p = 3.18 × 10⁻²⁵¹**, **Cramér's V = 0.56** in the [registry](../data/extracted/canonical_research_registry.json). This is a strong descriptive association between event type and classification. It does **not** measure spatial lane creation, individual block quality, or the causal effect of a block on a try. The cohort is specific to these official box scores and cannot be generalized to all eras without new data.

## Paris 2024 decision example

The [reconstructed match record](../data/extracted/matches/PAR24_M20.json), checked against the [official Paris Results Book](https://worldwheelchair.rugby/wp-content/uploads/2025/05/PG2024-Overall-results-book.pdf), has Japan winning the gold final **48–41**. With **5:31** left in Q4, the score was **Japan 39–USA 34**; the record shows a USA 60-second timeout and Sarah Adam out / Josh Wheeler in. At **5:20**, a USA try made it **39–35**. Later recorded events include a USA turnover at **4:50** and a Japan try at **3:59** (42–36). These are selected points in the official sequence, not an effect estimate for the timeout or substitution. The [timeline figure](presentation_assets/02_paris_decision_timeline.png) labels them accordingly.

## Retrospective predictive comparison

The six models were compared on **24 reused 2026 World Championship matches that influenced development**. Brier score is the mean squared error of a predicted win probability; **lower is better**.

| Model | Brier score |
| --- | ---: |
| Reconstructed-ranking baseline | **0.1177** |
| L2 logistic regression | **0.1433** |
| Random forest | **0.1513** |
| Dynamic Elo | **0.1771** |
| Gradient boosting | **0.2062** |
| Constant 50/50 baseline | **0.2500** |

The baseline has the lowest *observed* error. For logistic minus baseline, the paired mean Brier difference is **+0.0256**; the 95% *t* interval is **[−0.0626, +0.1139]**, with **p = 0.5539**. The interval spans zero, so predictive superiority has **not** been established. The baseline's ranking order was reconstructed from a **“previous rank” field in the official 29 August 2026 post-tournament snapshot**. There is no separately dated pre-event ranking snapshot in this repository. This is a retrospective sensitivity analysis, not an untouched prospective test or a validated model champion. See the [prediction-level evaluation](../data/extracted/prediction_level_evaluations.json), [registry](../data/extracted/canonical_research_registry.json), and [model figure](presentation_assets/04_model_comparison.png).

## Other results kept in proportion

- **Timeouts:** The adjusted observational scoring-run analysis reports **p = 0.66**. It does not establish a causal benefit or justify an automatic timeout after a 3–0 run.
- **Female classification allowance:** Across **5,148** active legal lineup stints, the recorded net-efficiency difference was **−0.0078 tries/min** with Welch **p = 0.8923**. No detectable mean difference in this comparison is not proof of parity, equivalence, or no causal effect.
- **Lineup ratings and simulations:** Regularized adjusted plus-minus, lineup search, and match simulations depend on their cohorts and model assumptions. A solver can find the best lineup under its encoded objective and rule constraint; it cannot establish that lineup as the best real-world choice for a particular opponent. A Tactical Court sketch is a hypothetical arrangement, not observed player tracking.

## Reproduce and audit

- [Research reproduction script](../scripts/reproduce_statistical_research.py) and [model reproduction script](../scripts/reproduce_ml_benchmarks.py)
- [Canonical registry tests](../tests/test_canonical_research_registry.py) and [scientific consistency browser check](../scripts/verify_scientific_consistency.py)
- [Figure-generation script](presentation_assets/generate_figures.py), with source checks for every displayed figure

The [README's feature directory and experiment table](../README.md#research-and-experiments) summarize all 23 views and the 12-question research portfolio. The backend has a Jev-style typed decision adapter and an offline Coach Assistant; a server-side key is recognized, but live Jev API calls are not implemented in this release.

The application distinguishes official observations, reconstructed records, observational associations, retrospective evaluations, and hypothetical scenarios. Video and event clocks may be unsynchronized. Pass routes, screens, presses, spatial formations, and coaching intent should not be presented as observed without verified synchronized footage or tracking data.
