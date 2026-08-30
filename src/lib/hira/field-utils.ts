/**
 * data.go.kr Open API는 서비스 버전에 따라 응답 필드명이 조금씩 다르게
 * 내려오는 경우가 있다(예: XPos vs xPos). 실제 서비스키로 최초 호출 후
 * 필드명이 다르면 이 파일의 후보 배열에 실제 필드명을 추가하면 된다.
 */
export function pickField(record: Record<string, unknown>, candidates: string[]): string | undefined {
  for (const key of candidates) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") {
      return String(value);
    }
  }
  return undefined;
}

export function pickNumberField(record: Record<string, unknown>, candidates: string[]): number | null {
  const raw = pickField(record, candidates);
  if (raw === undefined) return null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}
