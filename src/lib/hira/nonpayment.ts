import { fetchHiraApi, isMockMode } from "./client";
import { pickField, pickNumberField } from "./field-utils";
import { mockNonPaymentAll, mockNonPaymentByHospital } from "./mock";
import type { NonPaymentItem, PagedResult } from "./types";

// 비급여진료비정보조회서비스는 심평원 활용가이드 버전에 따라 항목코드/금액
// 필드명이 다르게 내려온 사례가 보고돼 있어, 후보 필드명을 여러 개 등록해
// 방어적으로 파싱한다. 실제 키로 첫 호출 후 콘솔에 원본 응답을 찍어보고
// 필요하면 후보 배열을 조정하면 된다.
function toNonPaymentItem(item: Record<string, unknown>): NonPaymentItem {
  return {
    ykiho: pickField(item, ["ykiho"]) ?? "",
    hospitalName: pickField(item, ["yadmNm"]) ?? "",
    sidoName: pickField(item, ["sidoCdNm"]) ?? "",
    sgguName: pickField(item, ["sgguCdNm"]) ?? "",
    itemCode: pickField(item, ["npayCd", "itemCd"]) ?? "",
    itemName: pickField(item, ["npayKorNm", "itemNm", "clsfNm"]) ?? "",
    minPrice: pickNumberField(item, ["curAmtMin", "amtMin", "minPrice"]),
    maxPrice: pickNumberField(item, ["curAmtMax", "amtMax", "maxPrice"]),
    avgPrice: pickNumberField(item, ["curAmtAvg", "amtAvg", "avgPrice"]),
    updatedDate: pickField(item, ["adtDate", "updateDate", "clcYm"]) ?? null,
  };
}

export interface NonPaymentSearchParams {
  ykiho?: string;
  sidoCd?: string;
  sgguCd?: string;
  pageNo?: number;
  numOfRows?: number;
}

export async function searchNonPayment(params: NonPaymentSearchParams): Promise<PagedResult<NonPaymentItem>> {
  if (isMockMode()) {
    const items = params.ykiho ? mockNonPaymentByHospital(params.ykiho) : mockNonPaymentAll();
    return { items, pageNo: 1, numOfRows: items.length, totalCount: items.length };
  }

  const result = await fetchHiraApi("nonPayment", "getNonPaymentItemHospDtlList", {
    ykiho: params.ykiho,
    sidoCd: params.sidoCd,
    sgguCd: params.sgguCd,
    pageNo: params.pageNo,
    numOfRows: params.numOfRows ?? 100,
  });

  return {
    items: result.items.map(toNonPaymentItem),
    pageNo: result.pageNo,
    numOfRows: result.numOfRows,
    totalCount: result.totalCount,
  };
}

/** 지역 내에서 조회된 비급여 항목들 중 서로 다른 항목명 목록을 뽑아 비교 대상 선택 UI에 쓴다. */
export function distinctItemNames(items: NonPaymentItem[]): string[] {
  return Array.from(new Set(items.map((i) => i.itemName).filter(Boolean))).sort();
}
