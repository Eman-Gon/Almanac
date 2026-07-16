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

### Suggested palette

| Token | Suggested value | Use |
|---|---|---|
| `--navy-900` | `#17324D` | Primary navigation and headers |
| `--blue-600` | `#2563EB` | Donors, links, selected controls |
| `--green-600` | `#2E7D4F` | Feasible, approved, delivered |
| `--amber-600` | `#B7791F` | Capacity warning, medium risk |
| `--red-600` | `#C2413B` | Infeasible, canceled, high risk |
| `--purple-600` | `#6D4C9A` | Warehouse and planning context |
| `--slate-900` | `#172033` | Primary text |
| `--slate-600` | `#526071` | Secondary text |
| `--slate-100` | `#EEF2F6` | Page or card background |
| `--white` | `#FFFFFF` | Surface |

Verify contrast in the implementation. Do not rely on color alone.

---

## Typography

Use a highly legible sans-serif available through the application stack.

Suggested scale:

| Role | Size | Weight |
|---|---:|---:|
| Page title | 28–32 px | 700 |
| Section heading | 20–24 px | 650–700 |
| Card heading | 16–18 px | 600 |
| Body | 14–16 px | 400 |
| Label | 12–14 px | 500–600 |
| KPI value | 26–36 px | 700 |

Use tabular numbers for metrics when supported.

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
