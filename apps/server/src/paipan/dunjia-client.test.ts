import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadConfig } from "../config/env.js";
import { PaipanClient } from "./paipan-client.js";

describe("PaipanClient Dunjia adapter", () => {
  it("normalizes the frozen sunland response", async () => {
    const samplePath = path.resolve(
      import.meta.dirname,
      "../../test/fixtures/dunjia-sunland-response.json",
    );
    const payload = JSON.parse(readFileSync(samplePath, "utf8")) as { data: unknown };
    const fetchImpl = async () => new Response(JSON.stringify(payload.data), { status: 200 });
    const client = new PaipanClient(
      loadConfig({ NODE_ENV: "test", PAIPAN_SERVICE_URL: "http://paipan.test" }).paipan,
      fetchImpl as typeof fetch,
    );

    const chart = await client.dunjiaChart({ chartDateTime: "2026-08-11 13:35" });

    expect(chart.overview).toMatchObject({
      dunType: "阴",
      juNumber: 5,
      xunShou: "甲辰壬",
      chiefStar: { name: "天蓬星", palace: 8 },
      chiefDoor: { name: "休", palace: 7 },
    });
    expect(chart.palaces).toHaveLength(9);
    expect(chart.palaces.find((palace) => palace.index === 8)).toMatchObject({
      isChief: true,
      isVoid: true,
      harms: [
        { symbol: "杜", type: "迫" },
        { symbol: "丁", type: "墓" },
      ],
    });
    expect(chart.heavenEarthGates).toHaveLength(12);
  });
});
