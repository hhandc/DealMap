"use client";
import { useState } from "react";
import {
  Ticket,
  Plus,
  Minus,
  Check,
  Trash2,
  Pencil,
  Coffee,
  Gift,
  ArrowUpRight,
  Info,
  LogOut,
  UserRound,
} from "lucide-react";
import type { Reward, RewardDraft } from "./model";
import { deals } from "./data";
import { DealActions } from "./actions";
import { useDealStore } from "./store";
import { Brand } from "./brand";
export function StampCard({
  count,
  target = 10,
  title = "스탬프를 모아 한 잔의 행복",
  onAdjust,
}: {
  count: number;
  target?: number;
  title?: string;
  onAdjust?: (delta: number) => void;
}) {
  return (
    <div className="stamp-card">
      <div className="stamp-heading">
        <div>
          <span>작은 한 잔, 차곡차곡</span>
          <h3>{title}</h3>
        </div>
        <Coffee size={27} />
      </div>
      <div className="stamp-grid" aria-label={`${target}개 중 ${count}개 적립`}>
        {Array.from({ length: Math.min(target, 20) }, (_, i) => (
          <span key={i} className={i < count ? "collected" : ""}>
            {i < count ? (
              <Coffee size={19} />
            ) : i === target - 1 ? (
              <Gift size={18} />
            ) : (
              <span>{i + 1}</span>
            )}
          </span>
        ))}
      </div>
      {target > 20 && <p className="muted">전체 {target}개 중 앞 20개 표시</p>}
      <div className="stamp-bottom">
        <span>
          <strong>{count}</strong> / {target}개 적립
        </span>
        {onAdjust ? (
          <div className="stamp-adjust">
            <button
              aria-label="스탬프 1개 차감"
              disabled={count <= 0}
              onClick={() => onAdjust(-1)}
            >
              <Minus size={15} />
            </button>
            <button
              aria-label="스탬프 1개 적립"
              disabled={count >= target}
              onClick={() => onAdjust(1)}
            >
              <Plus size={15} />
            </button>
          </div>
        ) : (
          <span>
            {count === target
              ? "리워드를 받으세요!"
              : `${target - count}개 더 모으면 리워드!`}
          </span>
        )}
      </div>
    </div>
  );
}
export function RewardItem({ reward }: { reward: Reward }) {
  const expired =
    reward.kind === "coupon" &&
    reward.expires < new Date().toLocaleDateString("sv-SE");
  return (
    <article className={`reward-item ${reward.used ? "reward-used" : ""}`}>
      <div className="reward-item-head">
        <span className="reward-kind">
          {reward.kind === "coupon" ? (
            <Ticket size={17} />
          ) : (
            <Coffee size={17} />
          )}
        </span>
        <div>
          <b>{reward.brand}</b>
          <span>{reward.kind === "coupon" ? "내 쿠폰" : "내 스탬프"}</span>
        </div>
        <button
          aria-label={`${reward.title} 수정`}
          onClick={() => DealActions.startEdit(reward.id)}
        >
          <Pencil size={15} />
        </button>
        <button
          aria-label={`${reward.title} 삭제`}
          onClick={() => DealActions.deleteReward(reward.id)}
        >
          <Trash2 size={15} />
        </button>
      </div>
      {reward.kind === "stamp" ? (
        <StampCard
          count={reward.count}
          target={reward.target}
          title={reward.title}
          onAdjust={(delta) => DealActions.adjustStamp(reward.id, delta)}
        />
      ) : (
        <>
          <h3>{reward.title}</h3>
          <div className="reward-bottom">
            <span className={expired ? "expired" : ""}>
              {reward.expires.replaceAll("-", ".")}까지{" "}
              {expired && "· 기간 만료"}
            </span>
            <button
              className={reward.used ? "used-toggle" : "use-toggle"}
              onClick={() => DealActions.toggleUsed(reward.id)}
              disabled={expired && !reward.used}
            >
              {reward.used ? (
                <>
                  <Check size={14} />
                  사용 완료 · 취소
                </>
              ) : (
                "사용 완료로 표시"
              )}
            </button>
          </div>
        </>
      )}
    </article>
  );
}
export function Wallet() {
  const profile = useDealStore((s) => s.profile),
    rewards = useDealStore((s) => s.rewards),
    storageError = useDealStore((s) => s.storageError);
  const [tab, setTab] = useState<"mine" | "sample">(
    profile || rewards.length ? "mine" : "sample",
  );
  const available = rewards.filter(
    (r) =>
      r.kind === "coupon" &&
      !r.used &&
      r.expires >= new Date().toLocaleDateString("sv-SE"),
  ).length;
  return (
    <div className="wallet-content">
      <div className="dialog-kicker">
        <Ticket size={16} /> MY BENEFITS
      </div>
      <h2>{profile ? `${profile}님의 쿠폰함` : "나만의 작은 혜택 보관함"}</h2>
      <p className="dialog-intro">쿠폰부터 스탬프까지, 놓치지 않게 한곳에.</p>
      <div className="wallet-context">
        <Info size={17} />
        <span>
          {profile
            ? "데모 프로필로 개인 기록을 관리하고 있어요."
            : "로그인 없이도 이 기기에 내 혜택을 저장할 수 있어요."}
          <br />
          기록은 이 브라우저에만 저장되며 브랜드 앱과 연동되지 않아요.
        </span>
      </div>
      {storageError && (
        <p className="form-error" role="alert">
          기기 저장이 제한되어 있어요. 창을 닫으면 새 기록이 사라질 수 있어요.
        </p>
      )}
      <div className="wallet-tabs">
        <button
          className={tab === "mine" ? "active" : ""}
          onClick={() => setTab("mine")}
        >
          내 기록 <span>{rewards.length}</span>
        </button>
        <button
          className={tab === "sample" ? "active" : ""}
          onClick={() => setTab("sample")}
        >
          샘플 둘러보기
        </button>
      </div>
      {tab === "mine" ? (
        <>
          <div className="wallet-summary">
            <span>
              사용 가능한 쿠폰 <b>{available}장</b>
            </span>
            <button onClick={() => DealActions.startAdd()}>
              <Plus size={16} />
              추가하기
            </button>
          </div>
          <div className="reward-list">
            {rewards.map((reward) => (
              <RewardItem key={reward.id} reward={reward} />
            ))}
            {!rewards.length && (
              <div className="empty-state">
                <Ticket size={39} />
                <h3>첫 번째 혜택을 담아볼까요?</h3>
                <p>
                  브랜드, 혜택, 유효기간만 입력하면 끝.
                  <br />
                  종이 스탬프도 간편하게 기록해 보세요.
                </p>
                <button onClick={() => DealActions.startAdd()}>
                  <Plus size={15} />내 쿠폰 / 스탬프 추가
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="sample-wallet">
          <span className="sample-chip">샘플 데이터 · 실제 사용 불가</span>
          {deals.slice(0, 3).map((deal) => (
            <button
              key={deal.id}
              className="sample-wallet-row"
              onClick={() => DealActions.select(deal.id)}
            >
              <Brand deal={deal} />
              <span>
                <b>{deal.brand}</b>
                <small>
                  쿠폰 {deal.coupons.length}장{" "}
                  {deal.stamps !== undefined && `· 스탬프 ${deal.stamps}/10`}
                </small>
              </span>
              <ArrowUpRight size={19} />
            </button>
          ))}
        </div>
      )}
      <div className="wallet-profile">
        {profile ? (
          <button onClick={DealActions.logout}>
            <LogOut size={15} />
            데모 로그아웃
          </button>
        ) : (
          <button onClick={() => DealActions.open("login")}>
            <UserRound size={15} />
            데모 로그인으로 개인 기록 관리하기
          </button>
        )}
      </div>
    </div>
  );
}
export function RewardForm() {
  const editingId = useDealStore((s) => s.editingId),
    addBrand = useDealStore((s) => s.addBrand),
    existing = useDealStore((s) => s.rewards.find((r) => r.id === editingId));
  const [draft, setDraft] = useState<RewardDraft>(
    existing || {
      brand: addBrand,
      kind: "coupon",
      title: "",
      expires: "",
      count: 0,
      target: 10,
    },
  );
  const [error, setError] = useState("");
  const update = (change: Partial<RewardDraft>) => {
    setDraft((d) => ({ ...d, ...change }));
    setError("");
  };
  return (
    <form
      className="reward-form"
      onSubmit={(e) => {
        e.preventDefault();
        const result = DealActions.saveReward(draft);
        if (result) setError(result);
      }}
    >
      <div className="dialog-kicker">
        <Plus size={16} /> MY RECORD
      </div>
      <h2>{editingId ? "내 혜택 수정" : "내 쿠폰 / 스탬프 추가"}</h2>
      <p className="dialog-intro">직접 기록하고, 잊지 말고 챙겨요.</p>
      <fieldset className="type-picker">
        <legend className="sr-only">기록 종류</legend>
        {(["coupon", "stamp"] as const).map((kind) => (
          <label key={kind} className={draft.kind === kind ? "active" : ""}>
            <input
              type="radio"
              name="kind"
              value={kind}
              checked={draft.kind === kind}
              onChange={() => update({ kind })}
            />
            {kind === "coupon" ? <Ticket size={19} /> : <Coffee size={19} />}{" "}
            {kind === "coupon" ? "쿠폰" : "스탬프"}
          </label>
        ))}
      </fieldset>
      <label className="form-field">
        브랜드
        <input
          required
          maxLength={40}
          list="brand-options"
          placeholder="예: 스타벅스"
          value={draft.brand}
          onChange={(e) => update({ brand: e.target.value })}
        />
      </label>
      <datalist id="brand-options">
        {deals.map((d) => (
          <option key={d.id} value={d.brand} />
        ))}
      </datalist>
      <label className="form-field">
        {draft.kind === "coupon" ? "쿠폰 혜택" : "완성하면 받는 혜택"}
        <input
          required
          maxLength={100}
          placeholder={
            draft.kind === "coupon"
              ? "예: 아메리카노 1+1"
              : "예: 아메리카노 한 잔 무료"
          }
          value={draft.title}
          onChange={(e) => update({ title: e.target.value })}
        />
      </label>
      {draft.kind === "coupon" ? (
        <label className="form-field">
          유효기간
          <input
            required
            type="date"
            value={draft.expires}
            onChange={(e) => update({ expires: e.target.value })}
          />
        </label>
      ) : (
        <div className="form-columns">
          <label className="form-field">
            현재 스탬프
            <input
              required
              type="number"
              min="0"
              max={draft.target}
              step="1"
              value={draft.count}
              onChange={(e) => update({ count: e.target.valueAsNumber })}
            />
          </label>
          <label className="form-field">
            목표 스탬프
            <input
              required
              type="number"
              min="1"
              max="50"
              step="1"
              value={draft.target}
              onChange={(e) => update({ target: e.target.valueAsNumber })}
            />
          </label>
        </div>
      )}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <div className="form-note">
        <Info size={15} />
        <span>
          직접 입력한 기록은 이 기기에 저장돼요.
          <br />
          실제 쿠폰 사용은 브랜드 앱 또는 매장에서 해 주세요.
        </span>
      </div>
      <button type="submit" className="primary-button full-width">
        {editingId ? "수정 내용 저장" : "내 혜택에 저장하기"}
        <Check size={17} />
      </button>
      <button
        type="button"
        className="form-cancel"
        onClick={() => DealActions.open("wallet")}
      >
        쿠폰함으로 돌아가기
      </button>
    </form>
  );
}
export function Login() {
  const [name, setName] = useState(""),
    [error, setError] = useState("");
  return (
    <form
      className="login-content"
      onSubmit={(e) => {
        e.preventDefault();
        if (!DealActions.login(name))
          setError("1~20자의 닉네임을 입력해 주세요.");
      }}
    >
      <div className="login-illustration">
        <Ticket size={35} />
        <span>✦</span>
      </div>
      <span className="sample-chip">데모 로그인</span>
      <h2>
        작은 혜택을,
        <br />
        나만의 기록으로.
      </h2>
      <p className="dialog-intro">
        쿠폰의 유효기간과 스탬프를
        <br />
        직접 챙기는 습관을 시작해 보세요.
      </p>
      <label className="form-field">
        어떻게 불러드릴까요?
        <input
          autoComplete="nickname"
          placeholder="닉네임을 입력해 주세요"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          maxLength={20}
          required
        />
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="primary-button full-width" type="submit">
        데모 시작하기
        <ArrowUpRight size={18} />
      </button>
      <p className="login-note">
        실제 계정 가입이나 인증은 이루어지지 않아요.
        <br />
        닉네임과 혜택 기록은 이 브라우저에만 저장됩니다.
      </p>
    </form>
  );
}
