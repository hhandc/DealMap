import { test } from "node:test";
import assert from "node:assert/strict";
import { NearbySearchCache } from "../src/features/dealmap/nearby-cache.ts";

test("reuses a recent search for the same nearby location and brands", () => {
  const cache = new NearbySearchCache<string>();
  cache.store(
    { lat: 37.4979, lng: 127.0276 },
    ["starbucks", "bbq"],
    ["스타벅스 강남역점", "BBQ 역삼점"],
    0,
  );

  assert.deepEqual(
    cache.read({ lat: 37.4981, lng: 127.0278 }, ["bbq", "starbucks"], 9 * 60 * 1000),
    ["스타벅스 강남역점", "BBQ 역삼점"],
  );
});

test("does not reuse a search after ten minutes or outside its area", () => {
  const cache = new NearbySearchCache<string>();
  cache.store({ lat: 37.4979, lng: 127.0276 }, ["starbucks"], ["스타벅스 강남역점"], 0);

  assert.equal(cache.read({ lat: 37.4979, lng: 127.0276 }, ["starbucks"], 10 * 60 * 1000), null);
  assert.equal(cache.read({ lat: 37.504, lng: 127.0276 }, ["starbucks"], 60 * 1000), null);
});
