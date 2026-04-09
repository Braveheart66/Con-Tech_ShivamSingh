"""
Rebuild the SFT training dataset with high-quality, deduplicated labels.

Fixes:
1. Removes samples where output == input (copy-paste)
2. Removes samples with empty outputs
3. Deduplicates: if the same output is used 3+ times, only keep the best match
4. Adds hand-crafted high-quality training pairs for common Indian rental clauses
5. Re-formats everything into clean chat-style SFT format
"""

from __future__ import annotations

import json
import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
MANUAL_PAIRS_PATH = BASE_DIR / "data" / "training" / "manual_pairs.jsonl"
TRAIN_SFT_PATH = BASE_DIR / "data" / "training" / "train_sft.jsonl"
TRAIN_SFT_BACKUP = BASE_DIR / "data" / "training" / "train_sft_backup.jsonl"


# High-quality hand-crafted training pairs for Indian rental agreements
GOLD_PAIRS = [
    {
        "input": "The Licensee shall pay monthly license fees on or before the 5th day of each calendar month. Delay in payment beyond 7 days shall attract a penalty of Rs. 100 per day.",
        "output": "You must pay rent by the 5th of every month. If you are late by more than 7 days, you will be charged Rs. 100 per day as a fine."
    },
    {
        "input": "Either party may terminate this leave and license agreement by giving 30 days written notice to the other party.",
        "output": "You or your landlord can end this agreement by giving 30 days written notice."
    },
    {
        "input": "The Lessee shall bear all maintenance charges, electricity charges, water charges, and municipal dues during the term of tenancy.",
        "output": "You must pay for electricity, water, maintenance, and municipal taxes during your stay."
    },
    {
        "input": "The Lessor may forfeit part or whole of the security deposit towards unpaid rent, damages to the property, or other liabilities at the time of vacating.",
        "output": "Your landlord can keep some or all of your deposit if you owe rent, damage the property, or have other unpaid dues."
    },
    {
        "input": "The Tenant shall not sublet, assign, or part with possession of the premises or any part thereof without the prior written consent of the Landlord.",
        "output": "You cannot rent out this property to someone else or share it without your landlord's written permission."
    },
    {
        "input": "Police verification of the Licensee shall be completed by the Licensor within 30 days and both parties shall cooperate for documentation.",
        "output": "Your landlord must complete your police verification within 30 days, and you must help with the paperwork."
    },
    {
        "input": "A lock-in period of eleven months shall apply from the date of commencement and early termination during this period may require payment of remaining months rent as compensation.",
        "output": "You cannot leave before 11 months. If you leave early, you may have to pay the remaining months rent."
    },
    {
        "input": "The agreement shall be registered under the Maharashtra Rent Control Act and applicable stamp duty and registration charges shall be borne equally by both parties.",
        "output": "This agreement must be officially registered, and both you and the landlord will share the stamp duty and registration costs."
    },
    {
        "input": "The Tenant shall use the premises solely for residential purposes and shall not carry on any commercial activity or business therein.",
        "output": "You can only use this place to live in. You cannot run a business from here."
    },
    {
        "input": "The Landlord shall have the right to inspect the premises with prior notice of 24 hours during reasonable hours.",
        "output": "Your landlord can visit the property to check on it, but must give you 24 hours notice first."
    },
    {
        "input": "The Tenant shall not make any structural alterations, additions or modifications to the premises without the prior written consent of the Landlord.",
        "output": "You cannot make any physical changes to the property like breaking walls or adding rooms without your landlord's written approval."
    },
    {
        "input": "Upon expiry of the lease period, the Tenant shall hand over vacant and peaceful possession of the premises in the same condition as received, subject to normal wear and tear.",
        "output": "When the agreement ends, you must return the property in the same condition you received it, except for normal wear and tear."
    },
    {
        "input": "The security deposit of Rs. 2,00,000 shall be refunded to the Tenant within 30 days of vacating the premises after deducting any outstanding dues.",
        "output": "Your deposit of Rs. 2 lakh will be returned within 30 days after you leave, minus any unpaid bills or damages."
    },
    {
        "input": "In case of any dispute arising out of this agreement, the same shall be referred to arbitration under the Arbitration and Conciliation Act, 1996.",
        "output": "If there is a disagreement, it will be settled through arbitration instead of going to court."
    },
    {
        "input": "The rent shall be escalated by 5 percent annually on each anniversary of the commencement date.",
        "output": "Your rent will increase by 5% every year on the anniversary of when your agreement started."
    },
    {
        "input": "The Tenant shall be responsible for all minor repairs up to Rs. 5,000 and the Landlord shall bear all major structural repairs.",
        "output": "You must pay for small repairs up to Rs. 5,000. Your landlord will pay for major structural repairs."
    },
    {
        "input": "The Landlord hereby indemnifies the Tenant against any title disputes or claims by third parties on the said premises.",
        "output": "Your landlord guarantees that no one else has a claim on this property, and will protect you if someone does."
    },
    {
        "input": "Notwithstanding anything contained herein, the Landlord reserves the right to terminate this agreement forthwith if the Tenant uses the premises for any illegal or immoral purpose.",
        "output": "Your landlord can immediately cancel this agreement if you use the property for any illegal activity."
    },
    {
        "input": "The Tenant shall keep the premises insured against fire, theft and natural calamities at his own cost during the subsistence of this agreement.",
        "output": "You must get insurance for the property against fire, theft, and natural disasters at your own expense."
    },
    {
        "input": "The Licensee agrees that upon termination of this agreement, he shall remove all his belongings within 7 days failing which the Licensor may dispose of the same.",
        "output": "You must remove all your belongings within 7 days after the agreement ends, or your landlord can dispose of them."
    },
    {
        "input": "Both parties agree that this agreement shall be governed by the laws of the State of Maharashtra and courts in Mumbai shall have exclusive jurisdiction.",
        "output": "This agreement follows Maharashtra state laws, and any legal matters will be handled by Mumbai courts only."
    },
    {
        "input": "The Tenant shall pay a non-refundable maintenance deposit of Rs. 25,000 at the time of signing this agreement.",
        "output": "You must pay Rs. 25,000 as a maintenance deposit when you sign this agreement. This money will not be returned."
    },
    {
        "input": "The Landlord shall not be liable for any inconvenience or damage caused due to force majeure events including but not limited to floods, earthquakes, or government actions.",
        "output": "Your landlord is not responsible for problems caused by events beyond their control like floods, earthquakes, or government orders."
    },
    {
        "input": "The Tenant hereby waives all rights to claim compensation for any improvements made to the premises during the tenancy period.",
        "output": "You give up the right to ask for money back for any improvements you make to the property during your stay."
    },
    {
        "input": "The monthly rent of Rs. 15,000 shall be payable in advance through bank transfer to the Landlords designated account.",
        "output": "You must pay Rs. 15,000 rent every month in advance through bank transfer to your landlord's account."
    },
    {
        "input": "The Tenant shall obtain prior written consent of the Landlord before keeping any pets on the premises.",
        "output": "You must get your landlord's written permission before keeping any pets in the property."
    },
    {
        "input": "In the event of the Tenants death, this agreement shall stand terminated and the legal heirs shall vacate the premises within 30 days.",
        "output": "If you pass away, this agreement ends and your family must vacate within 30 days."
    },
    {
        "input": "The Tenant acknowledges having inspected the premises and accepts the same in its present condition without any defects.",
        "output": "You confirm that you have checked the property and accept it as it is, with no complaints about its condition."
    },
    {
        "input": "Any notice required under this agreement shall be deemed served if sent by registered post or email to the addresses mentioned herein.",
        "output": "Notices under this agreement will be considered delivered if sent by registered post or email to the addresses listed."
    },
    {
        "input": "The Landlord may increase the security deposit proportionately upon renewal of this agreement.",
        "output": "Your landlord may ask for a higher security deposit when renewing the agreement."
    },
]


def log(message: str) -> None:
    print(f"[rebuild] {message}")


def read_jsonl(path: Path) -> list[dict]:
    rows = []
    if not path.exists():
        return rows
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            text = line.strip()
            if text:
                rows.append(json.loads(text))
    return rows


def write_jsonl(path: Path, rows: list[dict]) -> None:
    with path.open("w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")


def is_good_pair(inp: str, out: str) -> bool:
    """Check if a training pair is high quality."""
    if not inp.strip() or not out.strip():
        return False
    # Output should not be same as input
    if inp.strip().lower() == out.strip().lower():
        return False
    # Output should be shorter than input (it's a simplification)
    if len(out.split()) > len(inp.split()) * 1.5:
        return False
    # Output should be at least 5 words
    if len(out.split()) < 5:
        return False
    # Output should not contain obvious junk
    junk_phrases = [
        "as a rental agreement",
        "you can also use",
        "you should follow this rental clause",
        "you must ensure that hence",
    ]
    for phrase in junk_phrases:
        if phrase in out.lower():
            return False
    return True


def to_sft_record(clause: str, simplified: str) -> dict:
    """Create a chat-format SFT record."""
    user_content = (
        "Simplify this Indian rental agreement clause into plain English. "
        "Use 1-2 short sentences. Start with You/Your landlord/This means. "
        "No legal jargon.\n\n"
        f"Clause:\n{clause}"
    )
    return {
        "messages": [
            {"role": "user", "content": user_content},
            {"role": "assistant", "content": simplified},
        ]
    }


def main() -> None:
    # Step 1: Read existing manual pairs
    manual_pairs = read_jsonl(MANUAL_PAIRS_PATH)
    log(f"Read {len(manual_pairs)} manual pairs")

    # Step 2: Extract usable pairs (not empty, not copy-paste)
    usable_pairs = []
    for row in manual_pairs:
        inp = str(row.get("input", "")).strip()
        out = str(row.get("output", "")).strip()
        if is_good_pair(inp, out):
            usable_pairs.append((inp, out))

    log(f"Usable pairs after quality filter: {len(usable_pairs)}")

    # Step 3: Deduplicate by output - if same output used 3+ times, keep only shortest input
    output_groups: dict[str, list[tuple[str, str]]] = {}
    for inp, out in usable_pairs:
        out_lower = out.lower().strip()
        if out_lower not in output_groups:
            output_groups[out_lower] = []
        output_groups[out_lower].append((inp, out))

    deduped_pairs = []
    for out_lower, group in output_groups.items():
        if len(group) <= 2:
            deduped_pairs.extend(group)
        else:
            # Keep the 2 most different inputs (shortest and longest)
            sorted_by_len = sorted(group, key=lambda x: len(x[0]))
            deduped_pairs.append(sorted_by_len[0])
            deduped_pairs.append(sorted_by_len[-1])

    log(f"After deduplication: {len(deduped_pairs)}")

    # Step 4: Build SFT dataset
    sft_records = []

    # Add gold pairs first (highest quality)
    for pair in GOLD_PAIRS:
        sft_records.append(to_sft_record(pair["input"], pair["output"]))
    log(f"Added {len(GOLD_PAIRS)} gold pairs")

    # Add cleaned existing pairs
    gold_inputs = {p["input"].lower().strip() for p in GOLD_PAIRS}
    for inp, out in deduped_pairs:
        if inp.lower().strip() not in gold_inputs:
            sft_records.append(to_sft_record(inp, out))

    log(f"Total SFT records: {len(sft_records)}")

    # Step 5: Backup old and write new
    old_sft = TRAIN_SFT_PATH
    if old_sft.exists():
        import shutil
        shutil.copy2(old_sft, TRAIN_SFT_BACKUP)
        log(f"Backed up old train_sft.jsonl to {TRAIN_SFT_BACKUP.name}")

    write_jsonl(TRAIN_SFT_PATH, sft_records)
    log(f"Wrote {len(sft_records)} records to {TRAIN_SFT_PATH.name}")


if __name__ == "__main__":
    main()
