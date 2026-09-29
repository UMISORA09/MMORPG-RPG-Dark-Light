---
name: Battle animation state
description: A durable UI rule for replaying CSS combat animations as battle rounds advance.
---

Combat visuals should be keyed by the current round rather than relying only on changing classes. Re-mounting the arena per round reliably restarts attack, hit, critical, and floating-damage animations.

**Why:** CSS animations can remain at their completed state when a class is reused across state changes, making later battle rounds look static.

**How to apply:** When adding new battle actions or effects, derive the visual container key from the round index and keep HP values on transition-enabled elements.