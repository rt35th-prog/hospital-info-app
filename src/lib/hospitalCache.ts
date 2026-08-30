import type { Hospital } from "@/lib/hira/types";

// 병원정보서비스(getHospBasisList)는 ykiho로 단건 조회하는 파라미터가 없다(활용가이드로 확인).
// 그래서 검색 목록에서 병원을 선택할 때 그 정보를 세션에 잠깐 저장해두고,
// 상세 페이지에서 그대로 꺼내 쓴다. 새로고침 등으로 이 정보가 없을 때만 서버에 재요청한다.
function key(ykiho: string) {
  return `hospital:${ykiho}`;
}

export function stashHospital(hospital: Hospital): void {
  try {
    sessionStorage.setItem(key(hospital.ykiho), JSON.stringify(hospital));
  } catch {
    // 세션 스토리지를 쓸 수 없는 환경이면 조용히 무시한다(상세 페이지가 서버로 재요청한다).
  }
}

export function readStashedHospital(ykiho: string): Hospital | null {
  try {
    const raw = sessionStorage.getItem(key(ykiho));
    return raw ? (JSON.parse(raw) as Hospital) : null;
  } catch {
    return null;
  }
}
