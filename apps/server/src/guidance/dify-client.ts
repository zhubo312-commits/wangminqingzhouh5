import { GuidanceSchema, type Guidance } from "@guoxue/contracts";
import { z } from "zod";
import type { AppConfig } from "../config/env.js";

const DifyResponseSchema = z.object({
  workflow_run_id: z.string().optional(),
  data: z.object({
    id: z.string().optional(),
    status: z.string(),
    outputs: z.record(z.string(), z.unknown()).optional(),
    error: z.string().nullable().optional(),
  }),
});

export class DifyClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "DifyClientError";
  }
}

export interface DifyGuidanceResult {
  guidance: Guidance;
  workflowRunId: string | null;
}

export class DifyClient {
  constructor(
    private readonly config: AppConfig["dify"],
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  isConfigured(): boolean {
    return Boolean(this.config.baseUrl && this.config.apiKey);
  }

  async generate(date: string): Promise<DifyGuidanceResult> {
    if (!this.config.baseUrl || !this.config.apiKey) {
      throw new DifyClientError("DIFY_NOT_CONFIGURED", "Dify is not configured");
    }

    let response: Response;
    try {
      response = await this.fetchImpl(`${this.config.baseUrl}/workflows/run`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: { date },
          response_mode: "blocking",
          user: this.config.user,
        }),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown network error";
      throw new DifyClientError("DIFY_NETWORK_ERROR", message);
    }

    if (!response.ok) {
      throw new DifyClientError(
        "DIFY_HTTP_ERROR",
        `Dify returned HTTP ${response.status}`,
      );
    }

    const payload = DifyResponseSchema.safeParse(await response.json());
    if (!payload.success) {
      throw new DifyClientError(
        "DIFY_INVALID_RESPONSE",
        "Dify response does not match the workflow contract",
      );
    }

    if (payload.data.data.status !== "succeeded") {
      throw new DifyClientError(
        "DIFY_WORKFLOW_FAILED",
        payload.data.data.error || `Dify workflow status: ${payload.data.data.status}`,
      );
    }

    const outputs = payload.data.data.outputs ?? {};
    const guidance = GuidanceSchema.safeParse({
      text: outputs.guidance,
      suitable: outputs.suitable,
      avoid: outputs.avoid,
    });
    if (!guidance.success) {
      throw new DifyClientError(
        "DIFY_INVALID_OUTPUTS",
        "Dify outputs must contain guidance, suitable[] and avoid[]",
      );
    }

    return {
      guidance: guidance.data,
      workflowRunId:
        payload.data.workflow_run_id ?? payload.data.data.id ?? null,
    };
  }
}
