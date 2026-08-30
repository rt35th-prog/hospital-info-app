import { fetchHiraApi, isMockMode } from "./client";
import { pickField, pickNumberField } from "./field-utils";
import { mockNonPaymentByHospital, mockNonPaymentCatalog, mockNonPaymentByItem } from "./mock";
import type { NonPaymentCatalogItem, NonPaymentItem, PagedResult } from "./types";

/**
 * 건강보험심사평가원_비급여진료비정보조회서비스 (data.go.kr 15001700)의
 * OpenAPI 활용가이드(2020-05-15)로 확인한 3개 오퍼레이션을 쓴다.
 *
 * - getNonPaymentItemCodeList2 (비급여항목코드조회): 필터 없이 전체 비급여 코드/이름 목록을
 *   페이지 단위로 반환한다. 이름으로 항목을 찾는 용도로 쓴다.
 * - getNonPaymentItemHospList2 (비급여항목병원목록요약): itemCd가 **필수**다. 특정 비급여
 *   항목을 파는 병원들의 최소/최대가격을 지역/종별/병원명으로 좁혀 비교할 때 쓴다.
 * - getNonPaymentItemHospDtlList (비급여항목병원목록상세): ykiho가 **필수**다. 특정 병원이
 *   보유한 비급여 항목 전체(각 항목의 단일 현재금액)를 조회할 때 쓴다.
 *
 * 응답 필드명은 활용가이드 예제 그대로다(추정 아님).
 */

function toCatalogItem(item: Record<string, unknown>): NonPaymentCatalogItem {
  return {
    itemCode: pickField(item, ["npayCd"]) ?? "",
    itemName: pickField(item, ["npayKorNm"]) ?? "",
    midCategory: pickField(item, ["npayMdivCdNm"]) ?? null,
    subCategory: pickField(item, ["npaySdivCdNm"]) ?? null,
    detailCategory: pickField(item, ["npayDtlDivCdNm"]) ?? null,
    description: pickField(item, ["cmmtTxt"]) ?? null,
    startDate: pickField(item, ["adtFrDd"]) ?? null,
    endDate: pickField(item, ["adtEndDd"]) ?? null,
  };
}

function toHospitalSummary(item: Record<string, unknown>): NonPaymentItem {
  return {
    ykiho: pickField(item, ["ykiho"]) ?? "",
    hospitalName: pickField(item, ["yadmNm"]) ?? "",
    sidoName: pickField(item, ["sidoCdNm"]) ?? "",
    sgguName: pickField(item, ["sgguCdNm"]) ?? "",
    itemCode: pickField(item, ["npayCd"]) ?? "",
    itemName: pickField(item, ["npayKorNm"]) ?? "",
    hospitalItemName: null,
    midCategory: pickField(item, ["npayMdivCdNm"]) ?? null,
    subCategory: pickField(item, ["npaySdivCdNm"]) ?? null,
    minPrice: pickNumberField(item, ["minPrc"]),
    maxPrice: pickNumberField(item, ["maxPrc"]),
    startDate: pickField(item, ["adtFrDd"]) ?? null,
    endDate: pickField(item, ["adtEndDd"]) ?? null,
    url: pickField(item, ["urlAddr"]) ?? null,
  };
}

function toHospitalDetailItem(item: Record<string, unknown>): NonPaymentItem {
  const curAmt = pickNumberField(item, ["curAmt"]);
  return {
    ykiho: pickField(item, ["ykiho"]) ?? "",
    hospitalName: pickField(item, ["yadmNm"]) ?? "",
    sidoName: pickField(item, ["sidoCdNm"]) ?? "",
    sgguName: pickField(item, ["sgguCdNm"]) ?? "",
    itemCode: pickField(item, ["npayCd"]) ?? "",
    itemName: pickField(item, ["npayKorNm"]) ?? "",
    hospitalItemName: pickField(item, ["yadmNpayCdNm"]) ?? null,
    midCategory: null,
    subCategory: null,
    minPrice: curAmt,
    maxPrice: curAmt,
    startDate: pickField(item, ["adtFrDd"]) ?? null,
    endDate: pickField(item, ["adtEndDd"]) ?? null,
    url: pickField(item, ["urlAddr"]) ?? null,
  };
}

/** 비급여 코드/이름 전체 목록에서 이름에 keyword가 들어간 것만 찾는다(자동완성용). */
export async function searchNonPaymentCatalog(keyword: string): Promise<NonPaymentCatalogItem[]> {
  if (isMockMode()) {
    return mockNonPaymentCatalog(keyword);
  }
  if (!keyword.trim()) return [];

  // 이 오퍼레이션은 이름 검색 파라미터가 없어 큰 페이지를 받아와 클라이언트 쪽에서 걸러낸다.
  const result = await fetchHiraApi("nonPayment", "getNonPaymentItemCodeList2", { numOfRows: 1000 });
  return result.items
    .map(toCatalogItem)
    .filter((c) => c.itemName.includes(keyword))
    .slice(0, 20);
}

export interface NonPaymentByItemParams {
  itemCode: string;
  sidoCd?: string;
  sgguCd?: string;
  clCd?: string;
  yadmNm?: string;
  pageNo?: number;
  numOfRows?: number;
}

/** 특정 비급여 항목을 파는 병원들을 지역/종별로 좁혀 가격을 비교한다. */
export async function searchNonPaymentByItem(params: NonPaymentByItemParams): Promise<PagedResult<NonPaymentItem>> {
  if (isMockMode()) {
    const items = mockNonPaymentByItem(params.itemCode);
    return { items, pageNo: 1, numOfRows: items.length, totalCount: items.length };
  }

  const result = await fetchHiraApi("nonPayment", "getNonPaymentItemHospList2", {
    itemCd: params.itemCode,
    sidoCd: params.sidoCd,
    sgguCd: params.sgguCd,
    clCd: params.clCd,
    yadmNm: params.yadmNm,
    pageNo: params.pageNo,
    numOfRows: params.numOfRows ?? 100,
  });

  return {
    items: result.items.map(toHospitalSummary),
    pageNo: result.pageNo,
    numOfRows: result.numOfRows,
    totalCount: result.totalCount,
  };
}

/** 특정 병원이 등록한 비급여 항목 전체를 조회한다(병원 상세 페이지용). */
export async function searchNonPaymentByHospital(ykiho: string): Promise<PagedResult<NonPaymentItem>> {
  if (isMockMode()) {
    const items = mockNonPaymentByHospital(ykiho);
    return { items, pageNo: 1, numOfRows: items.length, totalCount: items.length };
  }

  const result = await fetchHiraApi("nonPayment", "getNonPaymentItemHospDtlList", {
    ykiho,
    numOfRows: 200,
  });

  return {
    items: result.items.map(toHospitalDetailItem),
    pageNo: result.pageNo,
    numOfRows: result.numOfRows,
    totalCount: result.totalCount,
  };
}
