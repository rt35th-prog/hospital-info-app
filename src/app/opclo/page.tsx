"use client";

import { useState } from "react";
import MockBanner from "@/components/MockBanner";
import { SIDO_LIST } from "@/data/regions";
import type { OpCloRecord } from "@/lib/hira/types";

export default function OpCloPage() {
  const [yearMonth, setYearMonth] = useState("202406");
  const [yadmTp, setYadmTp] = useState("0");
  const [opCloTp, setOpCloTp] = useState("0");
  const [sidoCd, setSidoCd] = useState("");
  const [items, setItems] = useState<OpCloRecord[]>([]);
  const [isMock, setIsMock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ yearMonth, yadmTp, opCloTp });
      if (sidoCd) params.set("sidoCd", sidoCd);
      const res = await fetch(`/api/opclo?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "조회에 실패했습니다.");
      setItems(data.items ?? []);
      setTotalCount(Number(data.totalCount ?? 0));
      setIsMock(Boolean(data.mock));
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">병원·약국 개폐업 현황</h1>
        <p className="mt-1 text-sm text-muted">기준년월에 개업·폐업·휴업한 병원/약국 목록을 조회합니다.</p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          기준년월(YYYYMM)
          <input
            value={yearMonth}
            onChange={(e) => setYearMonth(e.target.value)}
            placeholder="예: 202406"
            className="rounded-md border border-border bg-surface px-3 py-2 w-32"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          구분
          <select
            value={yadmTp}
            onChange={(e) => setYadmTp(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2"
          >
            <option value="0">전체</option>
            <option value="1">병원</option>
            <option value="2">약국</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          상태
          <select
            value={opCloTp}
            onChange={(e) => setOpCloTp(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2"
          >
            <option value="0">전체</option>
            <option value="1">개업</option>
            <option value="2">폐업</option>
            <option value="3">휴업</option>
          </select>
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
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "조회 중..." : "조회"}
        </button>
      </form>

      <div className="rounded-md border border-border bg-surface px-4 py-3 text-xs text-muted">
        <p className="font-medium text-foreground">확인되지 않은 조건 안내</p>
        <p className="mt-1">
          이 API는 응답 필드명을 확인할 참고문서가 없어(포털 미리보기도 오류), 다른 심평원 API들의 명명 관례를
          따를 것으로 가정해 방어적으로 파싱합니다. 실제 데이터는 오지만 특정 항목이 비어 보이면 필드명이
          다를 가능성이 큽니다.
        </p>
      </div>

      {isMock && <MockBanner />}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {searched && !loading && items.length === 0 && !error && (
        <p className="text-sm text-muted">조회 결과가 없습니다. (전체 {totalCount}건)</p>
      )}

      {items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="py-2 pr-4">기관명</th>
                <th className="py-2 pr-4">구분</th>
                <th className="py-2 pr-4">상태</th>
                <th className="py-2 pr-4">주소</th>
                <th className="py-2 pr-4">전화번호</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={`${item.ykiho ?? item.name}-${i}`} className="border-b border-border/60">
                  <td className="py-2 pr-4">{item.name}</td>
                  <td className="py-2 pr-4 text-muted">{item.institutionType ?? "-"}</td>
                  <td className="py-2 pr-4 text-muted">{item.statusName ?? "-"}</td>
                  <td className="py-2 pr-4 text-muted">{item.address ?? "-"}</td>
                  <td className="py-2 pr-4 text-muted">{item.tel ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
