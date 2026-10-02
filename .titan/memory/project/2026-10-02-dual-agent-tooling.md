# Dual-agent tooling: Claude Code and Codex

Date: 2026-10-02

## Decision

klauShop adopts the same dual-agent layout as LensSpace (copied from
`../lensspace` on 2026-10-02): Titan Factory Codex (`plugins/titan-factory-codex/`,
`.codex/`, `.agents/`) and Titan Factory for Claude Code (`CLAUDE.md`, `.claude/`)
live in the repo and share one memory.

- Memory moved from `.claude/memory/` to `.titan/memory/` (git mv, history kept);
  `.claude/PRPs/prp-base.md` → `.titan/plans/prp-base.md`; QA evidence in `.titan/qa/`.
  `.claude/memory/` must never exist again.
- Skills and subagents renamed with the `tf-` prefix (same names as Codex). The old
  unprefixed skills were upstream copies with no klauShop changes.
- Project rules moved from `CLAUDE.md` to `AGENTS.md` (read by Codex); `CLAUDE.md` and
  `GEMINI.md` import it with `@AGENTS.md`. The real-stack rules are unchanged
  (see [decision-no-golden-path.md](decision-no-golden-path.md)).
- Third-party skills in `.agents/skills/` (`supabase`, `supabase-postgres-best-practices`,
  `logo-design`), locked in `skills-lock.json`; `.claude/skills/` has thin bridges.
- Codex marketplace renamed to `klaushop` (`titan-factory-codex@klaushop`).
- `.mcp.json`: `supabase` switched from npx + `SUPABASE_ACCESS_TOKEN` to the hosted HTTP
  MCP with OAuth (`/mcp` → Authenticate). Local servers start via `cmd /c npx` (Windows).
  `n8n-mcp` reads `N8N_API_URL`/`N8N_API_KEY` from the environment.

## Evidence

- `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.claude/`, `.codex/`, `.agents/`, `plugins/`
- `.claude/titan-factory-source.json` (upstream Claude toolbox commit `1d92ede`)
- `docs/AGENT_SETUP.md`

Source: user request to bring the LensSpace Codex + Claude Code setup to klauShop; user
chose to include logo-design and the hosted Supabase MCP with OAuth.
