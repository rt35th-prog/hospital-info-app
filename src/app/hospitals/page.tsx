"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MockBanner from "@/components/MockBanner";
import { DEPARTMENT_LIST } from "@/data/departments";
import { SIDO_LIST } from "@/data/regions";
import type { Hospital } from "@/lib/hira/types";
import { stashHospital } from "@/lib/hospitalCache";

export default function HospitalsPage() {
  const router = useRouter();
  const [sidoCd, setSidoCd] = useState("");
  const [dgsbjtCd, setDgsbjtCd] = useState("");
  const [name, setName] = useState("");
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [searched, setSearched] = useState(false);

  const [suggestions, setSuggestions] = useState<Hospital[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 병원명을 입력하는 동안 일치하는 병원을 목록으로 보여준다(중간어 포함 검색).
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (!name.trim()) {
        setSuggestions([]);
        return;
      }
      try {
        const params = new URLSearchParams({ yadmNm: name, numOfRows: "8" });
        if (sidoCd) params.set("sidoCd", sidoCd);
        if (dgsbjtCd) params.set("dgsbjtCd", dgsbjtCd);
        const res = await fetch(`/api/hospitals?${params.toString()}`);
        const data = await res.json();
        if (cancelled || !res.ok) return;
        setSuggestions(data.items ?? []);
        setShowSuggestions(true);
      } catch {
        // 자동완성 실패는 조용히 무시한다(검색 버튼으로 여전히 조회 가능).
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [name, sidoCd, dgsbjtCd]);

  function selectSuggestion(hospital: Hospital) {
    setShowSuggestions(false);
    setName(hospital.name);
    stashHospital(hospital);
    router.push(`/hospitals/${hospital.ykiho}`);
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setShowSuggestions(false);
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
        <label className="relative flex flex-col gap-1 text-sm">
          병원명
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="예: 서울 (중간 글자로도 검색됩니다)"
            autoComplete="off"
            className="rounded-md border border-border bg-surface px-3 py-2 w-56"
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute top-full left-0 z-10 mt-1 w-72 max-h-72 overflow-y-auto rounded-md border border-border bg-surface shadow-lg">
              {suggestions.map((h) => (
                <li key={h.ykiho}>
                  <button
                    type="button"
                    onMouseDown={() => selectSuggestion(h)}
                    className="block w-full px-3 py-2 text-left hover:bg-accent/10"
                  >
                    <div className="font-medium">{h.name}</div>
                    <div className="text-xs text-muted">
                      {h.sidoName} {h.sgguName} · {h.clinicType}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
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
              onClick={() => stashHospital(h)}
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
