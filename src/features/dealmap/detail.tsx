"use client";
import {
  CalendarDays,
  MapPin,
  ArrowUpRight,
  Heart,
  Ticket,
  Plus,
  Info,
  MessageCircle,
  ChevronRight,
  Coffee,
} from "lucide-react";
import { Disclosure } from "~/components/ui/collapsible";
import type { Deal } from "./data";
import { endDate } from "./data";
import { Brand } from "./brand";
import { StampCard, RewardItem } from "./rewards";
import { useDealStore } from "./store";
import { DealActions } from "./actions";
import Image from "next/image";
export function DealDetail({ deal }: { deal: Deal }) {
  const profile = useDealStore((s) => s.profile),
    favorite = useDealStore((s) => s.favorites.includes(deal.id)),
    rewards = useDealStore((s) => s.rewards);
  const mine = rewards.filter((r) => r.brand === deal.brand);
  return (
    <>
      <div className={`detail-photo photo-${deal.id}`}>
        {deal.image && (
          <Image src={deal.image} alt={deal.imageAlt} fill sizes="560px" />
        )}
        <div className="photo-shade" />
        <div className="detail-photo-caption">
          <span>{deal.english.toUpperCase()}</span>
          <strong>{deal.benefit}</strong>
          <p>{deal.subtitle}</p>
        </div>
        <span className="detail-sample">샘플 프로모션 · 실제 행사 아님</span>
      </div>
      <div className="detail-body">
        <div className="detail-brand">
          <Brand deal={deal} />
          <div>
            <b>{deal.brand}</b>
            <span>
              {deal.branch} · {deal.distance}m
            </span>
          </div>
          <button
            className={`detail-favorite ${favorite ? "saved" : ""}`}
            onClick={() => DealActions.toggleFavorite(deal.id)}
            aria-label={favorite ? "찜 해제" : "찜하기"}
            aria-pressed={favorite}
          >
            <Heart size={21} fill={favorite ? "currentColor" : "none"} />
          </button>
        </div>
        <h2>{deal.title}</h2>
        <div className="detail-period">
          <CalendarDays size={16} />
          <span>2026.09.11 ~ 2026.{endDate(deal.days)}</span>
          <span className={`deadline ${deal.days <= 3 ? "urgent" : ""}`}>
            D-{deal.days}
          </span>
        </div>
        <div className="detail-section">
          <h3>
            <Info size={17} />
            사용 전 꼭 확인해 주세요
          </h3>
          <ul>
            {deal.conditions.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <p className="official-note">
            아래 링크는 공식 브랜드 페이지예요. 예시 혜택은 사용할 수 없으며,
            실제 진행 중인 행사는 공식 페이지에서 확인해 주세요.
          </p>
          <a
            href={deal.url}
            target="_blank"
            rel="noopener noreferrer"
            className="primary-button full-width"
          >
            공식 페이지에서 혜택 확인
            <ArrowUpRight size={18} />
          </a>
        </div>
        <div className="detail-section benefits-section">
          <div className="section-title">
            <h3>
              <Ticket size={17} />
              {profile ? "내가 기록한 혜택" : "내 혜택 미리보기"}
            </h3>
            <span className="sample-chip">
              {profile ? "이 기기의 기록" : "샘플 데이터"}
            </span>
          </div>
          {profile ? (
            <>
              {mine.length ? (
                mine.map((r) => <RewardItem key={r.id} reward={r} />)
              ) : (
                <p className="empty-inline">
                  아직 {deal.brand}의 개인 기록이 없어요.
                  <br />
                  가지고 있는 쿠폰이나 스탬프를 추가해 보세요.
                </p>
              )}
            </>
          ) : (
            <>
              {deal.stamps !== undefined && <StampCard count={deal.stamps} />}
              {deal.coupons.length > 0 ? (
                <Disclosure
                  title={
                    <span className="coupon-disclosure-title">
                      <Ticket size={18} />
                      <b>
                        사용 가능한 쿠폰 <em>{deal.coupons.length}장</em>
                      </b>
                    </span>
                  }
                >
                  {deal.coupons.map((coupon, i) => (
                    <div className="coupon-row" key={i}>
                      <span className="coupon-number">0{i + 1}</span>
                      <div>
                        <b>{coupon.title}</b>
                        <span>2026.{coupon.expires}까지 · 샘플</span>
                      </div>
                      <Ticket size={20} />
                    </div>
                  ))}
                </Disclosure>
              ) : (
                <div className="empty-inline">
                  <Coffee size={22} />
                  <p>
                    등록된 샘플 쿠폰이 없어요.
                    <br />내 쿠폰은 직접 추가할 수 있어요.
                  </p>
                </div>
              )}
              <p className="benefit-help">
                로그인하면 샘플 대신 내가 직접 기록한 혜택을 관리할 수 있어요.
              </p>
            </>
          )}
          <button
            className="add-reward-button"
            onClick={() => DealActions.startAdd(deal.brand)}
          >
            <Plus size={17} />내 쿠폰 / 스탬프 추가
          </button>
        </div>
        <div className="community-section">
          <div className="section-title">
            <h3>
              <MessageCircle size={17} />
              함께 나누는 절약 팁
            </h3>
            <span>예시 글</span>
          </div>
          <details>
            <summary>
              <span>
                <b>
                  {deal.category === "카페"
                    ? "카페 스탬프, 빠짐없이 모으는 습관"
                    : "앱 쿠폰과 카드 혜택, 함께 쓸 수 있을까?"}
                </b>
                <small>혜택탐험가 · 2시간 전</small>
              </span>
              <ChevronRight size={17} />
            </summary>
            <p>
              {deal.category === "카페"
                ? "주문 전에 멤버십 바코드를 준비해 보세요. 스탬프 유효기간과 적립 제외 음료를 확인하고, 오늘 모은 개수는 내 쿠폰함에 기록하면 편리해요."
                : "일부 할인은 다른 혜택과 함께 쓸 수 없어요. 최대 35% 절약 같은 조합을 봤다면, 적용 순서와 중복 할인 가능 여부를 공식 약관이나 매장에서 먼저 확인해 보세요."}
            </p>
          </details>
        </div>
        <p className="detail-location">
          <MapPin size={13} />
          강남역 주변 예시 매장 · 실제 거리 및 위치와 다를 수 있어요.
        </p>
      </div>
    </>
  );
}
