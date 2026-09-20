import { toast } from "sonner";
import { useDealStore, type Modal } from "./store.ts";
import { deals, categories, type Category } from "./data.ts";
import {
  validateReward,
  type RewardDraft,
  type Reward,
  type Sort,
} from "./model.ts";
const STORAGE_KEY = "dealmap-device-v1";
function persist() {
  const { favorites, rewards, profile } = useDealStore.getState();
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ favorites, rewards, profile }),
    );
    useDealStore.setState({ storageError: false });
  } catch {
    useDealStore.setState({ storageError: true });
    toast.error(
      "이 브라우저에 저장하지 못했어요. 현재 창에서는 계속 사용할 수 있어요.",
    );
  }
}
export const DealActions = {
  hydrate() {
    if (useDealStore.getState().ready) return;
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (data && typeof data === "object") {
        const favorites = Array.isArray(data.favorites)
          ? data.favorites.filter(
              (id: unknown) =>
                typeof id === "string" && deals.some((d) => d.id === id),
            )
          : [];
        const rewards = Array.isArray(data.rewards)
          ? data.rewards.filter(
              (r: Reward) =>
                r &&
                typeof r.id === "string" &&
                typeof r.used === "boolean" &&
                typeof r.brand === "string" &&
                typeof r.title === "string" &&
                typeof r.expires === "string" &&
                !validateReward(r),
            )
          : [];
        useDealStore.setState({
          favorites,
          rewards,
          profile:
            typeof data.profile === "string" ? data.profile.slice(0, 20) : null,
        });
      }
    } catch {
      useDealStore.setState({ storageError: true });
    }
    useDealStore.setState({ ready: true });
  },
  setQuery(query: string) {
    useDealStore.setState({ query });
  },
  setCategory(category: Category) {
    if (categories.includes(category)) useDealStore.setState({ category });
  },
  setSort(sort: Sort) {
    useDealStore.setState({ sort });
  },
  toggleUrgent() {
    useDealStore.setState((s) => ({ urgent: !s.urgent }));
  },
  showSaved() {
    useDealStore.setState({ onlySaved: true, sort: "nearest" });
  },
  resetFilters() {
    useDealStore.setState({
      category: "전체",
      query: "",
      sort: "nearest",
      urgent: false,
      onlySaved: false,
    });
  },
  toggleFavorite(id: string) {
    if (!deals.some((d) => d.id === id)) return;
    const saved = useDealStore.getState().favorites.includes(id);
    useDealStore.setState((s) => ({
      favorites: saved
        ? s.favorites.filter((f) => f !== id)
        : [...s.favorites, id],
    }));
    persist();
    toast(saved ? "찜한 혜택에서 삭제했어요." : "찜한 혜택에 저장했어요.", {
      duration: 1800,
    });
  },
  select(id: string | null) {
    if (id === null || deals.some((d) => d.id === id))
      useDealStore.setState({ selected: id, modal: null });
  },
  open(modal: Modal) {
    useDealStore.setState({ modal, selected: null, editingId: null });
  },
  startAdd(brand = "") {
    useDealStore.setState({
      modal: "add",
      selected: null,
      addBrand: brand,
      editingId: null,
    });
  },
  startEdit(id: string) {
    const record = useDealStore.getState().rewards.find((r) => r.id === id);
    if (record)
      useDealStore.setState({
        modal: "add",
        selected: null,
        addBrand: record.brand,
        editingId: id,
      });
  },
  login(name: string) {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 20) return false;
    useDealStore.setState({ profile: trimmed, modal: "wallet" });
    persist();
    toast.success(`${trimmed}님, 나만의 혜택을 기록해 보세요.`);
    return true;
  },
  logout() {
    useDealStore.setState({ profile: null, modal: null });
    persist();
    toast("데모 프로필에서 로그아웃했어요. 기록은 이 기기에 남아 있어요.");
  },
  saveReward(draft: RewardDraft) {
    const error = validateReward(draft);
    if (error) return error;
    const { editingId } = useDealStore.getState();
    if (
      editingId &&
      !useDealStore.getState().rewards.some((r) => r.id === editingId)
    )
      return "수정할 기록을 찾을 수 없어요.";
    const normalized = {
      ...draft,
      brand: draft.brand.trim(),
      title: draft.title.trim(),
    };
    useDealStore.setState((s) => ({
      rewards: editingId
        ? s.rewards.map((r) =>
            r.id === editingId ? { ...r, ...normalized } : r,
          )
        : [
            ...s.rewards,
            { ...normalized, id: crypto.randomUUID(), used: false },
          ],
      modal: "wallet",
      editingId: null,
    }));
    persist();
    toast.success(editingId ? "기록을 수정했어요." : "내 혜택을 추가했어요.");
    return null;
  },
  toggleUsed(id: string) {
    useDealStore.setState((s) => ({
      rewards: s.rewards.map((r) =>
        r.id === id && r.kind === "coupon" ? { ...r, used: !r.used } : r,
      ),
    }));
    persist();
  },
  adjustStamp(id: string, delta: number) {
    if (!Number.isInteger(delta)) return;
    useDealStore.setState((s) => ({
      rewards: s.rewards.map((r) =>
        r.id === id && r.kind === "stamp"
          ? { ...r, count: Math.max(0, Math.min(r.target, r.count + delta)) }
          : r,
      ),
    }));
    persist();
  },
  deleteReward(id: string) {
    const old = useDealStore.getState().rewards.find((r) => r.id === id);
    if (!old) return;
    useDealStore.setState((s) => ({
      rewards: s.rewards.filter((r) => r.id !== id),
    }));
    persist();
    toast("기록을 삭제했어요.", {
      action: {
        label: "되돌리기",
        onClick: () => {
          useDealStore.setState((s) => ({
            rewards: s.rewards.some((r) => r.id === old.id)
              ? s.rewards
              : [...s.rewards, old],
          }));
          persist();
        },
      },
    });
  },
};
