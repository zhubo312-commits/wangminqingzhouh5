import type { Guidance } from "@guoxue/contracts";
import { addDays, nowIso } from "../shared/time/beijing-date.js";
import { DifyClientError, type DifyClient } from "./dify-client.js";
import {
  type GuidanceRecord,
  type GuidanceRepository,
} from "./guidance.repository.js";

const seedGuidance: Guidance[] = [
  {
    text: "心静则事明，今日宜先理清轻重，再从容行动。",
    suitable: ["静心", "学习", "整理"],
    avoid: ["急躁", "冲动"],
  },
  {
    text: "循序而行更易有所得，先完成眼前小事，再谋长远。",
    suitable: ["规划", "沟通"],
    avoid: ["拖延", "争执"],
  },
  {
    text: "今日贵在守正与专注，把心力放在真正重要的人和事上。",
    suitable: ["专注", "陪伴"],
    avoid: ["分心", "勉强"],
  },
];

function seedForDate(date: string): Guidance {
  const index = [...date].reduce((total, character) => total + character.charCodeAt(0), 0) %
    seedGuidance.length;
  return seedGuidance[index]!;
}

export class GuidanceService {
  constructor(
    private readonly repository: GuidanceRepository,
    private readonly difyClient: DifyClient,
  ) {}

  getOrCreateForDate(date: string): GuidanceRecord {
    return this.repository.findByDate(date) ?? this.createStableFallback(date);
  }

  async generateForDate(
    date: string,
    options: { attempt: number; allowFallback: boolean },
  ): Promise<GuidanceRecord> {
    const existing = this.repository.findByDate(date);
    const startedAt = nowIso();
    if (existing?.source === "dify") {
      const finishedAt = nowIso();
      this.repository.recordRun({
        targetDate: date,
        attempt: options.attempt,
        status: "skipped",
        startedAt,
        finishedAt,
      });
      return existing;
    }

    try {
      const result = await this.difyClient.generate(date);
      const record = this.repository.save({
        date,
        guidance: result.guidance,
        source: "dify",
        sourceDate: null,
        workflowRunId: result.workflowRunId,
        generatedAt: nowIso(),
      });
      this.repository.recordRun({
        targetDate: date,
        attempt: options.attempt,
        status: "success",
        workflowRunId: result.workflowRunId,
        startedAt,
        finishedAt: nowIso(),
      });
      return record;
    } catch (error) {
      const code = error instanceof DifyClientError ? error.code : "GUIDANCE_UNKNOWN_ERROR";
      const message = error instanceof Error ? error.message : "Unknown guidance error";

      if (options.allowFallback) {
        const fallback = this.createStableFallback(date);
        this.repository.recordRun({
          targetDate: date,
          attempt: options.attempt,
          status: "fallback",
          errorCode: code,
          errorMessage: message,
          startedAt,
          finishedAt: nowIso(),
        });
        return fallback;
      }

      this.repository.recordRun({
        targetDate: date,
        attempt: options.attempt,
        status: "failed",
        errorCode: code,
        errorMessage: message,
        startedAt,
        finishedAt: nowIso(),
      });
      throw error;
    }
  }

  private createStableFallback(date: string): GuidanceRecord {
    const existing = this.repository.findByDate(date);
    if (existing) return existing;

    const historical = this.repository.findRandomRecentSuccessful(
      date,
      addDays(date, -30),
    );
    return this.repository.save({
      date,
      guidance: historical?.guidance ?? seedForDate(date),
      source: historical ? "fallback" : "seed",
      sourceDate: historical?.date ?? null,
      workflowRunId: null,
      generatedAt: nowIso(),
    });
  }
}
