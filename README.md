# UnLegalize

UnLegalize is an India-focused legal clause simplifier for rental and leave-and-license agreements.

The project has:
- A FastAPI backend for text, PDF, image OCR, and URL analysis
- A Next.js frontend with a polished UI and multiple input modes
- Data and training scripts for fine-tuning legal simplification workflows

## Repository Structure

```text
Con-Tech_Srajal/
  backend/
    app/                 # FastAPI app
    scripts/             # Data pipeline and training scripts
    data/                # Raw, cleaned, processed, training, evaluation data
    outputs/             # Reports and generated artifacts
    requirements.txt
  frontend/
    app/                 # Next.js app routes
    components/          # UI components
    lib/                 # API client, hooks, shared types
    package.json
  README.md
```

## Features

- Analyze pasted legal text
- Analyze uploaded PDF agreement files
- Analyze uploaded image files using OCR
- Analyze public agreement URLs
- Return plain-English summary, key points, risk level, and warnings

## Tech Stack

- Backend: FastAPI, Pydantic, pdfplumber, EasyOCR, OpenCV, BeautifulSoup
- Frontend: Next.js 14, TypeScript, Tailwind CSS, Framer Motion

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm 9+

## Backend Setup

1. Go to backend folder.

```bash
cd backend
```

2. Create and activate virtual environment.

```bash
python -m venv .venv
.venv\\Scripts\\activate
```

3. Install dependencies.

```bash
pip install -r requirements.txt
```

4. Optional: create backend environment file.

```bash
copy .env.example .env
```

5. Start backend server.

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend health endpoint:
- GET http://127.0.0.1:8000/health

## Frontend Setup

1. Go to frontend folder.

```bash
cd frontend
```

2. Install dependencies.

```bash
npm install
```

3. Configure API URL.

```bash
copy .env.example .env.local
```

Default value in .env.local:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

4. Start frontend dev server.

```bash
npm run dev
```

Frontend app:
- http://localhost:3000

## Run Both Servers

Open two terminals.

Terminal 1 (backend):

```bash
cd backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Terminal 2 (frontend):

```bash
cd frontend
npm run dev
```

## API Endpoints

- POST /analyze
  - Input via multipart form data:
    - text (string) or
    - file (PDF/image) or
    - url (string)
  - Exactly one input is allowed per request.

- POST /scrape-url
  - JSON body:
    - url (string)
    - simplify (boolean, optional)

- GET /health

## Example Analyze Response

```json
{
  "source_type": "text",
  "file_name": null,
  "extracted_text": "...",
  "plain_english": "...",
  "key_points": ["...", "..."],
  "risk_level": "low",
  "warnings": ["..."]
}
```

## Quick Test Clause

Use this in Text mode:

The Tenant shall pay monthly rent on or before the 5th day of each month, failing which a daily penalty shall apply, and continued default may lead to termination. The Tenant shall indemnify the Landlord against losses arising from misuse of the premises.

## Notes

- Current simplification in backend is rule/mock based. Replace with Gemma inference for production quality.
- If image extraction feels slow on first run, EasyOCR model loading is expected.
- Keep large datasets and generated reports out of Git history when possible.

## Team

- Shivam Singh
- Sujeet Jaiswal
- Srajal Tiwari
- Trijal Kumar Anand
