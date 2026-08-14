import { describe, expect, it } from "vitest";
import {
  isRegisteredPaipanIdentity,
  paipanContextRegistry,
} from "./paipan-context.registry.js";

describe("paipanContextRegistry", () => {
  it("registers every chart with one unique chart type and schema version", () => {
    const identities = Object.values(paipanContextRegistry).map(
      ({ chartType, schemaVersion }) => `${chartType}:${schemaVersion}`,
    );
    expect(identities).toHaveLength(11);
    expect(new Set(identities).size).toBe(identities.length);
  });

  it("rejects unknown chart types and mismatched schema versions", () => {
    expect(isRegisteredPaipanIdentity("shengping_zishi", "guoxue.paipan.bazi.v1")).toBe(true);
    expect(isRegisteredPaipanIdentity("dunjia", "guoxue.paipan.dunjia.v1")).toBe(true);
    expect(isRegisteredPaipanIdentity(
      "shijia_juece",
      "guoxue.paipan.shijia_juece.v1",
    )).toBe(true);
    expect(isRegisteredPaipanIdentity(
      "yinpan_juece",
      "guoxue.paipan.yinpan_juece.v1",
    )).toBe(true);
    expect(isRegisteredPaipanIdentity("meihua", "guoxue.paipan.meihua.v1")).toBe(true);
    expect(isRegisteredPaipanIdentity("luoji", "guoxue.paipan.luoji.v1")).toBe(true);
    expect(isRegisteredPaipanIdentity("shanxiang_juece", "guoxue.paipan.shanxiang_juece.v1")).toBe(true);
    expect(isRegisteredPaipanIdentity("xingxiang", "guoxue.paipan.xingxiang.v2")).toBe(true);
    expect(isRegisteredPaipanIdentity("xingxiang", "guoxue.paipan.xingxiang.v1")).toBe(false);
    expect(isRegisteredPaipanIdentity("shuzi_guilv", "guoxue.paipan.shuzi_guilv.v1")).toBe(true);
    expect(isRegisteredPaipanIdentity("xuankong_feixing", "guoxue.paipan.xuankong_feixing.v1")).toBe(true);
    expect(isRegisteredPaipanIdentity("xingming", "guoxue.paipan.xingming.v2")).toBe(true);
    expect(isRegisteredPaipanIdentity("unknown", "guoxue.paipan.unknown.v1")).toBe(false);
    expect(isRegisteredPaipanIdentity("dunjia", "guoxue.paipan.bazi.v1")).toBe(false);
  });
});
