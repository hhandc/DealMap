"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Crosshair, Flame, MapPin, Minus, Plus } from "lucide-react";
import type { Deal } from "./data";
import { NearbySearchCache } from "./nearby-cache";
import { shouldRefreshNearbySearch } from "./location-tracking";

type Props = { deals: Deal[]; onSelect: (id: string) => void; urgent: boolean; onUrgent: () => void };
type KakaoMap = { setCenter(center: unknown): void; getCenter(): { getLat(): number; getLng(): number }; setLevel(level: number): void; getLevel(): number; relayout(): void };
type PlaceRow = { place_name: string; x: string; y: string };
type KakaoMaps = {
  load(cb: () => void): void;
  LatLng: new (lat: number, lng: number) => unknown;
  Map: new (element: HTMLElement, options: { center: unknown; level: number; draggable: boolean }) => KakaoMap;
  CustomOverlay: new (options: { map: KakaoMap; position: unknown; content: HTMLElement; yAnchor?: number; clickable?: boolean }) => { setMap(map: KakaoMap | null): void };
  services: { Places: new () => { keywordSearch(query: string, cb: (rows: PlaceRow[], status: string) => void, options?: { location?: unknown; radius?: number; sort?: string }): void }; Status: { OK: string } };
};
type KakaoWindow = Window & { kakao?: { maps: KakaoMaps } };
type Coordinates = { lat: number; lng: number };
type NearbyPlace = { dealId: string; name: string; lat: number; lng: number };

const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY || "bd8198c32db00d8b713959eadc1e5bef";
const CENTER = { lat: 37.4979, lng: 127.0276 };
const BRAND_QUERIES: Record<string, string> = { starbucks: "스타벅스", mcdonalds: "맥도날드", bbq: "BBQ", paris: "파리바게뜨", cu: "CU", olive: "올리브영", gongcha: "공차", dominos: "도미노피자", twosome: "투썸플레이스", gs25: "GS25" };
const LOCATION_OPTIONS = { enableHighAccuracy: false, timeout: 8_000, maximumAge: 60_000 };
let kakaoPromise: Promise<KakaoMaps> | null = null;
const nearbySearchCache = new NearbySearchCache<NearbyPlace[]>();

function loadKakao(): Promise<KakaoMaps> {
  const existing = (window as KakaoWindow).kakao?.maps;
  if (existing?.Map && existing.services) return Promise.resolve(existing);
  if (kakaoPromise) return kakaoPromise;
  kakaoPromise = new Promise<KakaoMaps>((resolve, reject) => {
    const script = document.createElement("script");
    script.dataset.dealmapKakao = "true";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(KAKAO_KEY)}&autoload=false&libraries=services`;
    script.async = true;
    script.onerror = () => reject(new Error("카카오 지도를 불러오지 못했어요. 네트워크 연결과 웹 도메인 설정을 확인해 주세요."));
    script.onload = () => {
      const kakao = (window as KakaoWindow).kakao;
      if (!kakao?.maps) return reject(new Error("카카오 지도 키를 확인해 주세요."));
      kakao.maps.load(() => resolve(kakao.maps));
    };
    document.head.append(script);
  }).catch((reason: unknown) => {
    kakaoPromise = null;
    throw reason;
  });
  return kakaoPromise;
}

export function NeighborhoodMap({ deals, onSelect, urgent, onUrgent }: Props) {
  const element = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState<{ maps: KakaoMaps; map: KakaoMap } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locationLabel, setLocationLabel] = useState("강남역 주변");
  const [searchOrigin, setSearchOrigin] = useState<Coordinates | null>(null);
  const lastSearchedLocation = useRef<(Coordinates & { searchedAt: number }) | null>(null);

  useEffect(() => {
    let disposed = false;
    loadKakao().then((maps) => {
      if (disposed || !element.current) return;
      const map = new maps.Map(element.current, { center: new maps.LatLng(CENTER.lat, CENTER.lng), level: 2, draggable: true });
      setLoaded({ maps, map });
      const resize = () => map.relayout();
      window.addEventListener("resize", resize);
      return () => window.removeEventListener("resize", resize);
    }).catch((reason: unknown) => { if (!disposed) setError(reason instanceof Error ? reason.message : "지도를 불러오지 못했어요."); });
    return () => { disposed = true; };
  }, []);

  useEffect(() => {
    if (!loaded || !searchOrigin) return;
    const overlays: Array<{ setMap(map: KakaoMap | null): void }> = [];
    const searchableDeals = deals.filter((deal) => BRAND_QUERIES[deal.id]);
    const brandIds = searchableDeals.map((deal) => deal.id);
    const cached = nearbySearchCache.read(searchOrigin, brandIds);
    let cancelled = false;

    const showPins = (places: NearbyPlace[]) => {
      if (cancelled) return;
      places.forEach((place) => {
        const deal = searchableDeals.find((item) => item.id === place.dealId);
        if (!deal) return;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "live-kakao-pin";
        button.style.setProperty("--pin-color", deal.color);
        button.setAttribute("aria-label", `${deal.brand} ${place.name} 상세 보기`);
        button.innerHTML = `<span>${deal.mark}</span><b>${place.name}</b>`;
        button.onclick = () => onSelect(deal.id);
        overlays.push(new loaded.maps.CustomOverlay({ map: loaded.map, position: new loaded.maps.LatLng(place.lat, place.lng), content: button, yAnchor: 1, clickable: true }));
      });
    };

    if (cached) {
      showPins(cached);
      return () => { cancelled = true; overlays.forEach((overlay) => overlay.setMap(null)); };
    }

    const places: NearbyPlace[] = [];
    let remaining = searchableDeals.length;
    if (!remaining) return;
    searchableDeals.forEach((deal) => {
      const query = BRAND_QUERIES[deal.id];
      new loaded.maps.services.Places().keywordSearch(query, (rows, status) => {
        if (status === loaded.maps.services.Status.OK) {
          rows.slice(0, 2).forEach((row) => {
            const lat = Number(row.y), lng = Number(row.x);
            if (Number.isFinite(lat) && Number.isFinite(lng)) places.push({ dealId: deal.id, name: row.place_name, lat, lng });
          });
        }
        remaining -= 1;
        if (!remaining && !cancelled) {
          nearbySearchCache.store(searchOrigin, brandIds, places);
          showPins(places);
        }
      }, { location: new loaded.maps.LatLng(searchOrigin.lat, searchOrigin.lng), radius: 3000, sort: "distance" });
    });
    return () => { cancelled = true; overlays.forEach((overlay) => overlay.setMap(null)); };
  }, [loaded, deals, onSelect, searchOrigin]);

  const applyLocation = useCallback((coords: GeolocationCoordinates) => {
    if (!loaded) return;
      const location = { lat: coords.latitude, lng: coords.longitude };
      loaded.map.setCenter(new loaded.maps.LatLng(location.lat, location.lng));
      setLocationLabel("내 위치 주변");
      if (!shouldRefreshNearbySearch(lastSearchedLocation.current, location)) return;
      lastSearchedLocation.current = { ...location, searchedAt: Date.now() };
      setSearchOrigin(location);
      setError(null);
  }, [loaded]);

  useEffect(() => {
    if (!loaded || !navigator.geolocation) return;
    const receivePosition = ({ coords }: GeolocationPosition) => applyLocation(coords);
    navigator.geolocation.getCurrentPosition(receivePosition, () => undefined, LOCATION_OPTIONS);
    const watchId = navigator.geolocation.watchPosition(receivePosition, () => undefined, LOCATION_OPTIONS);
    return () => navigator.geolocation.clearWatch(watchId);
  }, [loaded, applyLocation]);

  const locate = () => {
    if (!loaded) return setError("카카오 지도를 불러오는 중이에요. 잠시 후 다시 시도해 주세요.");
    if (!navigator.geolocation) return setError("이 브라우저에서는 현재 위치를 사용할 수 없어요. 강남역 지도를 계속 보여드려요.");
    navigator.geolocation.getCurrentPosition(({ coords }) => applyLocation(coords), () => setError("위치 권한을 허용하면 주변 매장을 볼 수 있어요."), LOCATION_OPTIONS);
  };

  return <section className="map-panel live-kakao-map" aria-label="주변 프랜차이즈 지도">
    <div className="map-toolbar"><span className="location-pill"><MapPin size={17} /><b>{locationLabel}</b><span className="map-radius">실시간 매장</span></span><div className="live-map-actions"><button onClick={locate}><Crosshair size={16} />내 위치 사용</button><button className={`urgent-toggle ${urgent ? "active" : ""}`} onClick={onUrgent} aria-pressed={urgent}><Flame size={16} />마감 임박만 보기</button></div></div>
    <div ref={element} className="map-viewport kakao-map-viewport" aria-label="카카오 지도" />
    {(error || !loaded) && <div className="live-map-status" role="status">{error || "카카오 지도를 불러오는 중이에요…"}</div>}
    <div className="map-controls"><button aria-label="지도 확대" disabled={!loaded} onClick={() => loaded?.map.setLevel(Math.max(1, loaded.map.getLevel() - 1))}><Plus size={20} /></button><button aria-label="지도 축소" disabled={!loaded} onClick={() => loaded?.map.setLevel(Math.min(14, loaded.map.getLevel() + 1))}><Minus size={20} /></button><span /><button aria-label="내 위치로 이동" onClick={locate}><Crosshair size={21} /></button></div>
    <div className="map-caption"><span>DEALMAP</span> 카카오 지도 · 브랜드별 주변 매장 실시간 검색</div>
  </section>;
}
