import { test } from "node:test";
import assert from "node:assert/strict";
import { filterDeals, validateReward } from "../src/features/dealmap/model.ts";

const deals = [
  {
    id: "coffee",
    category: "카페",
    brand: "스타벅스",
    english: "Starbucks",
    title: "아메리카노 한 잔 더",
    distance: 200,
    days: 3,
  },
  {
    id: "burger",
    category: "버거",
    brand: "맥도날드",
    english: "McDonald’s",
    title: "빅맥 세트 할인",
    distance: 350,
    days: 1,
  },
  {
    id: "tea",
    category: "카페",
    brand: "공차",
    english: "Gong cha",
    title: "밀크티 할인",
    distance: 100,
    days: 7,
  },
];
test("search matches English brands and Korean menus while respecting category", () => {
  assert.deepEqual(
    filterDeals(deals, {
      query: "STARBUCKS",
      category: "카페",
      sort: "nearest",
      favorites: [],
    }).map((d) => d.id),
    ["coffee"],
  );
  assert.equal(
    filterDeals(deals, {
      query: "빅맥",
      category: "카페",
      sort: "nearest",
      favorites: [],
    }).length,
    0,
  );
});
test("expiry sorting and favorite filtering share the same result set", () => {
  assert.deepEqual(
    filterDeals(deals, {
      query: "",
      category: "전체",
      sort: "ending",
      favorites: [],
    }).map((d) => d.id),
    ["burger", "coffee", "tea"],
  );
  assert.deepEqual(
    filterDeals(deals, {
      query: "",
      category: "전체",
      sort: "favorites",
      favorites: ["tea", "coffee"],
    }).map((d) => d.id),
    ["tea", "coffee"],
  );
});
test("brand search ignores typographic punctuation and extra spaces", () => {
  assert.deepEqual(
    filterDeals(deals, {
      query: "McDonald's",
      category: "전체",
      sort: "nearest",
      favorites: [],
    }).map((d) => d.id),
    ["burger"],
  );
  assert.deepEqual(
    filterDeals(deals, {
      query: "맥 도 날 드",
      category: "전체",
      sort: "nearest",
      favorites: [],
    }).map((d) => d.id),
    ["burger"],
  );
});
test("reward validation rejects impossible counts and invalid dates", () => {
  assert.ok(
    validateReward({
      brand: "스타벅스",
      kind: "stamp",
      title: "리워드",
      count: 11,
      target: 10,
      expires: "",
    }),
  );
  assert.ok(
    validateReward({
      brand: " ",
      kind: "coupon",
      title: "할인",
      count: 0,
      target: 10,
      expires: "2026-12-01",
    }),
  );
  assert.ok(
    validateReward({
      brand: "CU",
      kind: "coupon",
      title: "할인",
      count: 0,
      target: 10,
      expires: "2026-02-30",
    }),
  );
  assert.equal(
    validateReward({
      brand: "CU",
      kind: "coupon",
      title: "1,000원 할인",
      count: 0,
      target: 10,
      expires: "2026-12-01",
    }),
    null,
  );
});
