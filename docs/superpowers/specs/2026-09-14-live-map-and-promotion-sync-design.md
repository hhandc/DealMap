# DealMap live map and promotion sync design

**Status:** proposed for review  
**Date:** 2026-09-14  
**Owner:** DealMap

## Purpose

Evolve the current DealMap prototype into a service that shows nearby Korean franchise branches on a live map and pairs them with promotions verified from official franchise sources. The product remains Korean-first and desktop-first, while retaining the responsive mobile layout.

The first release covers the brands already represented in the prototype: Starbucks, McDonald's, BBQ, Paris Baguette, CU, Olive Young, Gong cha, Domino's, A Twosome Place, and GS25.

## Product behavior

1. DealMap initially opens over a neutral South Korea map extent. It does not request the user's location automatically.
2. Selecting **내 위치 사용** requests browser location permission. On success, the map centers on the user and searches supported franchise branches within 2 km.
3. If permission is denied or unavailable, the user can search an address, subway station, or neighborhood, then run the same nearby search.
4. The map and event list are driven from the same branch result set. Selecting a category, searching a brand/menu, or changing the search area updates both together.
5. Selecting a branch pin or event card opens its detail view. A promotion is shown at a branch only when it applies to that brand generally or the official source explicitly names that branch or area.
6. Officially verified, soon-ending promotions receive the existing D-day treatment. The detail view includes source, last verified time, period, eligibility, cautions, and the official event-page link.
7. Stamp data stays clearly labelled as the user's sample or personally tracked record until authenticated account syncing is introduced. Coupon tracking is deferred.

## Map and nearby-branch provider

DealMap uses Kakao as the map and nearby-place provider.

- The browser loads the Kakao Maps JavaScript SDK for map rendering, pins, and client interactions.
- A server-side branch-search endpoint uses the Kakao Local REST API for the canonical nearby result. It makes brand-specific keyword searches around a coordinate, with a 2 km radius and distance sort, then normalizes and deduplicates the results.
- This approach is chosen over Naver for nearby discovery because Kakao's documented keyword-place search accepts a center coordinate, radius, and distance sorting. Naver Local Search is useful for text search but does not provide the same documented coordinate/radius/distance query for this use case.
- The Kakao JavaScript key is domain-restricted and may be public in the browser. The Kakao REST key is server-only, held in runtime secrets, and is never sent to the client, emitted in logs, or placed in build-time public variables.

The first map integration replaces the current static SVG drawing with a client-only Kakao map component. It preserves DealMap's custom brand-colored pins, selected-branch state, urgent badges, and synchronized card selection.

## Branch search and normalization

The service maintains a versioned brand registry. Each brand defines its display name, category, brand color, Kakao keyword aliases, and a branch-name normalizer. For example, McDonald's searches use both `맥도날드` and `McDonald's`; Paris Baguette uses `파리바게뜨` and `Paris Baguette`.

For every requested map area, the server searches each supported brand, normalizes the returned place name and coordinates, and removes duplicate branch records. The response contains only the data needed by the map and list: provider place id, brand id, branch name, address, coordinates, distance, phone number when supplied, and category. It is cached briefly by rounded map cell and filter set to control provider calls.

Changing the map viewport does not continuously query places while the user drags. DealMap refreshes after an explicit **이 지역 재검색** action, an address search, a category/search change, or the initial successful location lookup.

## Promotion sourcing

Promotion data uses a hybrid official-source pipeline.

- A source registry records official event/list URLs, the responsible brand, fetch strategy, and parser adapter.
- Daily scheduled work fetches only registered official franchise sources. It creates an import run and candidate records rather than publishing scraped text directly.
- Structured sources may be automatically parsed into a candidate with title, benefit, period, source URL, eligibility, scope, and parser confidence.
- Candidates with an unambiguous current period and required fields can be published automatically. Ambiguous, incomplete, changed, or failed parses enter the review queue.
- A reviewer can edit, approve, reject, suspend, or expire a candidate. Approval records the source URL and verification time.
- Published promotions retain a source URL and a last-verified timestamp. A failed source refresh does not delete the last verified promotion before its known end date; the UI displays its verification time. Promotions past their end date are removed from live results until verified again.

No source is treated as authoritative merely because it appears in a search result, community post, or third-party coupon site. Community tips remain user-generated content and never determine the live promotion facts.

## Data model

The server-backed deployment adds a D1 database and a daily Cron trigger. Core tables are:

| Table | Purpose |
| --- | --- |
| `brands` | Registry of supported franchise brands and categories. |
| `promotion_sources` | Official source URL, fetch/parser configuration, and enabled status. |
| `promotion_import_runs` | Daily fetch status, timestamps, source response metadata, and errors. |
| `promotion_candidates` | Parsed items awaiting automation or review, including raw provenance and confidence. |
| `promotions` | Approved live promotions: benefit, dates, eligibility, cautions, scope, source URL, and verified time. |
| `promotion_reviews` | Immutable approval, edit, rejection, and suspension history. |

Nearby branches are fetched from Kakao when needed and cached; they are not treated as a permanent, user-owned directory. A future branch table is appropriate only when the product needs editorial branch overrides or source-confirmed branch-specific promotions.

Promotion scope has three explicit values: `brand`, `region`, and `branch`. Brand-wide promotions may appear at every returned branch for that brand. Region and branch scopes require corresponding source evidence. The UI never implies branch availability when the promotion scope is unknown.

## API boundary

The browser communicates only with DealMap endpoints:

- `GET /api/branches/nearby?lat=&lng=&radius=&categories=&query=` returns normalized live branches and applicable, verified promotions.
- `GET /api/promotions` returns verified promotions for list/filter views, with source metadata appropriate for display.
- Scheduled import and review endpoints require server-side authorization and are never callable through a public browser key.

Endpoints validate coordinate ranges, cap radius to the supported product limit, validate filters against the brand registry, rate-limit anonymous requests, and return a clear fallback state when Kakao is unavailable. No precise user location is stored in D1. Request logging omits raw coordinates or rounds them to a non-identifying operational cell.

## Accounts and manual stamp tracking

DealMap uses passwordless email magic links for accounts. A user enters an email address, receives a time-limited single-use link, and returns to a signed-in session. Magic-link tokens are stored only as hashes, expire after 15 minutes, and are invalidated after use. Sessions use secure, HTTP-only cookies.

The account feature initially stores only user profiles, favorites, and manual stamp cards. A stamp card has a brand, current count, goal count, reward description, optional expiry date, and timestamps. For example, a user can record **20 / 20 스탬프 · 무료 음료 1잔**. The app calculates progress and highlights a reward that has reached its goal.

The authenticated schema adds `users`, `sessions`, `magic_link_tokens`, `user_favorites`, and `user_stamp_cards`. Every read and mutation is scoped to the authenticated user id. A first successful login can offer a one-time import of the prototype's local favorites and stamp records, then clears only the migrated records after confirmation.

Coupon tracking is explicitly out of scope. DealMap will not provide coupon fields, upload controls, coupon APIs, or coupon database tables until a user-approved low-friction capture flow is designed.

## UI changes

The desktop layout remains a list beside a two-thirds map. The live component adds:

- an explicit location action and location-permission fallback copy;
- a search-area refresh control after map movement;
- live loading, empty, provider-error, and stale-verification states;
- map pins created from provider branches, using the product's brand colors;
- source and **마지막 확인** information in details;
- scope copy such as **전국 매장 대상** or **일부 매장 대상**, only when confirmed;
- local stamp controls until sign-in, then cloud-synced stamp cards, with no claim that they are synchronized with franchise accounts;
- no coupon controls or coupon storage.

On mobile, the map remains above the horizontal/scrollable deal list. The same live branch and promotion response drives both layouts.

## Deployment and configuration

The current project is statically exported, which cannot keep the Kakao REST key secret or execute daily imports. The live release moves DealMap to a server-capable deployment with an edge/server runtime, D1 binding, and Cron trigger. The hosting configuration and Next.js output mode are updated as part of implementation after confirming the target runtime's supported Next.js adapter.

Required secrets and configuration are:

- `KAKAO_JAVASCRIPT_KEY` — domain-restricted client map key;
- `KAKAO_REST_API_KEY` — server secret for nearby search;
- database binding and migration configuration;
- import/review endpoint authorization;
- source-registry configuration.

Production source credentials are placed in the host secret store. Local development uses `.env.local`, excluded from version control. An `.env.template` lists names only.

## Reliability and privacy rules

- Location permission is user initiated, and a denied permission never blocks address-based discovery.
- A Kakao failure leaves the map usable and tells the user that nearby branches could not be refreshed; it does not fabricate live results.
- A promotion parser failure creates an operational record and review candidate rather than silently publishing a guessed deal.
- Daily sync is the initial freshness target. A manually triggered administrative refresh may be added later with the same validation path.
- User-created favorites and stamp counts stay in local storage until sign-in. After account sync ships, they are stored only for that account and are never included in promotion imports or review records.

## Testing and acceptance criteria

Implementation is complete when:

1. A browser user can grant location permission and see live Kakao branch results for supported franchises within the selected radius.
2. Denying location permission still supports neighborhood/address search and shows a usable result.
3. Category and text filters update the branch pins and event cards from one shared state.
4. A valid Kakao REST key is used only by server code; client bundles and endpoint responses contain no REST secret.
5. Branch normalization tests cover aliases, duplicate provider results, coordinate validation, and category filtering.
6. Promotion import tests cover official-source provenance, parser fixtures, expired entries, source failures, review gating, and brand/region/branch scope.
7. Account tests cover expired and consumed magic links, session authorization, account-level data isolation, stamp progress, and one-time local-data migration.
8. UI tests cover location failure, loading/empty/provider-error states, selected pin/card synchronization, D-day badges, official-source links, and manual stamp-card creation/editing.
9. Database migrations and a dry-run import complete successfully before the daily schedule is enabled.

## Non-goals for this release

- Redeeming or reading coupons inside a franchise account.
- User-managed coupon capture, storage, or expiry tracking.
- Scraping private, login-protected, or unregistered sources.
- Turn-by-turn routing or delivery ordering.
- Guaranteed real-time promotion changes between daily imports.
- Nationwide coverage for every Korean franchise beyond the supported brand registry.
