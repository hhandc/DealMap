export type Sort = "nearest" | "ending" | "favorites";
export interface FilterOptions {
  query: string;
  category: string;
  sort: Sort;
  favorites: string[];
  onlySaved?: boolean;
  urgent?: boolean;
}
export interface SearchableDeal {
  id: string;
  category: string;
  brand: string;
  english: string;
  title: string;
  distance: number;
  days: number;
}

function normalizeSearch(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\s\p{P}\p{S}]/gu, "");
}

export function filterDeals<T extends SearchableDeal>(
  deals: T[],
  options: FilterOptions,
): T[] {
  const query = normalizeSearch(options.query);
  return deals
    .filter(
      (d) =>
        (options.category === "전체" || d.category === options.category) &&
        (!query ||
          normalizeSearch(`${d.brand}${d.english}${d.title}`).includes(
            query,
          )) &&
        (!(options.onlySaved || options.sort === "favorites") ||
          options.favorites.includes(d.id)) &&
        (!options.urgent || d.days <= 3),
    )
    .sort((a, b) =>
      options.sort === "ending"
        ? a.days - b.days || a.distance - b.distance
        : a.distance - b.distance,
    );
}
export interface RewardDraft {
  brand: string;
  kind: "coupon" | "stamp";
  title: string;
  expires: string;
  count: number;
  target: number;
}
export interface Reward extends RewardDraft {
  id: string;
  used: boolean;
}
export function validateReward(value: RewardDraft): string | null {
  if (!value.brand.trim() || !value.title.trim())
    return "브랜드와 혜택 내용을 입력해 주세요.";
  if (value.brand.length > 40 || value.title.length > 100)
    return "브랜드는 40자, 혜택은 100자 이내로 입력해 주세요.";
  if (value.kind === "stamp") {
    if (
      !Number.isInteger(value.count) ||
      !Number.isInteger(value.target) ||
      value.target < 1 ||
      value.target > 50 ||
      value.count < 0 ||
      value.count > value.target
    )
      return "스탬프는 0개부터 목표 개수까지, 목표는 1~50개로 입력해 주세요.";
  } else if (value.kind === "coupon") {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(value.expires) ||
      Number.isNaN(Date.parse(value.expires)) ||
      new Date(value.expires).toISOString().slice(0, 10) !== value.expires
    )
      return "올바른 쿠폰 만료일을 입력해 주세요.";
  } else return "쿠폰 또는 스탬프를 선택해 주세요.";
  return null;
}
