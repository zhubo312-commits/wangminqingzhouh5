import * as cheerio from "cheerio";
import type { Cheerio, CheerioAPI } from "cheerio";
import type { AnyNode } from "domhandler";
import {
  type AssetKind,
  type AssetReference,
  type DiscoveredLink,
  type IndexEntry,
  type IndexGroup,
  type ParsedCharacterPage,
  type ParsedDictionarySection,
  type ParsedIndexPage,
  type ParsedNamingProfile,
  type ParsedRelation,
  type ParsedScanPage,
  type ParsedScanReference,
  type PronunciationValue,
} from "../domain/types.js";
import { ParseError } from "../shared/errors.js";
import { firstCodePoint } from "../shared/unicode.js";

const CHARACTER_PATH = /^\/kangxi\/(\d+)\.html$/;
const SCAN_PATH = /^\/tupian\/([a-z]+)_(\d+)\.html$/;
const ELEMENTS = new Set(["金", "木", "水", "火", "土"]);

function absoluteUrl(baseUrl: string, value: string | undefined): string | null {
  if (!value || value.startsWith("data:") || value.startsWith("javascript:")) return null;
  try {
    const url = new URL(value, baseUrl);
    // Fragments address a section inside one HTTP resource. Keeping them in
    // the crawl key schedules the same page repeatedly (notably /pinyin/#A).
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function compact(value: string): string {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function normalizedText(node: Cheerio<AnyNode>): string {
  return compact(node.text());
}

function integerFrom(value: string | null | undefined): number | null {
  const match = value?.match(/-?\d+/);
  return match ? Number(match[0]) : null;
}

function percentFrom(value: string | null | undefined): number | null {
  const valueNumber = integerFrom(value);
  return valueNumber !== null && valueNumber >= 0 && valueNumber <= 100 ? valueNumber : null;
}

function classifyLink(url: URL): DiscoveredLink["kind"] {
  if (CHARACTER_PATH.test(url.pathname)) return "character";
  if (SCAN_PATH.test(url.pathname)) return "scan";
  if (url.pathname.includes("search.php")) return "search";
  if (/^\/(bihua|wuxing|pinyin|bushou|jixiong|pingze|xingmingxue|shengxiao)(\/|$)/.test(url.pathname)) return "index";
  // The site also hosts naming collections under non-numeric /kangxi/*.html
  // paths (common characters, gender collections, jade-related characters,
  // and their five-element variants). They are index pages, not character
  // detail pages, and belong to the union used for discovery.
  if (/^\/kangxi\/[^/]+\.html$/.test(url.pathname)) return "index";
  return "unknown";
}

function collectLinks($: CheerioAPI, baseUrl: string): DiscoveredLink[] {
  const baseHost = new URL(baseUrl).hostname;
  const seen = new Set<string>();
  const output: DiscoveredLink[] = [];
  $("a[href]").each((_, element) => {
    const absolute = absoluteUrl(baseUrl, $(element).attr("href"));
    if (!absolute) return;
    const url = new URL(absolute);
    if (url.hostname !== baseHost) return;
    const kind = classifyLink(url);
    if (kind === "unknown" || seen.has(absolute)) return;
    seen.add(absolute);
    const sourceKey = CHARACTER_PATH.exec(url.pathname)?.[1] ?? SCAN_PATH.exec(url.pathname)?.slice(1).join(":");
    output.push({ url: absolute, kind, ...(sourceKey ? { sourceKey } : {}) });
  });
  return output;
}

function sourceCharacterId(url: string): string | null {
  return CHARACTER_PATH.exec(new URL(url).pathname)?.[1] ?? null;
}

function elementFromHeading(value: string): string | null {
  const match = value.match(/五行属([金木水火土])/);
  return match?.[1] ?? null;
}

function strokeFromText(value: string): number | null {
  return integerFrom(value.match(/(?:笔画数为|康熙字典)(\d+)(?:画|笔)/)?.[1] ?? value.match(/(\d+)画/)?.[1]);
}

export function parseIndexPage(html: string, pageUrl: string): ParsedIndexPage {
  const $ = cheerio.load(html);
  const links = collectLinks($, pageUrl);
  const entries: IndexEntry[] = [];
  const groups: IndexGroup[] = [];
  const seoDeclaredCount = integerFrom($("meta[name=description]").attr("content")?.match(/一共有(\d+)个/)?.[1]);
  const seen = new Set<string>();
  $("h3").each((_, heading) => {
    const headingText = normalizedText($(heading));
    const element = elementFromHeading(headingText);
    const strokeCount = strokeFromText(headingText);
    const container = $(heading).nextAll("ul").first();
    if (!container.length) return;
    const declaredCount = integerFrom($(heading).prev("div.gray").text());
    const before = entries.length;
    container.find("a[href*='/kangxi/']").each((__, anchor) => {
      const absolute = absoluteUrl(pageUrl, $(anchor).attr("href"));
      if (!absolute || seen.has(`${pageUrl}|${absolute}`)) return;
      seen.add(`${pageUrl}|${absolute}`);
      const clone = $(anchor).clone();
      const pinyin = compact(clone.find("span").first().text()) || null;
      const auspiciousness = compact(clone.find(".ziqu").text()) || null;
      clone.find("span").remove();
      const glyph = compact(clone.text()) || null;
      entries.push({
        characterUrl: absolute,
        sourceCharacterId: sourceCharacterId(absolute),
        glyph,
        pinyin,
        strokeCount,
        element,
        auspiciousness,
      });
    });
    const discoveredCount = entries.length - before;
    if (element || strokeCount !== null || declaredCount !== null) {
      groups.push({
        kind: element ? "stroke_element" : "index_section",
        key: [strokeCount, element].filter((part) => part !== null).join(":") || headingText,
        declaredCount,
        discoveredCount,
        seoDeclaredCount,
      });
    }
  });
  if (entries.length === 0) {
    $("a[href*='/kangxi/']").each((_, anchor) => {
      const absolute = absoluteUrl(pageUrl, $(anchor).attr("href"));
      if (!absolute || seen.has(`${pageUrl}|${absolute}`)) return;
      seen.add(`${pageUrl}|${absolute}`);
      const clone = $(anchor).clone();
      const pinyin = compact(clone.find("span").first().text()) || null;
      const auspiciousness = compact(clone.find(".ziqu").text()) || null;
      clone.find("span").remove();
      entries.push({
        characterUrl: absolute,
        sourceCharacterId: sourceCharacterId(absolute),
        glyph: compact(clone.text()) || null,
        pinyin,
        strokeCount: strokeFromText($("title").text()),
        element: elementFromHeading($("title").text()),
        auspiciousness,
      });
    });
  }
  return { links, entries, groups };
}

function parseLabelFields($: CheerioAPI, root: Cheerio<AnyNode>): Record<string, string[]> {
  const fields: Record<string, string[]> = {};
  root.find(".attr_name").each((_, labelElement) => {
    const label = normalizedText($(labelElement));
    const valueNode = $(labelElement).next("span");
    const value = normalizedText(valueNode.length ? valueNode : $(labelElement).parent());
    if (!label || !value) return;
    const cleanValue = value === label ? "" : value;
    if (!cleanValue) return;
    (fields[label] ??= []).push(cleanValue);
  });
  return fields;
}

function pronunciationValues($: CheerioAPI, label: string, pageUrl: string): PronunciationValue[] {
  const output: PronunciationValue[] = [];
  $(".attr_name").filter((_, element) => normalizedText($(element)) === label).first().next("span").find("a").each((_, anchor) => {
    const value = normalizedText($(anchor));
    if (value) output.push({ value, audioUrl: absoluteUrl(pageUrl, $(anchor).attr("data-mp3")) });
  });
  return output;
}

function labeledParagraph($: CheerioAPI, label: string): string | null {
  let result: string | null = null;
  $("p.indent").each((_, paragraph) => {
    const text = normalizedText($(paragraph));
    if (text.startsWith(`${label}：`) || text.startsWith(`${label}:`)) result = compact(text.slice(label.length + 1));
  });
  return result;
}

function taboos($: CheerioAPI): string | null {
  const heading = $("h3").filter((_, element) => normalizedText($(element)).startsWith("取名忌讳")).first();
  if (!heading.length) return null;
  const paragraphs: string[] = [];
  let node = heading.next();
  while (node.length && node[0]?.tagName?.toLowerCase() === "p") {
    const value = normalizedText(node);
    if (value) paragraphs.push(value);
    node = node.next();
  }
  return paragraphs.length ? paragraphs.join("\n") : null;
}

function parseNamingProfile($: CheerioAPI): ParsedNamingProfile {
  const values = $("ul.fz li").map((_, item) => normalizedText($(item))).get();
  const recommendationPercent = percentFrom(values.find((value) => value.startsWith("推荐度")));
  const culturePercent = percentFrom(values.find((value) => value.startsWith("文化印象")));
  // The live page appends the progress-bar percentage and the "0偏男…9偏女"
  // scale to the same <li>. Reading the first integer therefore turns 字性3
  // into 30. The value displayed immediately after the label is one digit.
  const genderText = values.find((value) => value.startsWith("字性"));
  const genderTendency = integerFrom(genderText?.match(/^字性\s*([0-9])/)?.[1]);
  const element = labeledParagraph($, "五行属性");
  const auspiciousness = labeledParagraph($, "吉凶寓意");
  const commonText = labeledParagraph($, "是否为常用字");
  const usageText = labeledParagraph($, "使用次数");
  const usageCount = integerFrom(usageText?.match(/约(\d+)次/)?.[1]);
  const firstCharacterPercent = percentFrom(usageText?.match(/第一个字占[：:]\s*(\d+)%/)?.[1]);
  const malePercent = percentFrom(usageText?.match(/男孩名字占(\d+)%/)?.[1]);
  const femalePercent = percentFrom(usageText?.match(/女孩名字占[：:]\s*(\d+)%/)?.[1]);
  const hasAny = recommendationPercent !== null || culturePercent !== null || element !== null || usageText !== null;
  return {
    recommendationPercent,
    culturePercent,
    genderTendency,
    // Invalid source values such as "-" and "岁" remain in the immutable HTML
    // evidence, but must not enter the canonical five-element enum.
    element: element && ELEMENTS.has(element) ? element : null,
    auspiciousness,
    commonFlag: commonText === "是" ? true : commonText === "否" ? false : null,
    nameUsageClass: labeledParagraph($, "姓名学"),
    nameExplanation: labeledParagraph($, "姓名学解释"),
    namingMeaning: labeledParagraph($, "起名意思"),
    namingImplication: labeledParagraph($, "取名寓意"),
    usageCount,
    firstCharacterPercent,
    malePercent,
    femalePercent,
    taboosText: taboos($),
    absenceReason: hasAny ? null : "source_page_has_no_naming_profile",
  };
}

function sanitizeFragment($: CheerioAPI, node: Cheerio<AnyNode>, pageUrl: string): { html: string; text: string } {
  const clone = node.clone();
  clone.find("script,style,iframe").remove();
  clone.find("img").each((_, image) => {
    const alt = $(image).attr("alt");
    if (alt) $(image).replaceWith(alt);
    else $(image).remove();
  });
  clone.find("a").each((_, anchor) => {
    const href = absoluteUrl(pageUrl, $(anchor).attr("href"));
    if (href) $(anchor).attr("href", href);
    $(anchor).removeAttr("target").removeAttr("style");
  });
  clone.find("*").each((_, element) => {
    const allowed = new Set(["href", "title"]);
    for (const attribute of element.attribs ? Object.keys(element.attribs) : []) {
      if (!allowed.has(attribute)) $(element).removeAttr(attribute);
    }
  });
  return { html: clone.html() ?? "", text: normalizedText(clone) };
}

function sectionType(title: string, subtitle: string): ParsedDictionarySection["type"] {
  if (title.includes("康熙字典")) return "kangxi";
  if (title.includes("汉语字典")) return "modern_dictionary";
  if (subtitle.includes("白话版")) return "shuowen_plain";
  if (subtitle.includes("解字注")) return "shuowen_annotation";
  if (title.includes("说文解字") || title.includes("説文解字")) return "shuowen_classic";
  return "other";
}

function parseSections($: CheerioAPI, pageUrl: string): ParsedDictionarySection[] {
  const sections: ParsedDictionarySection[] = [];
  $(".leftbox .panel .mcon.noi").each((_, container) => {
    const topHeading = $(container).children("h2").first();
    const topTitle = normalizedText(topHeading);
    if (!topTitle || !["康熙字典", "说文解字", "説文解字", "汉语字典"].some((value) => topTitle.includes(value))) return;
    const children = $(container).children();
    const groups: Array<{ subtitle: string; nodes: AnyNode[] }> = [];
    let current = { subtitle: topTitle, nodes: [] as AnyNode[] };
    groups.push(current);
    children.each((__, child) => {
      const tagName = child.tagName?.toLowerCase();
      if (tagName === "h2") return;
      if (tagName === "h3") {
        current = { subtitle: normalizedText($(child)), nodes: [] };
        groups.push(current);
      } else current.nodes.push(child);
    });
    for (const group of groups) {
      if (!group.nodes.length) continue;
      const wrapper = $("<div></div>");
      for (const node of group.nodes) wrapper.append($(node).clone());
      const sanitized = sanitizeFragment($, wrapper, pageUrl);
      if (!sanitized.text) continue;
      sections.push({
        type: sectionType(topTitle, group.subtitle),
        title: group.subtitle,
        ordinal: sections.filter((entry) => entry.type === sectionType(topTitle, group.subtitle)).length,
        sourceHtml: wrapper.html() ?? "",
        sanitizedHtml: sanitized.html,
        plainText: sanitized.text,
      });
    }
  });
  return sections;
}

function formCandidates(glyph: string, sections: ParsedDictionarySection[]): ParsedCharacterPage["formCandidates"] {
  const modern = sections.filter((section) => section.type === "modern_dictionary").map((section) => section.plainText).join(" ");
  const prefix = modern.slice(0, 120);
  const escaped = glyph.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = prefix.match(new RegExp(`^◎?\\s*${escaped}\\s*([\\p{Script=Han}\\u3400-\\u4DBF])(?:\\s|$)`, "u"));
  const candidate = match?.[1];
  if (!candidate || candidate === glyph) return [];
  return [{ glyph: candidate, relationType: "traditional", evidence: prefix }];
}

function parseRelations($: CheerioAPI, pageUrl: string): ParsedRelation[] {
  const output: ParsedRelation[] = [];
  $(".panel .mcon").each((_, container) => {
    const heading = normalizedText($(container).find("h3").first());
    const type = heading.includes("同五行") ? "same_element" : heading.includes("同笔画") ? "same_stroke" : null;
    if (!type) return;
    $(container).find("a[href*='/kangxi/']").each((ordinal, anchor) => {
      const targetUrl = absoluteUrl(pageUrl, $(anchor).attr("href"));
      if (!targetUrl) return;
      const clone = $(anchor).clone();
      clone.find("span").remove();
      output.push({
        type,
        targetUrl,
        targetSourceCharacterId: sourceCharacterId(targetUrl),
        targetGlyph: compact(clone.text()) || null,
        ordinal,
      });
    });
  });
  return output;
}

function parseScanReferences($: CheerioAPI, pageUrl: string): ParsedScanReference[] {
  const output: ParsedScanReference[] = [];
  $("a[href*='/tupian/']").each((_, anchor) => {
    const sourceUrl = absoluteUrl(pageUrl, $(anchor).attr("href"));
    if (!sourceUrl) return;
    const match = SCAN_PATH.exec(new URL(sourceUrl).pathname);
    if (!match) return;
    output.push({
      editionKey: match[1]!,
      pageNumber: Number(match[2]),
      sourceUrl,
      label: normalizedText($(anchor)) || null,
    });
  });
  return output;
}

function collectAssets($: CheerioAPI, pageUrl: string, pinyin: PronunciationValue[], zhuyin: PronunciationValue[]): AssetReference[] {
  const output = new Map<string, AssetReference>();
  const add = (url: string | null, kind: AssetKind, role: string) => {
    if (url) output.set(url, { url, kind, role });
  };
  const mainGlyph = absoluteUrl(pageUrl, $(".zipic img").attr("src"));
  add(mainGlyph, "glyph", "primary_glyph");
  $(".leftbox .panel img").each((_, image) => {
    const url = absoluteUrl(pageUrl, $(image).attr("src"));
    if (url !== mainGlyph) add(url, "inline_glyph", "dictionary_inline_glyph");
  });
  for (const value of pinyin) add(value.audioUrl, "pinyin_audio", `pinyin:${value.value}`);
  for (const value of zhuyin) add(value.audioUrl, "zhuyin_audio", `zhuyin:${value.value}`);
  return [...output.values()];
}

function strictKangxiStrokes(value: string | undefined, defaultGlyph: string): Array<{ glyph: string; strokes: number }> {
  if (!value) return [];
  const output: Array<{ glyph: string; strokes: number }> = [];
  const pattern = /\(([^():：]+)[：:]\s*(\d+)\)/g;
  for (const match of value.matchAll(pattern)) output.push({ glyph: compact(match[1]!), strokes: Number(match[2]) });
  if (!output.length) {
    const strokes = integerFrom(value);
    if (strokes !== null) output.push({ glyph: defaultGlyph, strokes });
  }
  return output;
}

export function parseCharacterPage(html: string, pageUrl: string): ParsedCharacterPage {
  const $ = cheerio.load(html);
  const id = sourceCharacterId(pageUrl) ?? sourceCharacterId($("link[rel=canonical]").attr("href") ?? "");
  const glyph = normalizedText($(".leftbox .mcon .f24").first()) || $(".zipic img").attr("alt")?.trim() || "";
  const codepoint = firstCodePoint(glyph);
  if (!id || !glyph || codepoint === null) throw new ParseError("Character page is missing identity", { pageUrl, id, glyph });
  const root = $(".leftbox .panel .mcon").first();
  const rawFields = parseLabelFields($, root);
  const pinyin = pronunciationValues($, "拼音", pageUrl);
  const zhuyin = pronunciationValues($, "注音", pageUrl);
  const strict = strictKangxiStrokes(rawFields["康熙笔画"]?.[0], glyph);
  const positiveStrict = strict.filter((entry) => entry.strokes > 0);
  const unicodeRaw = rawFields["统一码"]?.[0] ?? null;
  const unicodeMatch = unicodeRaw?.match(/(.+?)\s+U\s*([0-9A-Fa-f]+)/);
  const sections = parseSections($, pageUrl);
  const naming = parseNamingProfile($);
  return {
    sourceCharacterId: id,
    sourceUrl: pageUrl,
    glyph,
    codepoint,
    unicodeLabel: unicodeMatch?.[2] ? `U+${unicodeMatch[2].toUpperCase()}` : `U+${codepoint.toString(16).toUpperCase()}`,
    unicodeBlock: unicodeMatch?.[1]?.trim() ?? null,
    structure: rawFields["结构"]?.[0] ?? null,
    radical: rawFields["部首"]?.at(-1) ?? null,
    radicalName: rawFields["部首"]?.[0] ?? null,
    modernStrokes: integerFrom(rawFields["总笔画"]?.[0]),
    // Preserve zero/invalid observations in strictKangxiStrokes and rawFields for audit,
    // but never promote them into the positive-only canonical naming stroke column.
    websiteNamingStrokes: positiveStrict.find((entry) => entry.glyph === glyph)?.strokes
      ?? positiveStrict[0]?.strokes ?? null,
    strictKangxiStrokes: strict,
    radicalStrokes: integerFrom(rawFields["部首笔画"]?.[0]),
    outsideStrokes: integerFrom(rawFields["部外"]?.[0] ?? rawFields["部外笔画"]?.[0]),
    wubi: rawFields["五笔"]?.[0] ?? null,
    cangjie: rawFields["仓颉"]?.[0] ?? null,
    fourCorner: rawFields["四角号码"]?.[0] ?? null,
    pinyin,
    zhuyin,
    formCandidates: formCandidates(glyph, sections),
    naming,
    sections,
    relations: parseRelations($, pageUrl),
    scanReferences: parseScanReferences($, pageUrl),
    links: collectLinks($, pageUrl),
    assets: collectAssets($, pageUrl, pinyin, zhuyin),
    rawFields,
    absenceReason: sections.length || naming.absenceReason === null ? null : "source_page_has_no_dictionary_or_naming_content",
  };
}

export function parseScanPage(html: string, pageUrl: string): ParsedScanPage {
  const $ = cheerio.load(html);
  const match = SCAN_PATH.exec(new URL(pageUrl).pathname);
  if (!match) throw new ParseError("Invalid scan page URL", { pageUrl });
  const imageUrl = absoluteUrl(pageUrl, $(".leftbox img[src]").filter((_, image) => /\/zidian\/book\//.test($(image).attr("src") ?? "")).first().attr("src"));
  const previousUrl = absoluteUrl(pageUrl, $("a").filter((_, anchor) => normalizedText($(anchor)) === "上一页").first().attr("href"));
  const nextUrl = absoluteUrl(pageUrl, $("a").filter((_, anchor) => normalizedText($(anchor)) === "下一页").first().attr("href"));
  return {
    editionKey: match[1]!,
    pageNumber: Number(match[2]),
    title: normalizedText($("h1").first()) || normalizedText($("title")),
    imageUrl,
    previousUrl,
    nextUrl,
    links: collectLinks($, pageUrl).filter((link) => link.kind === "scan"),
    assets: imageUrl ? [{ url: imageUrl, kind: "scan_image", role: "book_scan" }] : [],
  };
}
