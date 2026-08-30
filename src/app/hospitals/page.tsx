"use client";

import Link from "next/link";
import { useState } from "react";
import MockBanner from "@/components/MockBanner";
import { DEPARTMENT_LIST } from "@/data/departments";
import { SIDO_LIST } from "@/data/regions";
import type { Hospital } from "@/lib/hira/types";

export default function HospitalsPage() {
  const [sidoCd, setSidoCd] = useState("");
  const [dgsbjtCd, setDgsbjtCd] = useState("");
  const [name, setName] = useState("");
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (sidoCd) params.set("sidoCd", sidoCd);
      if (dgsbjtCd) params.set("dgsbjtCd", dgsbjtCd);
      if (name) params.set("yadmNm", name);
      const res = await fetch(`/api/hospitals?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "검색에 실패했습니다.");
      setHospitals(data.items);
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
        <h1 className="text-xl font-semibold tracking-tight">병원 검색</h1>
        <p className="mt-1 text-sm text-muted">지역과 진료과목, 병원명으로 검색할 수 있습니다.</p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3">
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
          진료과목
          <select
            value={dgsbjtCd}
            onChange={(e) => setDgsbjtCd(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2"
          >
            <option value="">전체</option>
            {DEPARTMENT_LIST.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          병원명
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 서울병원"
            className="rounded-md border border-border bg-surface px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "검색 중..." : "검색"}
        </button>
      </form>

      {isMock && <MockBanner />}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {searched && !loading && hospitals.length === 0 && !error && (
        <p className="text-sm text-muted">검색 결과가 없습니다.</p>
      )}

      <ul className="flex flex-col gap-3">
        {hospitals.map((h) => (
          <li key={h.ykiho}>
            <Link
              href={`/hospitals/${h.ykiho}`}
              className="block rounded-lg border border-border bg-surface p-4 hover:border-accent transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{h.name}</span>
                <span className="text-xs text-muted">{h.clinicType}</span>
              </div>
              <p className="mt-1 text-sm text-muted">
                {h.sidoName} {h.sgguName} · {h.address}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
