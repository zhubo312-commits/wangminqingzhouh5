export const HEXAGRAM_NAMES = [
  "乾为天", "坤为地", "水雷屯", "山水蒙", "水天需", "天水讼", "地水师", "水地比",
  "风天小畜", "天泽履", "地天泰", "天地否", "天火同人", "火天大有", "地山谦", "雷地豫",
  "泽雷随", "山风蛊", "地泽临", "风地观", "火雷噬嗑", "山火贲", "山地剥", "地雷复",
  "天雷无妄", "山天大畜", "山雷颐", "泽风大过", "坎为水", "离为火", "泽山咸", "雷风恒",
  "天山遁", "雷天大壮", "火地晋", "地火明夷", "风火家人", "火泽睽", "水山蹇", "雷水解",
  "山泽损", "风雷益", "泽天夬", "天风姤", "泽地萃", "地风升", "泽水困", "水风井",
  "泽火革", "火风鼎", "震为雷", "艮为山", "风山渐", "雷泽归妹", "雷火丰", "火山旅",
  "巽为风", "兑为泽", "风水涣", "水泽节", "风泽中孚", "雷山小过", "水火既济", "火水未济",
] as const;

export type HexagramName = typeof HEXAGRAM_NAMES[number];

export const HEXAGRAM_PALACES = [
  { key: "qian", name: "乾", symbol: "☰", element: "金", hexagrams: ["乾为天", "天风姤", "天山遁", "天地否", "风地观", "山地剥", "火地晋", "火天大有"] },
  { key: "dui", name: "兑", symbol: "☱", element: "金", hexagrams: ["兑为泽", "泽水困", "泽地萃", "泽山咸", "水山蹇", "地山谦", "雷山小过", "雷泽归妹"] },
  { key: "li", name: "离", symbol: "☲", element: "火", hexagrams: ["离为火", "火山旅", "火风鼎", "火水未济", "山水蒙", "风水涣", "天水讼", "天火同人"] },
  { key: "zhen", name: "震", symbol: "☳", element: "木", hexagrams: ["震为雷", "雷地豫", "雷水解", "雷风恒", "地风升", "水风井", "泽风大过", "泽雷随"] },
  { key: "xun", name: "巽", symbol: "☴", element: "木", hexagrams: ["巽为风", "风天小畜", "风火家人", "风雷益", "天雷无妄", "火雷噬嗑", "山雷颐", "山风蛊"] },
  { key: "kan", name: "坎", symbol: "☵", element: "水", hexagrams: ["坎为水", "水泽节", "水雷屯", "水火既济", "泽火革", "雷火丰", "地火明夷", "地水师"] },
  { key: "gen", name: "艮", symbol: "☶", element: "土", hexagrams: ["艮为山", "山火贲", "山天大畜", "山泽损", "火泽睽", "天泽履", "风泽中孚", "风山渐"] },
  { key: "kun", name: "坤", symbol: "☷", element: "土", hexagrams: ["坤为地", "地雷复", "地泽临", "地天泰", "雷天大壮", "泽天夬", "水天需", "水地比"] },
] as const satisfies ReadonlyArray<{
  key: string;
  name: string;
  symbol: string;
  element: string;
  hexagrams: readonly HexagramName[];
}>;

const HEXAGRAM_INDEX = new Map<string, number>(HEXAGRAM_NAMES.map((name, index) => [name, index]));

export interface HexagramMeta {
  name: HexagramName;
  number: number;
  symbol: string;
  palaceKey: string;
  palaceName: string;
  palaceSymbol: string;
  element: string;
}

export function getHexagramMeta(name: string): HexagramMeta | null {
  const index = HEXAGRAM_INDEX.get(name);
  const palace = HEXAGRAM_PALACES.find((item) => item.hexagrams.some((hexagram) => hexagram === name));
  if (index === undefined || !palace) return null;
  return {
    name: HEXAGRAM_NAMES[index]!,
    number: index + 1,
    symbol: String.fromCodePoint(0x4dc0 + index),
    palaceKey: palace.key,
    palaceName: palace.name,
    palaceSymbol: palace.symbol,
    element: palace.element,
  };
}
