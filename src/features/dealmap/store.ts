import { create } from "zustand";
import type { Category } from "./data";
import type { Sort, Reward } from "./model";
export type Modal = "login" | "wallet" | "add" | null;
export interface DealState {
  category: Category;
  query: string;
  sort: Sort;
  favorites: string[];
  urgent: boolean;
  onlySaved: boolean;
  selected: string | null;
  modal: Modal;
  profile: string | null;
  rewards: Reward[];
  ready: boolean;
  storageError: boolean;
  addBrand: string;
  editingId: string | null;
}
export const useDealStore = create<DealState>(() => ({
  category: "전체",
  query: "",
  sort: "nearest",
  favorites: [],
  urgent: false,
  onlySaved: false,
  selected: null,
  modal: null,
  profile: null,
  rewards: [],
  ready: false,
  storageError: false,
  addBrand: "",
  editingId: null,
}));
