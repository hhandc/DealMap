# DealMap
DealMap is a Korean, map-first franchise deal finder for students and office workers. It brings nearby promotions, discounts, and reward progress into one calm interface so people can decide where to go before they leave.

## What it does

- Loads a live Kakao Map and searches nearby franchise branches around the user’s location.
- Starts with a closer neighborhood view while keeping a 3 km nearby-store search radius.
- Refreshes location-aware pins after a meaningful move and a 90-second interval, with a ten-minute cache for the same area.
- Filters deals and map results together by café, burger, chicken, pizza, convenience store, bakery, and beauty categories.
- Shows brand-colored pins, urgency badges, promotion details, conditions, favorites, and official links.
- Supports a device-local demo login and manual coupon/stamp records, including stamp progress toward a reward.
- Includes responsive layouts for desktop and mobile.

Promotion benefits and dates are sample data for the prototype. Store locations come from Kakao’s Places search when the Kakao Map JavaScript SDK is available.

## Tech stack

- Next.js 15 App Router with React 19 and TypeScript strict mode
- Tailwind CSS v4, Zustand, Radix UI, lucide-react, and sonner
- Kakao Maps JavaScript SDK with Places keyword search
- Static export to `out/` for simple hosting

## Run locally

```bash
pnpm install
pnpm dev
```

Open [http://localhost:4399](http://localhost:4399).

Use these checks before sharing a build:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`pnpm build` creates the deployable static site in `out/`.

## Deploy the static build

The simplest competition demo is to upload `out/` to a static host such as [Netlify Drop](https://app.netlify.com/drop). Netlify will provide a public HTTPS URL under `netlify.app`. Cloudflare Pages and Vercel provide equivalent free project URLs. Add the final HTTPS origin to the Kakao JavaScript SDK domain list before testing location search.

## Kakao Maps setup

The app reads `NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY` when it is present and falls back to the prototype key used for local demonstration. For a real deployment, set the environment variable in the hosting provider instead of relying on the fallback.

In Kakao Developers:

1. Turn on Kakao Map under the app’s API usage settings.
2. Add each site origin to the JavaScript SDK domain list, including `http://localhost:4399` and the final hosted URL.
3. Use the JavaScript key for the browser SDK. REST and native-app keys are for different platforms.

The browser asks for location permission. If permission is denied, DealMap keeps its Gangnam demonstration center and allows a later retry.

## Data and privacy boundaries

- Promotion content, dates, conditions, and sample rewards are illustrative.
- Login is a device-local demo; it does not authenticate an account or sync across devices.
- Favorites, manual stamps, and coupon records are stored in browser `localStorage`.
- Location is used in the current browser session to center the map and query nearby branches. It is not persisted by DealMap.
- Official promotion buttons lead to brand pages; they do not claim to redeem sample promotions.

## Project layout

```text
src/app/                       App Router entry point
src/features/dealmap/          Deal data, map, state, actions, and reward UI
src/components/ui/             Accessible Radix-based primitives
src/styles/                    Theme tokens and responsive application styles
tests/                         Node tests for selectors, records, caching, and location refresh rules
```

## License

This repository is a competition prototype. Brand names and sample promotion content belong to their respective owners.
