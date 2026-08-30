import type { DiseaseCostStat, DrugUsageStat, Hospital, NonPaymentItem } from "./types";

// 서비스키가 없거나 HIRA_USE_MOCK=true일 때 화면/기능을 바로 확인해 볼 수 있도록 제공하는 샘플 데이터.
// 실제 값이 아니며, 개발/데모 용도로만 사용한다.

const MOCK_HOSPITALS: Hospital[] = [
  {
    ykiho: "MOCK0001",
    name: "서울행복종합병원",
    clinicType: "종합병원",
    sidoName: "서울특별시",
    sgguName: "강남구",
    address: "서울특별시 강남구 테헤란로 123",
    tel: "02-1234-5678",
    homepage: "http://example.com",
    establishedDate: "19950301",
    doctorTotalCount: 85,
    latitude: 37.4979,
    longitude: 127.0276,
  },
  {
    ykiho: "MOCK0002",
    name: "강남튼튼정형외과의원",
    clinicType: "의원",
    sidoName: "서울특별시",
    sgguName: "강남구",
    address: "서울특별시 강남구 역삼로 45",
    tel: "02-2345-6789",
    homepage: null,
    establishedDate: "20081120",
    doctorTotalCount: 3,
    latitude: 37.5006,
    longitude: 127.0365,
  },
  {
    ykiho: "MOCK0003",
    name: "부산제일병원",
    clinicType: "병원",
    sidoName: "부산광역시",
    sgguName: "해운대구",
    address: "부산광역시 해운대구 센텀중앙로 90",
    tel: "051-345-6789",
    homepage: null,
    establishedDate: "20010615",
    doctorTotalCount: 22,
    latitude: 35.1691,
    longitude: 129.1306,
  },
];

const MOCK_NONPAYMENT: NonPaymentItem[] = [
  {
    ykiho: "MOCK0001",
    hospitalName: "서울행복종합병원",
    sidoName: "서울특별시",
    sgguName: "강남구",
    itemCode: "MZ0710001",
    itemName: "물리치료/도수치료",
    minPrice: 50000,
    maxPrice: 150000,
    updatedDate: "20260101",
  },
  {
    ykiho: "MOCK0002",
    hospitalName: "강남튼튼정형외과의원",
    sidoName: "서울특별시",
    sgguName: "강남구",
    itemCode: "MZ0710001",
    itemName: "물리치료/도수치료",
    minPrice: 40000,
    maxPrice: 120000,
    updatedDate: "20260101",
  },
  {
    ykiho: "MOCK0003",
    hospitalName: "부산제일병원",
    sidoName: "부산광역시",
    sgguName: "해운대구",
    itemCode: "MZ0710001",
    itemName: "물리치료/도수치료",
    minPrice: 60000,
    maxPrice: 130000,
    updatedDate: "20260101",
  },
  {
    ykiho: "MOCK0001",
    hospitalName: "서울행복종합병원",
    sidoName: "서울특별시",
    sgguName: "강남구",
    itemCode: "MZ0720001",
    itemName: "물리치료/체외충격파치료(ESWT)",
    minPrice: 30000,
    maxPrice: 80000,
    updatedDate: "20260101",
  },
  {
    ykiho: "MOCK0002",
    hospitalName: "강남튼튼정형외과의원",
    sidoName: "서울특별시",
    sgguName: "강남구",
    itemCode: "MZ0720001",
    itemName: "물리치료/체외충격파치료(ESWT)",
    minPrice: 25000,
    maxPrice: 70000,
    updatedDate: "20260101",
  },
];

const MOCK_NONPAYMENT_CATALOG = Array.from(
  new Map(MOCK_NONPAYMENT.map((n) => [n.itemCode, { itemCode: n.itemCode, itemName: n.itemName }])).values(),
);

const MOCK_DISEASE_STATS: DiseaseCostStat[] = [
  { diseaseCode: "J20", diseaseName: "급성 기관지염", visitType: "외래", patientCount: 3200000, totalCost: 210_000_000_000, avgCostPerPatient: 65625, statYear: 2025 },
  { diseaseCode: "K05", diseaseName: "치은염 및 치주질환", visitType: "외래", patientCount: 2100000, totalCost: 180_000_000_000, avgCostPerPatient: 85714, statYear: 2025 },
  { diseaseCode: "I10", diseaseName: "본태성(원발성) 고혈압", visitType: "외래", patientCount: 1900000, totalCost: 320_000_000_000, avgCostPerPatient: 168421, statYear: 2025 },
  { diseaseCode: "M54", diseaseName: "등통증", visitType: "외래", patientCount: 1750000, totalCost: 260_000_000_000, avgCostPerPatient: 148571, statYear: 2025 },
  { diseaseCode: "E11", diseaseName: "2형 당뇨병", visitType: "외래", patientCount: 1600000, totalCost: 410_000_000_000, avgCostPerPatient: 256250, statYear: 2025 },
  { diseaseCode: "S72", diseaseName: "대퇴골 골절", visitType: "입원", patientCount: 45000, totalCost: 520_000_000_000, avgCostPerPatient: 11_555_556, statYear: 2025 },
  { diseaseCode: "I63", diseaseName: "뇌경색증", visitType: "입원", patientCount: 62000, totalCost: 610_000_000_000, avgCostPerPatient: 9_838_710, statYear: 2025 },
  { diseaseCode: "O80", diseaseName: "자연분만", visitType: "입원", patientCount: 180000, totalCost: 340_000_000_000, avgCostPerPatient: 1_888_889, statYear: 2025 },
];

const MOCK_DRUG_USAGE: DrugUsageStat[] = [
  { drugName: "고지혈증용제(스타틴계)", drugCode: "100701ACH", yearMonth: "202506", sidoName: "서울특별시", sgguName: "강남구", usageCount: 182000, usageAmount: 4_100_000_000 },
  { drugName: "혈압강하제(ARB계)", drugCode: "214902ATB", yearMonth: "202506", sidoName: "서울특별시", sgguName: "서초구", usageCount: 210000, usageAmount: 5_300_000_000 },
  { drugName: "당뇨병용제(DPP-4 억제제)", drugCode: "396801ATB", yearMonth: "202506", sidoName: "서울특별시", sgguName: "강남구", usageCount: 95000, usageAmount: 3_800_000_000 },
  { drugName: "소화성궤양용제(PPI)", drugCode: "246501ATB", yearMonth: "202506", sidoName: "부산광역시", sgguName: "해운대구", usageCount: 130000, usageAmount: 1_900_000_000 },
  { drugName: "해열진통소염제(NSAID)", drugCode: "150501ATB", yearMonth: "202506", sidoName: "부산광역시", sgguName: "해운대구", usageCount: 260000, usageAmount: 1_200_000_000 },
];

export function mockSearchHospitals(filter: { sidoCd?: string; name?: string }): Hospital[] {
  return MOCK_HOSPITALS.filter((h) => {
    if (filter.name && !h.name.includes(filter.name)) return false;
    return true;
  });
}

export function mockGetHospital(ykiho: string): Hospital | undefined {
  return MOCK_HOSPITALS.find((h) => h.ykiho === ykiho);
}

export function mockNonPaymentByHospital(ykiho: string): NonPaymentItem[] {
  return MOCK_NONPAYMENT.filter((n) => n.ykiho === ykiho);
}

export function mockNonPaymentByItem(itemCode: string): NonPaymentItem[] {
  return MOCK_NONPAYMENT.filter((n) => n.itemCode === itemCode);
}

export function mockNonPaymentCatalog(keyword: string): { itemCode: string; itemName: string }[] {
  return MOCK_NONPAYMENT_CATALOG.filter((c) => c.itemName.includes(keyword));
}

export function mockDiseaseStats(): DiseaseCostStat[] {
  return MOCK_DISEASE_STATS;
}

export function mockDrugUsage(filter: { keyword?: string }): DrugUsageStat[] {
  if (!filter.keyword) return MOCK_DRUG_USAGE;
  return MOCK_DRUG_USAGE.filter((d) => d.drugName.includes(filter.keyword!));
}
