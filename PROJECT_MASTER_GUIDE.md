# UnLegalize: Project Master Guide 🌟

*This is the single, centralized document that contains absolutely everything about the UnLegalize project. It merges the technical architecture, the step-by-step workflow, and the presentation script into one easy-to-read guide. Use this to study for the hackathon judging phase.*

---

## Part 1: The Project Pitch (What We Built)

**The Problem:** Indian rental agreements are full of archaic legal jargon designed to protect landlords and confuse tenants (e.g., *"The Lessee shall indemnify the Lessor against all forfeiture"*).

**The Solution:** We built **UnLegalize**, an AI platform that takes complex Indian legal agreements (via Copy/Paste, PDF upload, or Image upload) and translates the difficult clauses into simple, plain English that anyone can understand. It also flags dangerous "risk" keywords visually.

**Why it's Special (The Hackathon Angle):** We didn't use a massive Cloud API like ChatGPT. To protect tenant privacy, we built a **Small Language Model (SLM)** pipeline that runs 100% locally on a standard laptop.

---

## Part 2: Step-by-Step System Workflow (How Data Moves)

If a judge asks *"Walk me through how this actually works from start to finish"*, use these 6 steps:

### Phase A: Training the AI (The ML Pipeline)
1. **The HTML Scraper (Raw Data Collection):** If you train an AI on generic data, it gives generic answers. We wrote custom `BeautifulSoup` python scripts to download the raw HTML of 50+ real Indian legal agreements. The script stripped away website menus, ads, and footers, extracting pure `<p>` legal text and shrinking it down to 113 high-value clauses.
2. **SFT Dataset Creation (Formatting):** AI needs structured data. We wrote a script (`rebuild_training_data.py`) to take those raw clauses and format them into a **JSONL** chat format (`user` vs `assistant`), which is required for Supervised Fine-Tuning.
3. **The "Parrot Problem" (Deduplication):** If an AI sees the same answer 20 times in training, it just "parrots" it back blindly. Our script heavily deduplicated the data. We then handcrafted 30 "Gold Standard" pairs to manually teach the model our exact tone of voice. This resulted in a premium dataset of 186 rows.
4. **Fine-Tuning Matrices (PEFT/LoRA):** Training all 270M parameters of our base Gemma model would create a 2GB file that GitHub rejects. Instead, we used **LoRA**. We froze the base model and attached tiny, blank mathematical matrices to the `q`, `k`, `v`, and `o` attention layers (using a mathematical Rank of 32). 
5. **The 3MB Miracle:** When we ran the `SFTTrainer`, it only updated those tiny attached matrices, dropping our loss from 4.27 to 1.21. Our final output was just the matrices (`adapter_model.safetensors`), which is beautifully small at only **3 Megabytes!**

### Phase B: When a User Uploads a File
4. **The 4 Input Modes (The Parsers):** A user has four different ways to interact with our Next.js frontend, making it incredibly accessible for non-technical tenants:
   * **Raw Text Paste:** Bypasses extraction logic; the text is sent straight to the context window splitter. Fast and immediate.
   * **PDF Upload:** Our Python backend uses `pdfplumber` to safely parse digital text layer out of multi-page PDF documents.
   * **Image Upload (Physical Contracts):** If a tenant takes a cell phone picture of a paper contract, our backend uses **Local OCR** (Optical Character Recognition via `EasyOCR`) to literally read the text off the JPG/PNG offline.
   * **URL Scraper:** If a tenant finds a lease template on a public website, they just paste the link. Our backend uses `BeautifulSoup` to visit the site, strip away the menus/ads, and extract the raw legal text automatically.
5. **Context Window Splitter:** Small AI models crash if you feed them 30 pages at once. To fix this, our backend systematically splits the huge document down into **individual clauses** using Regex.
6. **Local Translation & Risk Scoring:** Our backend loads our fine-tuned LoRA weights into PyTorch. It translates the separated clauses one-by-one into plain English. Simultaneously, it scans the text for "danger keywords" (like *Indemnify*, *Evict*, *Forfeit*) to calculate a total Risk Score before sending it back to the frontend.

---

## Part 3: Deep Technical Details (For Hard Questions)

Here are the advanced technical details of the AI and Architecture for when the judges look closely at your code.

### 1. Why Gemma 3 270M?
We chose a 270 Million parameter model because it is incredibly lightweight. A large model like LLaMA 3 8B requires 8GB+ of VRAM to function. Our Gemma 3 setup allows local, private inference on a standard laptop using less than 2GB of RAM.

### 2. Fine-Tuning Accuracy & LoRA (Bypassing GitHub Limits)
**The Problem:** Normal fine-tuning updates all 270 Million parameters in an AI's brain. Doing that requires supercomputers and generates a massive 2+ Gigabyte file that gets blocked by GitHub's 100MB limit. 
**The Solution:** We used **PEFT (Parameter-Efficient Fine-Tuning)** with **LoRA (Low-Rank Adaptation)**.

Instead of retraining the whole model, LoRA freezes the base model weights and only trains tiny mathematical matrices (`q_proj, k_proj, v_proj, o_proj`) on the side. This means our final fine-tuned file is only **3 Megabytes**.
*   **Hyperparameters used:** Rank (`r`) = 32, Alpha = 64, trained for 5 epochs with a Cosine Learning rate schedule to prevent overfitting on our small dataset.
*   **Before Fine-Tuning:** The base model would hallucinate dates and ignore instructions.
*   **After Fine-Tuning:** The model accurately replaces legal actors (e.g., converts 'Lessee' to 'Tenant') and translates accurately without losing the legal restriction bounds.

### 3. The "Cheat Sheet" Analogy (Use this for Judges!)
If the judges ask how LoRA works, use this exact analogy:
> *"Think of Gemma as a high school student with a massive brain who speaks perfect English, but knows nothing about Indian Law. Instead of forcing the student to re-read years of law school textbooks to rewire their whole brain (Full Fine-Tuning), we just handed them a 3-page cheat sheet on Indian Property Law (LoRA). When our backend runs, the student uses their massive English brain combined with our tiny 3MB cheat sheet to give perfect legal translations."*

### 4. The 100% Local Merging Architecture
Absolutely zero tenant data is sent to external APIs. When the FastAPI server boots up, it looks for the 3MB LoRA `adapter_model.safetensors` file. If it finds it, it dynamically merges the LoRA cheat sheet into the base Gemma model inside PyTorch's local memory.

---

## Part 4: How to Deploy/Run Locally for the Demo

Do NOT deploy the backend to Render or Heroku. Free cloud providers have a 512MB memory limit, and they will crash when trying to load PyTorch and the LLM. 

**Run everything locally on your laptop to guarantee a smooth presentation.**

**Terminal 1 (The AI Backend):**
```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 2 (The User Interface):**
```bash
cd frontend
npm run dev
```

*(Keep the app open at `http://localhost:3000` on your screen when speaking to the judges!)*

---

## Part 5: Advanced Talking Points (Flexing on the Judges)

If the judges seem highly technical and ask hard questions, use these advanced talking points to prove your engineering skills:

*   **"How do you handle bad Image uploads?"** -> *"We built the backend robustly. If someone uploads an extremely blurry photo, `EasyOCR` still outputs its best-guess text matrix, which our fine-tuned LoRA model is actually trained to smooth out contextually if it detects broken syntactic words."*
*   **"What happens if a user uploads a 50-page PDF?"** -> *"That's exactly why we built the Context Window Splitter. Instead of passing 50 pages and crashing PyTorch with an Out-of-Memory (OOM) error, our FastAPI server streams the document, isolates the sentences, and batches them. It's infinitely scalable."*
*   **"Why didn't you just use an API key from OpenAI?"** -> *"Legal documents contain highly sensitive personal information, addresses, and financial data. Using a third-party cloud API violates tenant privacy. By taking the time to fine-tune our own SLM, we ensure 100% of the tenant's data never leaves their local device."*
*   **"How did you get the UI to look so good?"** -> *"We used Next.js and Tailwind CSS with custom Framer Motion animations. We specifically designed the 'AI Result' panel using glassmorphism and subtle CSS glow gradients to make the AI inference visually tangible to the user."*
