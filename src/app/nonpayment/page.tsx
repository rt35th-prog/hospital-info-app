"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import MockBanner from "@/components/MockBanner";
import { SIDO_LIST } from "@/data/regions";
import type { NonPaymentItem } from "@/lib/hira/types";

function formatWon(v: number | null) {
  if (v === null) return "-";
  return `${v.toLocaleString("ko-KR")}원`;
}

export default function NonPaymentComparePage() {
  const [sidoCd, setSidoCd] = useState("11");
  const [availableItemNames, setAvailableItemNames] = useState<string[]>([]);
  const [itemName, setItemName] = useState("");
  const [items, setItems] = useState<NonPaymentItem[]>([]);
  const [isMock, setIsMock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 지역이 바뀌면 해당 지역에서 조회 가능한 비급여 항목명 목록을 먼저 가져온다.
  useEffect(() => {
    let cancelled = false;
    async function loadItemNames() {
      setError(null);
      try {
        const res = await fetch(`/api/nonpayment/compare?sidoCd=${sidoCd}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "항목 목록을 불러오지 못했습니다.");
        if (cancelled) return;
        setAvailableItemNames(data.availableItemNames ?? []);
        setIsMock(Boolean(data.mock));
        setItemName((prev) => (data.availableItemNames?.includes(prev) ? prev : data.availableItemNames?.[0] ?? ""));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      }
    }
    loadItemNames();
    return () => {
      cancelled = true;
    };
  }, [sidoCd]);

  useEffect(() => {
    let cancelled = false;
    async function loadItems() {
      if (!itemName) {
        setItems([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/nonpayment/compare?sidoCd=${sidoCd}&itemName=${encodeURIComponent(itemName)}`,
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "비교 데이터를 불러오지 못했습니다.");
        if (cancelled) return;
        setItems(data.items ?? []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadItems();
    return () => {
      cancelled = true;
    };
  }, [sidoCd, itemName]);

  const chartData = items
    .filter((i) => i.minPrice !== null)
    .map((i) => ({ name: i.hospitalName, 최저가: i.minPrice as number }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">비급여 진료비 비교</h1>
        <p className="mt-1 text-sm text-muted">지역을 선택하면 해당 지역 병원들의 비급여 항목 가격을 비교합니다.</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          지역
          <select
            value={sidoCd}
            onChange={(e) => setSidoCd(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2"
          >
            {SIDO_LIST.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          비급여 항목
          <select
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2 min-w-48"
          >
            {availableItemNames.length === 0 && <option value="">항목 없음</option>}
            {availableItemNames.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isMock && <MockBanner />}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {loading && <p className="text-sm text-muted">불러오는 중...</p>}

      {!loading && itemName && items.length === 0 && !error && (
        <p className="text-sm text-muted">이 지역에서 &ldquo;{itemName}&rdquo; 항목 데이터를 찾을 수 없습니다.</p>
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
