"use client";

import { use, useEffect, useState } from "react";
import MockBanner from "@/components/MockBanner";
import type { Hospital, NonPaymentItem } from "@/lib/hira/types";

function formatWon(v: number | null) {
  if (v === null) return "-";
  return `${v.toLocaleString("ko-KR")}원`;
}

export default function HospitalDetailPage({ params }: PageProps<"/hospitals/[ykiho]">) {
  const { ykiho } = use(params);
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [items, setItems] = useState<NonPaymentItem[]>([]);
  const [isMock, setIsMock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [hospRes, npRes] = await Promise.all([
          fetch(`/api/hospitals/${ykiho}`),
          fetch(`/api/hospitals/${ykiho}/nonpayment`),
        ]);
        const hospData = await hospRes.json();
        const npData = await npRes.json();
        if (!hospRes.ok) throw new Error(hospData.error ?? "병원 정보를 불러오지 못했습니다.");
        if (cancelled) return;
        setHospital(hospData);
        setItems(npData.items ?? []);
        setIsMock(Boolean(npData.mock));
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
  }, [ykiho]);

  if (loading) return <p className="text-sm text-muted">불러오는 중...</p>;
  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (!hospital) return <p className="text-sm text-muted">병원 정보를 찾을 수 없습니다.</p>;

  return (
    <div className="flex flex-col gap-6">
      {isMock && <MockBanner />}

      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">{hospital.name}</h1>
          <span className="text-xs text-muted">{hospital.clinicType}</span>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">주소</dt>
            <dd>{hospital.address || "-"}</dd>
          </div>
          <div>
            <dt className="text-muted">전화번호</dt>
            <dd>{hospital.tel ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-muted">의사 수</dt>
            <dd>{hospital.doctorTotalCount ?? "-"}</dd>
          </div>
        </dl>
      </div>

      <div>
        <h2 className="font-medium">비급여 진료비 항목</h2>
        {items.length === 0 ? (
          <p className="mt-2 text-sm text-muted">등록된 비급여 항목 정보가 없습니다.</p>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="py-2 pr-4">항목명</th>
                  <th className="py-2 pr-4 text-right">최저가</th>
                  <th className="py-2 pr-4 text-right">최고가</th>
                  <th className="py-2 pr-4">갱신일</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={`${item.itemCode}-${i}`} className="border-b border-border/60">
                    <td className="py-2 pr-4">{item.itemName}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{formatWon(item.minPrice)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{formatWon(item.maxPrice)}</td>
                    <td className="py-2 pr-4 text-muted">{item.updatedDate ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
