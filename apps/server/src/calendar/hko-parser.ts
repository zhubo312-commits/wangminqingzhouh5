export interface ParsedCalendarDay {
  date: string;
  weekday: string;
  lunarYear: string;
  lunarMonth: string;
  lunarDay: string;
  zodiac: string;
  solarTerm: string | null;
  sourceRaw: string;
}

export interface ParsedHkoYear {
  year: number;
  days: ParsedCalendarDay[];
  lastLunarMonth: string;
}

const simplifiedCharacters: Record<string, string> = {
  曆: "历",
  馬: "马",
  羊: "羊",
  猴: "猴",
  雞: "鸡",
  狗: "狗",
  犬: "狗",
  豬: "猪",
  鼠: "鼠",
  牛: "牛",
  虎: "虎",
  兔: "兔",
  龍: "龙",
  蛇: "蛇",
  閏: "闰",
  驚: "惊",
  蟄: "蛰",
  穀: "谷",
  滿: "满",
  種: "种",
  處: "处",
};

const stems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const branches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const zodiacByBranch = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"];

export function toSimplified(value: string): string {
  return [...value]
    .map((character) => simplifiedCharacters[character] ?? character)
    .join("");
}

export function cyclicalYear(year: number): { label: string; zodiac: string } {
  const stemIndex = ((year - 4) % 10 + 10) % 10;
  const branchIndex = ((year - 4) % 12 + 12) % 12;
  return {
    label: `${stems[stemIndex]}${branches[branchIndex]}年`,
    zodiac: zodiacByBranch[branchIndex]!,
  };
}

function expectedDaysInYear(year: number): number {
  return new Date(Date.UTC(year + 1, 0, 1)).getTime() -
    new Date(Date.UTC(year, 0, 1)).getTime() ===
    366 * 86_400_000
    ? 366
    : 365;
}

function formatDate(year: number, month: number, day: number): string {
  return [year, String(month).padStart(2, "0"), String(day).padStart(2, "0")].join("-");
}

export function parseHkoYearFile(
  input: string,
  options: {
    initialLunarMonth?: string;
    validateCompleteYear?: boolean;
  } = {},
): ParsedHkoYear {
  const normalizedInput = input.replace(/^\uFEFF/, "").replace(/\r/g, "");
  const lines = normalizedInput.split("\n").map((line) => line.trim());
  const header = lines.find((line) => /^\d{4}\(/.test(line));
  if (!header) {
    throw new Error("HKO calendar header was not found");
  }

  const headerMatch = header.match(/^(\d{4})\(\s*([^\s-]+)\s*-\s*肖([^\s)]+)\s*\)年/);
  if (!headerMatch) {
    throw new Error(`Unsupported HKO calendar header: ${header}`);
  }

  const year = Number(headerMatch[1]);
  const upcomingLunarYear = cyclicalYear(year);
  const headerYearLabel = `${toSimplified(headerMatch[2]!)}年`;
  const headerZodiac = toSimplified(headerMatch[3]!);
  if (
    headerYearLabel !== upcomingLunarYear.label ||
    headerZodiac !== upcomingLunarYear.zodiac
  ) {
    throw new Error(`HKO header cycle mismatch for ${year}`);
  }

  let lunarMonth = options.initialLunarMonth ?? (year === 1901 ? "十一月" : "");
  let activeLunarYear = cyclicalYear(year - 1);
  const days: ParsedCalendarDay[] = [];

  const rowPattern = /^(\d{4})年0?(\d{1,2})月0?(\d{1,2})日\s+(\S+)\s+(星期[一二三四五六日天])(?:\s+(\S+))?$/;

  for (const line of lines) {
    const match = line.match(rowPattern);
    if (!match) continue;

    const rowYear = Number(match[1]);
    if (rowYear !== year) {
      throw new Error(`Unexpected Gregorian year in row: ${line}`);
    }

    const rawLunar = toSimplified(match[4]!);
    let lunarDay = rawLunar;
    if (rawLunar.endsWith("月")) {
      lunarMonth = rawLunar;
      lunarDay = "初一";
      if (rawLunar === "正月") {
        activeLunarYear = upcomingLunarYear;
      }
    }

    if (!lunarMonth) {
      throw new Error(`Missing carried lunar month before row: ${line}`);
    }

    days.push({
      date: formatDate(rowYear, Number(match[2]), Number(match[3])),
      weekday: match[5] === "星期天" ? "星期日" : match[5]!,
      lunarYear: activeLunarYear.label,
      lunarMonth,
      lunarDay,
      zodiac: activeLunarYear.zodiac,
      solarTerm: match[6] ? toSimplified(match[6]) : null,
      sourceRaw: line,
    });
  }

  if (days.length === 0) {
    throw new Error(`No HKO calendar rows found for ${year}`);
  }
  if ((options.validateCompleteYear ?? true) && days.length !== expectedDaysInYear(year)) {
    throw new Error(
      `Incomplete HKO calendar for ${year}: expected ${expectedDaysInYear(year)}, got ${days.length}`,
    );
  }

  return { year, days, lastLunarMonth: lunarMonth };
}
