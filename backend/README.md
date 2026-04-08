# Legal Clause Simplifier: End-to-End Data And Fine-Tuning Workflow

This project builds a full pipeline for Indian rental agreement and
leave-and-license clause simplification.

Required workflow:

scrape -> clean -> split -> manually label -> prepare SFT dataset ->
fine-tune Gemma 3 270M -> evaluate -> generate report.

Quality gate recommendation:

scrape -> clean -> split -> quality audit -> manually label -> prepare SFT.

## Why this approach

- Data quality matters more than raw quantity for legal text simplification.
- Manual labels preserve legal meaning while improving readability for renters.
- Focused Indian rental clause training improves practical output relevance.

## Project structure

backend/
- scripts/
  - scrape_india_rental_sources.py
  - clean_scraped_text.py
  - split_clauses.py
  - create_training_pairs.py
  - data_quality_audit.py
  - prepare_sft_dataset.py
  - train_gemma_qlora.py
  - evaluate_model.py
  - compare_outputs.py
- data/
  - raw/
  - cleaned/
  - processed/
  - training/
  - evaluation/
- outputs/
  - reports/
- requirements.txt
- README.md

## Setup

Install dependencies:

```bash
pip install -r backend/requirements.txt
```

The scripts read settings from backend/.env:

- HF_TOKEN
- GEMMA_MODEL_ID (defaults to google/gemma-3-270m-it)

## Step-by-step commands

1. Scrape raw data

```bash
python backend/scripts/scrape_india_rental_sources.py
```

2. Clean scraped data

```bash
python backend/scripts/clean_scraped_text.py
```

3. Split into clause-quality records

```bash
python backend/scripts/split_clauses.py
```

4. Create manual labeling pairs

```bash
python backend/scripts/create_training_pairs.py
```

5. Run data quality audit

```bash
python backend/scripts/data_quality_audit.py
```

This writes:

- backend/outputs/reports/data_quality_report.json
- backend/outputs/reports/data_quality_report.md

6. Manually fill output values in backend/data/training/manual_pairs.jsonl

7. Prepare SFT dataset

```bash
python backend/scripts/prepare_sft_dataset.py
```

8. Fine-tune Gemma 3 270M using LoRA/QLoRA

```bash
python backend/scripts/train_gemma_qlora.py
```

9. Evaluate base vs fine-tuned outputs

```bash
python backend/scripts/evaluate_model.py
```

10. Generate judge-friendly report

```bash
python backend/scripts/compare_outputs.py
```

## Example data formats

Raw record:

```json
{
  "id": "source_001",
  "source_url": "https://example.com",
  "source_type": "html",
  "title": "Rental Agreement Format",
  "text": "..."
}
```

Clause record:

```json
{
  "id": "source_001_clause_001",
  "source_url": "https://example.com",
  "title": "Rental Agreement Format",
  "clause": "..."
}
```

SFT record:

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Simplify this Indian rental agreement clause into plain English in one sentence.\n\nClause:\n..."
    },
    {
      "role": "assistant",
      "content": "..."
    }
  ]
}
```

Comparison record:

```json
{
  "id": "eval_001",
  "clause": "...",
  "base_output": "...",
  "finetuned_output": "..."
}
```
