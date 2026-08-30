"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import MockBanner from "@/components/MockBanner";
import { SIDO_LIST } from "@/data/regions";
import type { DrugUsageStat } from "@/lib/hira/types";

function formatCount(v: number | null) {
  if (v === null) return "-";
  return `${v.toLocaleString("ko-KR")}건`;
}

function formatWon(v: number | null) {
  if (v === null) return "-";
  if (v >= 100_000_000) return `${(v / 100_000_000).toFixed(1)}억원`;
  return `${v.toLocaleString("ko-KR")}원`;
}

export default function DrugUsagePage() {
  const [yearMonth, setYearMonth] = useState("202506");
  const [drugCode, setDrugCode] = useState("100701ACH");
  const [sidoCd, setSidoCd] = useState("");
  const [keyword, setKeyword] = useState("");
  const [items, setItems] = useState<DrugUsageStat[]>([]);
  const [isMock, setIsMock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (yearMonth) params.set("yearMonth", yearMonth);
        if (drugCode) params.set("drugCode", drugCode);
        if (sidoCd) params.set("sidoCd", sidoCd);
        if (keyword) params.set("keyword", keyword);
        const res = await fetch(`/api/drug-usage?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "조회에 실패했습니다.");
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
  }, [yearMonth, drugCode, sidoCd, keyword]);

  const chartData = items
    .filter((d) => d.usageCount !== null)
    .map((d) => ({ name: d.drugName, value: d.usageCount as number }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">의약품 사용정보</h1>
        <p className="mt-1 text-sm text-muted">약효분류군/성분별 사용량·사용금액 통계를 확인합니다.</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          진료년월(YYYYMM)
          <input
            value={yearMonth}
            onChange={(e) => setYearMonth(e.target.value)}
            placeholder="예: 202506"
            className="rounded-md border border-border bg-surface px-3 py-2 w-32"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          성분코드(gnlNmCd)
          <input
            value={drugCode}
            onChange={(e) => setDrugCode(e.target.value)}
            placeholder="예: 100701ACH"
            className="rounded-md border border-border bg-surface px-3 py-2 w-40"
          />
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
          결과 내 이름 필터
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="선택"
            className="rounded-md border border-border bg-surface px-3 py-2"
          />
        </label>
      </div>
      <p className="text-xs text-muted -mt-3">
        성분코드는 건강보험심사평가원 약제급여목록표 등에서 확인할 수 있습니다. 지역코드는 병원정보서비스의
        시도코드를 6자리로 근사 변환해 사용합니다.
      </p>

      {isMock && <MockBanner />}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && items.length === 0 && !error && <p className="text-sm text-muted">조회 결과가 없습니다.</p>}

      {chartData.length > 0 && (
        <div className="h-[300px] rounded-lg border border-border bg-surface p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 24, right: 48 }}>
              <CartesianGrid horizontal={false} stroke="var(--border)" />
              <XAxis type="number" tickFormatter={(v) => `${Number(v).toLocaleString()}건`} stroke="var(--muted)" fontSize={12} />
              <YAxis type="category" dataKey="name" width={160} stroke="var(--muted)" fontSize={12} />
              <Tooltip
                formatter={(value) => [`${Number(value).toLocaleString("ko-KR")}건`, "사용량"]}
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", fontSize: 12 }}
              />
              <Bar dataKey="value" fill="#2a78d6" radius={[0, 4, 4, 0]} maxBarSize={24}>
                <LabelList
                  dataKey="value"
                  position="right"
                  formatter={(v: unknown) => `${Number(v).toLocaleString("ko-KR")}건`}
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
                <th className="py-2 pr-4">성분</th>
                <th className="py-2 pr-4">시도</th>
                <th className="py-2 pr-4">시군구</th>
                <th className="py-2 pr-4 text-right">사용량</th>
                <th className="py-2 pr-4 text-right">사용금액</th>
              </tr>
            </thead>
            <tbody>
              {items.map((d, i) => (
                <tr key={`${d.drugCode}-${i}`} className="border-b border-border/60">
                  <td className="py-2 pr-4">
                    {d.drugName} <span className="text-muted">({d.drugCode})</span>
                  </td>
                  <td className="py-2 pr-4 text-muted">{d.sidoName ?? "-"}</td>
                  <td className="py-2 pr-4 text-muted">{d.sgguName ?? "-"}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{formatCount(d.usageCount)}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{formatWon(d.usageAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
