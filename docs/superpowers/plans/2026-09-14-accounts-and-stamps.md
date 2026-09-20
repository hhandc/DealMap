# Accounts and manual stamps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add passwordless email accounts and per-user manual stamp cards, with no coupon feature.

**Architecture:** Cloudflare Worker endpoints issue and consume hashed, single-use magic-link tokens and set secure HTTP-only sessions. D1 scopes favorites and stamp cards by authenticated user id. The existing Zustand layer calls an account repository and imports existing browser records once after sign-in.

**Tech Stack:** Next.js 15, React 19, TypeScript, Zustand, D1, Cloudflare Email Service, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-14-live-map-and-promotion-sync-design.md`

## Global Constraints

- Magic links expire after 15 minutes, are single use, and only their SHA-256 hash is persisted.
- Sessions use `Secure`, `HttpOnly`, `SameSite=Lax` cookies.
- Every favorite and stamp query filters by the authenticated user id.
- Do not create coupon tables, fields, routes, buttons, or copy.

---

### Task 1: Add migrations and authentication primitives

**Files:**
- Create: `migrations/0001_accounts.sql`
- Create: `src/features/account/auth.ts`
- Create: `src/app/api/auth/magic-link/route.ts`
- Create: `src/app/api/auth/callback/route.ts`
- Create: `tests/account/auth.test.ts`

**Interfaces:**
- Produces `createMagicLink(email, now)`, `consumeMagicLink(token, now)`, and `requireSession(request)`.

- [ ] **Step 1: Write the failing token tests.**

```ts
test("cannot consume a token twice or after 15 minutes", async () => {
  const token = await createMagicLink("user@example.com", now);
  assert.ok(await consumeMagicLink(token.raw, now));
  assert.equal(await consumeMagicLink(token.raw, now), null);
  assert.equal(await consumeMagicLink(token.raw, now + 15 * 60_001), null);
});
```

- [ ] **Step 2: Run `pnpm test -- tests/account/auth.test.ts` and confirm it fails.**
- [ ] **Step 3: Add `users`, `sessions`, and `magic_link_tokens` migrations.** Use text UUID primary keys, a unique lower-cased email, `token_hash`, `expires_at`, `consumed_at`, and indexed session/token lookup columns.
- [ ] **Step 4: Implement issuance and callback.** Rate-limit issuance by normalized email and IP bucket. Send the callback URL through the Cloudflare Email binding, hash raw random bytes with Web Crypto SHA-256, create a random session id after a successful consume, and redirect to `/` with the secure cookie.
- [ ] **Step 5: Run tests, `pnpm typecheck`, and `pnpm lint`; commit `feat: add email magic-link authentication`.**

### Task 2: Add authenticated favorites and stamp cards

**Files:**
- Create: `migrations/0002_user_stamps.sql`
- Create: `src/features/stamps/types.ts`
- Create: `src/features/stamps/repository.ts`
- Create: `src/app/api/me/stamps/route.ts`
- Create: `src/app/api/me/stamps/[id]/route.ts`
- Create: `src/app/api/me/favorites/route.ts`
- Create: `tests/stamps/repository.test.ts`

**Interfaces:**
- Produces `StampCard { id, brandId, title, currentCount, goalCount, reward, expiresAt }` and CRUD routes scoped by `requireSession`.

- [ ] **Step 1: Write failing ownership and progress tests.**

```ts
test("a user cannot read another user's stamp card", async () => {
  await stamps.create("user-a", draft);
  assert.deepEqual(await stamps.list("user-b"), []);
});
test("a count cannot exceed its goal", () => assert.equal(clampCount(21, 20), 20));
```

- [ ] **Step 2: Run `pnpm test -- tests/stamps/repository.test.ts` and confirm it fails.**
- [ ] **Step 3: Add the migration and repository.** Create `user_favorites(user_id, deal_id)` and `user_stamp_cards` with `current_count >= 0`, `goal_count BETWEEN 1 AND 50`, optional ISO date, and created/updated timestamps. Use prepared statements exclusively.
- [ ] **Step 4: Add authorized CRUD routes.** Return 401 without a session, 404 for a record outside the session owner, 422 for invalid brand/title/count/goal values, and 204 after delete.
- [ ] **Step 5: Run tests, `pnpm typecheck`, and `pnpm lint`; commit `feat: persist user stamp cards`.**

### Task 3: Convert the wallet to account-backed stamp UI

**Files:**
- Modify: `src/features/dealmap/model.ts`
- Modify: `src/features/dealmap/store.ts`
- Modify: `src/features/dealmap/actions.ts`
- Modify: `src/features/dealmap/rewards.tsx`
- Modify: `src/features/dealmap/detail.tsx`
- Modify: `tests/actions.test.ts`

**Interfaces:**
- Consumes Task 2 `/api/me/stamps` and `StampCard`.
- Produces `DealActions.createStamp`, `updateStamp`, `adjustStamp`, `deleteStamp`, and `importDeviceStampsOnce`.

- [ ] **Step 1: Replace coupon test fixtures with `StampDraft` fixtures and add a one-time migration test.**

```ts
test("imports each legacy stamp once after login", async () => {
  await DealActions.importDeviceStampsOnce();
  await DealActions.importDeviceStampsOnce();
  assert.equal(fetchCalls("/api/me/stamps", "POST"), 1);
});
```

- [ ] **Step 2: Run `pnpm test -- tests/actions.test.ts` and confirm it fails.**
- [ ] **Step 3: Remove `coupon`, `used`, and expiry-only validation paths from `model.ts`, `actions.ts`, and `rewards.tsx`.** Make the wallet title **내 스탬프**, make the add form require brand, goal, current count, and reward description, and preserve manual plus/minus controls.
- [ ] **Step 4: Add a magic-link form and signed-in profile controls.** Before sign-in, explain that device records can be imported once. After sign-in, load server stamps/favorites, show the email/account menu, and offer sign-out. Show API failure without overwriting local unsynced state.
- [ ] **Step 5: Run `pnpm test`, `pnpm typecheck`, `pnpm lint`, and keyboard/screen-reader smoke tests; commit `feat: add account-backed stamp wallet`.**
