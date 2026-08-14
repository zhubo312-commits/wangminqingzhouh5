import { describe, expect, it } from "vitest";
import { parseCharacterPage, parseIndexPage, parseScanPage } from "./parser.js";

const characterHtml = `<!doctype html><html><head><link rel="canonical" href="/kangxi/25061.html"></head><body>
<div class="leftbox"><div class="panel"><div class="mcon">
  <div class="zipic"><img src="/static/kai/cn/9633.svg" alt="阳"></div><span class="f24">阳</span>
  <span class="attr_name">拼音</span><span><a data-mp3="/audio/zd/py/yáng.mp3">yáng</a></span>
  <span class="attr_name">注音</span><span><a data-mp3="/audio/zd/zy/test.mp3">ㄧㄤˊ</a></span>
  <span class="attr_name">部首</span><span>阝部</span><span class="attr_name">总笔画</span><span>6画</span>
  <span class="attr_name">康熙笔画</span><span>(阳:12)画</span><span class="attr_name">部首</span><span>阜</span>
  <span class="attr_name">部首笔画</span><span>8画</span><span class="attr_name">部外</span><span>4画</span>
  <span class="attr_name">五笔</span><span>bjg</span><span class="attr_name">仓颉</span><span>nla</span>
  <span class="attr_name">四角号码</span><span>76200</span><span class="attr_name">统一码</span><span>基本区 U 9633</span>
  <span class="attr_name">结构</span><span>左右结构</span>
  <ul class="fz"><li><div>推荐度<em>95%</em></div><div style="width:95%"></div></li>
  <li><div>文化印象<em>94%</em></div><div style="width:94%"></div></li>
  <li><div>字性<em>3</em></div><div style="width:30%"></div><p><span>0偏男</span><span>中性</span><span>9偏女</span></p></li></ul>
  <p class="indent">五行属性：土</p><p class="indent">吉凶寓意：吉</p><p class="indent">是否为常用字：是</p>
  <p class="indent">姓名学：姓,多用男性</p><h3>取名含义</h3>
  <p class="indent">姓名学解释：阳光。</p><p class="indent">起名意思：太阳。</p><p class="indent">取名寓意：温暖明亮。</p>
  <p class="indent">使用次数：每千万人出现次数约100次，用于第一个字占：80%，男孩名字占61%，女孩名字占：39%。</p>
  <h3>取名忌讳：</h3><p class="indent">1、阳字五行属性为土。</p>
</div></div>
<div class="panel"><div class="mcon"><h3>阳同五行吉利字</h3><a href="/kangxi/23394.html"><span>chén</span>辰</a></div></div>
<div class="panel"><div class="mcon noi"><h2>康熙字典</h2><p><a href="/tupian/tw_1347.html">同文本：P1347</a></p><p>與陽同。<img src="/static/cjkext/a.svg" alt="𨹈"></p></div></div>
<div class="panel"><div class="mcon noi"><h2>说文解字</h2><h3>《说文解字白话版》</h3><p>陽，高而亮。</p></div></div>
<div class="panel"><div class="mcon noi"><h2>汉语字典</h2><p>◎ <strong>阳</strong></p><p>陽 <span>yáng</span></p><p>太阳。</p></div></div>
</div></body></html>`;

describe("Kangxi HTML parsers", () => {
  it("preserves identity, separate stroke systems, naming content, relations and assets", () => {
    const parsed = parseCharacterPage(characterHtml, "https://www.kangxizidian.cn/kangxi/25061.html");
    expect(parsed.glyph).toBe("阳");
    expect(parsed.codepoint).toBe(0x9633);
    expect(parsed.modernStrokes).toBe(6);
    expect(parsed.websiteNamingStrokes).toBe(12);
    expect(parsed.strictKangxiStrokes).toEqual([{ glyph: "阳", strokes: 12 }]);
    expect(parsed.naming).toMatchObject({ element: "土", recommendationPercent: 95, genderTendency: 3, usageCount: 100 });
    expect(parsed.formCandidates).toEqual([expect.objectContaining({ glyph: "陽", relationType: "traditional" })]);
    expect(parsed.sections.map((section) => section.type)).toEqual(expect.arrayContaining(["kangxi", "shuowen_plain", "modern_dictionary"]));
    expect(parsed.sections.find((section) => section.type === "kangxi")?.plainText).toContain("𨹈");
    expect(parsed.relations[0]).toMatchObject({ type: "same_element", targetGlyph: "辰" });
    expect(parsed.scanReferences[0]).toMatchObject({ editionKey: "tw", pageNumber: 1347 });
    expect(parsed.assets.map((asset) => asset.kind)).toEqual(expect.arrayContaining(["glyph", "inline_glyph", "pinyin_audio", "zhuyin_audio"]));
  });

  it("uses explicit absence reasons instead of inventing missing rare-character content", () => {
    const html = `<div class="leftbox"><div class="panel"><div class="mcon"><div class="zipic"><img alt="乚"></div><span class="f24">乚</span><span class="attr_name">拼音</span><span><a>yǐ</a></span><span class="attr_name">总笔画</span><span>1画</span></div></div></div>`;
    const parsed = parseCharacterPage(html, "https://www.kangxizidian.cn/kangxi/6672.html");
    expect(parsed.naming.absenceReason).toBe("source_page_has_no_naming_profile");
    expect(parsed.absenceReason).toBe("source_page_has_no_dictionary_or_naming_content");
    expect(parsed.sections).toEqual([]);
  });

  it("preserves a source-declared zero stroke without promoting it to canonical naming strokes", () => {
    const html = `<div class="leftbox"><div class="panel"><div class="mcon">
      <div class="zipic"><img alt="台"></div><span class="f24">台</span>
      <span class="attr_name">总笔画</span><span>5画</span>
      <span class="attr_name">康熙笔画</span><span>(台:0)画</span>
    </div></div></div>`;
    const parsed = parseCharacterPage(html, "https://www.kangxizidian.cn/kangxi/8102.html");
    expect(parsed.modernStrokes).toBe(5);
    expect(parsed.strictKangxiStrokes).toEqual([{ glyph: "台", strokes: 0 }]);
    expect(parsed.websiteNamingStrokes).toBeNull();
    expect(parsed.rawFields["康熙笔画"]).toEqual(["(台:0)画"]);
  });

  it("does not promote a non-five-element source typo into canonical data", () => {
    const html = `<div class="leftbox"><div class="panel"><div class="mcon">
      <div class="zipic"><img alt="饰"></div><span class="f24">饰</span>
      <p class="indent">五行属性：岁</p>
    </div></div></div>`;
    const parsed = parseCharacterPage(html, "https://www.kangxizidian.cn/kangxi/25890.html");
    expect(parsed.naming.element).toBeNull();
    expect(html).toContain("五行属性：岁");
  });

  it("keeps structured index counts separate from untrusted SEO counts", () => {
    const html = `<head><meta name="description" content="一共有7007个"></head><h3>笔画数为12画，五行属金的汉字</h3><ul><li><a href="/kangxi/1.html"><span>yī</span>一<span class="ziqu">吉</span></a></li></ul>`;
    const parsed = parseIndexPage(html, "https://www.kangxizidian.cn/bihua/12.html");
    expect(parsed.entries[0]).toMatchObject({ glyph: "一", strokeCount: 12, element: "金", auspiciousness: "吉" });
    expect(parsed.groups[0]?.seoDeclaredCount).toBe(7007);
  });

  it("deduplicates fragment-only navigation links as one HTTP resource", () => {
    const html = `<a href="/pinyin/#A">A</a><a href="/pinyin/#B">B</a><a href="/pinyin/a.html">a</a>
      <a href="/shengxiao/long.html">生肖龙</a><a href="/kangxi/nvhaichangyongzi-tu.html">女孩土属性常用字</a>
      <a href="https://untrusted.example/kangxi/1.html">外站伪装详情</a>`;
    const parsed = parseIndexPage(html, "https://www.kangxizidian.cn/pinyin/");
    expect(parsed.links.map((link) => link.url)).toEqual([
      "https://www.kangxizidian.cn/pinyin/",
      "https://www.kangxizidian.cn/pinyin/a.html",
      "https://www.kangxizidian.cn/shengxiao/long.html",
      "https://www.kangxizidian.cn/kangxi/nvhaichangyongzi-tu.html",
    ]);
    expect(parsed.links.slice(-2).map((link) => link.kind)).toEqual(["index", "index"]);
  });

  it("parses scan navigation and remote image assets", () => {
    const html = `<h1>同文本</h1><div class="leftbox"><a href="/tupian/tw_1.html">上一页</a><a href="/tupian/tw_3.html">下一页</a><img src="https://cdn.example/book/2.jpg"></div>`;
    const parsed = parseScanPage(html, "https://www.kangxizidian.cn/tupian/tw_2.html");
    expect(parsed).toMatchObject({ editionKey: "tw", pageNumber: 2 });
    expect(parsed.imageUrl).toBeNull();
  });
});
