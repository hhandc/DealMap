import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { DealActions } from "../src/features/dealmap/actions.ts";
import { useDealStore } from "../src/features/dealmap/store.ts";

const storage = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => storage.get(key) || null,
    setItem: (key: string, value: string) => storage.set(key, value),
  },
  configurable: true,
});
beforeEach(() => {
  storage.clear();
  useDealStore.setState({
    favorites: [],
    rewards: [],
    profile: null,
    ready: false,
    storageError: false,
    editingId: null,
    modal: null,
    selected: null,
  });
});
test("personal coupon creation, editing and use status survive hydration", () => {
  DealActions.startAdd("CU");
  assert.equal(
    DealActions.saveReward({
      brand: " CU ",
      title: "음료 1+1",
      kind: "coupon",
      expires: "2027-01-01",
      count: 0,
      target: 10,
    }),
    null,
  );
  const id = useDealStore.getState().rewards[0].id;
  DealActions.startEdit(id);
  DealActions.saveReward({
    brand: "CU",
    title: "음료 2+1",
    kind: "coupon",
    expires: "2027-01-01",
    count: 0,
    target: 10,
  });
  DealActions.toggleUsed(id);
  useDealStore.setState({ rewards: [], ready: false });
  DealActions.hydrate();
  const saved = useDealStore.getState().rewards;
  assert.equal(saved.length, 1);
  assert.equal(saved[0].title, "음료 2+1");
  assert.equal(saved[0].used, true);
  DealActions.deleteReward(id);
  assert.equal(useDealStore.getState().rewards.length, 0);
});
test("stamp adjustments stop at zero and target", () => {
  DealActions.saveReward({
    brand: "카페",
    title: "커피 무료",
    kind: "stamp",
    expires: "",
    count: 9,
    target: 10,
  });
  const id = useDealStore.getState().rewards[0].id;
  DealActions.adjustStamp(id, 3);
  assert.equal(useDealStore.getState().rewards[0].count, 10);
  DealActions.adjustStamp(id, -15);
  assert.equal(useDealStore.getState().rewards[0].count, 0);
  DealActions.adjustStamp(id, NaN);
  assert.equal(useDealStore.getState().rewards[0].count, 0);
});
test("invalid records and invalid favorite IDs never enter state", () => {
  assert.ok(
    DealActions.saveReward({
      brand: "",
      title: "할인",
      kind: "coupon",
      expires: "nonsense",
      count: 0,
      target: 10,
    }),
  );
  DealActions.toggleFavorite("nonexistent");
  assert.equal(useDealStore.getState().rewards.length, 0);
  assert.deepEqual(useDealStore.getState().favorites, []);
});
test("damaged storage cannot crash hydration; known favorites restore", () => {
  storage.set(
    "dealmap-device-v1",
    JSON.stringify({
      favorites: ["starbucks", "unknown"],
      rewards: [null, { id: "bad" }],
      profile: "테스트",
    }),
  );
  DealActions.hydrate();
  assert.deepEqual(useDealStore.getState().favorites, ["starbucks"]);
  assert.deepEqual(useDealStore.getState().rewards, []);
  storage.set("dealmap-device-v1", "broken json");
  useDealStore.setState({ ready: false });
  assert.doesNotThrow(() => DealActions.hydrate());
  assert.equal(useDealStore.getState().storageError, true);
});
