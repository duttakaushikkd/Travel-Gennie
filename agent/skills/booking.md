---
description: Use when comparing ticket prices or choosing MakeMyTrip, Goibibo, or EaseMyTrip for a route.
---

Load this when the traveler asks which platform is cheapest or wants to book.

Call `search_and_rank_fares` with the current trip. Never invent fares. Then call `confirm_ota_handoff` so the traveler explicitly approves opening a third-party site. Remind them prices move and Travel Gennie does not complete checkout.
