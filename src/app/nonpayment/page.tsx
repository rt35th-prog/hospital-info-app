"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import MockBanner from "@/components/MockBanner";
import { CLINIC_TYPE_LIST } from "@/data/clinicTypes";
import { SIDO_LIST } from "@/data/regions";
import type { NonPaymentCatalogItem, NonPaymentItem } from "@/lib/hira/types";

function formatWon(v: number | null) {
  if (v === null) return "-";
  return `${v.toLocaleString("ko-KR")}원`;
}

export default function NonPaymentComparePage() {
  const [itemName, setItemName] = useState("");
  const [selectedItem, setSelectedItem] = useState<NonPaymentCatalogItem | null>(null);
  const [suggestions, setSuggestions] = useState<NonPaymentCatalogItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [sidoCd, setSidoCd] = useState("");
  const [clCd, setClCd] = useState("");

  const [items, setItems] = useState<NonPaymentItem[]>([]);
  const [isMock, setIsMock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 항목명을 입력하는 동안 후보를 보여준다(itemCode를 몰라도 이름으로 찾을 수 있게).
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (!itemName.trim() || itemName === selectedItem?.itemName) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(`/api/nonpayment/items?q=${encodeURIComponent(itemName)}`);
        const data = await res.json();
        if (cancelled || !res.ok) return;
        setSuggestions(data.items ?? []);
        setShowSuggestions(true);
      } catch {
        // 자동완성 실패는 조용히 무시한다.
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [itemName, selectedItem]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!selectedItem) {
        setItems([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ itemCode: selectedItem!.itemCode });
        if (sidoCd) params.set("sidoCd", sidoCd);
        if (clCd) params.set("clCd", clCd);
        const res = await fetch(`/api/nonpayment/compare?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "비교 데이터를 불러오지 못했습니다.");
        if (cancelled) return;
        setItems(data.items ?? []);
        setIsMock(Boolean(data.mock));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedItem, sidoCd, clCd]);

  function selectSuggestion(item: NonPaymentCatalogItem) {
    setShowSuggestions(false);
    setItemName(item.itemName);
    setSelectedItem(item);
  }

  const chartData = items
    .filter((i) => i.minPrice !== null)
    .slice(0, 15)
    .map((i) => ({ name: i.hospitalName, 최저가: i.minPrice as number }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">비급여 진료비 비교</h1>
        <p className="mt-1 text-sm text-muted">비급여 항목명을 입력해 선택하면, 그 항목을 파는 병원들의 가격을 비교합니다.</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="relative flex flex-col gap-1 text-sm">
          비급여 항목명
          <input
            value={itemName}
            onChange={(e) => {
              setItemName(e.target.value);
              if (selectedItem) setSelectedItem(null);
            }}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="예: 도수치료, 1인실, MRI"
            autoComplete="off"
            className="rounded-md border border-border bg-surface px-3 py-2 w-64"
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute top-full left-0 z-10 mt-1 w-80 max-h-72 overflow-y-auto rounded-md border border-border bg-surface shadow-lg">
              {suggestions.map((s) => (
                <li key={s.itemCode}>
                  <button
                    type="button"
                    onMouseDown={() => selectSuggestion(s)}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-accent/10"
                  >
                    {s.itemName}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          지역
          <select
            value={sidoCd}
            onChange={(e) => setSidoCd(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2"
          >
            <option value="">전체</option>
            {SIDO_LIST.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          병원 종별
          <select
            value={clCd}
            onChange={(e) => setClCd(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2"
          >
            <option value="">전체</option>
            {CLINIC_TYPE_LIST.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isMock && <MockBanner />}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {loading && <p className="text-sm text-muted">불러오는 중...</p>}

      {!loading && selectedItem && items.length === 0 && !error && (
        <p className="text-sm text-muted">&ldquo;{selectedItem.itemName}&rdquo; 항목을 등록한 병원을 찾을 수 없습니다.</p>
      )}

      {chartData.length > 0 && (
        <div className="h-[360px] rounded-lg border border-border bg-surface p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 24, right: 24 }}>
              <CartesianGrid horizontal={false} stroke="var(--border)" />
              <XAxis type="number" tickFormatter={(v) => `${(v / 10000).toLocaleString()}만`} stroke="var(--muted)" fontSize={12} />
              <YAxis type="category" dataKey="name" width={140} stroke="var(--muted)" fontSize={12} />
              <Tooltip
                formatter={(value) => [`${Number(value).toLocaleString("ko-KR")}원`, "최저가"]}
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", fontSize: 12 }}
              />
              <Bar dataKey="최저가" fill="#2a78d6" radius={[0, 4, 4, 0]} maxBarSize={28}>
                <LabelList
                  dataKey="최저가"
                  position="right"
                  formatter={(v: unknown) => `${Number(v).toLocaleString("ko-KR")}원`}
                  fontSize={11}
                  fill="var(--muted)"
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="py-2 pr-4">병원</th>
                <th className="py-2 pr-4">지역</th>
                <th className="py-2 pr-4 text-right">최저가</th>
                <th className="py-2 pr-4 text-right">최고가</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={`${item.ykiho}-${i}`} className="border-b border-border/60">
                  <td className="py-2 pr-4">{item.hospitalName}</td>
                  <td className="py-2 pr-4 text-muted">
                    {item.sidoName} {item.sgguName}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">{formatWon(item.minPrice)}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{formatWon(item.maxPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
