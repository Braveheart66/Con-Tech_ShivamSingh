import logging
import re
from functools import lru_cache
from pathlib import Path

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

from app.config import get_settings

try:
    from peft import PeftModel
    PEFT_AVAILABLE = True
except ImportError:
    PeftModel = None
    PEFT_AVAILABLE = False

logger = logging.getLogger(__name__)

device = "cuda" if torch.cuda.is_available() else "cpu"

# Path to fine-tuned LoRA adapter (relative to backend/)
ADAPTER_DIR = Path(__file__).resolve().parents[2] / "outputs" / "gemma-3-270m-rental-lora"


HIGH_RISK = {
    "forfeit": "Deposit taken without reason",
    "waives all rights": "You lose right to dispute",
    "without court": "Landlord acts without legal process",
    "sole discretion": "Landlord has unchecked power",
    "immediately re-enter": "Landlord enters flat without notice",
    "without notice": "No warning before action",
    "waives": "Your legal rights removed",
    "indemnify": "You bear all losses and costs",
    "irrevocable": "Cannot be reversed or cancelled",
    "non-refundable": "Money will not be returned",
    "eviction": "You may be forced to leave",
    "dispossess": "You may lose possession of the property",
}

MEDIUM_RISK = {
    "deduction": "Money cut from deposit",
    "penalty": "You may be fined",
    "damages": "You may be charged",
    "breach": "Breaking rules has consequences",
    "terminate": "Agreement can end early",
    "liable": "You are legally responsible",
    "lock-in": "You cannot leave before a fixed period",
    "escalation": "Rent or charges may increase",
    "arbitration": "Disputes settled outside court",
    "force majeure": "Uncontrollable events may affect agreement",
}


def _extract_key_points(text: str, max_points: int = 5) -> list[str]:
    sentences = re.split(r"(?<=[.!?])\s+", text)
    points = [
        sentence.strip()
        for sentence in sentences
        if len(sentence.strip()) > 20
    ]
    return points[:max_points]


def _score_risk(clause: str) -> dict:
    lowered = clause.lower()
    reasons: list[str] = []
    flags: list[str] = []
    score = 0

    for phrase, reason in HIGH_RISK.items():
        if phrase in lowered:
            score += 20
            flags.append(phrase)
            reasons.append(reason)

    for phrase, reason in MEDIUM_RISK.items():
        if phrase in lowered:
            score += 10
            flags.append(phrase)
            reasons.append(reason)

    score = min(score, 100)

    if score >= 70:
        risk_level = "High Risk"
    elif score >= 40:
        risk_level = "Medium Risk"
    else:
        risk_level = "Low Risk"

    return {
        "risk_score": score,
        "risk_level": risk_level,
        "reasons": reasons,
        "flags": flags,
    }


@lru_cache
def get_model_bundle() -> tuple[AutoTokenizer, AutoModelForCausalLM]:
    settings = get_settings()
    model_id = settings.gemma_model_id
    hf_token = settings.hf_token or None

    logger.info("Loading model: %s on device: %s", model_id, device)

    tokenizer = AutoTokenizer.from_pretrained(
        model_id,
        token=hf_token,
    )
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        token=hf_token,
        torch_dtype=torch.float32,
    )

    # Load fine-tuned LoRA adapter if available
    adapter_config = ADAPTER_DIR / "adapter_config.json"
    if adapter_config.exists() and PEFT_AVAILABLE:
        logger.info("Loading fine-tuned LoRA adapter from: %s", ADAPTER_DIR)
        try:
            model = PeftModel.from_pretrained(model, str(ADAPTER_DIR))
            model = model.merge_and_unload()
            logger.info("LoRA adapter merged successfully — using fine-tuned model")
        except Exception as exc:
            logger.warning("Failed to load LoRA adapter, using base model: %s", exc)
    elif adapter_config.exists() and not PEFT_AVAILABLE:
        logger.warning("LoRA adapter found but peft not installed — using base model")
    else:
        logger.info("No LoRA adapter found at %s — using base model", ADAPTER_DIR)

    model.to(device)
    model.eval()

    logger.info("Model loaded successfully: %s (%s params)", model_id, f"{model.num_parameters():,}")
    return tokenizer, model


def print_model_runtime_info() -> None:
    settings = get_settings()
    model_id = settings.gemma_model_id
    adapter_status = "with LoRA adapter" if (ADAPTER_DIR / "adapter_config.json").exists() and PEFT_AVAILABLE else "base model only"
    try:
        _, model = get_model_bundle()
        logger.info("Model running locally on CPU/GPU — zero external API calls")
        logger.info("Model: %s (%s) | Device: %s | Parameters: %s", model_id, adapter_status, device, f"{model.num_parameters():,}")
    except Exception as exc:
        logger.warning("Model loading deferred — will load on first request")
        logger.warning("Model: %s | Device: %s | Error: %s", model_id, device, exc)


def _generate_plain_english(clause: str) -> str:
    """Generate a plain-English simplification of a legal clause using Gemma 3."""
    system_prompt = (
        "You are a legal language simplifier for Indian rental agreements. "
        "Convert the given legal clause into plain, simple English that any tenant can understand. "
        "Rules:\n"
        "- Use 1-2 short sentences maximum\n"
        "- Start with: You must / You cannot / Your landlord can / This means\n"
        "- No legal jargon\n"
        "- Be specific about what the tenant needs to know\n"
        "- If it mentions money, mention the amount or condition"
    )

    try:
        tokenizer, model = get_model_bundle()

        # Use Gemma 3 chat template via tokenizer
        messages = [
            {"role": "user", "content": f"{system_prompt}\n\nSimplify this clause:\n{clause}"},
        ]

        prompt = tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True,
        )

        inputs = tokenizer(prompt, return_tensors="pt").to(device)
        with torch.no_grad():
            generated = model.generate(
                **inputs,
                max_new_tokens=80,
                temperature=0.3,
                repetition_penalty=1.2,
                do_sample=True,
            )

        # Decode only the new tokens (skip the input prompt)
        new_tokens = generated[0][inputs["input_ids"].shape[1]:]
        result = tokenizer.decode(new_tokens, skip_special_tokens=True).strip()

        # Clean up: take up to 2 sentences
        sentences = re.split(r"(?<=[.!?])\s+", result)
        cleaned = ". ".join(s.strip() for s in sentences[:2] if s.strip())
        if cleaned and not cleaned.endswith("."):
            cleaned += "."

        return cleaned if cleaned and len(cleaned) > 10 else _fallback_simplify(clause)

    except Exception as exc:
        logger.error("LLM inference failed: %s", exc, exc_info=True)
        return _fallback_simplify(clause)


def _fallback_simplify(clause: str) -> str:
    """Deterministic local fallback for when the model is unavailable."""
    lowered = clause.lower()
    if "sublet" in lowered or "assign" in lowered:
        return "You cannot give your flat to someone else without your landlord's written permission."
    if "terminate" in lowered and "notice" in lowered:
        return "Your landlord can end this agreement by giving you prior written notice."
    if "forfeit" in lowered or "sole discretion" in lowered:
        return "Your landlord can keep your entire deposit for any reason they choose."
    if "maintenance" in lowered or "repair" in lowered:
        return "You are responsible for keeping the property in good condition during your stay."
    if "rent" in lowered and ("increase" in lowered or "escalat" in lowered):
        return "Your rent may increase during the agreement period."
    if "deposit" in lowered and ("refund" in lowered or "return" in lowered):
        return "Your deposit will be returned after deducting any damages or unpaid dues."
    if "lock-in" in lowered or "lock in" in lowered:
        return "You cannot leave the property before a fixed period without paying a penalty."
    if "penalty" in lowered or "fine" in lowered:
        return "You may be charged extra money if you break this rule."
    return "You must follow this rental rule or your landlord may take action."


def simplify_legal_text(legal_text: str) -> dict:
    """Simplify a single clause or short legal text segment."""
    if not legal_text.strip():
        return {
            "plain_english": "You must provide clause text for simplification.",
            "key_points": [],
            "risk_score": 0,
            "risk_level": "Low Risk",
            "reasons": [],
            "flags": [],
            "warnings": [
                "Input text was empty after extraction and cleaning."
            ],
        }

    risk = _score_risk(legal_text)
    key_points = _extract_key_points(legal_text)
    plain_english = _generate_plain_english(legal_text)

    warnings: list[str] = []
    if risk["risk_score"] >= 40:
        warnings.append("Potentially sensitive legal obligations detected. Manual review is recommended.")

    return {
        "plain_english": plain_english,
        "key_points": key_points,
        "risk_score": risk["risk_score"],
        "risk_level": risk["risk_level"],
        "reasons": risk["reasons"],
        "flags": risk["flags"],
        "warnings": warnings,
    }


def simplify_clauses(clauses: list[str]) -> dict:
    """Simplify each clause individually and aggregate results."""
    if not clauses:
        return simplify_legal_text("")

    all_plain: list[str] = []
    all_key_points: list[str] = []
    all_reasons: list[str] = []
    all_flags: list[str] = []
    all_warnings: list[str] = []
    total_risk_score = 0
    clause_count = 0

    for clause in clauses:
        if not clause.strip():
            continue
        result = simplify_legal_text(clause)
        all_plain.append(result["plain_english"])
        all_key_points.extend(result["key_points"])
        all_reasons.extend(result["reasons"])
        all_flags.extend(result["flags"])
        all_warnings.extend(result["warnings"])
        total_risk_score += result["risk_score"]
        clause_count += 1

    if clause_count == 0:
        return simplify_legal_text("")

    # Average risk score across all clauses
    avg_risk = min(total_risk_score // clause_count, 100) if clause_count else 0

    if avg_risk >= 70:
        risk_level = "High Risk"
    elif avg_risk >= 40:
        risk_level = "Medium Risk"
    else:
        risk_level = "Low Risk"

    # Deduplicate
    unique_reasons = list(dict.fromkeys(all_reasons))
    unique_flags = list(dict.fromkeys(all_flags))
    unique_warnings = list(dict.fromkeys(all_warnings))

    return {
        "plain_english": "\n\n".join(all_plain),
        "key_points": all_key_points[:8],
        "risk_score": avg_risk,
        "risk_level": risk_level,
        "reasons": unique_reasons,
        "flags": unique_flags,
        "warnings": unique_warnings,
    }
