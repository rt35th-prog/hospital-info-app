// 심평원 병원정보서비스(dgsbjtCd)의 진료과목코드(양방 기준).
// 치과/한방 세부 코드는 기관마다 표기가 갈려 정확도를 보장할 수 없어 제외했다.
// 필요 시 보건의료빅데이터개방시스템(opendata.hira.or.kr) 코드조회 메뉴에서
// 정식 코드표를 받아 추가하면 된다.
export const DEPARTMENT_LIST = [
  { code: "01", name: "내과" },
  { code: "02", name: "신경과" },
  { code: "03", name: "정신건강의학과" },
  { code: "04", name: "외과" },
  { code: "05", name: "정형외과" },
  { code: "06", name: "신경외과" },
  { code: "07", name: "흉부외과" },
  { code: "08", name: "성형외과" },
  { code: "09", name: "마취통증의학과" },
  { code: "10", name: "산부인과" },
  { code: "11", name: "소아청소년과" },
  { code: "12", name: "안과" },
  { code: "13", name: "이비인후과" },
  { code: "14", name: "피부과" },
  { code: "15", name: "비뇨의학과" },
  { code: "16", name: "영상의학과" },
  { code: "17", name: "방사선종양학과" },
  { code: "18", name: "병리과" },
  { code: "19", name: "진단검사의학과" },
  { code: "20", name: "결핵과" },
  { code: "21", name: "재활의학과" },
  { code: "22", name: "핵의학과" },
  { code: "23", name: "가정의학과" },
  { code: "24", name: "응급의학과" },
  { code: "25", name: "직업환경의학과" },
  { code: "26", name: "예방의학과" },
] as const;
