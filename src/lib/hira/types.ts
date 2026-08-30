// 심평원(HIRA) 공공데이터 API 응답을 앱 내부에서 쓰는 형태로 정규화한 타입 정의.

export interface Hospital {
  /** 암호화된 요양기호 (심평원이 발급하는 병원 식별자, 복호화 불가) */
  ykiho: string;
  name: string;
  /** 종별 코드명 (상급종합병원/종합병원/병원/의원 등) */
  clinicType: string;
  sidoName: string;
  sgguName: string;
  address: string;
  tel: string | null;
  homepage: string | null;
  establishedDate: string | null;
  doctorTotalCount: number | null;
  latitude: number | null;
  longitude: number | null;
}

export interface HospitalDepartment {
  code: string;
  name: string;
  doctorCount: number | null;
}

export interface NonPaymentItem {
  ykiho: string;
  hospitalName: string;
  sidoName: string;
  sgguName: string;
  /** 비급여 코드(npayCd) */
  itemCode: string;
  itemName: string;
  /** 최저 비용 (원). 병원 단건 조회(현재금액 1건)면 최고가와 같은 값이 들어간다. */
  minPrice: number | null;
  /** 최고 비용 (원) */
  maxPrice: number | null;
  updatedDate: string | null;
}

/** 비급여항목코드조회(getNonPaymentItemCodeList2) 결과 — 이름으로 항목을 찾을 때 쓴다. */
export interface NonPaymentCatalogItem {
  itemCode: string;
  itemName: string;
}

export interface DiseaseCostStat {
  /** 한국표준질병사인분류 코드 (소분류) */
  diseaseCode: string;
  diseaseName: string;
  /** 입원/외래 구분 */
  visitType: "입원" | "외래" | "전체";
  /** 전체 진료인원(명) */
  patientCount: number;
  /** 총 진료비(원) */
  totalCost: number;
  /** 1인당 평균 진료비(원) */
  avgCostPerPatient: number;
  /** 통계 기준 연도 */
  statYear: number;
}

export interface DrugUsageStat {
  /** 성분명 (제공되는 경우, 없으면 성분코드로 대체 표시) */
  drugName: string;
  /** 성분코드(gnlNmCd) */
  drugCode: string;
  /** 진료년월 (YYYYMM) */
  yearMonth: string;
  sidoName: string | null;
  sgguName: string | null;
  /** 사용량(청구건수 또는 처방량, 단위는 API 응답에 따름) */
  usageCount: number | null;
  /** 사용금액(원, 제공되는 경우) */
  usageAmount: number | null;
}

export interface PagedResult<T> {
  items: T[];
  pageNo: number;
  numOfRows: number;
  totalCount: number;
}

export class HiraApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "HiraApiError";
  }
}
