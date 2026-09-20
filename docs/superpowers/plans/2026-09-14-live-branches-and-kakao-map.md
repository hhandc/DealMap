# Live branches and Kakao map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace DealMap's static map and sample branch coordinates with live, filterable nearby franchise branches from Kakao.

**Architecture:** Move the static Next export to a Cloudflare-compatible server runtime. A server route owns the Kakao REST call, normalizes provider records, and returns a short-lived cached branch set. A client-only Kakao map receives that set and stays synchronized with the existing Zustand filter state.

**Tech Stack:** Next.js 15, React 19, TypeScript, Zustand, Kakao Maps JavaScript SDK, Kakao Local REST API, Cloudflare Workers/D1, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-14-live-map-and-promotion-sync-design.md`

## Global Constraints

- Never expose `KAKAO_REST_API_KEY` in a client bundle, response, log, or public environment variable.
- Ask for browser geolocation only after the user activates **내 위치 사용**.
- Limit nearby search to 2 km and use an explicit **이 지역 재검색** after map movement.
- Keep Korean UI copy, semantic color tokens, and shared map/list filter state.
- `pnpm test`, `pnpm typecheck`, and `pnpm lint` must pass before each task commit.

---

### Task 1: Establish the server runtime and branch domain contract

**Files:**
- Modify: `next.config.ts`
- Modify: `.openai/hosting.json`
- Create: `wrangler.jsonc`
- Create: `.env.template`
- Create: `src/features/branches/types.ts`
- Create: `src/features/branches/brands.ts`
- Create: `tests/branches/brands.test.ts`

**Interfaces:**
- Produces `BrandDefinition`, `NearbyBranch`, `NearbyBranchQuery`, and `normalizeBrandPlace()` for Tasks 2 and 3.

- [ ] **Step 1: Write the failing brand-normalization tests.**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { normalizeBrandPlace } from "../../src/features/branches/brands.ts";

test("normalizes Kakao aliases and rejects an unrelated result", () => {
  assert.equal(normalizeBrandPlace("starbucks", "스타벅스 강남역점")?.brandId, "starbucks");
  assert.equal(normalizeBrandPlace("mcdonalds", "버거킹 강남점"), null);
});
```

- [ ] **Step 2: Run `pnpm test -- tests/branches/brands.test.ts` and confirm it fails because the module is absent.**
- [ ] **Step 3: Define the contract and registry.**

```ts
export interface NearbyBranch { id: string; brandId: string; name: string; address: string; lat: number; lng: number; distanceM: number | null; }
export interface NearbyBranchQuery { lat: number; lng: number; radiusM: 2000; categories: string[]; query: string; }
export const brands = [{ id: "starbucks", category: "카페", aliases: ["스타벅스", "Starbucks"] }] as const;
```

Validate finite Korean coordinates, require latitude -90..90 and longitude -180..180, and reject a result whose normalized name does not start with the chosen brand alias.

- [ ] **Step 4: Configure the server-capable target.** Remove `output: "export"`; add Worker, D1, Cron, and secret binding names to `wrangler.jsonc`; list empty `KAKAO_JAVASCRIPT_KEY=` and `KAKAO_REST_API_KEY=` entries in `.env.template`. Preserve the existing static hosting config only until the Worker deployment adapter replaces it.
- [ ] **Step 5: Run `pnpm test -- tests/branches/brands.test.ts`, `pnpm typecheck`, and `pnpm lint`; commit `feat: add live branch domain contract`.**

### Task 2: Implement and secure nearby-branch retrieval

**Files:**
- Create: `src/features/branches/kakao-server.ts`
- Create: `src/features/branches/service.ts`
- Create: `src/app/api/branches/nearby/route.ts`
- Create: `tests/branches/service.test.ts`

**Interfaces:**
- Consumes `NearbyBranchQuery`, `NearbyBranch`, and `brands` from Task 1.
- Produces `searchNearbyBranches(query, env): Promise<NearbyBranch[]>` and `GET /api/branches/nearby`.

- [ ] **Step 1: Write failing service tests with a mocked `fetch`.**

```ts
test("deduplicates a branch returned by two aliases", async () => {
  const rows = await searchNearbyBranches(query, { kakaoKey: "test", fetch: fakeFetch });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, "스타벅스 강남역점");
});
```

- [ ] **Step 2: Run `pnpm test -- tests/branches/service.test.ts` and confirm it fails.**
- [ ] **Step 3: Implement the adapter.** Call `https://dapi.kakao.com/v2/local/search/keyword.json` with an `Authorization: KakaoAK <secret>` header, `x`, `y`, `radius=2000`, and `sort=distance`. Map only provider id, place name, road/lot address, x/y, and distance. Deduplicate by provider id, then brand id plus normalized address. Cache results for five minutes by rounded 0.01-degree cell, query, and categories.
- [ ] **Step 4: Implement the route.** Parse query parameters, return 400 for invalid coordinates/radius/filter values, return 429 through the selected rate limiter, and map provider failure to `{ code: "PROVIDER_UNAVAILABLE" }` with HTTP 503. Do not include the upstream request or secret in any response.
- [ ] **Step 5: Run the task tests, `pnpm typecheck`, and `pnpm lint`; commit `feat: add protected nearby branch API`.**

### Task 3: Replace the static map and synchronize live results

**Files:**
- Modify: `src/features/dealmap/store.ts`
- Modify: `src/features/dealmap/actions.ts`
- Modify: `src/features/dealmap/app.tsx`
- Replace: `src/features/dealmap/map.tsx`
- Create: `src/features/branches/use-nearby-branches.ts`
- Create: `tests/branches/location-state.test.ts`

**Interfaces:**
- Consumes `GET /api/branches/nearby` and `NearbyBranch` from Task 2.
- Produces store fields `mapCenter`, `pendingCenter`, `locationStatus`, `branches`, and `branchError`.

- [ ] **Step 1: Write failing pure-action tests.**

```ts
test("a denied location request keeps address search available", () => {
  DealActions.locationDenied();
  assert.equal(useDealStore.getState().locationStatus, "denied");
  assert.equal(useDealStore.getState().mapCenter, null);
});
```

- [ ] **Step 2: Run `pnpm test -- tests/branches/location-state.test.ts` and confirm it fails.**
- [ ] **Step 3: Implement map state and actions.** `requestLocation()` calls `navigator.geolocation.getCurrentPosition` only from a button click. `setMapViewport()` updates `pendingCenter`; `refreshSearchArea()` fetches only after the user asks. Address search sets `mapCenter` from the Kakao geocoder result and calls the same refresh action.
- [ ] **Step 4: Implement the client map.** Load the Kakao JavaScript SDK in a client component, create brand-colored custom overlays from `branches`, show a separate current-location marker, and keep pin/card selection in `selected`. Remove `MapDrawing` and all use of `Deal.x`/`Deal.y`. Render loading, no-results, provider-error, and denied-location Korean copy.
- [ ] **Step 5: Run `pnpm test`, `pnpm typecheck`, `pnpm lint`, and a browser smoke test with an API mock; commit `feat: show live nearby branches on Kakao map`.**
