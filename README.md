# UnLegalize ⚖️

UnLegalize is an India-focused legal clause simplifier targeting rental and leave-and-license agreements. Built for the **AI / SLM Fine-Tuning Track**, this application translates complex Indian legal jargon into plain, actionable English that any tenant can easily understand without needing a lawyer.

---

## 🏆 Hackathon Track: AI / SLM Fine-Tuning

This project was built specifically to demonstrate an end-to-end Small Language Model (SLM) pipeline running 100% locally.

### 1. Data Scraping & Quality (30 Marks)
- **Pipeline:** Custom BeautifulSoup + text extraction scripts scraped over 50 public Indian rental agreements.
- **Cleaning:** Extracted raw text, removed boilerplate, and isolated specifically 113 high-value lease clauses.
- **Quality Control:** Built a robust SFT dataset combining extracted clauses with 30 handcrafted "gold standard" plain-English explanations. Deduplicated the dataset completely to eliminate parrot-learning.
- *Artifacts found in: `backend/data/`*

### 2. Fine-Tuning & Model Performance (20 Marks)
- **Base Model:** `google/gemma-3-270m-it` (Chosen for its highly efficient 270M parameter size).
- **Fine-Tuning Architecture:** Parameter-Efficient Fine-Tuning (PEFT) using **LoRA** (Low-Rank Adaptation) via Hugging Face `trl` and `peft`.
- **Hyperparameters:** `r=32`, `alpha=64`, targeted modules (`q_proj`, `k_proj`, `v_proj`, `o_proj`), 5 epochs with cosine learning rate scheduling to prevent overfitting on the small domain-specific dataset.
- *Artifacts found in: `backend/scripts/train_gemma_qlora.py` and `backend/outputs/`*

### 3. Local Inference Setup & Usability (20 Marks)
- **100% Local Execution:** The model runs entirely on the host machine using PyTorch. **Zero external API calls** (no OpenAI/Anthropic keys used).
- **Graceful Fallback:** The FastAPI backend dynamically detects the fine-tuned LoRA adapter (`adapter_config.json`). If found, it merges the weights into the base Gemma model on startup. If not, it falls back to the base model.
- **Usability:** Users can paste text, upload PDF agreements, or upload images of physical contracts (parsed via local EasyOCR).

### 4. Technical Implementation (20 Marks)
- **Per-Clause Processing:** Instead of stuffing entire 30-page documents into the model (which breaks context windows), the `Analyzer` intelligently splits PDFs into individual clauses and processes them sequentially.
- **Risk Scoring:** Added deterministic risk flagging for dangerous Indian legal keywords (e.g., "forfeit", "indemnify", "lock-in", "eviction").
- **Backend:** Modular FastAPI application.
- **Frontend:** Responsive Next.js 14 dashboard with a clean, user-friendly UI.

---

## 🚀 How to Run Locally (For Judges)

Because this application runs a Local LLM, **we recommend running both the Frontend and Backend locally** to avoid cloud memory limits (free tier cloud servers usually crash on the 2GB memory requirement for Gemma).

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm 9+
- A Hugging Face account (to download the Gemma model weights)

### 1. Backend Setup

Open your terminal and navigate to the backend folder:
```bash
cd backend
```

Create a virtual environment and activate it:
```bash
# On Windows:
python -m venv venv
venv\Scripts\activate

# On Mac/Linux:
python3 -m venv venv
source venv/bin/activate
```

Install the dependencies:
```bash
pip install -r requirements.txt
```

Set up your environment variables:
1. Copy `.env.example` to `.env`
2. Add your `HF_TOKEN` (Hugging Face Access Token) to the `.env` file. You must have accepted the Gemma 3 license terms on HuggingFace.

Start the AI server:
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
*Note: The first startup may take a few minutes as it downloads the Gemma-3-270M weights and EasyOCR models to your machine.*


### 2. Frontend Setup

Open a **new** terminal window and navigate to the frontend folder:
```bash
cd frontend
```

Install the Node dependencies:
```bash
npm install
```

Configure the API connection:
```bash
# On Windows
copy .env.example .env.local

# On Mac/Linux
cp .env.example .env.local
```
*(Ensure `NEXT_PUBLIC_API_BASE_URL` in `.env.local` is set to `http://127.0.0.1:8000`)*

Start the user interface:
```bash
npm run dev
```

**Open your browser to [http://localhost:3000](http://localhost:3000)**

---

## 📂 Repository Structure

```text
Con-Tech_Srajal/
├── backend/
│   ├── app/                 # FastAPI server, Model Inference & Clause Splitting
│   ├── scripts/             # Data scraping, cleaning, SFT prep, and Training scripts
│   ├── data/                # The complete LLM dataset pipeline
│   ├── outputs/
│   │   ├── gemma-3-270m-rental-lora/  # The resulting Fine-Tuned Model Weights
│   │   └── reports/                   # Base vs Fine-Tuned Model comparison evals
│   └── .env                 # Environment config (gitignored for security)
└── frontend/
    ├── app/                 # Next.js App Router UI
    ├── components/          # Reusable Tailwind UI components
    └── .env.local           # Frontend API mapping
```

## 👥 Team
- Shivam Singh
- Sujeet Jaiswal
- Srajal Tiwari
- Trijal Kumar Anand
