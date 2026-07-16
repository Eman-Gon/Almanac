# Domain Glossary

## Organizations and people

### Food bank
A regional organization that receives, purchases, stores, allocates, and distributes large quantities of food to partner agencies. A food bank is not always the location where an individual household receives food.

### Food pantry
A local distribution site where households obtain food. A pantry may be operated by a nonprofit, religious organization, school, or community group.

### Partner agency
A pantry, meal program, shelter, school program, or other organization receiving food from the food bank.

### Donor
A business, farm, manufacturer, retailer, organization, or person offering food or funds.

### Recipient or neighbor
A person or household receiving food. Prefer respectful terms such as **neighbor**, **household**, or **participant** when the organization uses them.

### Volunteer
A person assisting with sorting, packing, driving, distribution, or other operations without being regular paid staff.

---

## Supply and receiving

### Donation offer
A proposed donation that has not yet been accepted. It may include product, quantity, location, pickup window, storage needs, and condition information.

### Inbound shipment
Food expected to arrive at a warehouse or partner site.

### Purchase order (PO)
A record authorizing purchased goods from a vendor.

### Donation order (DO)
A record representing donated goods. Terminology can vary by organization.

### Receiving
The process of unloading, inspecting, counting, recording, and accepting an inbound shipment.

### Short receipt
A delivery received with less product than expected.

### Over receipt
A delivery received with more product than expected.

### Refusal
A partner agency or receiving site declines all or part of a delivery, possibly because of capacity, timing, product suitability, quality, or quantity.

### Donor reliability
A performance measure comparing committed and actual product, quantity, timing, and condition.

---

## Inventory and warehouse

### Product lot
A quantity of one product sharing relevant arrival, condition, source, and shelf-life attributes.

### Shelf life
The expected period during which a product remains usable under stated storage conditions. ChoiceGrid treats this as an estimate requiring staff judgment.

### Expiration risk
A modeled risk that product will become unusable before it can move through the planned workflow.

### Cold chain
Temperature-controlled handling and transportation for refrigerated or frozen products.

### Cold capacity
Available refrigerator or freezer space, expressed in pounds, pallets, cubic volume, or another explicit unit.

### Long-term refrigerated storage
Refrigerated space used to hold product beyond short-dwell handling. In the hero fixture, the warehouse has 420 lb of headroom in this pool, and the 60 lb supervisor inspection hold consumes it.

### Refrigerated staging
Separate short-dwell refrigerated space used for same-day cross-dock or packing work. In the hero fixture, this pool has 500 lb available and is validated separately from long-term storage.

### Slotting
Selecting the warehouse location where product should be stored.

### Pick list
A list of products and quantities warehouse staff must retrieve for an order or mission.

### Pick sequence
The order in which pick-list items should be collected.

### Cycle count
A targeted inventory check of selected storage locations rather than a complete physical inventory.

### Cross-dock
Moving product from receiving directly into outbound staging or delivery without long-term storage.

### First-expired, first-out (FEFO)
A method that prioritizes lots with the earliest practical use-by or risk date.

---

## Allocation and demand

### Allocation
The quantity of a product assigned to a partner agency, program, packing run, or destination.

### Pre-allocation
Assigning food in advance using estimated demand or fixed shares.

### Pull-based replenishment
Using current consumption or need signals to drive replenishment rather than relying only on fixed allocation.

### Demand signal
An aggregate indication of product need based on orders, service history, declared preferences, shortages, access patterns, or program requirements.

### Usability profile
A non-identifying category describing whether a product can practically be used, such as no-cook, limited refrigeration, low-sodium program, or culturally preferred staple.

### Service gap
Evidence that a location or community has recently received less service relative to modeled need or historical expectations.

### Client choice
A distribution model allowing households to select among available foods rather than receiving a completely predetermined box.

### Constrained choice
A model that permits a limited number of category selections or substitutions while preserving fairness and throughput.

### Equity indicator
A transparent indicator of how a plan addresses access burden, recent service gaps, and distribution fairness. It is not an objective measure of justice and must be shown with its assumptions.

---

## Production and delivery

### Packing run
A scheduled activity producing boxes, bags, kits, or repacked units.

### Line setup
The arrangement of stations, materials, workers, and tasks for a packing run.

### Staging
Placing required product and materials near a dock, route, or production line before execution.

### Mission
An approved operational pickup and delivery plan.

### Route stop
One donor, warehouse, pantry, or other location in a mission sequence.

### Receiving window
The time interval during which a destination can accept a delivery.

### Access window
A time interval based on when a pantry, program, or community can practically receive or distribute food.

### Disruption
An event that makes the approved plan partially or fully infeasible, such as a truck failure, partner cancellation, capacity loss, or changed quantity.

### Replan
A revised set of allocations, stops, quantities, or times created after a disruption.

### Superseded mission
An original mission retained in history after a human approves a replacement mission. `superseded` does not mean deleted or silently overwritten.

---

## Programs and public assistance

### TEFAP
The Emergency Food Assistance Program, a USDA program providing food and administrative support through states and local organizations.

### SNAP
The Supplemental Nutrition Assistance Program, a federal benefit program helping eligible households purchase food.

### Mobile pantry
A scheduled distribution using a vehicle or temporary site to reach locations without sufficient fixed pantry access.

---

## ChoiceGrid-specific terms

### Plan option
One complete proposed way to accept, allocate, pack, and deliver a donation.

### Decision room
The screen comparing plan options, assumptions, metrics, and risks before approval.

### Need-match score
A deterministic score summarizing destination need, usability, capacity, windows, and related factors.

### Refusal-risk score
An estimate based on known destination constraints and prior refusal patterns.

### Agent run
One invocation of an AI or deterministic planning component, including input, output, status, confidence, and timing.

### Audit event
A record of a recommendation, approval, edit, override, disruption, or state change.

### Demo estimate
A value calculated from synthetic scenario data. It must never be presented as observed real-world impact.
