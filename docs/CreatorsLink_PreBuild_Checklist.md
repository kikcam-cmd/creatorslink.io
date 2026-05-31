# CreatorsLink — Pre-Build Checklist

*Turning §11 (Open Decisions) into work you can actually do.*

This is the companion to the v1 scope. Every open decision in §11 gets answered by a real-world input — a vendor quote, a creator interview, a compliance step — not by more writing. This document converts each open item into the specific work that closes it, and groups them into three tracks you can run in parallel.

The key insight about §11: the items aren't independent. Three of them (**platform-fee amount**, **cost-to-move-a-dollar**, **payments partner**) collapse into a single payments-provider evaluation. One (**beachhead vertical**) is answered by creator interviews. The **self-brokered rate** is downstream of *both* — you can't price it until you know your cost floor and what creators/VAs charge today. Two (**v2 tier thresholds**, **creator paid-vs-free line**) shouldn't be answered now at all. And one (**Gmail CASA**) is a slow compliance clock you should start early.

---

## The map: which decision each track closes

| §11 open decision | How it gets answered | Track |
|---|---|---|
| Payments partner | Vendor calls + quotes | A |
| Cost-to-move-a-dollar | Vendor quotes (all-in landed cost) | A |
| Platform-fee amount | Cost floor (A) + willingness-to-pay (B) | A + B |
| Self-brokered rate | Cost floor (A) + what VAs/brokers charge today (B) | A + B |
| Beachhead vertical | Creator interviews | B |
| Gmail CASA confirmation | Start the OAuth verification process | C |
| v2 tier thresholds | **Defer** — needs live usage data | — |
| Creator paid-vs-free line | **Defer** — needs retention/usage data | — |

---

## Track A — Payments / escrow provider evaluation

**What you're deciding:** who holds money between brand and creator, releases it on delivery, and pays the creator out — and what that costs per dollar. This single evaluation closes the payments-partner, cost-to-move-a-dollar, and platform-fee questions.

**Candidates to call (cover the categories, not just one name):**
- **Platform payments / escrow-capable:** Stripe Connect (+ possibly Treasury), Adyen for Platforms
- **Payout-first / mass creator payouts:** Trolley, Tipalti, Payoneer
- **Orchestration over a bank / more control:** Modern Treasury, Increase
- **Purpose-built escrow:** Escrow.com API

**The critical regulatory question (ask first, it can eliminate a vendor):**
Holding funds on behalf of two parties and releasing on a condition can make *you* a money transmitter, which means state-by-state licensing (slow, expensive, 50 jurisdictions). You want a partner whose structure keeps that liability off you.

1. Can we hold funds on behalf of two parties and release on a delivery condition **without** us becoming a licensed money transmitter? What's the legal structure — are you the licensed party, or do we rely on an agent-of-payee arrangement?
2. Who holds the money-transmitter / e-money license, and does using you keep us clear in all 50 states?

**Cost — this is where "cost-to-move-a-dollar" gets its number. Ask for the all-in landed cost, not the headline rate:**
3. Full per-transaction cost: percentage + fixed fee, *plus* payout fee, *plus* FX if any brand or creator is cross-border.
4. Monthly platform minimums or per-active-account fees while we're small.
5. Chargeback / dispute fees, and reserve requirements (do you hold back a % of our volume?).
6. How does pricing change as we ramp — quote it at ~$100K/mo, $1M/mo, and $10M/mo GMV.

**Escrow mechanics (does it actually do the thing?):**
7. Can we programmatically place a hold and release on *our* trigger (delivery confirmed)? Maximum hold duration?
8. Negative-balance / clawback: if a brand disputes *after* we've released to the creator, who eats it?

**Creator experience (drop-off risk lives here):**
9. What must a creator provide to receive money (KYC), and how long does onboarding take? What's typical drop-off?
10. Payout speed and methods — ACH, instant-to-debit, international?
11. Do you auto-generate 1099-NEC / 1099-K for creators at year-end?

**Build cost:**
12. Sandbox quality, SDK maturity, realistic time-to-integrate, support tier.
13. Per-transaction and per-account limits that could break a larger brand deal.

> **Output of Track A:** one chosen partner, a hard cost-to-move-a-dollar number, and therefore a defensible floor under both the platform fee and the self-brokered rate.

---

## Track B — Creator discovery interviews (lock the beachhead)

**What you're deciding:** which creator segment to launch into, whether the wedge (the comms mess + trust/payment problem) is acute enough that they'll switch, and whether the VA/broker spend you plan to redirect actually exists.

**Format:** ~15 creators, 30–40 min each, semi-structured. **Do not pitch.** You're learning, not selling — the moment you describe the product, the answers get polite and useless. Recruit through TikTok Shop affiliate Discords/groups, agency contacts, and warm intros; offer a gift card so you get the busy ones, not just the enthusiasts.

**Script — the business reality (open here, it's easy to answer):**
1. Walk me through your last brand deal start to finish — how did they reach you, where did the conversation happen, how did you negotiate, how and when did you get paid?
2. How many brand conversations are live right now, and where do they live? (Count the tools/inboxes out loud with them.)
3. What's slipped through the cracks lately — a deal you lost track of, a payment you had to chase?

**Spend — this validates the wedge (you're redirecting existing spend, not creating new):**
4. Do you pay anyone to help manage this — VA, manager, agency? What exactly do they do, and what do you pay?
5. Which of those tasks would you happily hand to software, and which do you want to keep with a human?

**Trust / payment — this validates escrow:**
6. When a new brand offers a deal, what's your biggest worry?
7. Would you route a brand's payment through a third party that holds it and releases on delivery? What would make you trust that — or refuse it?
8. Would you pay a fee for guaranteed payment, or do you expect the brand to cover it? *(This is your willingness-to-pay signal for the platform fee.)*

**Segmentation — this picks the vertical:**
9. Primary platform and category (beauty, fitness, food, home, etc.)?
10. Roughly, monthly income from brand deals? Split between TikTok Shop affiliate commission vs. flat-fee sponsorships?

**Close:**
11. If a tool nailed *[the single most-mentioned pain from this interview]*, what would it have to get exactly right for you to drop your current setup — and what would make you not trust it?

**Decision criteria — pick the vertical where all three are true:**
- Pain is loudest (most fragmentation, most lost deals)
- Money is *already* being spent (VAs/brokers to redirect)
- They're TikTok-Shop-native (so your wedge architecture fits, per §1)

> **Output of Track B:** a named beachhead segment, plus the willingness-to-pay and current-VA-cost data points that — combined with Track A's cost floor — let you finally set the self-brokered rate and platform fee.

---

## Track C — Gmail CASA (start now, it's slow)

**What you're deciding:** nothing — this is a clock to start, not a choice. Reading a creator's Gmail (core to taming the inbox) requires Google's restricted-scope OAuth verification, which includes a third-party security assessment (CASA). It takes **weeks to months** and has a cost, and it *gates* the email-integration feature.

**Action:** confirm exactly which scopes the email feature needs, register the OAuth consent screen, and begin the verification/CASA process **before** you need it — not after the build is done. Starting late here is the kind of thing that silently delays launch by a quarter.

---

## What NOT to decide now

**v2 tier thresholds** and the **creator paid-vs-free line** both need data you don't have yet — real usage, retention, and where creators hit value. Guessing now just creates a number you'll feel obligated to defend later. Leave them open on purpose; they resolve themselves once v1 has users.

---

## Suggested sequencing

- **Week 1:** Kick off Track C (CASA) — it's the long pole, start the clock. Begin scheduling Track B interviews.
- **Weeks 1–3:** Run Tracks A and B in parallel. Vendor calls and creator interviews don't compete for the same hours.
- **End of week 3:** You have a cost floor (A) and willingness-to-pay + current VA spend (B). Set the self-brokered rate and platform fee in one sitting — now it's arithmetic, not a guess.
- **Throughout:** CASA grinds in the background so it's not blocking you at build time.

Close these and §11 is empty — at which point the scope doc stops being a strategy artifact and becomes a build spec.
