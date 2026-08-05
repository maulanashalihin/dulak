---
type: source
title: "Observation: TypeBox formats not pre-registered in plain @sinclair/typebox"
slug: obs-2026-08-05-typebox-formats-not-pre-registered-in-plain-sinclair-typebox
status: observation
created: 2026-08-05
updated: 2026-08-05
relevance: high
observed_at: 2026-08-05T01:14:22.346Z
tags: ["typebox", "validation", "formats"]
source_context: "Porting TypeBox validation to Hono"
---
# ⭐ Observation: TypeBox formats not pre-registered in plain @sinclair/typebox
Elysia's t wrapper pre-registered standard string formats; plain @sinclair/typebox does NOT — Value.Check on t.String({format:'email'}) fails with "Unknown format 'email'". Fix: FormatRegistry.Set('email', regex) at module load in src/server/validation.ts. Register any future formats there too. TypeBox error paths (e.g. '/email') still match the VALIDATION_MESSAGES mapping keys. Also: t.Object defaults allow additional properties — Elysia was strict by default, so schemas now pass { additionalProperties: false } explicitly.
*Relevance: high*

*Context: Porting TypeBox validation to Hono*

*Tags: typebox validation formats*
---
*Observed: 2026-08-05T01:14:22.346Z*