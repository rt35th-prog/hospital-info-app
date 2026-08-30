import type { DiseaseCostStat } from "./hira/types";
import raw from "@/data/disease-cost-stats.json";

interface DiseaseStatsFile {
  _meta: { source: string; note: string; generatedAt: string };
  items: DiseaseCostStat[];
}

const data = raw as DiseaseStatsFile;

export function loadDiseaseStats(): DiseaseCostStat[] {
  return data.items;
}

export function isDiseaseStatsSample(): boolean {
  return data._meta.source === "SAMPLE_DATA";
}

export function diseaseStatsSourceNote(): string {
  return data._meta.note;
}
