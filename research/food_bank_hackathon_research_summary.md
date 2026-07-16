# Food-Bank AI Supply-Chain Hackathon Research Brief

**Prepared:** July 16, 2026  
**Purpose:** Consolidate the important hackathon requirements, Reddit findings, research analytics, formal evidence, competitor landscape, product ideas, and final recommendation developed during this research process.

> **Most important conclusion:** The strongest opportunity is not another pantry locator, recipe chatbot, donation listing board, or ordinary routing app. The strongest gap is an **AI-assisted allocation and recovery system that matches urgent food with the destinations most able to use it, then turns the approved decision into a packing and delivery plan.**

---

## Table of contents

1. [Executive summary](#1-executive-summary)  
2. [Official hackathon prompt and requirements](#2-official-hackathon-prompt-and-requirements)  
3. [Research coverage and analytics](#3-research-coverage-and-analytics)  
4. [Exact Reddit theme frequencies](#4-exact-reddit-theme-frequencies)  
5. [What recipients, workers, and volunteers said](#5-what-recipients-workers-and-volunteers-said)  
6. [Most important external research facts](#6-most-important-external-research-facts)  
7. [Existing products and crowded categories](#7-existing-products-and-crowded-categories)  
8. [The main market and product gap](#8-the-main-market-and-product-gap)  
9. [Top five hackathon ideas](#9-top-five-hackathon-ideas)  
10. [Recommended project: ChoiceGrid](#10-recommended-project-choicegrid)  
11. [MVP build plan](#11-mvp-build-plan)  
12. [Demo metrics](#12-demo-metrics)  
13. [Risks and guardrails](#13-risks-and-guardrails)  
14. [Research limitations](#14-research-limitations)  
15. [Appendix: subreddits and searches](#15-appendix-subreddits-and-searches)  
16. [Source registry](#16-source-registry)

---

# 1. Executive summary

## The problem

Food banks operate real, complex supply chains. The Alameda County challenge document describes an operation involving roughly:

- **20 inbound trucks per day**
- **More than 100,000 square feet of warehouse space**
- **A delivery fleet leaving every morning**
- **About 60 million pounds of food per year**
- **Hundreds of partner agencies**
- **Volatile, donated, seasonal supply meeting persistent community need**

The recurring problem is not simply a lack of food. It is the difficulty of getting the **right food**, in usable condition, to the **right location**, at the right time, while working within:

- Shelf-life limits
- Refrigerator and freezer capacity
- Warehouse labor
- Volunteer attendance
- Receiving windows
- Vehicle availability
- Dietary and cultural needs
- Unpredictable donations
- Community-access barriers
- Fairness across partner agencies

## The research-supported product gap

The research repeatedly pointed to a missing connection between two sides of the system:

```text
What food is available and urgent
                +
What agencies and communities can actually use
                ↓
An explainable allocation, packing, and delivery plan
```

A strong product should help staff answer:

1. Should we accept this donation?
2. How urgent is it?
3. Which locations can receive, store, and use it?
4. What are the best alternative plans?
5. What should be packed or cross-docked?
6. What route should be used?
7. What should happen when a truck, pantry, or pickup window changes?
8. What impact did the decision produce?

## Recommended project

**ChoiceGrid** — an AI-assisted food allocation and disruption-recovery control tower.

A representative demo:

1. A grocery store offers **1,200 pounds of strawberries**.
2. The AI extracts the offer from a message.
3. The system checks shelf life, cold capacity, agency demand, receiving hours, trucks, and fairness.
4. It displays three alternative plans.
5. A food-bank employee approves one.
6. A map displays the donor, warehouse, pantry destinations, and routes.
7. A pantry cancels or a truck breaks down.
8. The system generates a revised plan.
9. The impact screen shows pounds saved, households served, miles, and replanning time.

---

# 2. Official hackathon prompt and requirements

## Official prompt

The hackathon asks teams to:

> Create a solution using **AI agents** to substantially improve or transform the effectiveness of food-bank supply chains.

The scope explicitly includes:

- Accepting donations
- Purchasing food
- Warehousing food
- Allocating food
- Packing food
- Distributing food
- Delivering food

Solutions for a specific food bank are encouraged.

**Source:** *AISCO Hackathon Deck 2026*, page 4.

## Operating principle

The Alameda County challenge document gives a critical design principle:

> Build tools that make people better at their jobs, not tools that try to do their jobs.

That means the product should:

- Recommend
- Explain
- Prioritize
- Draft
- Simulate
- Alert
- Replan

But staff should retain control over important decisions such as:

- Accepting or declining donations
- Declaring food unsafe
- Changing allocations
- Contacting partners
- Dispatching vehicles
- Using sensitive community information

## Seven official challenge themes

### 1. See It Coming

- Forecast produce volume and mix
- Score donors and vendors on delivered versus committed
- Identify purchase windows before prices move
- Predict actual truck arrival times

### 2. The Warehouse That Explains Itself

- Put receiving information on scanners at the dock
- Recommend slotting and bin locations
- Sequence pick lists
- Identify produce condition and shelf life
- Target cycle counts
- Predict equipment failures

### 3. Production Is Manufacturing

- Forecast boxes, bags, and kits
- Recommend line setup and crew size
- Predict volunteer turnout
- Stage raw materials in advance
- Track production yield

### 4. Equity With a Truck Attached

- Route using access windows and product urgency, not only miles
- Balance driver workload using stop difficulty
- Rebuild the day after truck or agency failures
- Coordinate EV charging
- Learn from refused products and short receipts

### 5. Need Is the Demand Signal

- Detect agency ordering that no longer matches community need
- Use pull-based replenishment
- Detect growing access friction
- Match products to neighborhood preferences and dietary patterns
- Explain pantry hours and eligibility in plain language

### 6. Every Team Member an Analyst

- Let frontline workers ask questions without SQL
- Provide shift-start briefings
- Convert voice notes into structured proposals
- Capture experienced workers' knowledge

### 7. A Smarter Movement

- Benchmark operations across food banks
- Match one food bank's surplus with another's shortage
- Model policy and economic changes by neighborhood

**Sources:** *Alameda County Food Bank — Hackathon Challenge Themes* and *The Build List*.

## What a competitive project should demonstrate

The hackathon deck advises teams to:

- Research real food-bank supply-chain problems
- Build an agent that solves a real problem
- Quantify the problem
- Quantify the solution
- Have an onsite representative present the project

A polished interface helps, but the likely winning combination is:

> **Real operational problem + useful workflow + meaningful AI + credible metrics + strong live demo + clear user interface**

## Prizes

- First prize: **$2,500**
- Honorable mention: **$1,000**
- Audience favorite: **$1,500**

---

# 3. Research coverage and analytics

## Research volume

| Research component | Coverage |
|---|---:|
| Relevant subreddits included in the broader review | **12** |
| Newly reviewed public Reddit thread pages | **30** |
| Approximate comments/replies viewed in those threads | **~230** |
| Complete Reddit exports supplied by the user | **2 threads** |
| Items exactly parsed from the two exports | **269** |
| Comments in the exact parsed subset | **~267** |
| Combined Reddit thread pages considered | **32** |
| Approximate combined comments/replies considered | **~497** |
| Formal non-Reddit articles, reports, and papers summarized | **20** |
| Existing technology products reviewed | **6** |
| Major external sources in the evidence and competitor review | **26** |
| Reddit date range represented | **2018–July 2026** |

## Critical distinction between exact and approximate numbers

### Exact coded dataset

The two complete Reddit text exports were programmatically parsed and coded:

- **269 total items**
- Approximately **267 comments**
- **2 original posts**
- Exact theme counts are available for this subset

### Broader manual Reddit review

The additional 30 public Reddit thread pages were reviewed qualitatively:

- Approximately **230 visible comments and replies**
- The broader set was not exported into the same auditable coding dataset
- It supported the same recurring themes, but exact theme frequencies should **not** be claimed for all 32 threads

### Combined reach

A reasonable description is:

> The research considered **32 Reddit thread pages and about 500 comments/replies**, but only the two full exports were systematically coded for exact repetition counts.

Do not describe this as a complete Reddit scrape.

## Subreddits represented in the broader review

| Subreddit | Threads reviewed |
|---|---:|
| r/povertyfinance | 3 |
| r/foodstamps | 2 |
| r/Assistance | 3 |
| r/homeless | 3 |
| r/Food_Pantry | 3 |
| r/Food_Bank | 3 |
| r/Frugal | 3 |
| r/EatCheapAndHealthy | 2 |
| r/ZeroWaste | 2 |
| r/MutualAid | 2 |
| r/urbancarliving | 2 |
| r/almosthomeless | 2 |
| **Total** | **30** |

---

# 4. Exact Reddit theme frequencies

The table below is based only on the **269-item exact coded subset**.

> Categories overlap. One comment can mention several themes, so the percentages do not add to 100%.

| Recurring theme | Mentions | Share of 269 items |
|---|---:|---:|
| Repetitive, unbalanced, or insufficiently varied food | **59** | **21.9%** |
| Storage, warehouse, funding, labor, or volunteer constraints | **42** | **15.6%** |
| Fresh-food quality, spoilage, mold, or expiration | **42** | **15.6%** |
| Shame, stigma, or eligibility confusion | **30** | **11.2%** |
| Recipes, cooking knowledge, spices, or cultural fit | **27** | **10.0%** |
| Client choice versus prepacked boxes | **23** | **8.6%** |
| Allergies, dietary restrictions, or medical-food needs | **19** | **7.1%** |
| Missing ingredients needed to make a complete meal | **16** | **5.9%** |
| Toiletries, period products, clothing, or other assistance | **15** | **5.6%** |
| Limited hours, transportation, delivery, or location access | **9** | **3.3%** |
| Lack of cooking equipment or home food-storage capacity | **9** | **3.3%** |

## Visual summary

```text
Repetitive, unbalanced, or insufficiently var ████████████████████ 59
Storage, warehouse, funding, labor, or volunt ██████████████ 42
Fresh-food quality, spoilage, mold, or expira ██████████████ 42
Shame, stigma, or eligibility confusion       ██████████ 30
Recipes, cooking knowledge, spices, or cultur █████████ 27
Client choice versus prepacked boxes          ████████ 23
Allergies, dietary restrictions, or medical-f ██████ 19
Missing ingredients needed to make a complete █████ 16
Toiletries, period products, clothing, or oth █████ 15
Limited hours, transportation, delivery, or l ███ 9
Lack of cooking equipment or home food-storag ███ 9
```

## Thread-to-thread difference

### Thread 1: food usefulness, quality, and choice

This thread produced most of the food and operations findings:

| Theme | Mentions |
|---|---:|
| Repetition or imbalance | **50** |
| Fresh-food quality or spoilage | **40** |
| Warehouse, storage, labor, or funding constraints | **27** |
| Recipes, spices, cooking, or cultural fit | **26** |
| Client choice | **19** |
| Dietary or allergy fit | **19** |
| Missing meal components | **15** |
| Cooking or storage limitations | **8** |

### Thread 2: access, shame, and qualification confusion

This thread concentrated more heavily on emotional and administrative barriers:

| Theme | Mentions |
|---|---:|
| Shame, stigma, or qualification confusion | **28** |
| Operational or capacity constraints | **15** |
| Food repetition or assortment | **9** |
| Non-food and wraparound assistance | **8** |
| Hours, transportation, or delivery | **4** |
| Client choice | **4** |

## What the counts mean

The most frequent coded category was **repetition and imbalance**, but the central product insight is broader:

> A food item is not useful merely because it is edible. It must also be safe, culturally and practically usable, compatible with the household's constraints, available before it spoils, and delivered through an accessible program.

---

# 5. What recipients, workers, and volunteers said

## Finding 1: available food is not always usable food

### Recipients described

- Allergies and gluten intolerance
- Diabetes and low-sodium needs
- Vegan or vegetarian diets
- Food requiring an oven or stove they did not have
- Products requiring refrigeration or freezer capacity they lacked
- Cans without easy-open lids
- Dental or health limitations
- Food their children would not eat
- Unfamiliar ingredients without preparation guidance

### Workers and volunteers described

- Too little time to customize every distribution
- Drive-through systems optimized for throughput
- Limited inventory categories
- Difficulty keeping special-diet foods in stock
- Lack of reliable recipient preference data

### Operational cause

Personalization increases:

- Inventory complexity
- Packing complexity
- Data requirements
- Fairness questions
- Labor time
- Substitution decisions

### Product opportunity

Create **aggregate usability profiles**, not invasive individual medical records:

- No-cook
- Limited refrigeration
- Common-allergen exclusion
- Low-sodium program
- Culturally preferred staple category
- Family meal-kit category
- Easy-open or ready-to-eat category

Use these profiles to guide allocation and packing.

---

## Finding 2: spoilage can occur anywhere between donation and distribution

### Recipients described

- Moldy bread
- Slimy greens
- Nearly rotten produce
- Products with only one or two usable days remaining
- Confusing “best by,” “sell by,” and expiration dates
- Fear of becoming sick
- Guilt about throwing donated food away

### Workers and volunteers described

- Manual inspection
- Inconsistent product condition
- Large amounts arriving simultaneously
- Products already close to the end of their useful life
- Insufficient cold capacity
- Delays before the next distribution

### Operational cause

Every step consumes remaining shelf life:

```text
Donor holding time
→ pickup delay
→ receiving
→ inspection
→ warehouse storage
→ allocation
→ packing
→ transportation
→ pantry storage
→ recipient pickup
```

### Product opportunity

A **shelf-life risk and movement agent** should recommend:

- Direct distribution
- Cross-docking
- Refrigeration or freezing
- Priority packing
- Transfer to another partner
- Supervisor inspection
- Safe disposal when required

It should not independently declare food safe.

---

## Finding 3: choice helps dignity, but unlimited choice can reduce throughput

### Recipients described

- Random boxes containing products they could not use
- Inability to decline or exchange unwanted items
- Repeated products accumulating at home
- Preference for a grocery-style model

### Workers and volunteers described

- Store-style models can expose demand more accurately
- Full choice can create longer lines
- More space, shelving, staff, and training are required
- Drive-through boxes can serve more households per hour
- Unrestricted choice can create fairness problems

### Product opportunity

Use **constrained choice**:

- AI recommends a balanced box
- Recipient can decline allergens
- Recipient can make a small number of category swaps
- Staff see the effect on inventory before approving
- Packing remains standardized by cohort or route

---

## Finding 4: ingredients are not necessarily a meal

Frequently described mismatches included:

- Macaroni and cheese without milk or butter
- Cereal without milk
- Meal mixes without meat
- Pasta without protein or vegetables
- Dry beans without instructions
- Produce requiring tools or time
- Food that cannot be stored after opening
- Snacks that do not combine into complete meals

### Product opportunity

A **meal-completeness agent** can detect:

- Missing protein
- Missing cooking fat
- Missing shelf-stable liquid
- Missing seasoning
- Missing preparation instructions
- Products requiring unavailable equipment

The agent should help staff create better packing combinations from existing inventory.

---

## Finding 5: fresh food and protein are desired, but infrastructure limits supply

### Recipients often requested

- Fresh produce
- Frozen vegetables
- Eggs
- Cheese
- Meat and fish
- Cooking oil
- Sauces
- Spices
- Protein appropriate for medical diets

### Operational barriers

- Cold-storage cost
- Short shelf life
- Inspection labor
- Transportation requirements
- Unpredictable donation volume
- Limited volunteer capacity
- Food-safety procedures
- Receiving-window constraints

### Product opportunity

Treat **cold capacity and remaining shelf life as first-class data**, not hidden notes.

---

## Finding 6: limited hours and distance make food functionally unavailable

### Recipients described

- Pantries open during work hours
- Sites open once a week or only a few hours
- Long lines
- Lack of a car
- High fuel cost
- Illness or disability
- Rural distance
- Lack of delivery options
- Confusing eligibility information

### Product opportunity

An operations map should display:

- Travel time, not only distance
- Public-transit access
- Opening hours
- Receiving hours
- Mobile pantry schedules
- Delivery zones
- Demand by day and time
- Vehicle and volunteer capacity

The map should help staff decide **where and when to distribute**, not merely show the closest pantry.

---

## Finding 7: stigma and qualification confusion delay help

### Recipients described

- Feeling that using a pantry was “begging”
- Fear of being judged
- Bringing bills and documents they were never asked to provide
- Believing they earned too much to qualify
- Waiting until they had gone days without eating

### Operational reality

Different programs have different:

- Funding sources
- Geographic rules
- Income rules
- Documentation rules
- Visit limits
- Delivery rules

### Product opportunity

Any eligibility or pantry-information agent should show:

- Source of the rule
- Date last confirmed
- Confidence level
- Contact method
- Alternative programs
- A warning when information may be outdated

---

## Finding 8: volunteer capacity affects whether food moves at all

### Workers and volunteers described

- Physically demanding sorting and packing
- Heavy reliance on older volunteers
- Turnout uncertainty
- Limited staff knowledge
- Insufficient time for balanced boxes
- Delayed food distribution when packing labor is unavailable

### Product opportunity

A volunteer-aware production agent can:

- Forecast turnout
- Identify skill gaps
- Create micro-shifts
- Build packing-line assignments
- Prioritize urgent food
- Replan when attendance changes
- Convert experienced-worker voice notes into instructions

---

## Finding 9: shortest distance is not always the fairest plan

A purely efficiency-based system may repeatedly deprioritize:

- Rural communities
- Locations with narrow receiving windows
- Agencies with difficult unloading conditions
- Communities with fewer volunteers
- Destinations farther from the warehouse
- Neighborhoods that have recently received less service

### Product opportunity

Display separate metrics for:

- Operational efficiency
- Food urgency
- Community need
- Fairness over time
- Access burden
- Refusal risk

Do not hide fairness inside one opaque score.

---

# 6. Most important external research facts

The formal research mostly confirmed the Reddit findings while explaining the operational reasons behind them.

## Scale and need

### USDA household food security report — 2024

- **13.5% of U.S. households** were food insecure at some point in 2023.
- **5.1% of households** experienced very low food security.
- Product implication: the problem requires scalable operations, not only high-touch individual services.

Source: [USDA Economic Research Service — Household Food Security in the United States in 2023](https://www.ers.usda.gov/publications/109895)

### Feeding America Map the Meal Gap — 2025

- People face hunger in **100% of U.S. counties and congressional districts**.
- **86% of counties with the highest food-insecurity rates were rural**.
- More than **2 in 5 people facing hunger** were unlikely to qualify for SNAP.
- The national food-budget shortfall exceeded **$32 billion**.
- Average meal cost in 2023 was **$3.58**, with large local variation.
- Product implication: model rural access, benefit gaps, and local cost differences.

Source: [Feeding America — Map the Meal Gap 2025](https://www.feedingamerica.org/research/map-the-meal-gap/overall-executive-summary)

## Food rescue and waste

### EPA Wasted Food Scale — updated 2025

- The preferred pathways are preventing waste, donating food, and upcycling.
- Donation preserves food's intended purpose: nourishing people.
- Product implication: measure pounds redirected from disposal and whether food reached a usable destination.

Source: [U.S. EPA — Wasted Food Scale](https://www.epa.gov/sustainable-management-food/wasted-food-scale)

### Food redistribution optimization — foundational research

- Food-rescue supply can be highly variable and heavy-tailed.
- Success depends heavily on the rate of expiration and the ability to preserve, transport, and redistribute food quickly.
- Product implication: urgency and transport feasibility matter more than a static donation listing.

Source: [Food Redistribution as Optimization](https://arxiv.org/abs/1108.5768)

## Public food programs

### USDA TEFAP

- TEFAP provides emergency food at no cost through states.
- USDA provides American-grown foods and administrative funds.
- Available categories include fruits, vegetables, legumes, proteins, dairy, grains, and soups.
- USDA also provides recipes, storage guidance, and waste-minimization resources.
- Product implication: supply does not come only from random individual donations; program source and rules matter.

Source: [USDA Food and Nutrition Service — TEFAP](https://www.fns.usda.gov/tefap/emergency-food-assistance-program)

## Decision support and scenario comparison

### World Food Programme Optimus

- Combines population, transportation, nutrition, sourcing, funding, and lead-time information.
- Lets teams create and compare scenarios.
- Has been used in **44 WFP operations**.
- Reached **1.7 million people in 2023**.
- Reported **$273,000 in operational cost reduction in Haiti**.
- Product implication: a plan-comparison screen is credible and stronger than one unexplained AI answer.

Source: [World Food Programme — Optimus](https://innovation.wfp.org/project/optimus)

## Forecasting

### FoodRL — 2025

- In-kind donations are volatile because of seasonality, disasters, and changing supply.
- The model was evaluated on data from two structurally different U.S. food banks.
- It performed especially well during disruption or decline.
- The paper estimates potential redistribution equivalent to **1.7 million additional meals annually**.
- Product implication: forecast ranges and confidence, rather than pretending to know exact future donations.

Source: [FoodRL](https://arxiv.org/abs/2511.04865)

## Fair allocation

### Automating Food Drop — 2024

- Manual truckload matching was time-consuming.
- A small group of recipients received a disproportionate share of donations.
- Researchers built and deployed a real-time matching platform balancing driver efficiency and recipient fairness.
- Product implication: show both efficiency and fairness.

Source: [Automating Food Drop](https://arxiv.org/abs/2406.06363)

### Sequential fair allocation — 2025

- Storage capacity changes the tradeoff between fairness and efficiency.
- Stockouts and overflows create different costs.
- Product implication: fairness cannot be calculated without capacity and supply uncertainty.

Source: [Sequential Fair Allocation With Replenishments](https://arxiv.org/abs/2508.21753)

### Volunteer-engagement fairness — 2025

- Engagement optimization can worsen geographic disparities.
- Areas with lower match rates may require intentionally higher support.
- Product implication: avoid repeatedly selecting the easiest routes and volunteer zones.

Source: [Contextual Budget Bandit for Food Rescue Volunteer Engagement](https://arxiv.org/abs/2509.10777)

## Dietary fit and food usability

### Menu-selection optimization — 2026

- Models how to serve people with varied dietary requirements while minimizing excess food.
- Product implication: dietary compatibility and waste can be treated as a resource-allocation problem.

Source: [Menu Selection: A Computational Approach to Minimizing Food Waste](https://arxiv.org/abs/2606.06989)

### Nutrition-guideline implementation study — 2026

- Interviews covered **12 food banks**.
- Common problems included evaluating mixed dishes, grains, and donated assortments.
- Staff time for nutrition ranking was limited.
- Product implication: AI can help categorize products, but uncertain classifications require staff review.

Source: [Healthy Eating Research — Nutrition Guideline Implementation](https://healthyeatingresearch.org/research/identifying-barriers-and-facilitators-of-the-implementation-of-nutrition-guidelines-in-food-banks-using-the-consolidated-framework-for-implementation-research/)

### Food Equality Initiative — 2021 profile

- An allergy-focused pantry emerged after a family found very few usable foods at a conventional pantry.
- The organization used online selection and delivery of allergy-safe food.
- Product implication: standard boxes can fail severely for households with restrictions.

Source: [EatingWell — Food Equality Initiative](https://www.eatingwell.com/article/7921879/food-equality-initiative-emily-brown/)

### Culturally relevant food — 2025

- Lowcountry Food Bank worked with Gullah Geechee farmers to distribute familiar foods such as okra, tomatoes, squash, corn, yams, and rice.
- Staff emphasized the value of familiar food during stressful periods.
- Product implication: cultural fit is operationally meaningful, not decorative.

Source: [The Guardian — Gullah Geechee Food Traditions](https://www.theguardian.com/news/2025/jul/29/food-bank-gullah-geechee-farming-traditions)

## Access and location

### Spatial accessibility — 2026

- Geographic accessibility was a key predictor of food-parcel uptake.
- The relationship was stronger in rural areas.
- Urban centers often had better transit access but shorter opening hours.
- Product implication: maps should include travel time, public transit, hours, and delivery models.

Source: [Spatial Accessibility to Food Banks](https://arxiv.org/abs/2606.24319)

### Food-bank and pantry location optimization — 2024

- A two-level model used real road distances and socioeconomic factors.
- California and Indiana test cases suggested potential travel-distance reductions.
- Product implication: maps can support temporary or mobile distribution planning.

Source: [Where to Build Food Banks and Pantries](https://arxiv.org/abs/2410.15420)

### Pantry-information retrieval — 2026

- Public pantry information is fragmented, inconsistent, and sometimes outdated.
- Conversational retrieval struggled with vague queries and inconsistent knowledge bases.
- Product implication: every pantry fact should include its source, freshness date, and uncertainty.

Source: [Retrieval Challenges in Food Pantry Access](https://arxiv.org/abs/2602.21598)

## Notes, feedback, and AI

### RescueLens — 2025

- Built with 412 Food Rescue.
- Categorized volunteer feedback and suggested follow-up.
- Recovered **96% of issues at 71% precision**.
- Found that **0.5% of donors accounted for more than 30% of volunteer issues**.
- Was deployed operationally.
- Product implication: messy driver and volunteer notes can be converted into prioritized actions.

Source: [RescueLens](https://arxiv.org/abs/2511.15698)

## Vision and inspection

### Computer-vision food-waste estimation — 2025

- Some food categories approached or exceeded **90% distributional pixel agreement**.
- Complex, fragmented, and viscous foods were harder to estimate.
- Product implication: use images to prioritize inspection or estimate quantity, not to independently guarantee safety.

Source: [Computer Vision Food-Waste Estimation](https://arxiv.org/abs/2507.14662)

## Labor and infrastructure

### Maine volunteer shortage — 2025

- More than **75%** of roughly 600 hunger-relief agencies receiving food through the state's food-bank network relied completely on volunteers.
- One large food bank delayed the processing of thousands of pounds because it lacked enough sorting and packing volunteers.
- Product implication: volunteer attendance is a supply-chain capacity variable.

Source: [Associated Press — Maine Food-Pantry Volunteer Shortage](https://apnews.com/article/d99561bb62692d58210d37542898745a)

### Connecticut Foodshare cold storage — 2026

- One older warehouse cost about **$300,000 annually** for utilities and cold-storage operation.
- A planned **50,000-square-foot expansion** would double freezer space.
- Foodshare said it sometimes could not accept additional food because it lacked room.
- Product implication: donation acceptance must include real cold-capacity constraints.

Source: [CT Insider — Connecticut Foodshare Warehouse Expansion](https://www.ctinsider.com/business/article/food-bank-ct-bloomfield-wallingford-warehouse-22222296.php)

---

# 7. Existing products and crowded categories

## Competitor summary

| Product | What it already does | Implication |
|---|---|---|
| **Plentiful** | Pantry finder, reservations, multilingual access, digital check-in, messaging, reporting, network insights | Do not build only a pantry locator or reservation tool |
| **Vivery** | Centralized food-resource map, agency updates, language and food-category information, analytics | A public find-food map is already crowded |
| **MealConnect** | Connects food banks, donors, partner agencies, and volunteer pickups for scheduled and real-time donations | A donation-posting and pickup marketplace is not enough |
| **Food Rescue Hero** | Volunteer scheduling, donor coordination, rescue tracking, mobile workflows, dashboards, equity analytics | Generic rescue dispatch is already mature |
| **Link2Feed** | Client intake, household and program tracking, reporting, volunteer tools, delivery integration | Do not rebuild case management |
| **PantrySoft** | CRM, visit tracking, inventory, client portal, online ordering, reporting, volunteer platform | Pantry management and online ordering are crowded |

## Product links

- [Plentiful](https://www.plentiful.org/)
- [Vivery](https://www.vivery.org/)
- [MealConnect](https://mealconnect.org/)
- [Food Rescue Hero](https://foodrescuehero.org/)
- [Link2Feed](https://www.link2feed.com/)
- [PantrySoft](https://www.pantrysoft.com/)

## Categories to avoid as the entire project

Avoid building only:

- A basic pantry locator
- A recipe chatbot
- A food-donation listing board
- A volunteer pickup app
- A generic client database
- A static inventory dashboard
- A chat interface over fake records
- A shortest-distance route optimizer
- A grocery-style ordering portal without an operations connection

These can exist as supporting screens, but they are not differentiated enough by themselves.

---

# 8. The main market and product gap

The strongest gap is the closed loop below:

```text
Donation or inventory event
        ↓
Product urgency and capacity analysis
        ↓
Agency and community usability matching
        ↓
Explainable alternative plans
        ↓
Human approval
        ↓
Packing or cross-dock instructions
        ↓
Route and partner communication
        ↓
Disruption recovery
        ↓
Refusal, delivery, and impact learning
```

The key differentiation is not “we have a map” or “we use AI.”

It is:

> **The system converts uncertain food supply and community demand into an approved operational plan.**

---

# 9. Top five hackathon ideas

## 1. ChoiceGrid

**Target user:** food-bank allocation, warehouse, and transportation managers.

**Problem:** donations and inventory are allocated without enough visibility into shelf life, agency capacity, receiving windows, product fit, community need, and fairness.

**Solution:** compare several explainable allocation plans, let staff approve one, generate packing instructions and routes, then replan when conditions change.

**Best screens:**

- Operations dashboard
- Donation details
- Community-demand map
- AI plan comparison
- Packing plan
- Mission map
- Disruption simulator
- Impact report

**Strengths:**

- Best combination of AI, maps, workflow, and measurable impact
- Covers several official themes without becoming random
- Creates a strong presentation story

**Main risk:** excessive scope.

---

## 2. FreshRoute

**Target user:** produce, inventory, and dispatch teams.

**Problem:** perishable food spoils because staff cannot quickly identify a destination with demand, cold capacity, and compatible receiving hours.

**Solution:** rank shelf-life risk, compare direct distribution, storage, transfer, or immediate packing, and display the selected route.

**Best demo:** a vehicle fails while strawberries have only 36 hours remaining.

**Strengths:**

- Focused
- Easy to explain
- Highly measurable
- Strong map

**Main risk:** shelf-life estimates must remain advisory.

---

## 3. DonationIQ

**Target user:** donation coordinators and warehouse managers.

**Problem:** some donations create more handling, transport, storage, and waste cost than value.

**Solution:** recommend accepting all, accepting part, rescheduling, redirecting, or declining; draft a donor response.

**Best demo:** insufficient cold space causes the agent to split a donation between direct delivery and warehouse storage.

**Strengths:**

- Original
- More achievable than a complete logistics product
- Strong AI reasoning

**Main risk:** requires credible decision rules and evidence.

---

## 4. ReturnLoop

**Target user:** agency-relations, transportation, and allocation teams.

**Problem:** refusal notes, short receipts, driver comments, and missed-delivery reasons remain unstructured, so the same failures repeat.

**Solution:** categorize notes, find repeated patterns, recommend new allocation rules, and show failure locations on a map.

**Best demo:** the system discovers repeated frozen-product refusals caused by inadequate freezer capacity.

**Strengths:**

- Less crowded
- Strong LLM use
- Real learning loop
- Easy to prototype with sample notes

**Main risk:** less visually dramatic unless paired with a strong before-and-after story.

---

## 5. ShiftPilot

**Target user:** volunteer coordinators and packing-line supervisors.

**Problem:** production plans fail when volunteer attendance and skill mix differ from the schedule.

**Solution:** predict turnout, assign stations, recommend line setup, prioritize urgent products, and rebuild the production plan.

**Best demo:** attendance drops from 20 volunteers to 11.

**Strengths:**

- Highly buildable
- Directly tied to official challenge needs
- Clear productivity metrics

**Main risk:** weaker geographic-map story.

---

# 10. Recommended project: ChoiceGrid

## Product statement

> **ChoiceGrid helps food-bank staff decide where urgent food should go, how it should be packed, and how to recover when the plan changes—using shelf life, capacity, access, community need, and product usability.**

## Why it is the best choice

ChoiceGrid combines:

- DonationIQ's donation interpretation
- FreshRoute's perishable urgency
- Community demand and usability matching
- RescueGrid-style routing and recovery
- ReturnLoop's notes-to-learning capability

But it keeps one clear story:

> **An urgent donation arrives, and ChoiceGrid makes sure it reaches a useful destination before it spoils.**

## AI-agent structure

### Intake Agent

- Reads a form, message, or email
- Extracts donation details into validated structured data
- Identifies missing questions

### Capacity Agent

- Checks warehouse, dock, refrigerator, freezer, labor, and vehicle capacity

### Need-Matching Agent

- Ranks partner agencies using aggregate demand and operational constraints

### Planning Agent

- Creates three alternatives
- Explains tradeoffs and assumptions

### Routing Agent

- Creates the pickup and delivery sequence
- Displays route lines and receiving windows

### Recovery Agent

- Replans after disruptions

### Communication Agent

- Drafts donor confirmations, driver instructions, and pantry updates

## Suggested scoring model

A transparent demonstration score could be:

```text
Destination Score =
30% documented community need
+ 20% product usability match
+ 15% receiving-window compatibility
+ 15% available storage capacity
+ 10% recent service gap
+ 10% equity priority
- travel penalty
- spoilage penalty
- refusal-risk penalty
```

Do not let the language model invent the score. Use deterministic code, then let the model explain the result.

## Eight core screens

### 1. Operations Control Tower

- Urgent offers
- Pounds at expiration risk
- Open missions
- Cold-capacity utilization
- Late arrivals
- Agency shortages
- Overnight briefing

### 2. Donation Intake and Details

- Original donor message
- Structured fields
- Confidence
- Missing questions
- Donor history

### 3. Demand and Capacity Map

- Donors
- Warehouse
- Partner agencies
- Product demand
- Cold capacity
- Receiving windows
- Service gaps
- Available trucks

### 4. AI Decision Room

Compare:

- Warehouse-first plan
- Direct-distribution plan
- Mixed plan

Display:

- Pounds expected to move in time
- Households served
- Miles
- Labor
- Cold utilization
- Need-match score
- Equity score
- Risks and assumptions

### 5. Packing and Cross-Dock Plan

- Cases and pounds by destination
- Pick order
- Packing stations
- Urgency
- Volunteer requirement
- Labels and instructions

### 6. Live Mission Map

- Pickup
- Stops
- Vehicle
- Estimated arrival times
- Receiving contacts
- Status

### 7. Disruption Simulator

Buttons:

- Truck breakdown
- Pantry cancellation
- Freezer capacity lost
- Driver unavailable
- Donation quantity doubled
- Pickup deadline shortened

### 8. Impact and Audit

- Pounds saved
- Estimated spoilage avoided
- Households served
- Miles
- Staff time saved
- Replanning time
- Human overrides
- Reasons for decisions

## Ninety-second demo

### 0–15 seconds

> “A grocery store unexpectedly offers 1,200 pounds of strawberries. Pickup must occur within two hours.”

### 15–30 seconds

The Intake Agent structures the offer.

### 30–45 seconds

The map shows:

- Main warehouse near cold capacity
- One pantry closing soon
- One pantry with cold space
- One pantry recently receiving produce
- A meal-kit program able to use part of the shipment

### 45–60 seconds

Compare three plans and approve the mixed plan.

### 60–75 seconds

Generate:

- Direct pantry allocations
- Meal-kit allocation
- Packing or cross-dock plan
- Route

### 75–85 seconds

Trigger **Pantry Canceled** or **Truck Breakdown**.

### 85–90 seconds

Display scenario results:

- 1,140 pounds distributed
- 380 households supported
- 94% estimated spoilage avoided
- Plan rebuilt in 11 seconds

These should be clearly labeled as **simulated scenario estimates**.

---

# 11. MVP build plan

## What should genuinely work

| Component | Real implementation |
|---|---|
| Donation extraction | LLM returns validated JSON |
| Destination scoring | Deterministic formula |
| Plan comparison | Three calculated alternatives |
| Human approval | Updates application state |
| Map | Real markers, popups, route lines, navigation |
| Packing plan | Derived from approved quantities |
| Disruption recovery | Recalculates assignments and routes |
| Impact metrics | Calculated from before-and-after state |
| Explanations | Generated from actual data and scores |
| Audit trail | Stores recommendation, approval, override, and reason |

## What can be simulated

- One warehouse
- Ten partner pantries
- Five donors
- Three vehicles
- Four drivers
- Twenty inventory products
- Three active donations
- Four disruption scenarios
- Alameda County or San Francisco coordinates
- Aggregate community profiles
- Precomputed route coordinates
- Sample receiving and refusal notes

## What not to build during the hackathon

- Production-grade warehouse integrations
- Live truck GPS
- Recipient medical records
- Automated food-safety approval
- Perfect shelf-life prediction
- Full route-optimization infrastructure
- Every feature in the 35-item build list

---

# 12. Demo metrics

## Operational metrics

- Decision time
- Replanning time
- Staff minutes saved
- Miles traveled
- Vehicle utilization
- Cold-capacity utilization
- Cases or pounds handled
- Packing labor required
- Receiving-window success rate

## Food-impact metrics

- Pounds distributed before expiration
- Estimated spoilage avoided
- Products redirected from disposal
- Expiration-risk reduction
- Refusals avoided
- Direct-distribution percentage

## Community-impact metrics

- Households or programs served
- Product-usability match
- High-need locations served
- Cultural-preference fit
- No-cook or limited-storage demand satisfied
- Fairness across agencies
- Service-gap reduction

## Trust metrics

- Recommendations approved
- Recommendations overridden
- Low-confidence fields
- Missing-information requests
- Staff explanations
- Reasons for destination exclusion

---

# 13. Risks and guardrails

| Risk | Guardrail |
|---|---|
| Project becomes too broad | Build one strawberry workflow and four disruptions |
| AI invents facts | Validate JSON and use fixed source records |
| Sensitive recipient data | Use synthetic or aggregate cohort data |
| Unsafe shelf-life claim | Present risk estimates and require staff inspection |
| Route API fails during presentation | Store route geometry locally |
| Product looks like a generic dashboard | Center the demo on plan comparison and disruption recovery |
| Impact metrics look fake | Calculate every metric from stated assumptions |
| Existing platforms already cover the idea | Differentiate through closed-loop allocation and recovery |
| Algorithm hides bias | Display fairness and efficiency separately |
| System over-automates decisions | Require human approval before operational changes |
| Dietary matching becomes medical advice | Match declared categories only; never diagnose |
| Pantry information is outdated | Show source, last-confirmed date, and confidence |

---

# 14. Research limitations

## Reddit limitations

- Reddit users are self-selecting.
- Negative or unusual experiences may be overrepresented.
- Some posts were deleted, private, collapsed, or unavailable.
- Reddit restricts broad automated crawling and historical indexing.
- The 30-thread broader review was qualitative, not an exhaustive scrape.
- Only the two user-provided complete exports were coded for exact frequencies.
- The combined “about 500 comments” figure is approximate.
- Exact Reddit theme counts should be reported only for the 269-item coded subset.

## Formal-research limitations

- Several papers are preprints and may not yet be peer reviewed.
- Studies come from different countries and operating systems.
- A finding in a humanitarian operation may not directly transfer to Alameda County.
- Product websites describe their own capabilities and should not be treated as independent evaluations.
- News reports provide valuable operational examples but not representative statistics.

## Product-research limitation

Public product pages may not describe every internal capability. Therefore:

> “No reviewed public page appeared to center this exact closed loop” is more defensible than “no competitor has this feature.”

---

# 15. Appendix: subreddits and searches

## Search-query families

```text
"food bank problems"
"food pantry experience"
"moldy expired food bank"
"food pantry dietary restrictions"
"food pantry client choice"
"food pantry prepacked boxes"
"food bank no kitchen"
"food pantry no refrigerator"
"food pantry opening hours"
"rural food bank access"
"food bank volunteer shortage"
"food bank donation sorting"
"food rescue driver problems"
"food pantry food waste"
"food bank stigma"
"SNAP dehumanizing"
"food pantry cultural food"
"food bank warehouse problems"
"food donation refused"
"food pantry transportation"
```

## Stakeholder groups prioritized

- Food-bank recipients
- Pantry recipients
- Volunteers
- Pantry workers
- Food-bank operations staff
- Donors
- Food-rescue drivers
- Social workers
- Nonprofit professionals

## Research categories

- Food quality and spoilage
- Dietary restrictions
- Client choice
- Meal completeness
- Cultural relevance
- Cooking and storage limits
- Donation sorting
- Warehouse operations
- Volunteer shortages
- Transportation
- Pantry hours
- Eligibility
- Stigma
- Refused products
- Unmet demand

---

# 16. Source registry

## Official hackathon materials

1. **AISCO Hackathon Deck 2026 — SHARE.pdf**  
   Official prompt, prizes, schedule, participation guidance, and judging advice.

2. **Alameda County Food Bank — Hackathon Challenge Themes.docx**  
   Seven challenge themes and operating principle.

3. **Alameda County Food Bank — The Build List.docx**  
   Thirty-five requested operational capabilities.

## Formal research, reports, and articles

1. [USDA ERS — Household Food Security in the United States in 2023](https://www.ers.usda.gov/publications/109895), September 4, 2024.  
2. [Feeding America — Map the Meal Gap 2025](https://www.feedingamerica.org/research/map-the-meal-gap/overall-executive-summary), May 14, 2025.  
3. [U.S. EPA — Wasted Food Scale](https://www.epa.gov/sustainable-management-food/wasted-food-scale), updated December 2025.  
4. [USDA FNS — The Emergency Food Assistance Program](https://www.fns.usda.gov/tefap/emergency-food-assistance-program), page updated August 8, 2025.  
5. [World Food Programme — Optimus](https://innovation.wfp.org/project/optimus), page updated April 8, 2025.  
6. [FoodRL: In-Kind Food Donation Forecasting](https://arxiv.org/abs/2511.04865), November 6, 2025.  
7. [Automating Food Drop](https://arxiv.org/abs/2406.06363), June 10, 2024.  
8. [Sequential Fair Allocation With Replenishments](https://arxiv.org/abs/2508.21753), August 29, 2025.  
9. [Contextual Budget Bandit for Food Rescue Volunteer Engagement](https://arxiv.org/abs/2509.10777), September 13, 2025.  
10. [Menu Selection: A Computational Approach to Minimizing Food Waste](https://arxiv.org/abs/2606.06989), June 5, 2026.  
11. [Spatial Accessibility to Food Banks](https://arxiv.org/abs/2606.24319), June 23, 2026.  
12. [Where to Build Food Banks and Pantries](https://arxiv.org/abs/2410.15420), October 20, 2024.  
13. [Retrieval Challenges in Food Pantry Access](https://arxiv.org/abs/2602.21598), February 25, 2026.  
14. [RescueLens](https://arxiv.org/abs/2511.15698), November 19, 2025.  
15. [Computer-Vision Food-Waste Estimation](https://arxiv.org/abs/2507.14662), July 19, 2025.  
16. [Healthy Eating Research — Nutrition Guideline Implementation](https://healthyeatingresearch.org/research/identifying-barriers-and-facilitators-of-the-implementation-of-nutrition-guidelines-in-food-banks-using-the-consolidated-framework-for-implementation-research/), April 2026.  
17. [EatingWell — Food Equality Initiative](https://www.eatingwell.com/article/7921879/food-equality-initiative-emily-brown/), October 15, 2021.  
18. [The Guardian — Gullah Geechee Farming Traditions](https://www.theguardian.com/news/2025/jul/29/food-bank-gullah-geechee-farming-traditions), July 29, 2025.  
19. [Associated Press — Maine Food-Pantry Volunteer Shortage](https://apnews.com/article/d99561bb62692d58210d37542898745a), September 28, 2025.  
20. [CT Insider — Connecticut Foodshare Expansion](https://www.ctinsider.com/business/article/food-bank-ct-bloomfield-wallingford-warehouse-22222296.php), April 24, 2026.  

## Existing products reviewed

1. [Plentiful](https://www.plentiful.org/)  
2. [Vivery](https://www.vivery.org/)  
3. [MealConnect](https://mealconnect.org/)  
4. [Food Rescue Hero](https://foodrescuehero.org/)  
5. [Link2Feed](https://www.link2feed.com/)  
6. [PantrySoft](https://www.pantrysoft.com/)  

---

# Final one-sentence recommendation

> Build **ChoiceGrid** as a focused AI decision-and-recovery product for urgent perishable donations: interpret the offer, compare destinations and plans, obtain human approval, generate packing and routes, recover from one disruption, and prove the result with calculated impact metrics.
