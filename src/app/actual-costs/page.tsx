"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ACTUAL_COST_DATASETS, type ActualCostDatasetKey, type ActualCostStat } from "@/lib/actualCostStats";

type SortKey = "totalCost" | "patientCount";

const METRIC_LABEL: Record<SortKey, string> = {
  totalCost: "요양급여비용총액",
  patientCount: "환자수",
};

function formatWon(v: number) {
  if (v >= 100_000_000) return `${(v / 100_000_000).toFixed(1)}억원`;
  if (v >= 10_000) return `${(v / 10_000).toFixed(0)}만원`;
  return `${v.toLocaleString("ko-KR")}원`;
}

function formatCount(v: number) {
  return `${v.toLocaleString("ko-KR")}`;
}

export default function ActualCostsPage() {
  const [dataset, setDataset] = useState<ActualCostDatasetKey>("region-by-type");
  const [sortKey, setSortKey] = useState<SortKey>("totalCost");
  const [keyword, setKeyword] = useState("");
  const [items, setItems] = useState<ActualCostStat[]>([]);
  const [sourceNote, setSourceNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      const params = new URLSearchParams({ dataset, sortBy: sortKey === "patientCount" ? "patient" : "total" });
      if (keyword) params.set("q", keyword);
      const res = await fetch(`/api/actual-costs?${params.toString()}`);
      const data = await res.json();
      if (cancelled) return;
      setItems(data.items ?? []);
      setSourceNote(data.meta?.source ?? null);
      setLoading(false);
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [dataset, sortKey, keyword]);

  const top15 = items.slice(0, 15);
  const chartData = top15.map((d) => ({ name: d.label, value: d[sortKey] }));
  const currentMeta = ACTUAL_COST_DATASETS.find((d) => d.key === dataset);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">실제 진료비 통계</h1>
        <p className="mt-1 text-sm text-muted">
          심평원이 공개한 실제 요양급여비용 청구 통계입니다(샘플이 아닌 실측 데이터).
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          기준(관점)
          <select
            value={dataset}
            onChange={(e) => setDataset(e.target.value as ActualCostDatasetKey)}
            className="rounded-md border border-border bg-surface px-3 py-2 min-w-56"
          >
            {ACTUAL_COST_DATASETS.map((d) => (
              <option key={d.key} value={d.key}>
                {d.title} ({d.years})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          정렬 기준
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-md border border-border bg-surface px-3 py-2"
          >
            <option value="totalCost">요양급여비용총액 순</option>
            <option value="patientCount">환자수 순</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          검색
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="예: 서울, 종합병원, D66"
            className="rounded-md border border-border bg-surface px-3 py-2"
          />
        </label>
      </div>

      {sourceNote && (
        <p className="text-xs text-muted">
          출처: {sourceNote}
          {currentMeta?.key === "rare-disease" && " — 상병코드는 한국표준질병사인분류(KCD) 코드입니다."}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted">불러오는 중...</p>
      ) : (
        <>
          {chartData.length === 0 && <p className="text-sm text-muted">검색 결과가 없습니다.</p>}

          {chartData.length > 0 && (
            <div className="h-[420px] rounded-lg border border-border bg-surface p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 24, right: 48 }}>
                  <CartesianGrid horizontal={false} stroke="var(--border)" />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => (sortKey === "totalCost" ? formatWon(v) : formatCount(v))}
                    stroke="var(--muted)"
                    fontSize={12}
                  />
                  <YAxis type="category" dataKey="name" width={160} stroke="var(--muted)" fontSize={11} />
                  <Tooltip
                    formatter={(value) => [
                      sortKey === "totalCost" ? formatWon(Number(value)) : `${formatCount(Number(value))}명`,
                      METRIC_LABEL[sortKey],
                    ]}
                    contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", fontSize: 12 }}
                  />
                  <Bar dataKey="value" fill="#2a78d6" radius={[0, 4, 4, 0]} maxBarSize={20}>
                    <LabelList
                      dataKey="value"
                      position="right"
                      formatter={(v: unknown) => (sortKey === "totalCost" ? formatWon(Number(v)) : `${formatCount(Number(v))}명`)}
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
                    <th className="py-2 pr-4">구분</th>
                    <th className="py-2 pr-4 text-right">환자수</th>
                    <th className="py-2 pr-4 text-right">청구건수</th>
                    <th className="py-2 pr-4 text-right">입내원일수</th>
                    <th className="py-2 pr-4 text-right">보험자부담금</th>
                    <th className="py-2 pr-4 text-right">요양급여비용총액</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((d, i) => (
                    <tr key={`${d.label}-${i}`} className="border-b border-border/60">
                      <td className="py-2 pr-4">{d.label}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{d.patientCount.toLocaleString("ko-KR")}명</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{d.claimCount.toLocaleString("ko-KR")}건</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{d.visitDays.toLocaleString("ko-KR")}일</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{formatWon(d.insurerPaidAmount)}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{formatWon(d.totalCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
