import { test } from "node:test";
import assert from "node:assert/strict";
import { shouldRefreshNearbySearch } from "../src/features/dealmap/location-tracking.ts";

test("starts a nearby search for the first granted location", () => {
  assert.equal(shouldRefreshNearbySearch(null, { lat: 37.4979, lng: 127.0276 }, 0), true);
});

test("refreshes only after ninety seconds and a meaningful move", () => {
  const last = { lat: 37.4979, lng: 127.0276, searchedAt: 0 };

  assert.equal(shouldRefreshNearbySearch(last, { lat: 37.504, lng: 127.0276 }, 89_999), false);
  assert.equal(shouldRefreshNearbySearch(last, { lat: 37.4985, lng: 127.0276 }, 90_000), false);
  assert.equal(shouldRefreshNearbySearch(last, { lat: 37.504, lng: 127.0276 }, 90_000), true);
});
