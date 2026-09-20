"use client";
import { useEffect, useRef } from "react";
import {
  MapPin,
  Search,
  Heart,
  Ticket,
  UserRound,
  Map,
  ArrowUpRight,
  Coffee,
  UtensilsCrossed,
  Drumstick,
  Pizza,
  Store,
  Croissant,
  Clock,
  ChevronDown,
  Plus,
  Flame,
  Sparkles,
  Info,
  X,
} from "lucide-react";
import Image from "next/image";
import { Toaster } from "sonner";
import { categories, deals, endDate, type Deal } from "./data";
import { Brand } from "./brand";
import { NeighborhoodMap } from "./map";
import { filterDeals, type Sort } from "./model";
import { useDealStore } from "./store";
import { DealActions } from "./actions";
import { Modal } from "~/components/ui/modal";
import { DealDetail } from "./detail";
import { Wallet, RewardForm, Login } from "./rewards";
import { registerDealTools } from "./webmcp";
const icons = [
  Sparkles,
  Coffee,
  UtensilsCrossed,
  Drumstick,
  Pizza,
  Store,
  Croissant,
  Sparkles,
];
export function DealMapApp() {
  const state = useDealStore();
  const {
    category,
    query,
    sort,
    favorites,
    urgent,
    onlySaved,
    modal,
    selected,
    profile,
    storageError,
  } = state;
  const searchRef = useRef<HTMLInputElement>(null);
  const feedRef = useRef<HTMLElement>(null);
  useEffect(() => {
    DealActions.hydrate();
    return registerDealTools();
  }, []);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  useEffect(() => {
    feedRef.current?.scrollTo({ top: 0 });
  }, [category, query, sort, onlySaved, urgent]);
  const results = filterDeals(deals, state);
  const currentDeal = deals.find((d) => d.id === selected);
  const setCategory = DealActions.setCategory,
    setQuery = DealActions.setQuery,
    setSort = DealActions.setSort;
  return (
    <div className="dealmap-app">
      <header className="topbar">
        <button
          className="wordmark"
          onClick={DealActions.resetFilters}
          aria-label="딜맵 홈"
        >
          <span className="logo-mark">
            <MapPin size={24} strokeWidth={2.6} />
          </span>
          deal<span>map</span>
          <i />
        </button>
        <div className="header-divider" />
        <span className="header-tagline">내 주변, 놓치기 아까운 혜택</span>
        <label className="searchbox">
          <Search size={20} />
          <input
            ref={searchRef}
            data-search
            placeholder="어떤 브랜드, 메뉴를 찾으세요?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="브랜드 또는 메뉴 검색"
          />
          {query ? (
            <button onClick={() => setQuery("")} aria-label="검색어 지우기">
              <X size={16} />
            </button>
          ) : (
            <kbd>⌘ K</kbd>
          )}
        </label>
        <button
          className="wallet-header"
          onClick={() => DealActions.open("wallet")}
        >
          <Ticket size={19} />내 쿠폰함
        </button>
        <button
          className="login-button"
          onClick={() => DealActions.open(profile ? "wallet" : "login")}
        >
          <UserRound size={16} />
          {profile ? `${profile}님` : "로그인"}
        </button>
      </header>
      <div className="workspace">
        <nav className="nav-rail" aria-label="메인 메뉴">
          <button
            className={`rail-item ${!onlySaved ? "active" : ""}`}
            onClick={DealActions.resetFilters}
            aria-label="전체 혜택 지도"
          >
            <Map size={23} />
            <span>혜택 지도</span>
          </button>
          <button
            className={`rail-item ${onlySaved ? "active" : ""}`}
            onClick={DealActions.showSaved}
            aria-pressed={onlySaved}
          >
            <Heart size={23} />
            <span>찜한 혜택</span>
            {favorites.length > 0 && <em>{favorites.length}</em>}
          </button>
          <button
            className="rail-item"
            onClick={() => DealActions.open("wallet")}
          >
            <Ticket size={23} />
            <span>내 쿠폰함</span>
          </button>
          <div className="rail-bottom">
            <span className="rail-spark">✦</span>
            <span>
              작은 혜택,
              <br />큰 즐거움
            </span>
          </div>
        </nav>
        <div className="main-workspace">
          <div className="filterbar">
            <div className="categories">
              {categories.map((item, i) => {
                const Icon = icons[i];
                return (
                  <button
                    key={item}
                    className={`category category-${i} ${category === item ? "selected" : ""}`}
                    onClick={() => setCategory(item)}
                    aria-pressed={category === item}
                  >
                    <Icon size={17} />
                    {item}
                  </button>
                );
              })}
            </div>
            <button
              className="filter-extra"
              onClick={() => DealActions.startAdd()}
            >
              <Plus size={16} />내 혜택 추가
            </button>
          </div>
          <main className="discovery">
            <aside className="deal-feed" ref={feedRef}>
              <div className="feed-heading">
                <div className="eyebrow">
                  <span /> 강남역 주변 혜택
                </div>
                <h1>
                  {onlySaved ? (
                    <>
                      찜해 둔 혜택,
                      <br />
                      잊지 말고 즐겨요<span>.</span>
                    </>
                  ) : (
                    <>
                      가까이 있는,
                      <br />
                      기분 좋은 발견<span>.</span>
                    </>
                  )}
                </h1>
                <p>오늘도 똑똑하게, 가볍게 즐겨요.</p>
                <div className="sample-label">
                  <Info size={12} />
                  둘러보기 · 모든 프로모션은 예시입니다
                </div>
                {onlySaved && (
                  <button
                    className="clear-saved"
                    onClick={DealActions.resetFilters}
                  >
                    전체 혜택으로 돌아가기 <X size={12} />
                  </button>
                )}
                {storageError && (
                  <p className="storage-warning" role="status">
                    기기 저장이 제한되어 있어요. 현재 창에서만 기록할 수 있어요.
                  </p>
                )}
              </div>
              <div className="feed-sort">
                <span aria-live="polite">
                  {onlySaved ? "찜한 혜택" : "주변 혜택"}{" "}
                  <b>{results.length}</b>
                </span>
                <label>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as Sort)}
                    aria-label="혜택 정렬"
                  >
                    <option value="nearest">가까운 순</option>
                    <option value="ending">마감 임박순</option>
                    <option value="favorites">찜한 혜택</option>
                  </select>
                  <ChevronDown size={14} />
                </label>
              </div>
              <div className="cards">
                {results.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    favorite={favorites.includes(deal.id)}
                    onFavorite={() => DealActions.toggleFavorite(deal.id)}
                    onSelect={() => DealActions.select(deal.id)}
                  />
                ))}
                {!results.length && (
                  <div className="empty-state">
                    <Search size={30} />
                    <h3>아직 발견한 혜택이 없어요</h3>
                    <p>
                      {onlySaved || sort === "favorites"
                        ? "마음에 드는 혜택의 하트를 눌러 담아보세요."
                        : "다른 브랜드나 카테고리를 찾아보세요."}
                    </p>
                    <button onClick={DealActions.resetFilters}>
                      전체 혜택 보기
                    </button>
                  </div>
                )}
              </div>
              <div className="feed-footer">
                <button
                  className="add-reward-button"
                  onClick={() => DealActions.startAdd()}
                >
                  <Plus size={16} />내 쿠폰 / 스탬프 추가
                </button>
                <p>
                  예시 기준일 2026.09.11 · 실제 진행 중인 혜택은 브랜드 공식
                  페이지를 확인해 주세요.
                </p>
              </div>
            </aside>
            <NeighborhoodMap
              deals={results}
              onSelect={DealActions.select}
              urgent={urgent}
              onUrgent={DealActions.toggleUrgent}
            />
          </main>
        </div>
      </div>
      <button
        className="mobile-wallet"
        onClick={() => DealActions.open("wallet")}
      >
        <Ticket size={18} />내 쿠폰함
      </button>
      <Modal
        open={!!currentDeal}
        onClose={() => DealActions.select(null)}
        title={currentDeal?.title || "혜택 상세"}
        description="예시 프로모션의 기간, 사용 조건, 쿠폰 및 스탬프"
        className="deal-detail"
      >
        {currentDeal && <DealDetail deal={currentDeal} />}
      </Modal>
      <Modal
        open={!!modal}
        onClose={() => DealActions.open(null)}
        title={
          modal === "login"
            ? "데모 로그인"
            : modal === "add"
              ? "내 혜택 기록"
              : "내 쿠폰함"
        }
        description="이 기기에 쿠폰과 스탬프를 기록하고 관리하세요."
        className={
          modal === "login"
            ? "login-modal"
            : modal === "add"
              ? "record-modal"
              : "wallet-modal"
        }
      >
        {modal === "login" ? (
          <Login />
        ) : modal === "add" ? (
          <RewardForm key={state.editingId || "new"} />
        ) : modal === "wallet" ? (
          <Wallet />
        ) : null}
      </Modal>
      <Toaster
        position="bottom-center"
        richColors
        closeButton
        toastOptions={{ style: { fontFamily: "inherit", fontSize: "14px" } }}
      />
    </div>
  );
}
export function DealCard({
  deal,
  favorite,
  onFavorite,
  onSelect,
}: {
  deal: Deal;
  favorite: boolean;
  onFavorite: () => void;
  onSelect: () => void;
}) {
  return (
    <article className="deal-card">
      <div className={`card-photo photo-${deal.id}`}>
        <button
          className="photo-open"
          onClick={onSelect}
          aria-label={`${deal.brand} ${deal.title} 상세 보기`}
        >
          {deal.image && (
            <Image
              src={deal.image}
              alt={deal.imageAlt}
              fill
              sizes="(max-width:700px) 100vw, 400px"
            />
          )}
          <span className="photo-shade" />
          <span className={`photo-tag ${deal.days === 1 ? "coral" : ""}`}>
            {deal.days === 1 ? <Flame size={12} /> : <Sparkles size={12} />}{" "}
            {deal.tag}
          </span>
          <span className="photo-copy">
            <span>{deal.english.toUpperCase()}</span>
            <strong>
              {deal.benefit}
              <small>{deal.benefit.includes("%") ? " OFF" : ""}</small>
            </strong>
          </span>
        </button>
        <button
          className={`favorite-button ${favorite ? "saved" : ""}`}
          aria-label={`${deal.brand} ${favorite ? "찜 해제" : "찜하기"}`}
          aria-pressed={favorite}
          onClick={onFavorite}
        >
          <Heart size={18} fill={favorite ? "currentColor" : "none"} />
        </button>
      </div>
      <button className="card-main" onClick={onSelect}>
        <span className="card-brand">
          <Brand deal={deal} small />
          <b>{deal.brand}</b>
          <span>{deal.branch}</span>
          <span className="distance">
            <MapPin size={12} />
            {deal.distance}m
          </span>
        </span>
        <span className="card-title">{deal.title}</span>
        <span className="card-meta">
          <span className={deal.days <= 3 ? "ending-soon" : ""}>
            <Clock size={13} />
            {endDate(deal.days)}까지
          </span>
          <span className={`deadline ${deal.days <= 3 ? "urgent" : ""}`}>
            D-{deal.days}
          </span>
        </span>
        <span className="card-caution">
          <Info size={12} />
          <span>{deal.caution}</span>
          <ArrowUpRight size={15} />
        </span>
      </button>
    </article>
  );
}
