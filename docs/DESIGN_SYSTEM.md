# Design System

## Design goals

The interface should feel like a calm, credible operations tool—not a futuristic AI toy.

Priorities:

1. Urgency without panic
2. Dense information without confusion
3. Clear human control
4. Explainable recommendations
5. Strong map and status semantics
6. Accessible contrast and keyboard behavior

---

## Visual direction

### Tone

- Professional
- Warm
- Mission-centered
- Operational
- Trustworthy

Avoid excessive gradients, glowing effects, decorative AI imagery, or animation that distracts from decisions.

### Palette — Cold Chain

The palette ships in `app/globals.css` `:root`. These are the shipped values, not a proposal. Re-point a token there and update this table in the same change.

The governing rule, from `app/globals.css`:

> The product's governing variable is whether perishable inventory stays cold. So the workspace is cool by default: every neutral is a teal-shifted slate, and the primary action is an instrument cyan rather than a generic UI blue. Saturation is reserved for signal. Warmth on screen means something is at risk — amber for a constraint under pressure, red for a break in the chain. Do not introduce a warm hue for a non-urgent purpose; it spends the one contrast the interface relies on to say "look here".

Token names are a palette ramp, not semantics. Roles are used consistently: 200/300 are rules, `--slate-600/700/900` are ink, `--slate-50/100` are ground.

#### Instrument chrome — the dark rail the workspace hangs off

| Token | Value | Use |
|---|---|---|
| `--navy-950` | `#06171d` | Rail ground |
| `--navy-900` | `#0c2830` | Rail surface |
| `--navy-800` | `#124049` | Rail rules and raised chrome |

#### Instrument cyan — primary action and focus

| Token | Value | Use |
|---|---|---|
| `--blue-900` | `#063b4f` | Deepest cyan ink |
| `--blue-700` | `#0a5670` | Pressed and active states |
| `--blue-600` | `#0d6e8c` | Primary action, links, selected controls |
| `--blue-500` | `#1898bd` | Focus and emphasis |
| `--blue-100` | `#cfe9f2` | Selected fill |
| `--blue-50` | `#f0f9fc` | Lightest cyan wash |

#### Cold-chain intact

| Token | Value | Use |
|---|---|---|
| `--green-700` | `#12614a` | Feasible/approved ink |
| `--green-600` | `#1f7a5c` | Feasible, approved, delivered |
| `--green-100` | `#dff2ea` | Feasible fill |

#### Alarm — constraint under pressure

| Token | Value | Use |
|---|---|---|
| `--amber-700` | `#8a4f08` | Warning ink |
| `--amber-600` | `#a8630a` | Capacity warning, medium risk |
| `--amber-500` | `#f59e0b` | Warning marker |
| `--amber-100` | `#fdefd4` | Warning fill |

#### Alarm — chain broken

| Token | Value | Use |
|---|---|---|
| `--red-700` | `#a82520` | Infeasible ink |
| `--red-600` | `#cc3a2c` | Infeasible, canceled, high risk |
| `--red-100` | `#ffe7e2` | Infeasible fill |

#### Advisory note

| Token | Value | Use |
|---|---|---|
| `--purple-600` | `#5a56a0` | Warehouse and planning context |
| `--purple-100` | `#e8e8f6` | Advisory fill |

#### Rail-scoped accents

The chrome sits on `--navy-950`, so it needs its own cyan steps: the workspace's `--blue-600` is tuned for contrast against white and goes muddy on a dark ground.

| Token | Value | Use |
|---|---|---|
| `--rail-active` | `#0e5f7a` | Active rail item fill |
| `--rail-active-edge` | `rgba(24, 152, 189, 0.34)` | Active rail item edge |
| `--rail-accent` | `#4fc3e8` | Rail accent on dark ground |

#### Cool neutral ramp

| Token | Value | Use |
|---|---|---|
| `--slate-950` | `#071a1f` | Deepest ink |
| `--slate-900` | `#0d2129` | Primary text |
| `--slate-800` | `#16303a` | Strong ink |
| `--slate-700` | `#2c4a55` | Ink |
| `--slate-600` | `#4c666f` | Secondary text |
| `--slate-500` | `#5f7a84` | Tertiary text |
| `--slate-400` | `#93a9b1` | Muted text and icons |
| `--slate-300` | `#c4d5d9` | Rule |
| `--slate-200` | `#d9e5e7` | Rule |
| `--slate-150` | `#e5eeef` | Subtle rule and fill |
| `--slate-100` | `#edf4f4` | Page ground |
| `--slate-50` | `#f6fbfb` | Raised ground |
| `--white` | `#ffffff` | Surface |

Every ink token clears 4.5:1 on `--white`. `npm run check:contrast` (`scripts/check-contrast.mjs`) enforces the palette across 28 pairs at WCAG AA and exits non-zero on regression. Run it after any token change. Do not rely on color alone.

---

## Typography

Instrument Sans (`--type-ui`) and Martian Mono (`--type-mono`), loaded via `next/font` in `app/layout.tsx` and exposed as `--font-ui` / `--font-mono`. The `--type-*` tokens carry system-stack fallbacks so the app stays legible if the fonts fail to load.

Martian Mono is for figures, unit labels, eyebrows, and identifiers only. Never body copy.

Scale:

| Role | Size | Weight |
|---|---:|---:|
| Page title | 28–32 px | 700 |
| Section heading | 20–24 px | 650–700 |
| Card heading | 16–18 px | 600 |
| Body | 14–16 px | 400 |
| Label | 12–14 px | 500–600 |
| KPI value | 26–36 px | 700 |

`body` sets `font-variant-numeric: tabular-nums` globally, so metrics align by default.

---

## Spacing and layout

Use a 4 px base scale:

```text
4, 8, 12, 16, 20, 24, 32, 40, 48, 64
```

### Desktop shell

- Sidebar: 232–256 px
- Content max width: 1440 px
- Page padding: 24–32 px
- Card gap: 16–24 px
- Card radius: 10–14 px
- Border: subtle neutral line

### Information density

Operational tables may be dense, but:

- Keep row height at least 40 px.
- Use sticky headers when needed.
- Align quantities and metrics right.
- Keep primary action visible.
- Move advanced assumptions into drawers rather than hiding all reasoning.

---

## Core components

### KPI card

Contains:

- Label
- Primary value
- Unit
- Trend or comparison
- Status icon
- Optional drill-down

### Alert card

Contains:

- Severity
- Clear title
- Time sensitivity
- Operational consequence
- One primary action

### Plan card

Contains:

- Plan name
- One-sentence strategy
- Recommended badge when applicable
- Core metrics
- Risks
- Select action

### Metric comparison table

- Rows are metrics
- Columns are plan options
- Highlight best values carefully
- Include units and tooltips
- Avoid implying every metric should be minimized

### Status badge

Suggested states:

- Draft
- Needs confirmation
- Ready for planning
- Plan generated
- Awaiting approval
- Approved
- In execution
- Disrupted
- Replanning
- Delivered
- Closed

### Confidence indicator

Use text plus icon:

- High
- Medium
- Low
- Unknown

Do not show confidence only as color.

### Audit timeline

Show:

- Event
- Actor
- Time
- Reason
- Related plan or agent run

---

## Map design

### Marker types

- Donor: blue package icon
- Warehouse: purple warehouse icon
- Partner: green storefront or pantry icon
- Capacity warning: amber outline or badge
- Unavailable: red slash or warning icon
- Vehicle: truck icon

### Route lines

- Candidate plan: dashed line
- Approved route: solid line
- Infeasible or replaced route: red dashed line
- Replanned route: solid line with “Replanned” label

### Accessibility

- Maintain a synchronized list of map locations.
- Provide text summaries of route changes.
- Do not require pointer hover.
- Ensure marker popups are keyboard reachable.

---

## Charts

Use charts only when they clarify a comparison.

Recommended:

- Horizontal bars for plan metrics
- Stacked bar for allocation quantities
- Before-and-after bars for spoilage risk
- Timeline for mission events

Avoid:

- 3D charts
- Decorative gauges
- Pie charts with many categories
- Unlabeled animated counters

---

## Motion

- 150–250 ms transitions
- Respect reduced-motion settings
- Use animation to show state change, not decoration
- Route replan may animate once, but provide immediate static result

---

## Content style

Use plain operational language:

Prefer:

- “Needs confirmation”
- “Receiving window closes at 2:00 PM”
- “Exceeds refrigerated capacity by 180 lb”
- “Supervisor inspection required”
- “Recommended because...”

Avoid:

- “AI magic”
- “Bad pantry”
- “Noncompliant community”
- “Guaranteed safe”
- “Perfect route”
- “Objective fairness”

---

## Accessibility checklist

- [ ] Keyboard-visible focus
- [ ] Minimum contrast verified
- [ ] Semantic headings
- [ ] Table headers associated correctly
- [ ] Status not communicated by color alone
- [ ] Map has synchronized list
- [ ] Forms have labels and errors
- [ ] Dialog focus is trapped and restored
- [ ] Reduced motion supported
- [ ] Screen-reader text for icons
