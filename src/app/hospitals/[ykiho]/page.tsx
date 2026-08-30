"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import MockBanner from "@/components/MockBanner";
import type { Hospital, NonPaymentItem, StaffCount } from "@/lib/hira/types";
import { readStashedHospital } from "@/lib/hospitalCache";

function formatWon(v: number | null) {
  if (v === null) return "-";
  return `${v.toLocaleString("ko-KR")}원`;
}

function formatDate(v: string | null) {
  if (!v || v.length !== 8) return v ?? "-";
  return `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`;
}

function formatPeriod(start: string | null, end: string | null) {
  const startStr = formatDate(start);
  if (!end || end === "99991231") return `${startStr} ~`;
  return `${startStr} ~ ${formatDate(end)}`;
}

const STAFF_ROWS: { key: "medicalStaff" | "dentalStaff" | "orientalStaff"; label: string }[] = [
  { key: "medicalStaff", label: "의과" },
  { key: "dentalStaff", label: "치과" },
  { key: "orientalStaff", label: "한방" },
];

function hasAnyStaff(staff: StaffCount) {
  return staff.general !== null || staff.intern !== null || staff.resident !== null || staff.specialist !== null;
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
        // 병원정보서비스는 ykiho 단건 조회를 지원하지 않아, 검색 목록에서 클릭할 때
        // 넘겨받은 정보를 우선 사용한다(hospitalCache 참고).
        const stashed = readStashedHospital(ykiho);
        const npRes = await fetch(`/api/hospitals/${ykiho}/nonpayment`);
        const npData = await npRes.json();
        if (cancelled) return;
        setItems(npData.items ?? []);
        setIsMock(Boolean(npData.mock));

        if (stashed) {
          setHospital(stashed);
        } else {
          const hospRes = await fetch(`/api/hospitals/${ykiho}`);
          const hospData = await hospRes.json();
          if (!hospRes.ok) throw new Error(hospData.error ?? "병원 정보를 불러오지 못했습니다.");
          if (!cancelled) setHospital(hospData);
        }
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
  if (error) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-red-500">{error}</p>
        <Link href="/hospitals" className="text-sm text-accent underline">
          병원 검색으로 돌아가기
        </Link>
      </div>
    );
  }
  if (!hospital) return <p className="text-sm text-muted">병원 정보를 찾을 수 없습니다.</p>;

  const staffRows = STAFF_ROWS.filter((row) => hasAnyStaff(hospital[row.key]));

  return (
    <div className="flex flex-col gap-6">
      {isMock && <MockBanner />}

      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">{hospital.name}</h1>
          <span className="text-xs text-muted">
            {hospital.clinicType} ({hospital.clinicTypeCode})
          </span>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">주소</dt>
            <dd>
              {hospital.address || "-"}
              {hospital.postCode && ` (${hospital.postCode})`}
            </dd>
          </div>
          <div>
            <dt className="text-muted">읍면동</dt>
            <dd>{hospital.emdongName ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-muted">전화번호</dt>
            <dd>{hospital.tel ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-muted">홈페이지</dt>
            <dd>
              {hospital.homepage ? (
                <a href={hospital.homepage} target="_blank" rel="noreferrer" className="text-accent underline">
                  바로가기
                </a>
              ) : (
                "-"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted">개설일</dt>
            <dd>{formatDate(hospital.establishedDate)}</dd>
          </div>
          <div>
            <dt className="text-muted">전체 의사 수</dt>
            <dd>{hospital.doctorTotalCount ?? "-"}명</dd>
          </div>
          <div>
            <dt className="text-muted">좌표</dt>
            <dd>
              {hospital.latitude !== null && hospital.longitude !== null
                ? `${hospital.latitude.toFixed(5)}, ${hospital.longitude.toFixed(5)}`
                : "-"}
            </dd>
          </div>
          <div>
            <dt className="text-muted">요양기호</dt>
            <dd className="truncate" title={hospital.ykiho}>
              {hospital.ykiho}
            </dd>
          </div>
        </dl>

        {staffRows.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="py-2 pr-4">구분</th>
                  <th className="py-2 pr-4 text-right">일반의</th>
                  <th className="py-2 pr-4 text-right">인턴</th>
                  <th className="py-2 pr-4 text-right">레지던트</th>
                  <th className="py-2 pr-4 text-right">전문의</th>
                </tr>
              </thead>
              <tbody>
                {staffRows.map((row) => {
                  const staff = hospital[row.key];
                  return (
                    <tr key={row.key} className="border-b border-border/60">
                      <td className="py-2 pr-4 text-muted">{row.label}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{staff.general ?? "-"}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{staff.intern ?? "-"}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{staff.resident ?? "-"}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{staff.specialist ?? "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
                  <th className="py-2 pr-4">병원 표기명</th>
                  <th className="py-2 pr-4 text-right">최저가</th>
                  <th className="py-2 pr-4 text-right">최고가</th>
                  <th className="py-2 pr-4">적용기간</th>
                  <th className="py-2 pr-4">확인</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={`${item.itemCode}-${i}`} className="border-b border-border/60">
                    <td className="py-2 pr-4">{item.itemName}</td>
                    <td className="py-2 pr-4 text-muted">{item.hospitalItemName ?? "-"}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{formatWon(item.minPrice)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{formatWon(item.maxPrice)}</td>
                    <td className="py-2 pr-4 text-muted">{formatPeriod(item.startDate, item.endDate)}</td>
                    <td className="py-2 pr-4">
                      {item.url ? (
                        <a href={item.url} target="_blank" rel="noreferrer" className="text-accent underline">
                          링크
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
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
