## Kalpathon Hackathon Submission

### Team Name
Con-Tech

### Project Name
UnLegalize

### Selected Track
AI / SLM Fine-Tuning

### Selected Problem Statement (PS)
Legal clause simplifier for rental agreements

### Team Leader
Name: Shivam Singh  
Phone: 9555268266

### Team Members
Sujeet Jaiswal  
Srajal Tiwari  
Trijal Kumar Anand

---

## Frontend MVP (Next.js)

This repository now includes a full frontend MVP in the `frontend/` folder for the India-focused Legal Clause Simplifier.

### What this frontend does
- Paste legal clause text and simplify it
- Upload rental agreement PDF and simplify it
- Upload rental agreement image and simplify it
- Submit a public URL for scraping and simplification
- Display extracted text, plain-English meaning, key points, risk level, and warnings

### Backend assumptions
- `POST /analyze` accepts `text` (form field) or `file` (multipart)
- `POST /scrape-url` accepts `url` (JSON or form field)
- API response shape:

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

### Frontend stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS

### Project structure

```text
frontend/
	app/
		globals.css
		layout.tsx
		page.tsx
	components/
		ExampleClauses.tsx
		FileUploadForm.tsx
		Header.tsx
		InputTabs.tsx
		LoadingState.tsx
		ResultPanel.tsx
		RiskBadge.tsx
		TextInputForm.tsx
		UrlScrapeForm.tsx
	lib/
		api.ts
		types.ts
	public/
	.env.example
	next-env.d.ts
	next.config.mjs
	package.json
	postcss.config.js
	tailwind.config.ts
	tsconfig.json
```

### Environment variable

Create `frontend/.env.local` with:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

You can copy from `frontend/.env.example`.

### Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

### Demo-friendly flow
1. Start with `Paste Text` and use one of the quick example clauses.
2. Show the plain-English explanation and risk badge in the result panel.
3. Switch to PDF/Image modes and upload a sample agreement.
4. Optionally show URL scraping mode for a public agreement page.

### Notes for developers
- API helpers are centralized in `frontend/lib/api.ts`.
- Shared types are in `frontend/lib/types.ts`.
- Input mode UI and forms are modular so new modes can be added quickly.
- Main state orchestration (mode, loading, errors, result, reset) is in `frontend/app/page.tsx`.


