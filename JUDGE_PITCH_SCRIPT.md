# UnLegalize: Judge Presentation Script 🎤

*Use this document as your guide when explaining the project to the judges. It flows from a basic overview to the advanced technical details, covering all 5 grading criteria.*

---

## 1. The Hook (Basic Overview)
**Goal:** Explain the problem and your solution simply.

"Hi judges, we are team UnLegalize. 
If you’ve ever rented an apartment in India, you know the lease agreements are written in complex legal jargon like *'The Lessee shall indemnify the Lessor'* or *'Notwithstanding any forfeiture'*. Normal tenants don't understand this, and landlords use it to trap them in bad contracts.

Our solution is **UnLegalize** — an AI tool that takes any Indian rental agreement (via text, PDF, image, or URL) and instantly translates those complex clauses into plain, simple English. We didn't just build a regular app; we built an entire AI pipeline and fine-tuned a custom Small Language Model (SLM) to run 100% locally to protect user privacy."

---

## 2. Data Scraping & Quality (30 Marks)
**Goal:** Prove you didn't just download a ready-made dataset.

"To train our model, we couldn't just use ChatGPT data. We built a custom scraping pipeline using Python (`BeautifulSoup`) to scrape over 50 real Indian rental agreements online. 
- We extracted the raw text and cleaned it to isolate exactly **113 high-value legal clauses** (like lock-in periods, police verification, and eviction notices).
- *[Advanced detail]*: We ran a data quality script to completely deduplicate the dataset, ensuring the model wouldn't just parrot answers. We then injected 30 'gold standard' handcrafted training pairs to teach the model the exact plain-English tone we wanted. 
- You can see our data pipeline in the `backend/data/` folder and `rebuild_training_data.py` script."

---

## 3. Fine-Tuning & Model Performance (20 Marks)
**Goal:** Showcase your ML engineering skills.

"For our model, we selected **Gemma 3 270M**. We chose SLMs over LLMs because we wanted local execution without relying on expensive OpenAI API keys.

- *[Advanced detail]*: Because 270M is a smaller model, its default legal understanding wasn't perfect. So, we fine-tuned it using **LoRA (Low-Rank Adaptation)**.
- We set our LoRA rank (`r`) to 32, targeted the `q`, `k`, `v`, and `o` projection layers, and trained it for 5 epochs with a cosine learning rate scheduler to prevent overfitting on our small dataset.
- The training loss dropped from `4.27` down to `1.21`! 
- Our automated evaluation script (`evaluate_model.py`) generated a `model_comparison.md` report proving the fine-tuned model now produces highly accurate, context-aware translations instead of generic responses."

---

## 4. Local Inference & Pipeline (20 Marks)
**Goal:** Prove it runs locally and handles context well.

"Let's look at how the app actually runs. 
- **100% Local Inference:** Our AI runs entirely on PyTorch locally. On startup, our backend dynamically checks for our fine-tuned LoRA `adapter_model.safetensors` file. If it finds it, it merges the weights into the base Gemma model automatically.
- *[Advanced detail]*: We solved the **Context Window problem**. If you feed a 30-page PDF to a 270M parameter model, it breaks. So we built an intelligent `Analyzer` service that splits the entire document into individual clauses using regex patterns. It feeds each clause to the model *one by one*, aggregating the plain-English results and flagging the high-risk keywords (like 'forfeit' or 'eviction') automatically."

---

## 5. Demo & Conclusion (10 Marks)
**Goal:** Show them the working UI.

*(Show the frontend running locally without Ngrok. Paste a complex clause into the text box and hit analyze).*

"As you can see, the complex clause went directly to our local PyTorch instance, the fine-tuned Gemma model translated it perfectly into one sentence, and our backend flagged the hidden risks. We built a complete, secure, end-to-end SLM pipeline in just 24 hours.

Thank you! We're happy to answer any technical questions."

---

### 🔥 Quick Answers for Likely Judge Questions:

**Q: Why Gemma 3 270M instead of LLaMA 3 8B?**
*A: Resource constraints. LLaMA 3 requires over 8GB of VRAM to perform inference. Gemma 270M allowed us to prove our fine-tuning pipeline works on consumer laptops while maintaining privacy.*

**Q: What is LoRA and why did you use it?**
*A: LoRA (Low-Rank Adaptation) freezes the base model weights and only trains a tiny subset of new parameter matrices. It let us train the model in 15 minutes on a CPU instead of needing an expensive GPU cluster.*

**Q: How did you calculate the training Loss?**
*A: We used HuggingFace's `SFTTrainer` (Supervised Fine-Tuning) and measured the cross-entropy loss against the labels we generated in our clean SFT JSONL dataset.*
