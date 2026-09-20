# DealMap approved design

Korean desktop-first nearby-franchise deals app. The user approved the design in conversation on 2026-09-11. Build a Next.js 15 / React 19 client-side prototype with realistic, explicitly labeled sample promotions. Use a 1:2 feed-to-map ratio, a slim navigation rail, universal search, category chips, and a responsive map-first mobile view. Ivory, navy, coral and lavender define the theme.

The interactive stylized Gangnam map supports drag, zoom, recenter, and brand pin selection. The same derived result set powers cards and pins. Search matches Korean/English brand names and menu keywords. Categories, nearest/expiry/favorites ordering, and saved-deals mode combine predictably. Detail dialogs contain benefits, period, cautions, official brand links, expandable coupons, stamps and favorites.

Demo login is explicitly a device-local profile, not authentication. Guests see sample reward records. Users can add, use and delete their own coupons and adjust stamp counts, persisted on this device. Do not present local records as synchronized franchise data. Handle empty search, invalid input, storage failure and missing geolocation permission. Current location on the illustrative map is explicitly a demo location.

Use Zustand serializable state and singleton DealActions. Radix provides accessible dialog and collapsible primitives. Promotion data, map component, management form, and theme are separate units. Verify domain selectors and record validation, then lint, typecheck and production build. Sites static hosting may publish the finished prototype privately.
