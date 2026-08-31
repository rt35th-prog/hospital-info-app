#!/usr/bin/env node
// 이 앱이 쓰는 심평원(HIRA) API들의 "가공하지 않은 원본 응답"을 그대로 CSV로 저장한다.
// 노트북에서(이 sandbox가 아니라) .env.local에 진짜 HIRA_SERVICE_KEY를 넣고
//   npm.cmd run fetch:raw
// 로 실행하면 raw-samples/ 폴더에 API별 CSV 파일이 생긴다. 각 CSV는 엑셀에서 바로 열 수 있다.
//
// 주의: 아래 6개 오퍼레이션 중 "기간을 하루 단위로 지정"할 수 있는 것은 하나도 없다.
// - getHospBasisList / getNonPaymentItemCodeList2 / getNonPaymentItemHospList2 /
//   getNonPaymentItemHospDtlList: 날짜 파라미터 자체가 없다(스냅샷 데이터).
// - getCmpnAreaList1.2 / getHospPharmacyOpCloList1: diagYm/crtrYm이 "년월(YYYYMM)" 단위이고
//   더 잘게(일 단위)는 쪼갤 수 없다.
// 그래서 "하루치"가 아니라, 각 API에서 받아올 수 있는 가장 작은 단위로 표본을 소량(기본 30건)만
// 내려받는다.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { XMLParser } from "fast-xml-parser";

function loadEnvLocal() {
  try {
    const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // .env.local이 없으면 무시(환경변수가 이미 설정돼 있을 수도 있음)
  }
}
loadEnvLocal();

const SERVICE_KEY = process.env.HIRA_SERVICE_KEY;
if (!SERVICE_KEY) {
  console.error("HIRA_SERVICE_KEY가 없습니다. .env.local에 공공데이터포털 서비스키를 넣어주세요.");
  process.exit(1);
}

const BASE_URLS = {
  hospInfo: "https://apis.data.go.kr/B551182/hospInfoServicev2",
  nonPayment: "https://apis.data.go.kr/B551182/nonPaymentDamtInfoService",
  drugUsage: "https://apis.data.go.kr/B551182/msupUserInfoService1.2",
  opCloInfo: "https://apis.data.go.kr/B551182/yadmOpCloInfoService2",
};

const xmlParser = new XMLParser({ ignoreAttributes: true, trimValues: true });

function normalizeItems(raw) {
  const items = raw?.body?.items;
  if (!items || items === "") return [];
  if (Array.isArray(items)) return items;
  const item = items.item;
  if (item === undefined) return [];
  return Array.isArray(item) ? item : [item];
}

async function callApi(service, operation, params, label) {
  const url = new URL(`${BASE_URLS[service]}/${operation}`);
  const sp = new URLSearchParams();
  sp.set("pageNo", String(params.pageNo ?? 1));
  sp.set("numOfRows", String(params.numOfRows ?? 30));
  sp.set("_type", "json");
  for (const [k, v] of Object.entries(params)) {
    if (k === "pageNo" || k === "numOfRows") continue;
    if (v === undefined || v === "") continue;
    sp.set(k, String(v));
  }
  url.search = `serviceKey=${SERVICE_KEY}&${sp.toString()}`;

  console.log(`\n[${label}] 호출 중...`);
  console.log(`  ${url.origin}${url.pathname}?${sp.toString()}&serviceKey=(생략)`);

  const res = await fetch(url);
  const text = await res.text();

  if (!res.ok) {
    console.error(`  실패: HTTP ${res.status} — ${text.slice(0, 300)}`);
    return null;
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = xmlParser.parse(text);
  }

  const header = parsed.response?.header;
  if (header && header.resultCode && header.resultCode !== "00") {
    console.error(`  API 오류: [${header.resultCode}] ${header.resultMsg}`);
    return null;
  }

  const items = normalizeItems(parsed.response);
  const totalCount = Number(parsed.response?.body?.totalCount ?? 0);
  console.log(`  성공: 전체 ${totalCount}건 중 ${items.length}건 수신`);
  return items;
}

function toCsv(items) {
  if (items.length === 0) return "﻿(결과 없음)\n";
  const columns = [...new Set(items.flatMap((it) => Object.keys(it)))];
  const escape = (v) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [columns.join(",")];
  for (const item of items) {
    lines.push(columns.map((c) => escape(item[c])).join(","));
  }
  return "﻿" + lines.join("\n") + "\n";
}

function saveCsv(filename, items) {
  mkdirSync(new URL("../raw-samples/", import.meta.url), { recursive: true });
  const path = new URL(`../raw-samples/${filename}`, import.meta.url);
  writeFileSync(path, toCsv(items));
  console.log(`  저장: raw-samples/${filename}`);
}

async function main() {
  // 1) 병원정보서비스 — 스냅샷(날짜 파라미터 없음)
  const hospitals = await callApi("hospInfo", "getHospBasisList", { numOfRows: 30 }, "병원정보서비스");
  if (hospitals) saveCsv("01_hospInfo_getHospBasisList.csv", hospitals);
  const sampleYkiho = hospitals?.[0]?.ykiho;

  // 2) 비급여 항목코드 목록 — 스냅샷(날짜 파라미터 없음)
  const catalog = await callApi(
    "nonPayment",
    "getNonPaymentItemCodeList2",
    { numOfRows: 30 },
    "비급여 항목코드 목록",
  );
  if (catalog) saveCsv("02_nonPayment_getNonPaymentItemCodeList2.csv", catalog);
  const sampleItemCd = catalog?.[0]?.npayCd;

  // 3) 특정 비급여 항목을 파는 병원 목록 — itemCd 필수(위에서 얻은 첫 항목코드 사용)
  if (sampleItemCd) {
    const byItem = await callApi(
      "nonPayment",
      "getNonPaymentItemHospList2",
      { itemCd: sampleItemCd, numOfRows: 30 },
      `비급여 항목별 병원 목록 (itemCd=${sampleItemCd})`,
    );
    if (byItem) saveCsv("03_nonPayment_getNonPaymentItemHospList2.csv", byItem);
  } else {
    console.log("\n[비급여 항목별 병원 목록] 건너뜀 — 위 2번에서 항목코드를 얻지 못함");
  }

  // 4) 특정 병원의 비급여 항목 전체 — ykiho 필수(위에서 얻은 첫 병원 사용)
  if (sampleYkiho) {
    const byHosp = await callApi(
      "nonPayment",
      "getNonPaymentItemHospDtlList",
      { ykiho: sampleYkiho, numOfRows: 30 },
      `병원별 비급여 항목 전체 (ykiho=${sampleYkiho})`,
    );
    if (byHosp) saveCsv("04_nonPayment_getNonPaymentItemHospDtlList.csv", byHosp);
  } else {
    console.log("\n[병원별 비급여 항목 전체] 건너뜀 — 위 1번에서 병원을 얻지 못함");
  }

  // 5) 의약품 사용정보 — diagYm은 "년월" 단위가 최소 단위(일 단위 불가)
  const drugYm = process.env.RAW_SAMPLE_DIAG_YM || "202401";
  const drugCode = process.env.RAW_SAMPLE_GNL_NM_CD || "100701ACH";
  const drugUsage = await callApi(
    "drugUsage",
    "getCmpnAreaList1.2",
    { diagYm: drugYm, gnlNmCd: drugCode, insupTp: "0", cpmdPrscTp: "01", numOfRows: 30 },
    `의약품 사용정보 (diagYm=${drugYm}, gnlNmCd=${drugCode})`,
  );
  if (drugUsage) saveCsv("05_drugUsage_getCmpnAreaList1.2.csv", drugUsage);

  // 6) 개폐업 현황 — crtrYm도 "년월" 단위가 최소 단위(일 단위 불가)
  const opCloYm = process.env.RAW_SAMPLE_CRTR_YM || "202401";
  const opClo = await callApi(
    "opCloInfo",
    "getHospPharmacyOpCloList1",
    { crtrYm: opCloYm, numOfRows: 30 },
    `개폐업 현황 (crtrYm=${opCloYm})`,
  );
  if (opClo) saveCsv("06_opCloInfo_getHospPharmacyOpCloList1.csv", opClo);

  console.log("\n완료. raw-samples/ 폴더의 CSV 파일들을 더블클릭하면 엑셀에서 바로 열립니다.");
}

main();
