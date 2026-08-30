"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DiseaseCostStat } from "@/lib/hira/types";

type SortKey = "totalCost" | "avgCostPerPatient";

const METRIC_LABEL: Record<SortKey, string> = {
  totalCost: "총진료비",
  avgCostPerPatient: "1인당 평균 진료비",
};

function formatWon(v: number) {
  if (v >= 100_000_000) return `${(v / 100_000_000).toFixed(1)}억원`;
  if (v >= 10_000) return `${(v / 10_000).toFixed(0)}만원`;
  return `${v.toLocaleString("ko-KR")}원`;
}

export default function DiseasesPage() {
  const [visitType, setVisitType] = useState<"전체" | "입원" | "외래">("전체");
  const [sortKey, setSortKey] = useState<SortKey>("totalCost");
  const [items, setItems] = useState<DiseaseCostStat[]>([]);
  const [isSample, setIsSample] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const sortBy = sortKey === "avgCostPerPatient" ? "avg" : "total";
      const res = await fetch(`/api/diseases?visitType=${visitType}&sortBy=${sortBy}`);
      const data = await res.json();
      if (cancelled) return;
      setItems(data.items ?? []);
      setIsSample(Boolean(data.isSample));
      setNote(data.note ?? null);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [visitType, sortKey]);

  const top10 = items.slice(0, 10);
  const chartData = top10.map((d) => ({ name: d.diseaseName, value: d[sortKey] }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">질병별 진료비 통계</h1>
        <p className="mt-1 text-sm text-muted">상병(질병)별 다빈도 진료 통계와 진료비를 확인합니다.</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          입원/외래
          <select
            value={visitType}
            onChange={(e) => setVisitType(e.target.value as typeof visitType)}
            className="rounded-md border border-border bg-surface px-3 py-2"
          >
            <option value="전체">전체</option>
            <option value="외래">외래</option>
            <option value="입원">입원</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          정렬 기준
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-md border border-border bg-surface px-3 py-2"
          >
            <option value="totalCost">총진료비 순</option>
            <option value="avgCostPerPatient">1인당 평균 진료비 순</option>
          </select>
        </label>
      </div>

      {isSample && note && (
        <div className="rounded-md border border-accent/30 bg-accent/10 px-4 py-2.5 text-sm">{note}</div>
      )}

      {loading ? (
        <p className="text-sm text-muted">불러오는 중...</p>
      ) : (
        <>
          <div className="h-[400px] rounded-lg border border-border bg-surface p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 24, right: 48 }}>
                <CartesianGrid horizontal={false} stroke="var(--border)" />
                <XAxis type="number" tickFormatter={(v) => formatWon(v)} stroke="var(--muted)" fontSize={12} />
                <YAxis type="category" dataKey="name" width={140} stroke="var(--muted)" fontSize={12} />
                <Tooltip
                  formatter={(value) => [formatWon(Number(value)), METRIC_LABEL[sortKey]]}
                  contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", fontSize: 12 }}
                />
                <Bar dataKey="value" fill="#2a78d6" radius={[0, 4, 4, 0]} maxBarSize={22}>
                  <LabelList
                    dataKey="value"
                    position="right"
                    formatter={(v: unknown) => formatWon(Number(v))}
                    fontSize={11}
                    fill="var(--muted)"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="py-2 pr-4">질병명</th>
                  <th className="py-2 pr-4">구분</th>
                  <th className="py-2 pr-4 text-right">진료인원</th>
                  <th className="py-2 pr-4 text-right">총진료비</th>
                  <th className="py-2 pr-4 text-right">1인당 평균</th>
                </tr>
              </thead>
              <tbody>
                {items.map((d) => (
                  <tr key={`${d.diseaseCode}-${d.visitType}`} className="border-b border-border/60">
                    <td className="py-2 pr-4">
                      {d.diseaseName} <span className="text-muted">({d.diseaseCode})</span>
                    </td>
                    <td className="py-2 pr-4 text-muted">{d.visitType}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{d.patientCount.toLocaleString("ko-KR")}명</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{formatWon(d.totalCost)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{formatWon(d.avgCostPerPatient)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
