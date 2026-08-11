import { describe, expect, it } from "vitest";
import { displayProfileName } from "./BaziResultPage";

describe("displayProfileName", () => {
  it("姓名未填写时显示同修", () => {
    expect(displayProfileName("")).toBe("同修");
    expect(displayProfileName("   ")).toBe("同修");
  });

  it("姓名已填写时保留用户姓名", () => {
    expect(displayProfileName("张三")).toBe("张三");
  });
});
