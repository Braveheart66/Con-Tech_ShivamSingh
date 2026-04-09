# Legal Clause Simplifier Backend: Judge Guide

## 1. What this backend does

This backend helps Indian renters understand difficult legal language in:

- Rental Agreements
- Leave and License Agreements

It accepts legal content from multiple sources, simplifies the clauses into plain English, and returns structured JSON.

## 2. Why this matters

Most renters cannot easily understand legal clauses about:

- notice period
- security deposit deductions
- lock-in period
- maintenance responsibilities
- termination rights

This backend converts those clauses into simple, tenant-friendly language while preserving legal meaning.

## 3. Core backend capabilities

The API supports four input modes:

1. pasted text
2. uploaded PDF
3. uploaded image (OCR)
4. scraped URL content

Then it runs this flow:

1. extract text
2. clean text
3. split into legal clauses
4. simplify each clause
5. return JSON with risk and key points

## 4. API architecture (simple view)

- app/main.py
  - starts FastAPI app
  - enables CORS
  - registers routes
  - health endpoint

- app/routers/analyze.py
  - POST /analyze
  - handles text + file uploads

- app/routers/scrape.py
  - POST /scrape-url
  - handles URL scraping and simplification

- app/services/
  - extract_pdf.py: PDF text extraction
  - extract_image.py: OCR from images
  - scrape_web.py: webpage extraction
  - clean_text.py: noise removal and normalization
  - split_clauses.py: clause segmentation
  - simplify.py: simplification output format
  - analyzer.py: orchestrates full pipeline

- app/utils/file_validation.py
  - file type and size checks

## 5. Structured output returned by backend

Each analysis returns:

- source_type
- file_name
- extracted_text
- plain_english
- key_points
- risk_level
- warnings

This makes frontend display easy and consistent.

## 6. Data and training pipeline in this project

This backend also includes model training support:

1. scrape data from India-specific legal sources
2. clean and filter to in-domain legal text
3. split into useful clauses
4. create and refine labeled pairs
5. prepare chat-style SFT dataset
6. fine-tune Gemma 3 270M with LoRA
7. evaluate base vs fine-tuned outputs
8. generate comparison report for judges

## 7. Data quality focus (important for judging)

Data quality improvements included:

- in-domain scraping relevance filters
- removal of off-topic legal templates
- conservative text cleanup preserving legal terms
- clause-level quality filtering
- targeted label refinement for high-risk clause types

This project prioritizes high-quality, relevant data over noisy large-scale scraping.

## 8. Model used

Fine-tuning target:

- google/gemma-3-270m-it

Fine-tuning method:

- LoRA / QLoRA style setup
- practical hackathon-friendly training config

## 9. Demo talking points for judges

Use this short flow:

1. Give a complex rental clause as input.
2. Show extracted clause text.
3. Show plain-English simplification output.
4. Show risk level and warnings.
5. Explain that the same backend works for text, PDF, image, and URL.
6. Explain that the model is fine-tuned on India-specific rental/legal data.

## 10. Key endpoints

- GET /health
- POST /analyze
- POST /scrape-url

## 11. What is already production-minded

- modular services
- safe error handling
- structured schema outputs
- file validation
- environment-based config
- repeatable scripts for data and training

## 12. One-line summary for judges

This backend is a full India-focused legal simplification pipeline: from scraping and cleaning legal clauses to fine-tuning Gemma 3 270M and serving renter-friendly clause explanations through a simple API.
