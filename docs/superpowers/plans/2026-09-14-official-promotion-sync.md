# Official promotion sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import, review, and display current promotion data only from registered official franchise sources.

**Architecture:** A daily Cron worker fetches source adapters into candidates. Validation determines whether a candidate may be published; ambiguous or altered records require review. Public map/list reads receive only currently verified promotion data and source timestamps.

**Tech Stack:** Next.js 15, TypeScript, Cloudflare Cron, D1, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-14-live-map-and-promotion-sync-design.md`

## Global Constraints

- Fetch only URLs in the enabled official source registry.
- Never publish a candidate without a source URL, brand, benefit/title, start/end date, and scope.
- Preserve an unexpired last-verified promotion during a source failure and disclose its verification time.
- Community posts never feed the promotion fact pipeline.

---

### Task 1: Create promotion provenance and validation

**Files:**
- Create: `migrations/0003_promotions.sql`
- Create: `src/features/promotions/types.ts`
- Create: `src/features/promotions/validate.ts`
- Create: `tests/promotions/validate.test.ts`

**Interfaces:**
- Produces `PromotionCandidate`, `PublishedPromotion`, and `validateCandidate(candidate, now)`.

- [ ] **Step 1: Write failing validation tests.**

```ts
test("rejects an official-looking candidate with no end date", () => {
  assert.match(validateCandidate({ ...candidate, endAt: null }, now)!, /종료일/);
});
test("accepts a brand-wide current candidate with provenance", () => {
  assert.equal(validateCandidate(candidate, now), null);
});
```

- [ ] **Step 2: Run `pnpm test -- tests/promotions/validate.test.ts` and confirm it fails.**
- [ ] **Step 3: Add source, import-run, candidate, promotion, and review tables.** The promotion table includes `scope` constrained to `brand|region|branch`, `source_url`, `verified_at`, `starts_at`, `ends_at`, `status`, and optional branch/region evidence.
- [ ] **Step 4: Implement validation.** Reject unregistered source ids, blank source URLs, unknown brands, invalid date ranges, expired candidates, and unsupported scopes. Return Korean operational errors that can be shown in the reviewer queue.
- [ ] **Step 5: Run tests, `pnpm typecheck`, and `pnpm lint`; commit `feat: add promotion provenance model`.**

### Task 2: Build the daily import and review gate

**Files:**
- Create: `src/features/promotions/sources.ts`
- Create: `src/features/promotions/importer.ts`
- Create: `src/features/promotions/repository.ts`
- Create: `src/app/api/internal/promotions/import/route.ts`
- Create: `src/app/api/internal/promotions/review/route.ts`
- Create: `tests/promotions/importer.test.ts`

**Interfaces:**
- Produces `runPromotionImport(now)`, `approveCandidate(id, reviewerId)`, and `listLivePromotions(now)`.

- [ ] **Step 1: Write failing fixture tests for a structured official source and a source failure.**

```ts
test("keeps an unexpired verified promotion when its source fetch fails", async () => {
  await runPromotionImport(now, failingOfficialFetch);
  assert.equal((await listLivePromotions(now))[0].status, "verified");
});
```

- [ ] **Step 2: Run `pnpm test -- tests/promotions/importer.test.ts` and confirm it fails.**
- [ ] **Step 3: Register official Starbucks, McDonald's, Olive Young, Gong cha, BBQ, Paris Baguette, CU, Domino's, A Twosome Place, and GS25 list URLs.** Each adapter returns candidates plus parser confidence; it stores raw provenance metadata with the import run rather than publishing text directly.
- [ ] **Step 4: Implement import state transitions.** Create an import run, fetch each enabled source, upsert candidates by source item identity, auto-publish only fully valid high-confidence items, and leave changed/ambiguous items pending review. Expire verified entries only after their end date.
- [ ] **Step 5: Require administrative authorization for import/review routes; run tests, `pnpm typecheck`, and `pnpm lint`; commit `feat: add reviewed daily promotion import`.**

### Task 3: Render verified promotions with live branches

**Files:**
- Create: `src/app/api/promotions/route.ts`
- Modify: `src/features/dealmap/data.ts`
- Modify: `src/features/dealmap/detail.tsx`
- Modify: `src/features/dealmap/app.tsx`
- Modify: `src/features/dealmap/map.tsx`
- Create: `tests/promotions/presentation.test.ts`

**Interfaces:**
- Consumes `listLivePromotions(now)` and uses `scope` to associate records with branches.
- Produces detail-view source and **마지막 확인** rendering.

- [ ] **Step 1: Write failing presenter tests.**

```ts
test("does not attach a branch-scoped promotion to a different branch", () => {
  assert.deepEqual(promotionsForBranch("branch-b", [branchScopedForA]), []);
});
```

- [ ] **Step 2: Run `pnpm test -- tests/promotions/presentation.test.ts` and confirm it fails.**
- [ ] **Step 3: Implement public promotion reads.** Return only verified, non-expired records. Associate `brand` records with that brand's live branches, apply `region` only with matching source evidence, and require exact branch evidence for `branch`.
- [ ] **Step 4: Replace static promotion facts in list/detail views with the public response.** Show D-day from `ends_at`, official source link, **마지막 확인**, and scope copy. Keep sample data only as an explicit offline-development fallback.
- [ ] **Step 5: Run `pnpm test`, `pnpm typecheck`, `pnpm lint`, and a manual review of source links; commit `feat: show verified live promotions`.**
