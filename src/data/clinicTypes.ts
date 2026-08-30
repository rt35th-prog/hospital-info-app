// 심평원 병원코드정보서비스(getMedicInsttClassesCodeList / clCd 설명)로 확인한 종별코드 전체 목록.
// 병원정보서비스(hospInfoServicev2) 활용가이드의 예시 목록엔 29(정신병원)가 별도로 있었는데,
// 최신 코드 서비스 목록엔 없어 혹시 몰라 같이 남겨둔다.
export const CLINIC_TYPE_LIST = [
  { code: "01", name: "상급종합병원" },
  { code: "05", name: "전문병원" },
  { code: "11", name: "종합병원" },
  { code: "21", name: "병원" },
  { code: "28", name: "요양병원" },
  { code: "29", name: "정신병원" },
  { code: "31", name: "의원" },
  { code: "41", name: "치과병원" },
  { code: "51", name: "치과의원" },
  { code: "61", name: "조산원" },
  { code: "71", name: "보건소" },
  { code: "72", name: "보건지소" },
  { code: "73", name: "보건진료소" },
  { code: "75", name: "보건의료원" },
  { code: "81", name: "약국" },
  { code: "91", name: "한방종합병원" },
  { code: "92", name: "한방병원" },
  { code: "93", name: "한의원" },
] as const;
