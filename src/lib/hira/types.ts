// 심평원(HIRA) 공공데이터 API 응답을 앱 내부에서 쓰는 형태로 정규화한 타입 정의.

/** 의사/한의사/치과의사 인원 상세 (일반의/인턴/레지던트/전문의) */
export interface StaffCount {
  general: number | null;
  intern: number | null;
  resident: number | null;
  specialist: number | null;
}

/**
 * 요양기관개폐업정보조회서비스(getHospPharmacyOpCloList1) 결과.
 * 요청 파라미터는 data.go.kr 활용신청 상세기능정보로 확인했지만, 응답 필드명은
 * 참고문서도 없고 포털 미리보기도 동작하지 않아 확인하지 못했다. 다른 HIRA API들의
 * 명명 관례(yadmNm, addr, telno 등)를 따를 것으로 가정해 방어적으로 파싱한다.
 */
export interface OpCloRecord {
  ykiho: string | null;
  name: string;
  /** 요양기관구분 (병원/약국) */
  institutionType: string | null;
  /** 개업/폐업/휴업 구분명 */
  statusName: string | null;
  address: string | null;
  tel: string | null;
  /** 기준년월(YYYYMM) */
  baseYearMonth: string | null;
}

export interface Hospital {
  /** 암호화된 요양기호 (심평원이 발급하는 병원 식별자, 복호화 불가) */
  ykiho: string;
  name: string;
  /** 종별코드 */
  clinicTypeCode: string;
  /** 종별 코드명 (상급종합병원/종합병원/병원/의원 등) */
  clinicType: string;
  sidoCode: string;
  sidoName: string;
  sgguCode: string;
  sgguName: string;
  /** 읍면동명 */
  emdongName: string | null;
  postCode: string | null;
  address: string;
  tel: string | null;
  homepage: string | null;
  establishedDate: string | null;
  doctorTotalCount: number | null;
  /** 의과 인원 상세 */
  medicalStaff: StaffCount;
  /** 치과 인원 상세 */
  dentalStaff: StaffCount;
  /** 한방 인원 상세 */
  orientalStaff: StaffCount;
  latitude: number | null;
  longitude: number | null;
  /** 검색 중심좌표로부터의 거리(m). xPos/yPos로 검색했을 때만 값이 있다. */
  distance: number | null;
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
  /** 병원이 실제 쓰는 명칭(yadmNpayCdNm). 병원 상세 조회에서만 제공된다. */
  hospitalItemName: string | null;
  /** 중분류명 (비교 조회에서만 제공) */
  midCategory: string | null;
  /** 소분류명 (비교 조회에서만 제공) */
  subCategory: string | null;
  /** 최저 비용 (원). 병원 단건 조회(현재금액 1건)면 최고가와 같은 값이 들어간다. */
  minPrice: number | null;
  /** 최고 비용 (원) */
  maxPrice: number | null;
  /** 적용개시일 */
  startDate: string | null;
  /** 적용종료일 (99991231이면 현재 유효) */
  endDate: string | null;
  /** 병원 자체 확인 URL */
  url: string | null;
}

/** 비급여항목코드조회(getNonPaymentItemCodeList2) 결과 — 이름으로 항목을 찾을 때 쓴다. */
export interface NonPaymentCatalogItem {
  itemCode: string;
  itemName: string;
  /** 중분류명 (예: 상급병실료차액) */
  midCategory: string | null;
  /** 소분류명 (예: 1인실) */
  subCategory: string | null;
  /** 상세분류명 */
  detailCategory: string | null;
  /** 항목 설명 */
  description: string | null;
  startDate: string | null;
  endDate: string | null;
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
