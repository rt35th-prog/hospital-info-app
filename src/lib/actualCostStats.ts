import regionByType from "@/data/actual-costs/region-by-type.json";
import typeByDept from "@/data/actual-costs/type-by-dept.json";
import regionByDistrict from "@/data/actual-costs/region-by-district.json";
import ageGender from "@/data/actual-costs/age-gender.json";
import rareDisease from "@/data/actual-costs/rare-disease.json";

// 심평원이 실제로 공개한 요양급여비용 통계 파일(사용자가 opendata.hira.or.kr에서 내려받아
// 전달)을 그대로 옮긴 실측 데이터다. 다른 기능들과 달리 샘플/mock이 아니다.

export interface ActualCostStat {
  /** 진료년도 */
  year: number;
  /** 이 데이터셋의 분류축을 조합한 표시용 라벨 (예: "서울 · 종합병원") */
  label: string;
  /** 환자수 */
  patientCount: number;
  /** 명세서청구건수 */
  claimCount: number;
  /** 입내원일수 */
  visitDays: number;
  /** 보험자부담금(원) */
  insurerPaidAmount: number;
  /** 요양급여비용총액(원) */
  totalCost: number;
}

interface ActualCostFile {
  _meta: { source: string; dimensions: string[]; note?: string };
  items: ActualCostStat[];
}

export type ActualCostDatasetKey = "region-by-type" | "type-by-dept" | "region-by-district" | "age-gender" | "rare-disease";

export const ACTUAL_COST_DATASETS: { key: ActualCostDatasetKey; title: string; years: string }[] = [
  { key: "region-by-type", title: "지역 × 요양기관종별", years: "2024" },
  { key: "type-by-dept", title: "요양기관종별 × 진료과목", years: "2024" },
  { key: "region-by-district", title: "지역 × 시군구", years: "2025" },
  { key: "age-gender", title: "성별 × 연령대 (입원환자)", years: "2018~2020" },
  { key: "rare-disease", title: "희귀질환 상병코드별", years: "2022" },
];

const FILES: Record<ActualCostDatasetKey, ActualCostFile> = {
  "region-by-type": regionByType as ActualCostFile,
  "type-by-dept": typeByDept as ActualCostFile,
  "region-by-district": regionByDistrict as ActualCostFile,
  "age-gender": ageGender as ActualCostFile,
  "rare-disease": rareDisease as ActualCostFile,
};

export function loadActualCostStats(key: ActualCostDatasetKey): ActualCostStat[] {
  return FILES[key].items;
}

export function actualCostDatasetMeta(key: ActualCostDatasetKey) {
  return FILES[key]._meta;
}
