---
description: Use when building or revising a day-by-day itinerary for a captured trip brief.
---

Load this when the traveler wants an itinerary.

Delegate to the `itinerary` subagent with origin, destination, dates, pace, budget, and constraints. Do not invent attractions without search evidence from the subagent tools. After the child returns, persist with `save_proposed_itinerary`.
