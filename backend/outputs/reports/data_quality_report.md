# Data Quality Audit

| Metric | Value |
| --- | --- |
| raw_records | 21 |
| cleaned_records | 21 |
| clause_records | 113 |
| avg_raw_words | 476.81 |
| avg_cleaned_words | 470.57 |
| avg_clause_words | 70.94 |
| unique_source_ratio | 1.0 |
| unique_clause_ratio | 0.9204 |
| clauses_with_legal_signal | 73 |
| legal_term_hits | 129 |
| quality_score_100 | 91.33 |

Interpretation guide:
- quality_score_100 >= 75: strong dataset for fine-tuning.
- quality_score_100 55-74: usable, improve breadth and clauses.
- quality_score_100 < 55: improve scraping before labeling.