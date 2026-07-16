# Source Index

## Purpose

This file defines which sources support product requirements and how claims should be labeled. It prevents coding and presentation agents from treating anecdotal research, official requirements, and simulated data as equivalent.

---

## Source priority

### Tier 1 — Official challenge sources

These define the hackathon prompt and requested opportunity areas:

1. `AISCO Hackathon Deck 2026 - SHARE.pdf`
2. `Alameda County Food Bank - Hackathon Challenge Themes.docx`
3. `Alameda County Food Bank - The Build List.docx`

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

---

## Claims that are safe to make

- The official prompt includes donation acceptance, warehousing, allocation, packing, distribution, and delivery.
- The challenge asks for meaningful AI-agent use.
- The supplied research repeatedly identified food mismatch, spoilage, capacity limits, access barriers, and lack of choice.
- The exact coded subset contained 269 items.
- The broader study considered 32 thread pages and approximately 500 comment-level observations.
- Existing public products already cover pantry maps, reservations, donation posting, volunteer pickup, case management, and pantry inventory.
- ChoiceGrid is designed to join urgent-food analysis, destination matching, plan comparison, packing, route creation, and recovery.

---

## Claims that require qualification

Say:

- “In the exact coded Reddit subset...” rather than “Most food-bank users...”
- “Approximately 500 comments were considered...” rather than “500 comments were scraped.”
- “The reviewed public product pages did not appear to center this full workflow...” rather than “No competitor has this feature.”
- “The scenario estimates...” rather than “ChoiceGrid saves 94% of food waste.”
- “Shelf-life risk estimate...” rather than “Safe until...”

---

## Claims that must not be made

- The Reddit sample represents all recipients or food banks.
- ChoiceGrid has been validated in a live food bank.
- AI can determine whether food is safe.
- A dietary tag constitutes medical advice.
- Simulated households served are real beneficiaries.
- The selected score weights are objectively fair.
- Existing products lack internal features that are not visible on public pages.

---

## External source registry

The complete source names, dates, summaries, and URLs are preserved in the full research appendix. Coding agents should not copy external statistics into UI unless the value is required for the demo and its source is documented in `METRICS_AND_EVIDENCE.md`.
