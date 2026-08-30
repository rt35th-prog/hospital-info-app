import { XMLParser } from "fast-xml-parser";
import { HiraApiError } from "./types";

/**
 * 공공데이터포털(data.go.kr) / 심평원(HIRA) Open API 공통 호출기.
 *
 * 서비스별 정확한 오퍼레이션명·응답 필드명은 data.go.kr에서 API 키가
 * 승인될 때 함께 제공되는 "활용가이드" 문서를 기준으로 한다. 이 파일은
 * 문서 기준으로 작성했지만 버전에 따라 필드명이 달라질 수 있으므로,
 * 실제 키 발급 후 아래 서비스별 파서(hospitals.ts, nonpayment.ts)에서
 * 필드 매핑만 손보면 되도록 구조를 분리해 두었다.
 */

// data.go.kr "서비스 정보" 화면에서 확인한 실제 End Point 그대로 사용한다.
const HIRA_BASE_URLS = {
  // 건강보험심사평가원_병원정보서비스 (data.go.kr 15001698)
  hospInfo: "https://apis.data.go.kr/B551182/hospInfoServicev2",
  // 건강보험심사평가원_비급여진료비정보조회서비스 (data.go.kr 15001700)
  nonPayment: "https://apis.data.go.kr/B551182/nonPaymentDamtInfoService",
} as const;

export type HiraServiceName = keyof typeof HIRA_BASE_URLS;

export function isMockMode(): boolean {
  if (process.env.HIRA_USE_MOCK === "true") return true;
  if (process.env.HIRA_USE_MOCK === "false") return false;
  // 서비스키가 설정돼 있지 않으면 자동으로 목(mock) 데이터 모드로 동작한다.
  return !process.env.HIRA_SERVICE_KEY;
}

/**
 * 의약품사용정보조회서비스는 오퍼레이션이 12개나 되고 정확한 엔드포인트/파라미터를
 * 문서로 확인하지 못한 상태라, 실제 엔드포인트가 확인되기 전까지는 항상 mock으로
 * 동작시킨다. HIRA_DRUG_USAGE_BASE_URL / HIRA_DRUG_USAGE_OPERATION을 함께
 * 설정해야만 실제 API를 호출한다(잘못된 추측 엔드포인트로 호출해 혼란스러운
 * 에러를 내는 것을 방지).
 */
export function isDrugUsageMockMode(): boolean {
  if (isMockMode()) return true;
  return !process.env.HIRA_DRUG_USAGE_BASE_URL || !process.env.HIRA_DRUG_USAGE_OPERATION;
}

interface HiraRawResponse {
  response?: {
    header?: { resultCode?: string; resultMsg?: string };
    body?: {
      items?: { item?: unknown } | string | unknown[];
      numOfRows?: number | string;
      pageNo?: number | string;
      totalCount?: number | string;
    };
  };
}

const xmlParser = new XMLParser({ ignoreAttributes: true, trimValues: true });

/** data.go.kr는 결과가 1건일 때 item을 배열이 아닌 단일 객체로 내려주므로 항상 배열로 정규화한다. */
function normalizeItems(raw: HiraRawResponse["response"]): Record<string, unknown>[] {
  const items = raw?.body?.items;
  if (!items || items === "") return [];
  if (Array.isArray(items)) return items as Record<string, unknown>[];
  const item = (items as { item?: unknown }).item;
  if (item === undefined) return [];
  return Array.isArray(item) ? (item as Record<string, unknown>[]) : [item as Record<string, unknown>];
}

export interface HiraFetchResult {
  items: Record<string, unknown>[];
  pageNo: number;
  numOfRows: number;
  totalCount: number;
}

export async function fetchHiraApi(
  service: HiraServiceName,
  operation: string,
  params: Record<string, string | number | undefined>,
): Promise<HiraFetchResult> {
  return callHiraEndpoint(`${HIRA_BASE_URLS[service]}/${operation}`, params);
}

/** 미리 등록되지 않은(베이스 URL을 환경변수 등으로 직접 지정하는) 서비스 호출용. */
export async function fetchHiraApiAtUrl(
  baseUrl: string,
  operation: string,
  params: Record<string, string | number | undefined>,
): Promise<HiraFetchResult> {
  return callHiraEndpoint(`${baseUrl}/${operation}`, params);
}

async function callHiraEndpoint(
  fullUrl: string,
  params: Record<string, string | number | undefined>,
): Promise<HiraFetchResult> {
  const serviceKey = process.env.HIRA_SERVICE_KEY;
  if (!serviceKey) {
    throw new HiraApiError(
      "HIRA_SERVICE_KEY가 설정되지 않았습니다. .env.local에 공공데이터포털에서 발급받은 서비스키를 넣어주세요.",
    );
  }

  const url = new URL(fullUrl);
  // data.go.kr에서 발급하는 서비스키는 이미 URL-encoding된 문자를 포함하는 경우가 많다.
  // URLSearchParams.set()은 값을 그대로 재-encoding하므로, 인증키는 직접 쿼리스트링에 붙인다.
  const searchParams = new URLSearchParams();
  searchParams.set("pageNo", String(params.pageNo ?? 1));
  searchParams.set("numOfRows", String(params.numOfRows ?? 20));
  searchParams.set("_type", "json");
  for (const [key, value] of Object.entries(params)) {
    if (key === "pageNo" || key === "numOfRows") continue;
    if (value === undefined || value === "") continue;
    searchParams.set(key, String(value));
  }
  url.search = `serviceKey=${serviceKey}&${searchParams.toString()}`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  const text = await res.text();

  if (!res.ok) {
    throw new HiraApiError(`HIRA API 호출 실패 (HTTP ${res.status}): ${text.slice(0, 300)}`);
  }

  let parsed: HiraRawResponse;
  try {
    parsed = JSON.parse(text);
  } catch {
    // 서비스키 오류 등은 JSON이 아닌 XML/평문으로 내려오는 경우가 있어 XML로 재시도한다.
    parsed = xmlParser.parse(text);
  }

  const header = parsed.response?.header;
  if (header && header.resultCode && header.resultCode !== "00") {
    throw new HiraApiError(header.resultMsg ?? "HIRA API 오류", header.resultCode);
  }

  const body = parsed.response?.body;
  return {
    items: normalizeItems(parsed.response),
    pageNo: Number(body?.pageNo ?? params.pageNo ?? 1),
    numOfRows: Number(body?.numOfRows ?? params.numOfRows ?? 20),
    totalCount: Number(body?.totalCount ?? 0),
  };
}
