#!/usr/bin/env node
/**
 * 심평원 보건의료빅데이터개방시스템 / 공공데이터포털에서 내려받은
 * "다빈도질병통계" 또는 "건강보험진료통계" CSV 파일을
 * src/data/disease-cost-stats.json 형식으로 변환한다.
 *
 * 사용법:
 *   node scripts/import-disease-stats.mjs <다운로드한.csv> [연도]
 *
 * CSV는 원본마다 컬럼명이 조금씩 다르므로, 아래 COLUMN_ALIASES에서
 * 실제 파일의 헤더명을 확인해 필요하면 후보를 추가하면 된다.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const COLUMN_ALIASES = {
  diseaseCode: ["상병기호", "상병코드", "질병코드", "질병소분류코드"],
  diseaseName: ["상병명", "질병명", "질병소분류명"],
  visitType: ["입원외래구분", "구분"],
  patientCount: ["진료실인원", "환자수", "요양급여실인원"],
  totalCost: ["요양급여비용총액", "총진료비", "진료비총액"],
  statYear: ["기준년도", "년도", "통계년도"],
};

function findColumn(headers, aliases) {
  return headers.find((h) => aliases.some((a) => h.replace(/\s/g, "").includes(a)));
}

function parseCsv(text) {
  // 표준 콤마 CSV 가정(따옴표로 감싼 필드 지원). 세미콜론/탭 구분 파일이면
  // 아래 split 구분자를 바꾸면 된다.
  const lines = text.replace(/\r\n/g, "\n").split("\n").filter(Boolean);
  const parseLine = (line) => line.match(/(".*?"|[^,]+)(?=,|$)/g)?.map((c) => c.replace(/^"|"$/g, "").trim()) ?? [];
  const headers = parseLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = parseLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? ""]));
  });
}

function toNumber(v) {
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

const [, , csvPath, yearArg] = process.argv;
if (!csvPath) {
  console.error("사용법: node scripts/import-disease-stats.mjs <csv경로> [연도]");
  process.exit(1);
}

const text = readFileSync(csvPath, "utf-8");
const rows = parseCsv(text);
const headers = Object.keys(rows[0] ?? {});

const colMap = Object.fromEntries(
  Object.entries(COLUMN_ALIASES).map(([key, aliases]) => [key, findColumn(headers, aliases)]),
);

const missing = Object.entries(colMap).filter(([, v]) => !v && v !== undefined);
if (!colMap.diseaseName || !colMap.totalCost) {
  console.error("필수 컬럼(질병명, 총진료비)을 CSV 헤더에서 찾지 못했습니다.");
  console.error("CSV 헤더:", headers);
  console.error("COLUMN_ALIASES를 실제 헤더에 맞게 수정해주세요.");
  process.exit(1);
}

const items = rows.map((row) => {
  const patientCount = colMap.patientCount ? toNumber(row[colMap.patientCount]) : 0;
  const totalCost = toNumber(row[colMap.totalCost]);
  return {
    diseaseCode: colMap.diseaseCode ? row[colMap.diseaseCode] : "",
    diseaseName: row[colMap.diseaseName],
    visitType: colMap.visitType ? row[colMap.visitType] || "전체" : "전체",
    patientCount,
    totalCost,
    avgCostPerPatient: patientCount > 0 ? Math.round(totalCost / patientCount) : 0,
    statYear: yearArg ? Number(yearArg) : colMap.statYear ? Number(row[colMap.statYear]) : new Date().getFullYear(),
  };
});

const outPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "data", "disease-cost-stats.json");
writeFileSync(
  outPath,
  JSON.stringify(
    {
      _meta: {
        source: path.basename(csvPath),
        note: "data.go.kr/opendata.hira.or.kr 원본 파일에서 import-disease-stats.mjs로 변환됨.",
        generatedAt: new Date().toISOString(),
      },
      items,
    },
    null,
    2,
  ),
);

console.log(`${items.length}건을 ${outPath} 에 저장했습니다.`);
if (missing.length) console.warn("일부 선택 컬럼을 찾지 못했습니다:", missing.map(([k]) => k));
