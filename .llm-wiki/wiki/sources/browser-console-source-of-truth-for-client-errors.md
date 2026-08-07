---
type: source
title: "Browser console is the source of truth for client-side errors"
slug: browser-console-source-of-truth-for-client-errors
status: insight
created: 2026-08-07
updated: 2026-08-07
category: testing
---
# Browser console is the source of truth for client-side errors

Client-side runtime errors (failed imports, Svelte runtime errors, hydration issues, bad Inertia props, XHR 4xx/5xx) do NOT surface in `bun run typecheck` or the Bun build — the build compiles, the page renders, and the bug is silent. The browser console (DevTools → Console) is the ONLY source of truth for these failures.

This caused major frustration: the AI agent could not locate the error because it only checked build/test output, while the real error was sitting in the browser console the whole time. A green build + green tests does NOT mean the page works.

**Agent guidance:** when testing a UI change in the browser, ALWAYS open the console and read it before declaring the change verified. Use the `browser` tool (`xd://browser`) to drive a real tab and read console output. See [[sources/obs-2026-08-04-agents-md-created-codifying-repo-architecture]] for the AGENTS.md `## Browser testing` section that codifies this.
*Category: testing*
---

*Captured: 2026-08-07*

## Related

_Add links to related pages.*
