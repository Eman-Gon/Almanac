# Source Index

## Purpose

This file defines which sources support product requirements and how claims should be labeled. It prevents coding and presentation agents from treating anecdotal research, official requirements, and simulated data as equivalent.

---

## Source priority

### Tier 1 — Official challenge sources

These define the hackathon prompt and requested opportunity areas:

1. `AISCO Hackathon Deck 2026 - SHARE.pdf` — challenge prompt on p. 4, validation guidance on p. 7, and judging-panel context on p. 11
2. `Alameda County Food Bank - Hackathon Challenge Themes.docx` — operating scale on p. 1 and routing, disruption-recovery, demand-signal, and staff-assistance requests on p. 2
3. `Alameda County Food Bank - The Build List.docx` — operations-intelligence requests on pp. 1–2, including routing by windows and urgency and rebuilding after disruption on p. 1

Use Tier 1 for claims about:

- Official prompt
- Supply-chain scope
- Human-centered operating principle
- Seven challenge themes
- Requested build capabilities
- Event logistics and prizes

### Tier 2 — Exact user-provided Reddit exports

1. `Pasted text(16).txt`
2. `Pasted text(17).txt`

These support exact coded counts in `RESEARCH_INSIGHTS.md`. They are anecdotal and self-selected but auditable within the supplied files.

### Tier 3 — Full research synthesis

- `research/food_bank_hackathon_research_summary.md`

This consolidates official context, Reddit analytics, formal research, product analysis, and external source links.

### Tier 4 — Broader qualitative Reddit review

The broader review considered 30 public thread pages across 12 subreddits and approximately 230 visible comments and replies. It supports directional qualitative findings but not exact frequency claims.

### Tier 5 — Formal external research and reporting

The research appendix includes 20 non-Reddit sources across:

- USDA and EPA publications
- Feeding America research
- Academic and preprint research
- World Food Programme decision support
- Food-bank infrastructure and labor reporting
- Nutrition, access, allocation, and food-rescue studies

### Tier 6 — Existing product pages

The competitor review includes:

- Plentiful
- Vivery
- MealConnect
- Food Rescue Hero
- Link2Feed
- PantrySoft
- Careit

Product pages are evidence of publicly described capabilities, not independent proof of product effectiveness.

---

## Evidence labels

Use one of these labels in pitch notes, metric tooltips, or documentation:

| Label | Meaning |
|---|---|
| `official_requirement` | Directly stated in hackathon materials |
| `exact_coded_research` | Counted in the 269-item exported Reddit subset |
| `qualitative_research` | Repeated in manual review but not systematically counted |
| `formal_research` | Supported by a named article, report, or study |
| `product_page_claim` | Described by an existing product on its public site |
| `team_inference` | A reasoned conclusion from multiple sources |
| `simulated_demo_data` | Invented for the prototype and clearly labeled |
| `calculated_demo_metric` | Derived from seeded demo data and documented formulas |
| `operator_interview_evidence` | A claim tied to a completed, consented interview and its stated denominator |
| `observed_usability_evidence` | A result from a defined task observed in a consented session |
| `pilot_interest` | A participant or organization expressed willingness to continue a conversation |
| `pilot_commitment` | A named organization approved an evaluation in writing |
| `shadow_pilot_observation` | A measured result from the stated non-authoritative pilot sample and dates |

---

## Claims that are safe to make

- The official prompt includes donation acceptance, warehousing, allocation, packing, distribution, and delivery.
- The challenge asks for meaningful AI-agent use.
- The supplied research repeatedly identified food mismatch, spoilage, capacity limits, access barriers, and lack of choice.
- The exact coded subset contained 269 items.
- The broader study considered 32 thread pages and approximately 500 comment-level observations.
- Existing public products already cover pantry maps, reservations, donation posting, volunteer pickup, case management, and pantry inventory.
- Almanac is designed to join urgent-food analysis, destination matching, plan comparison, packing, route creation, and recovery.
- The Alameda County challenge materials directly request routing using receiving windows and product urgency and rebuilding after a truck or agency disruption.
- California guidance identifies refrigerated capacity, vehicles, and software for donor-to-rescue matching and inventory management as food-recovery capacity considerations.
- Comparable platforms demonstrate that organizations use digital food-recovery coordination at scale.

---

## Claims that require qualification

Say:

- “In the exact coded Reddit subset...” rather than “Most food-bank users...”
- “Approximately 500 comments were considered...” rather than “500 comments were scraped.”
- “The reviewed public product pages did not appear to center this full workflow...” rather than “No competitor has this feature.”
- “Almanac's hypothesized integration wedge is explainable allocation and disruption recovery...” rather than “Almanac has no competitors.”
- “The scenario estimates...” rather than “Almanac saves 94% of food waste.”
- “Shelf-life risk estimate...” rather than “Safe until...”
- “The participant expressed pilot interest...” rather than “The organization committed to a pilot,” unless written approval exists.
- “In 4 of 6 observed sessions...” rather than “Operators found the product easy to use.”

---

## Claims that must not be made

- The Reddit sample represents all recipients or food banks.
- Almanac has been validated in a live food bank.
- AI can determine whether food is safe.
- A dietary tag constitutes medical advice.
- Simulated households served are real beneficiaries.
- The selected score weights are objectively fair.
- Existing products lack internal features that are not visible on public pages.
- Challenge-language alignment is equivalent to operator validation or adoption.
- A scheduled interview counts as completed evidence.
- An expression of interest counts as a signed pilot commitment.

---

## Current external source registry

Research snapshot: July 16, 2026.

| Source | Safe claim | Evidence label and caveat |
|---|---|---|
| [StopWaste — Edible Food Recovery Capacity Planning Report for Alameda County](https://www.stopwaste.org/sites/default/files/2026-03/2024%20EFR%20Capacity%20Results%20Summary-7-Updated%20%281-16-26%29.pdf), September 2025 | Alameda County reported 14.39 million pounds recovered in 2024; the report describes 510 weekly ACCFB program pickups and 65 of 84 identified organizations participating in ACCFB's Food Recovery Program and reporting activity through MealConnect | `formal_research`; local network evidence, not Almanac impact or adoption |
| [StopWaste — Food Donation & Recovery in Alameda County](https://www.stopwaste.org/sites/default/files/topic-brief-2025-09-Food-Recovery-Network.pdf), September 2025 | Nearly 90% of local recovery organizations operated with fewer than five paid staff; cold storage and transportation were top infrastructure requests | `formal_research`; agency-reported system conditions |
| [CalRecycle — Capacity Planning for Food Recovery](https://calrecycle.ca.gov/organics/slcp/foodrecovery/capacityplanning/) | California guidance names paid staff, refrigerated space and vehicles, storage, and software to match donors to rescues and manage inventory as capacity considerations | `formal_research`; guidance is not proof that a buyer wants Almanac |
| [CalRecycle — Food Recovery Organizations and Services](https://calrecycle.ca.gov/organics/slcp/foodrecovery/organizations/) | Participating organizations with written mandated-donor agreements must retain donor-level receipt records and report annual pounds | `formal_research`; applicability depends on participation and agreements |
| [Feeding America — What is MealConnect?](https://www.feedingamerica.org/hunger-blog/what-mealconnect-learn-about-feeding-americas-food-rescue-platform), April 14, 2026 | Feeding America reported that MealConnect facilitated more than seven billion pounds of food recovery since 2014 | `product_page_claim`; category adoption and incumbent evidence, not Almanac demand |
| [Careit — How It Works](https://careit.com/how-it-works/) and [Impact](https://careit.com/impact/) | Careit publicly describes donation posting, matching, pickup coordination, records and reporting | `product_page_claim`; capability and impact figures are vendor-reported |
| [USDA ERS — Household Food Security in the United States in 2024](https://ers.usda.gov/publications/113622), December 30, 2025 | USDA estimated 18.3 million U.S. households were food insecure in 2024 | `formal_research`; establishes need, not software demand |

The complete source names, summaries, and historical registry remain in the full research appendix. Coding agents should not copy external statistics into the product UI unless the value is required for the demo and its source is documented in `METRICS_AND_EVIDENCE.md`.

## Validation evidence registry

Completed operator and pilot evidence belongs in [`../research/validation/EVIDENCE_REGISTER.md`](../research/validation/EVIDENCE_REGISTER.md). Each claim must retain its denominator, date, evidence type, and permission level.
