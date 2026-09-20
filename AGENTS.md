# DealMap agent guide

## Project

Korean deal-discovery prototype: Next.js 15 App Router, React 19, TypeScript
strict mode, Tailwind v4, Zustand, Radix UI, lucide-react, and sonner.
Next.js produces a static export in `out/`; hosting configuration is in
`.openai/hosting.json`. See `README.md` for product boundaries: deals and maps
are illustrative, login is a device-local demo, and records use localStorage.

## Commands

Use pnpm (version pinned in `package.json`).

- `pnpm install`: install dependencies when needed.
- `pnpm dev`: development server on port 4399.
- `pnpm lint`: ESLint check; does not automatically fix files.
- `pnpm typecheck`: TypeScript check.
- `pnpm test`: Node tests in `tests/`.
- `pnpm build`: production build and static export.

## Code map and conventions

- `src/app/`: page, layout, metadata, and global style imports.
- `src/features/dealmap/`: feature UI, sample data, state, and actions.
  `model.ts` contains pure validation/selectors; `store.ts` holds serializable
  Zustand state; `actions.ts` exposes the `DealActions` singleton for business
  logic and side effects. Components subscribe with selectors and call actions;
  do not mutate store state from components.
- `src/components/ui/`: reuse or extend the existing Radix modal and disclosure.
  Build additional primitives with the same accessible UI style.
- `src/styles/globals.css` and `details.css`: theme tokens and app styles.
  Prefer semantic background, text, accent, fill, and border tokens over raw
  colors. Use `cn` and `focusRing` from `~/lib/cn`; icons use `lucide-react`.
- Use the `~/*` alias for imports from `src` and preserve existing conventions.
- `docs/superpowers/`: historical specs and plans; read only the document relevant
  to the current task. Plans describe intended work, not necessarily implemented
  behavior; verify against source.

## Efficient workflow

- Use one agent by default. Delegate only when the user explicitly requests it;
  do not automatically launch implementation, review, or re-review agents.
- Start with relevant feature files and targeted searches. Avoid reading the
  whole repository, lockfile, generated output, or unrelated plans. Exclude
  `node_modules`, `.next`, `out`, `dist`, `.sites-runtime`, and `.worktrees` from
  broad searches. Keep tool output bounded and summarize long logs.
- Keep small changes direct; use planning and review effort proportional to the
  task. Load only relevant skills and tools. Avoid repeated discovery, unchanged
  checks, and optional improvements beyond the requested scope.
- Preserve the user's model and reasoning settings. Recommend a higher-cost
  setting only when there is a concrete need; do not change it automatically.
- For long tasks, leave a concise handoff with decisions, changed files, checks,
  and remaining work so future tasks need not reconstruct the full conversation.

## Verification

- Review the diff and run `git diff --check` for every change.
- Run `pnpm lint` before committing. For code changes, run relevant tests and
  `pnpm typecheck`; use a build for routing, configuration, dependency, or export
  changes. Visually check affected UI when changing layout or interaction.
- Documentation-only changes need no application build or runtime tests.
- Repeat checks only after relevant edits or to investigate a failure. Report
  failures accurately; preserve unrelated user changes and commit only task files.
