export type PageKind = "root" | "index" | "search" | "character" | "scan" | "unknown";
export type PageStatus = "pending" | "fetching" | "success" | "source_missing" | "failed";
export type AssetKind =
  | "glyph"
  | "inline_glyph"
  | "pinyin_audio"
  | "zhuyin_audio"
  | "scan_image"
  | "other_content";

export interface DiscoveredLink {
  url: string;
  kind: PageKind;
  sourceKey?: string;
}

export interface AssetReference {
  url: string;
  kind: AssetKind;
  role: string;
}

export interface IndexEntry {
  characterUrl: string;
  sourceCharacterId: string | null;
  glyph: string | null;
  pinyin: string | null;
  strokeCount: number | null;
  element: string | null;
  auspiciousness: string | null;
}

export interface IndexGroup {
  kind: string;
  key: string;
  declaredCount: number | null;
  discoveredCount: number;
  seoDeclaredCount: number | null;
}

export interface ParsedIndexPage {
  links: DiscoveredLink[];
  entries: IndexEntry[];
  groups: IndexGroup[];
}

export interface PronunciationValue {
  value: string;
  audioUrl: string | null;
}

export interface ParsedDictionarySection {
  type: "kangxi" | "shuowen_classic" | "shuowen_plain" | "shuowen_annotation" | "modern_dictionary" | "other";
  title: string;
  ordinal: number;
  sourceHtml: string;
  sanitizedHtml: string;
  plainText: string;
}

export interface ParsedRelation {
  type: "same_element" | "same_stroke" | "recommendation";
  targetUrl: string;
  targetSourceCharacterId: string | null;
  targetGlyph: string | null;
  ordinal: number;
}

export interface ParsedScanReference {
  editionKey: string;
  pageNumber: number;
  sourceUrl: string;
  label: string | null;
}

export interface ParsedNamingProfile {
  recommendationPercent: number | null;
  culturePercent: number | null;
  genderTendency: number | null;
  element: string | null;
  auspiciousness: string | null;
  commonFlag: boolean | null;
  nameUsageClass: string | null;
  nameExplanation: string | null;
  namingMeaning: string | null;
  namingImplication: string | null;
  usageCount: number | null;
  firstCharacterPercent: number | null;
  malePercent: number | null;
  femalePercent: number | null;
  taboosText: string | null;
  absenceReason: string | null;
}

export interface ParsedCharacterPage {
  sourceCharacterId: string;
  sourceUrl: string;
  glyph: string;
  codepoint: number;
  unicodeLabel: string | null;
  unicodeBlock: string | null;
  structure: string | null;
  radical: string | null;
  radicalName: string | null;
  modernStrokes: number | null;
  websiteNamingStrokes: number | null;
  strictKangxiStrokes: Array<{ glyph: string; strokes: number }>;
  radicalStrokes: number | null;
  outsideStrokes: number | null;
  wubi: string | null;
  cangjie: string | null;
  fourCorner: string | null;
  pinyin: PronunciationValue[];
  zhuyin: PronunciationValue[];
  formCandidates: Array<{ glyph: string; relationType: "traditional" | "variant"; evidence: string }>;
  naming: ParsedNamingProfile;
  sections: ParsedDictionarySection[];
  relations: ParsedRelation[];
  scanReferences: ParsedScanReference[];
  links: DiscoveredLink[];
  assets: AssetReference[];
  rawFields: Record<string, string[]>;
  absenceReason: string | null;
}

export interface ParsedScanPage {
  editionKey: string;
  pageNumber: number;
  title: string;
  imageUrl: string | null;
  previousUrl: string | null;
  nextUrl: string | null;
  links: DiscoveredLink[];
  assets: AssetReference[];
}
