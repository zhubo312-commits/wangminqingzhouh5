import { z } from "zod";

export const CalendarInfoSchema = z.object({
  lunarYear: z.string().min(1),
  lunarMonth: z.string().min(1),
  lunarDay: z.string().min(1),
  zodiac: z.string().min(1),
  solarTerm: z.string().min(1).nullable(),
});

export const GuidanceSchema = z.object({
  text: z.string().min(1).max(160),
  suitable: z.array(z.string().min(1).max(12)).min(1).max(3),
  avoid: z.array(z.string().min(1).max(12)).min(1).max(3),
});

export const HomeLinksSchema = z.object({
  interpretation: z.url().nullable(),
  learning: z.url().nullable(),
  question: z.url().nullable(),
});

export const HomeResponseSchema = z.object({
  date: z.iso.date(),
  weekday: z.string().min(1),
  calendar: CalendarInfoSchema,
  guidance: GuidanceSchema,
  links: HomeLinksSchema,
});

export const AnalyticsEventSchema = z.enum([
  "home_view",
  "paipan_click",
  "interpretation_click",
  "learning_click",
  "question_click",
]);

export const TrackEventRequestSchema = z.object({
  event: AnalyticsEventSchema,
});

export const ProblemDetailsSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string(),
  instance: z.string(),
  request_id: z.string(),
  errors: z
    .array(
      z.object({
        field: z.string(),
        message: z.string(),
        code: z.string(),
      }),
    )
    .optional(),
});

export interface PaipanAreaNode {
  label: string;
  code: string;
  children: PaipanAreaNode[];
}

export const PaipanAreaNodeSchema: z.ZodType<PaipanAreaNode> = z.lazy(() =>
  z.object({
    label: z.string().min(1),
    code: z.string().min(1),
    children: z.array(PaipanAreaNodeSchema),
  }),
);

const BirthDateTimeSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);

export const ResolveBirthRequestSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("solar"), solarDateTime: BirthDateTimeSchema }),
  z.object({
    mode: z.literal("lunar"),
    lunar: z.object({
      year: z.number().int().min(1900).max(2100),
      month: z.number().int().min(1).max(12),
      day: z.number().int().min(1).max(30),
      hour: z.number().int().min(0).max(23),
      minute: z.number().int().min(0).max(59),
      leapMonth: z.boolean(),
    }),
  }),
  z.object({
    mode: z.literal("fourPillars"),
    pillars: z.object({
      year: z.string().length(2),
      month: z.string().length(2),
      day: z.string().length(2),
      hour: z.string().length(2),
    }),
  }),
]);

export const ResolveBirthResponseSchema = z.object({
  candidates: z.array(
    z.object({
      id: z.string().min(1),
      solarDateTime: BirthDateTimeSchema,
      label: z.string().min(1),
    }),
  ),
  sect: z.literal(2),
});

export const BaziChartRequestSchema = z.object({
  name: z.string().max(32),
  gender: z.enum(["male", "female"]),
  birthDateTime: BirthDateTimeSchema,
  areaCode: z.string().regex(/^\d{6}$/),
  useTrueSolarTime: z.boolean(),
});

const HiddenStemSchema = z.object({
  stem: z.string(),
  element: z.string(),
  tenGod: z.string(),
});

const AttentionSchema = z.object({
  heavenlyStems: z.array(z.string()),
  earthlyBranches: z.array(z.string()),
});

const FlowYearSchema = z.object({
  index: z.number().int(),
  year: z.number().int(),
  age: z.number().int(),
  ganZhi: z.string(),
  voidBranch: z.string(),
  tenGods: z.array(z.string()),
  hiddenStems: z.string(),
  hiddenStemTenGods: z.array(z.string()),
  wealthStrong: z.boolean(),
  heavenlyStemAttention: z.array(z.string()),
  earthlyBranchAttention: z.array(z.string()),
  shenSha: z.array(z.string()),
});

const FortunePeriodSchema = z.object({
  index: z.number().int(),
  startYear: z.number().int(),
  endYear: z.number().int(),
  startAge: z.number().int(),
  endAge: z.number().int(),
  ganZhi: z.string(),
  tenGods: z.array(z.string()),
  growth: z.string(),
  hiddenStems: z.string(),
  hiddenStemTenGods: z.array(z.string()),
  wealthStrong: z.boolean(),
  heavenlyStemAttention: z.array(z.string()),
  earthlyBranchAttention: z.array(z.string()),
  shenSha: z.array(z.string()),
  years: z.array(FlowYearSchema),
});

export const BaziChartResponseSchema = z.object({
  profile: z.object({
    name: z.string(),
    gender: z.enum(["male", "female"]),
    birthDateTime: BirthDateTimeSchema,
    lunarDate: z.string(),
    area: z.string(),
    areaCode: z.string(),
    trueSolarTime: z.string().nullable().optional(),
    chineseZodiac: z.string(),
    zodiac: z.string(),
  }),
  basicFacts: z.object({
    benMingFo: z.string(),
    taiYuan: z.string(),
    taiYuanNaYin: z.string(),
    mingGong: z.string(),
    mingGongNaYin: z.string(),
    duiChong: z.string(),
    sanSha: z.string(),
    wenChangWei: z.string(),
    prevSolarTerm: z.string(),
    nextSolarTerm: z.string(),
  }),
  pillars: z.array(
    z.object({
      key: z.enum(["year", "month", "day", "hour"]),
      label: z.string(),
      stem: z.string(),
      branch: z.string(),
      stemElement: z.string(),
      branchElement: z.string(),
      tenGod: z.string(),
      hiddenStems: z.array(HiddenStemSchema),
      growth: z.string(),
      selfSeat: z.string(),
      naYin: z.string(),
      voidBranch: z.string(),
      shenSha: z.array(z.string()),
    }),
  ).length(4),
  attention: AttentionSchema,
  shenShaDescriptions: z.record(z.string(), z.array(z.string())),
  fortune: z.object({
    startSolar: z.string(),
    startDescription: z.string(),
    changeDescription: z.string(),
    periods: z.array(FortunePeriodSchema),
  }),
  strength: z.object({
    legacyScore: z.number().int(),
    samePartyScore: z.number().int(),
    otherPartyScore: z.number().int(),
    level: z.string(),
    pattern: z.string(),
    summary: z.string(),
    favorableGod: z.string(),
    favorableElements: z.array(z.string()),
    relationScores: z.record(z.string(), z.number().int()),
  }),
});

export const PaipanReferenceSchema = z
  .string()
  .regex(/^pp_[A-Za-z0-9_-]{32}$/);

export const BaziChartWithReferenceSchema = BaziChartResponseSchema.extend({
  paipan_ref: PaipanReferenceSchema,
  expiresAt: z.iso.datetime(),
});

export const PaipanContextLookupRequestSchema = z.object({
  paipan_ref: PaipanReferenceSchema,
});

export const PaipanContextResponseSchema = z.object({
  schemaVersion: z.literal("guoxue.paipan.bazi.v1"),
  chartType: z.literal("shengping_zishi"),
  paipan_ref: PaipanReferenceSchema,
  generatedAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
  chartRequest: BaziChartRequestSchema,
  chart: BaziChartResponseSchema,
});

export const DunjiaChartRequestSchema = z.object({
  chartDateTime: BirthDateTimeSchema,
});

const DunjiaGrowthStageSchema = z.object({
  branch: z.string().min(1),
  stage: z.string().min(1),
});

const DunjiaHarmSchema = z.object({
  symbol: z.string().min(1),
  type: z.enum(["迫", "墓", "刑"]),
});

export const DunjiaPalaceSchema = z.object({
  index: z.number().int().min(1).max(9),
  trigram: z.string().min(1),
  direction: z.string().min(1),
  element: z.string().min(1),
  deity: z.string().nullable(),
  star: z.string().nullable(),
  door: z.string().nullable(),
  heavenPlate: z.string(),
  earthPlate: z.string(),
  hiddenStem: z.string().nullable(),
  isVoid: z.boolean(),
  isChief: z.boolean(),
  isChiefDoor: z.boolean(),
  isHorse: z.boolean(),
  harms: z.array(DunjiaHarmSchema),
  heavenGrowth: z.array(DunjiaGrowthStageSchema),
  earthGrowth: z.array(DunjiaGrowthStageSchema),
});

export const DunjiaChartResponseSchema = z.object({
  overview: z.object({
    method: z.literal("转盘-拆补-寄坤二宫"),
    solarDateTime: BirthDateTimeSchema,
    lunarDate: z.string().min(1),
    pillars: z.object({
      year: z.string().length(2),
      month: z.string().length(2),
      day: z.string().length(2),
      hour: z.string().length(2),
    }),
    voidBranches: z.object({
      year: z.string().min(1),
      month: z.string().min(1),
      day: z.string().min(1),
      hour: z.string().min(1),
    }),
    previousSolarTerm: z.object({
      name: z.string().min(1),
      dateTime: z.string().min(1),
    }),
    nextSolarTerm: z.object({
      name: z.string().min(1),
      dateTime: z.string().min(1),
    }),
    dunType: z.enum(["阴", "阳"]),
    juNumber: z.number().int().min(1).max(9),
    xunShou: z.string().min(1),
    chiefStar: z.object({
      name: z.string().min(1),
      palace: z.number().int().min(1).max(9),
    }),
    chiefDoor: z.object({
      name: z.string().min(1),
      palace: z.number().int().min(1).max(9),
    }),
    horse: z.object({
      trigram: z.string().min(1),
      branch: z.string().min(1),
    }),
  }),
  palaces: z.array(DunjiaPalaceSchema).length(9),
  heavenEarthGates: z.array(
    z.object({
      branch: z.string().min(1),
      heavenGate: z.string().min(1),
      earthGate: z.string().min(1),
    }),
  ).length(12),
});

export const DunjiaChartWithReferenceSchema = DunjiaChartResponseSchema.extend({
  paipan_ref: PaipanReferenceSchema,
  expiresAt: z.iso.datetime(),
});

export const DunjiaContextResponseSchema = z.object({
  schemaVersion: z.literal("guoxue.paipan.dunjia.v1"),
  chartType: z.literal("dunjia"),
  paipan_ref: PaipanReferenceSchema,
  generatedAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
  chartRequest: DunjiaChartRequestSchema,
  chart: DunjiaChartResponseSchema,
});

const JueceDateTimeSchema = BirthDateTimeSchema.refine((value) => {
  const [datePart, timePart] = value.split(" ");
  if (!datePart || !timePart) return false;
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!, hour!, minute!));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() + 1 === month
    && date.getUTCDate() === day
    && date.getUTCHours() === hour
    && date.getUTCMinutes() === minute;
}, "日期或时间无效");

export const JueceTimeSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("standard") }).strict(),
  z.object({
    mode: z.literal("true_solar"),
    areaCode: z.string().regex(/^\d{6}$/),
  }).strict(),
]);

export const JuecePanSchema = z.discriminatedUnion("style", [
  z.object({
    style: z.literal("rotating"),
    centerPalaceMethod: z.enum([
      "kun",
      "yang_gen_yin_kun",
      "four_corners",
      "seasonal",
    ]),
  }).strict(),
  z.object({
    style: z.literal("flying"),
    directionRule: z.enum(["yang_forward_yin_reverse", "all_forward"]),
  }).strict(),
]);

export const JueceBureauSchema = z.discriminatedUnion("method", [
  z.object({ method: z.literal("chai_bu") }).strict(),
  z.object({ method: z.literal("zhi_run") }).strict(),
  z.object({ method: z.literal("mao_shan") }).strict(),
  z.object({
    method: z.literal("manual"),
    dunType: z.enum(["yin", "yang"]),
    number: z.number().int().min(1).max(9),
  }).strict(),
]);

export const JueceChartRequestSchema = z.object({
  chartDateTime: JueceDateTimeSchema,
  time: JueceTimeSchema,
  pan: JuecePanSchema,
  bureau: JueceBureauSchema,
  voidBasis: z.enum(["hour", "day", "month", "year"]),
}).strict();

const JuecePlateLayerSchema = z.object({
  stem: z.string().min(1).nullable(),
  star: z.string().min(1).nullable(),
  door: z.string().min(1).nullable(),
  deity: z.string().min(1).nullable(),
});

export const JuecePalaceSchema = z.object({
  index: z.number().int().min(1).max(9),
  trigram: z.string().min(1),
  direction: z.string().min(1),
  element: z.string().min(1),
  heavenPlate: JuecePlateLayerSchema,
  earthPlate: JuecePlateLayerSchema,
  attached: z.object({
    earthStem: z.string().min(1),
    earthStar: z.string().min(1),
    heavenStem: z.string().min(1).nullable(),
    heavenStar: z.string().min(1).nullable(),
  }).nullable(),
  hiddenGanZhi: z.string().min(1).nullable(),
  harms: z.array(DunjiaHarmSchema).default([]),
  heavenGrowth: z.array(DunjiaGrowthStageSchema).default([]),
  earthGrowth: z.array(DunjiaGrowthStageSchema).default([]),
  isVoid: z.boolean(),
  isHorse: z.boolean(),
  isChief: z.boolean(),
  isChiefDoor: z.boolean(),
});

const JueceSolarTermSchema = z.object({
  name: z.string().min(1),
  dateTime: z.string().min(1),
});

export const JueceChartResponseSchema = z.object({
  overview: z.object({
    method: z.string().min(1),
    clockDateTime: JueceDateTimeSchema,
    effectiveDateTime: JueceDateTimeSchema,
    timeMode: z.enum(["standard", "true_solar"]),
    areaCode: z.string().regex(/^\d{6}$/).nullable(),
    areaName: z.string().min(1).nullable(),
    trueSolarTime: JueceDateTimeSchema.nullable(),
    lunarDate: z.string().min(1),
    pillars: z.object({
      year: z.string().length(2),
      month: z.string().length(2),
      day: z.string().length(2),
      hour: z.string().length(2),
    }),
    voidBranches: z.object({
      year: z.string().length(2),
      month: z.string().length(2),
      day: z.string().length(2),
      hour: z.string().length(2),
    }),
    selectedVoidBranches: z.string().length(2),
    previousSolarTerm: JueceSolarTermSchema,
    nextSolarTerm: JueceSolarTermSchema,
    panStyle: z.enum(["rotating", "flying"]),
    panStyleLabel: z.string().min(1),
    bureauMethod: z.enum(["chai_bu", "zhi_run", "mao_shan", "manual"]),
    bureauLabel: z.string().min(1),
    directionRule: z.enum(["yang_forward_yin_reverse", "all_forward"]).nullable(),
    centerPalaceMethod: z.enum([
      "kun",
      "yang_gen_yin_kun",
      "four_corners",
      "seasonal",
    ]).nullable(),
    dunType: z.enum(["阴", "阳"]),
    juNumber: z.number().int().min(1).max(9),
    xunShou: z.string().min(1),
    chiefStar: z.object({
      name: z.string().min(1),
      palace: z.number().int().min(1).max(9),
    }),
    chiefDoor: z.object({
      name: z.string().min(1),
      palace: z.number().int().min(1).max(9),
    }),
    horse: z.object({
      branch: z.string().length(1),
      palace: z.number().int().min(1).max(9),
    }),
  }),
  palaces: z.array(JuecePalaceSchema).length(9),
  heavenEarthGates: z.array(
    z.object({
      branch: z.string().min(1),
      heavenGate: z.string().min(1),
      earthGate: z.string().min(1),
    }),
  ).max(12).default([]),
});

export const JueceChartWithReferenceSchema = JueceChartResponseSchema.extend({
  paipan_ref: PaipanReferenceSchema,
  expiresAt: z.iso.datetime(),
});

export const JueceContextResponseSchema = z.object({
  schemaVersion: z.literal("guoxue.paipan.shijia_juece.v1"),
  chartType: z.literal("shijia_juece"),
  paipan_ref: PaipanReferenceSchema,
  generatedAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
  chartRequest: JueceChartRequestSchema,
  chart: JueceChartResponseSchema,
});

const YinpanGrowthStageSchema = z.object({
  branch: z.string().min(1),
  stage: z.string().min(1),
});

const YinpanHarmSchema = z.object({
  symbol: z.string().min(1),
  type: z.enum(["迫", "墓", "刑"]),
});

export const YinpanChartRequestSchema = z.object({
  chartDateTime: BirthDateTimeSchema,
  gender: z.enum(["male", "female"]),
  question: z.string().trim().max(30).default(""),
  mode: z.enum(["time", "ke"]),
  lifetime: z.boolean().default(false),
});

export const YinpanPalaceSchema = z.object({
  index: z.number().int().min(1).max(9),
  trigram: z.string().min(1),
  direction: z.string().min(1),
  element: z.string().min(1),
  deity: z.string().nullish().transform((value) => value ?? null),
  star: z.string().nullish().transform((value) => value ?? null),
  door: z.string().nullish().transform((value) => value ?? null),
  heavenStems: z.array(z.string().length(1)).max(2),
  earthStems: z.array(z.string().length(1)).max(2),
  hiddenStem: z.string().nullish().transform((value) => value ?? null),
  harms: z.array(YinpanHarmSchema),
  heavenGrowth: z.array(YinpanGrowthStageSchema),
  earthGrowth: z.array(YinpanGrowthStageSchema),
  isVoid: z.boolean(),
  isHorse: z.boolean(),
  isChief: z.boolean(),
  isChiefDoor: z.boolean(),
});

export const YinpanChartResponseSchema = z.object({
  overview: z.object({
    method: z.enum(["时盘", "刻盘"]),
    question: z.string(),
    gender: z.enum(["male", "female"]),
    solarDateTime: BirthDateTimeSchema,
    lunarDate: z.string().min(1),
    pillars: z.object({
      year: z.string().length(2),
      month: z.string().length(2),
      day: z.string().length(2),
      hour: z.string().length(2),
    }),
    voidBranches: z.string().length(2),
    dunType: z.enum(["阴", "阳"]),
    juNumber: z.number().int().min(1).max(9),
    xunShou: z.string().min(2),
    chiefStar: z.object({ name: z.string().min(1), palace: z.number().int().min(1).max(9) }),
    chiefDoor: z.object({ name: z.string().min(1), palace: z.number().int().min(1).max(9) }),
    previousSolarTerm: z.string().min(1),
    nextSolarTerm: z.string().min(1),
    monthGeneral: z.string().min(1),
    horse: z.object({ branch: z.string().length(1), palace: z.number().int().min(1).max(9) }),
  }),
  palaces: z.array(YinpanPalaceSchema).length(9),
  heavenEarthGates: z.array(z.object({
    branch: z.string().length(1),
    heavenGate: z.string().min(1),
    earthGate: z.string().min(1),
  })).length(12),
  lifetimeChart: BaziChartResponseSchema.nullish().transform((value) => value ?? null),
});

export const YinpanChartWithReferenceSchema = YinpanChartResponseSchema.extend({
  paipan_ref: PaipanReferenceSchema,
  expiresAt: z.iso.datetime(),
});

export const YinpanContextResponseSchema = z.object({
  schemaVersion: z.literal("guoxue.paipan.yinpan_juece.v1"),
  chartType: z.literal("yinpan_juece"),
  paipan_ref: PaipanReferenceSchema,
  generatedAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
  chartRequest: YinpanChartRequestSchema,
  chart: YinpanChartResponseSchema,
});

export const MeihuaChartRequestSchema = z.object({
  chartDateTime: BirthDateTimeSchema,
  mode: z.enum(["time", "random", "number", "specified"]),
  numberOne: z.number().int().min(1).max(999_999_999).optional(),
  numberTwo: z.number().int().min(1).max(999_999_999).optional(),
  includeHour: z.boolean().optional(),
  school: z.enum(["digit_sum", "raw_number"]).optional(),
  upperTrigram: z.number().int().min(1).max(8).optional(),
  lowerTrigram: z.number().int().min(1).max(8).optional(),
  movingLine: z.number().int().min(1).max(6).optional(),
}).superRefine((value, context) => {
  if (value.mode === "number") {
    for (const [field, valid] of [
      ["numberOne", value.numberOne !== undefined],
      ["numberTwo", value.numberTwo !== undefined],
      ["includeHour", value.includeHour !== undefined],
      ["school", value.school !== undefined],
    ] as const) {
      if (!valid) context.addIssue({ code: "custom", path: [field], message: "报数起盘参数不完整" });
    }
  }
  if (value.mode === "random" || value.mode === "specified") {
    for (const [field, valid] of [
      ["upperTrigram", value.upperTrigram !== undefined],
      ["lowerTrigram", value.lowerTrigram !== undefined],
      ["movingLine", value.movingLine !== undefined],
    ] as const) {
      if (!valid) context.addIssue({ code: "custom", path: [field], message: "卦象参数不完整" });
    }
  }
});

const MeihuaTrigramSchema = z.object({
  index: z.number().int().min(1).max(8),
  key: z.enum(["qian", "dui", "li", "zhen", "xun", "kan", "gen", "kun"]),
  name: z.enum(["乾", "兑", "离", "震", "巽", "坎", "艮", "坤"]),
  symbol: z.enum(["☰", "☱", "☲", "☳", "☴", "☵", "☶", "☷"]),
  element: z.enum(["金", "木", "水", "火", "土"]),
  lines: z.array(z.enum(["yang", "yin"])).length(3),
});

export const MeihuaHexagramSchema = z.object({
  key: z.string().regex(/^(qian|dui|li|zhen|xun|kan|gen|kun){2}$/),
  name: z.string().min(2),
  upper: MeihuaTrigramSchema,
  lower: MeihuaTrigramSchema,
  lines: z.array(z.enum(["yang", "yin"])).length(6),
});

export const MeihuaChartResponseSchema = z.object({
  overview: z.object({
    method: z.enum(["时间起盘", "随机起盘", "报数起盘", "指定起盘"]),
    solarDateTime: BirthDateTimeSchema,
    lunarDate: z.string().min(1),
    pillars: z.object({
      year: z.string().length(2),
      month: z.string().length(2),
      day: z.string().length(2),
      hour: z.string().length(2),
    }),
    voidBranches: z.string().length(2),
    school: z.enum(["digit_sum", "raw_number"]).nullish().transform((value) => value ?? null),
    numberOne: z.number().int().nullish().transform((value) => value ?? null),
    numberTwo: z.number().int().nullish().transform((value) => value ?? null),
    includeHour: z.boolean(),
  }),
  upperTrigram: z.number().int().min(1).max(8),
  lowerTrigram: z.number().int().min(1).max(8),
  movingLine: z.number().int().min(1).max(6),
  original: MeihuaHexagramSchema,
  mutual: MeihuaHexagramSchema,
  changed: MeihuaHexagramSchema,
});

export const MeihuaChartWithReferenceSchema = MeihuaChartResponseSchema.extend({
  paipan_ref: PaipanReferenceSchema,
  expiresAt: z.iso.datetime(),
});

export const MeihuaContextResponseSchema = z.object({
  schemaVersion: z.literal("guoxue.paipan.meihua.v1"),
  chartType: z.literal("meihua"),
  paipan_ref: PaipanReferenceSchema,
  generatedAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
  chartRequest: MeihuaChartRequestSchema,
  chart: MeihuaChartResponseSchema,
});

export const LuojiChartRequestSchema = z.object({
  chartDateTime: BirthDateTimeSchema,
  question: z.string().trim().max(80).default(""),
  mode: z.enum(["coins", "names", "backs"]),
  coinBacks: z.string().regex(/^[0-3]{6}$/).optional(),
  originalHexagram: z.string().min(2).optional(),
  changedHexagram: z.string().min(2).optional(),
}).superRefine((value, context) => {
  if ((value.mode === "coins" || value.mode === "backs") && value.coinBacks === undefined) {
    context.addIssue({ code: "custom", path: ["coinBacks"], message: "硬币背数需要六位" });
  }
  if (value.mode === "names") {
    if (value.originalHexagram === undefined) context.addIssue({ code: "custom", path: ["originalHexagram"], message: "请选择本卦" });
    if (value.changedHexagram === undefined) context.addIssue({ code: "custom", path: ["changedHexagram"], message: "请选择变卦" });
  }
});

const LuojiPalaceSchema = z.object({
  name: z.string().regex(/^[乾兑离震巽坎艮坤]宫$/),
  sequence: z.number().int().min(1).max(8),
  type: z.enum(["游魂", "归魂"]).nullish().transform((value) => value ?? null),
  element: z.enum(["金", "木", "水", "火", "土"]),
});

export const LuojiHexagramSchema = z.object({
  name: z.string().min(2),
  upperTrigram: z.enum(["乾", "兑", "离", "震", "巽", "坎", "艮", "坤"]),
  lowerTrigram: z.enum(["乾", "兑", "离", "震", "巽", "坎", "艮", "坤"]),
  lines: z.array(z.enum(["yang", "yin"])).length(6),
  palace: LuojiPalaceSchema,
  shiLine: z.number().int().min(1).max(6),
  yingLine: z.number().int().min(1).max(6),
});

export const LuojiLineSchema = z.object({
  position: z.number().int().min(1).max(6),
  deity: z.enum(["青龙", "朱雀", "勾陈", "螣蛇", "白虎", "玄武"]),
  hiddenKin: z.enum(["父母", "兄弟", "子孙", "官鬼", "妻财"]).nullish().transform((value) => value ?? null),
  hiddenStemBranch: z.string().length(2).nullish().transform((value) => value ?? null),
  originalKin: z.enum(["父母", "兄弟", "子孙", "官鬼", "妻财"]),
  originalStemBranch: z.string().length(2),
  originalElement: z.enum(["金", "木", "水", "火", "土"]),
  originalLine: z.enum(["yang", "yin"]),
  isMoving: z.boolean(),
  marker: z.enum(["世", "应"]).nullish().transform((value) => value ?? null),
  changedKin: z.enum(["父母", "兄弟", "子孙", "官鬼", "妻财"]),
  changedStemBranch: z.string().length(2),
  changedElement: z.enum(["金", "木", "水", "火", "土"]),
  changedLine: z.enum(["yang", "yin"]),
});

export const LuojiChartResponseSchema = z.object({
  overview: z.object({
    method: z.enum(["铜钱摇盘法", "盘名起盘法", "硬币背数法"]),
    question: z.string(),
    solarDateTime: BirthDateTimeSchema,
    lunarDate: z.string().min(1),
    pillars: z.object({
      year: z.string().length(2),
      month: z.string().length(2),
      day: z.string().length(2),
      hour: z.string().length(2),
    }),
    voidBranches: z.string().length(2),
    coinBacks: z.string().regex(/^[0-3]{6}$/).nullish().transform((value) => value ?? null),
  }),
  original: LuojiHexagramSchema,
  changed: LuojiHexagramSchema,
  lines: z.array(LuojiLineSchema).length(6),
});

export const LuojiChartWithReferenceSchema = LuojiChartResponseSchema.extend({
  paipan_ref: PaipanReferenceSchema,
  expiresAt: z.iso.datetime(),
});

export const LuojiContextResponseSchema = z.object({
  schemaVersion: z.literal("guoxue.paipan.luoji.v1"),
  chartType: z.literal("luoji"),
  paipan_ref: PaipanReferenceSchema,
  generatedAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
  chartRequest: LuojiChartRequestSchema,
  chart: LuojiChartResponseSchema,
});

export const ShanxiangChartRequestSchema = z.object({
  year: z.number().int().min(1930).max(2100),
  degrees: z.number().min(0).max(360),
  question: z.string().trim().max(80).default(""),
});

export const ShanxiangPanelSchema = z.object({
  overview: z.object({
    degrees: z.number().min(0).max(360),
    direction: z.string().length(1),
    mountain: z.string().length(1),
    degreeRange: z.string().min(3),
    dunType: z.enum(["阴", "阳"]),
    juNumber: z.number().int().min(1).max(9),
    yearPillar: z.string().length(2),
    hourPillar: z.string().length(2),
    voidBranches: z.string().length(2),
    xunShou: z.string().min(2),
    chiefStar: z.object({ name: z.string().min(1), palace: z.number().int().min(1).max(9) }),
    chiefDoor: z.object({ name: z.string().min(1), palace: z.number().int().min(1).max(9) }),
    horse: z.object({ branch: z.string().length(1), palace: z.number().int().min(1).max(9) }),
    huangQuan: z.string().min(1),
  }),
  palaces: z.array(YinpanPalaceSchema).length(9),
});

export const ShanxiangChartResponseSchema = z.object({
  overview: z.object({
    year: z.number().int().min(1930).max(2100),
    selectedDegrees: z.number().min(0).max(360),
    question: z.string(),
  }),
  panels: z.array(ShanxiangPanelSchema).length(3),
});

export const ShanxiangChartWithReferenceSchema = ShanxiangChartResponseSchema.extend({
  paipan_ref: PaipanReferenceSchema,
  expiresAt: z.iso.datetime(),
});

export const XingxiangChartRequestSchema = z.object({
  name: z.string().trim().min(1).max(10),
  gender: z.enum(["male", "female"]),
  birthDateTime: BirthDateTimeSchema,
  school: z.literal("flying").default("flying"),
});

const XingxiangPillarsSchema = z.object({
  year: z.string().length(2),
  month: z.string().length(2),
  day: z.string().length(2),
  hour: z.string().length(2),
});

export const XingxiangStarSchema = z.object({
  name: z.string().min(1),
  category: z.enum(["major", "soft", "flower", "tough", "support"]),
  brightness: z.string(),
  natalTransformation: z.enum(["禄", "权", "科", "忌"]).nullish().transform((value) => value ?? null),
});

export const XingxiangPalaceNameSchema = z.object({
  branch: z.enum(["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]),
  name: z.enum(["命宫", "兄弟", "夫妻", "子女", "财帛", "疾厄", "迁移", "交友", "官禄", "田宅", "福德", "父母"]),
});

const XingxiangTransformationSchema = z.object({
  transformation: z.enum(["禄", "权", "科", "忌"]),
  star: z.string().min(1),
});

export const XingxiangPalaceSchema = XingxiangPalaceNameSchema.extend({
  heavenlyStem: z.enum(["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"]),
  bodyPalace: z.boolean(),
  zodiacPalace: z.boolean(),
  originPalace: z.boolean(),
  stars: z.array(XingxiangStarSchema),
  selfTransformations: z.array(XingxiangTransformationSchema.extend({ inward: z.boolean() })),
});

const XingxiangAnnualSchema = z.object({
  age: z.number().int().min(1),
  year: z.number().int().min(1800).max(2300),
  ganZhi: z.string().length(2),
  palaceNames: z.array(XingxiangPalaceNameSchema).length(12),
  transformations: z.array(XingxiangTransformationSchema).length(4),
});

const XingxiangPeriodSchema = z.object({
  ganZhi: z.string().length(2),
  startAge: z.number().int().min(1),
  endAge: z.number().int().min(1),
  startYear: z.number().int(),
  endYear: z.number().int(),
  palaceNames: z.array(XingxiangPalaceNameSchema).length(12),
  transformations: z.array(XingxiangTransformationSchema).length(4),
  annuals: z.array(XingxiangAnnualSchema).length(10),
});

export const XingxiangChartResponseSchema = z.object({
  profile: z.object({
    name: z.string().min(1).max(10),
    gender: z.enum(["male", "female"]),
    genderLabel: z.enum(["男", "女"]),
    yinYangGender: z.enum(["阳男", "阴男", "阳女", "阴女"]),
    solarDateTime: BirthDateTimeSchema,
    lunarDate: z.string().min(1),
    fiveElementsBureau: z.enum(["水二局", "木三局", "金四局", "土五局", "火六局"]),
    pillars: XingxiangPillarsSchema,
  }),
  palaces: z.array(XingxiangPalaceSchema).length(12),
  periods: z.array(XingxiangPeriodSchema).length(12),
});

export const XingxiangChartWithReferenceSchema = XingxiangChartResponseSchema.extend({
  paipan_ref: PaipanReferenceSchema,
  expiresAt: z.iso.datetime(),
});

export const ShuziGuilvChartRequestSchema = z.object({
  name: z.string().trim().min(1).max(10),
  gender: z.enum(["male", "female"]),
  birthDateTime: BirthDateTimeSchema,
});

const ShuziNumberCellSchema = z.object({
  numbers: z.array(z.number().int().min(1).max(12)).min(1).max(3),
  yinYang: z.array(z.enum(["阴", "阳"])).min(1).max(3),
  elements: z.array(z.enum(["金", "木", "水", "火", "土"])).min(1).max(3),
});

const ShuziNumberSetSchema = z.object({
  year: ShuziNumberCellSchema,
  month: ShuziNumberCellSchema,
  day: ShuziNumberCellSchema,
  hour: ShuziNumberCellSchema,
});

export const ShuziGuilvChartResponseSchema = z.object({
  overview: z.object({
    name: z.string().min(1).max(10),
    gender: z.enum(["male", "female"]),
    genderLabel: z.enum(["男", "女"]),
    solarDateTime: BirthDateTimeSchema,
    lunarDate: z.string().min(1),
    chineseZodiac: z.string().length(1),
  }),
  innate: ShuziNumberSetSchema,
  acquired: ShuziNumberSetSchema,
  interpretations: z.array(z.object({
    combination: z.string().min(3),
    position: z.enum(["年月", "月日", "日时"]),
    category: z.string().min(1),
    description: z.string().min(1),
    occurrences: z.number().int().min(1),
  })),
});

export const ShuziGuilvChartWithReferenceSchema = ShuziGuilvChartResponseSchema.extend({
  paipan_ref: PaipanReferenceSchema,
  expiresAt: z.iso.datetime(),
});

export const XUANKONG_ORIENTATIONS = [
  "壬山丙向", "子山午向", "癸山丁向", "丑山未向", "艮山坤向", "寅山申向",
  "甲山庚向", "卯山酉向", "乙山辛向", "辰山戌向", "巽山乾向", "巳山亥向",
  "丙山壬向", "午山子向", "丁山癸向", "未山丑向", "坤山艮向", "申山寅向",
  "庚山甲向", "酉山卯向", "辛山乙向", "戌山辰向", "乾山巽向", "亥山巳向",
] as const;

export const XuankongFeixingChartRequestSchema = z.object({
  chartDateTime: BirthDateTimeSchema,
  fortunePeriod: z.number().int().min(1).max(9),
  orientation: z.enum(XUANKONG_ORIENTATIONS),
  method: z.enum(["base", "replacement"]),
  note: z.string().trim().max(10).default(""),
});

export const XuankongFeixingPalaceSchema = z.object({
  index: z.number().int().min(1).max(9),
  trigram: z.enum(["乾", "兑", "离", "震", "巽", "坎", "艮", "坤", "中"]),
  direction: z.enum(["北方", "东北", "东方", "东南", "南方", "西南", "西方", "西北", "中央"]),
  element: z.enum(["金", "木", "水", "火", "土"]),
  star: z.string().min(2),
  fortuneStar: z.number().int().min(1).max(9),
  mountainStar: z.number().int().min(1).max(9),
  facingStar: z.number().int().min(1).max(9),
  annualStar: z.number().int().min(1).max(9),
  monthlyStar: z.number().int().min(1).max(9),
  dailyStar: z.number().int().min(1).max(9),
  hourlyStar: z.number().int().min(1).max(9),
  mountainPosition: z.string().length(1).nullish().transform((value) => value ?? null),
  facingPosition: z.string().length(1).nullish().transform((value) => value ?? null),
  interpretations: z.object({
    combination: z.string(),
    fortune: z.string(),
    mountain: z.string(),
    facing: z.string(),
    annual: z.string(),
  }),
});

export const XuankongFeixingChartResponseSchema = z.object({
  overview: z.object({
    chartDateTime: BirthDateTimeSchema,
    lunarDate: z.string().min(1),
    fortunePeriod: z.number().int().min(1).max(9),
    fortuneLabel: z.string().regex(/^[一二三四五六七八九]运$/),
    orientation: z.enum(XUANKONG_ORIENTATIONS),
    method: z.enum(["base", "replacement"]),
    methodLabel: z.enum(["下盘", "替盘"]),
    note: z.string().max(10),
  }),
  directions: z.array(z.string().min(1)).length(8),
  palaces: z.array(XuankongFeixingPalaceSchema).length(9),
});

export const XuankongFeixingChartWithReferenceSchema = XuankongFeixingChartResponseSchema.extend({
  paipan_ref: PaipanReferenceSchema,
  expiresAt: z.iso.datetime(),
});

export const ShanxiangContextResponseSchema = z.object({
  schemaVersion: z.literal("guoxue.paipan.shanxiang_juece.v1"),
  chartType: z.literal("shanxiang_juece"),
  paipan_ref: PaipanReferenceSchema,
  generatedAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
  chartRequest: ShanxiangChartRequestSchema,
  chart: ShanxiangChartResponseSchema,
});

export const XingxiangContextResponseSchema = z.object({
  schemaVersion: z.literal("guoxue.paipan.xingxiang.v1"),
  chartType: z.literal("xingxiang"),
  paipan_ref: PaipanReferenceSchema,
  generatedAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
  chartRequest: XingxiangChartRequestSchema,
  chart: XingxiangChartResponseSchema,
});

export const ShuziGuilvContextResponseSchema = z.object({
  schemaVersion: z.literal("guoxue.paipan.shuzi_guilv.v1"),
  chartType: z.literal("shuzi_guilv"),
  paipan_ref: PaipanReferenceSchema,
  generatedAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
  chartRequest: ShuziGuilvChartRequestSchema,
  chart: ShuziGuilvChartResponseSchema,
});

export const XuankongFeixingContextResponseSchema = z.object({
  schemaVersion: z.literal("guoxue.paipan.xuankong_feixing.v1"),
  chartType: z.literal("xuankong_feixing"),
  paipan_ref: PaipanReferenceSchema,
  generatedAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
  chartRequest: XuankongFeixingChartRequestSchema,
  chart: XuankongFeixingChartResponseSchema,
});

export const FlowMonthsRequestSchema = z.object({
  chart: BaziChartRequestSchema,
  year: z.number().int().min(1900).max(2200),
});

export const FlowMonthsResponseSchema = z.object({
  year: z.number().int(),
  months: z.array(
    z.object({
      index: z.number().int().min(1).max(12),
      monthName: z.string(),
      ganZhi: z.string(),
      solarTermName: z.string(),
      solarTermDateTime: z.string(),
      tenGods: z.array(z.string()),
      hiddenStems: z.string(),
      hiddenStemTenGods: z.array(z.string()),
      heavenlyStemAttention: z.array(z.string()),
      earthlyBranchAttention: z.array(z.string()),
      shenSha: z.array(z.string()),
    }),
  ),
});

export const ShenShaRequestSchema = z.object({
  pillars: z.record(z.string(), z.array(z.string().length(1)).length(2)),
  target: z.enum(["nian", "yue", "ri", "shi", "dayun", "liunian", "liuyue"]),
});

export const ShenShaResponseSchema = z.object({
  target: ShenShaRequestSchema.shape.target,
  names: z.array(z.string()),
});

export type CalendarInfo = z.infer<typeof CalendarInfoSchema>;
export type Guidance = z.infer<typeof GuidanceSchema>;
export type HomeLinks = z.infer<typeof HomeLinksSchema>;
export type HomeResponse = z.infer<typeof HomeResponseSchema>;
export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;
export type TrackEventRequest = z.infer<typeof TrackEventRequestSchema>;
export type ProblemDetails = z.infer<typeof ProblemDetailsSchema>;
export type ResolveBirthRequest = z.infer<typeof ResolveBirthRequestSchema>;
export type ResolveBirthResponse = z.infer<typeof ResolveBirthResponseSchema>;
export type BaziChartRequest = z.infer<typeof BaziChartRequestSchema>;
export type BaziChartResponse = z.infer<typeof BaziChartResponseSchema>;
export type BaziChartWithReference = z.infer<typeof BaziChartWithReferenceSchema>;
export type PaipanContextLookupRequest = z.infer<typeof PaipanContextLookupRequestSchema>;
export type PaipanContextResponse = z.infer<typeof PaipanContextResponseSchema>;
export type DunjiaChartRequest = z.infer<typeof DunjiaChartRequestSchema>;
export type DunjiaPalace = z.infer<typeof DunjiaPalaceSchema>;
export type DunjiaChartResponse = z.infer<typeof DunjiaChartResponseSchema>;
export type DunjiaChartWithReference = z.infer<typeof DunjiaChartWithReferenceSchema>;
export type DunjiaContextResponse = z.infer<typeof DunjiaContextResponseSchema>;
export type JueceTime = z.infer<typeof JueceTimeSchema>;
export type JuecePan = z.infer<typeof JuecePanSchema>;
export type JueceBureau = z.infer<typeof JueceBureauSchema>;
export type JueceChartRequest = z.infer<typeof JueceChartRequestSchema>;
export type JuecePalace = z.infer<typeof JuecePalaceSchema>;
export type JueceChartResponse = z.infer<typeof JueceChartResponseSchema>;
export type JueceChartWithReference = z.infer<typeof JueceChartWithReferenceSchema>;
export type JueceContextResponse = z.infer<typeof JueceContextResponseSchema>;
export type YinpanChartRequest = z.infer<typeof YinpanChartRequestSchema>;
export type YinpanPalace = z.infer<typeof YinpanPalaceSchema>;
export type YinpanChartResponse = z.infer<typeof YinpanChartResponseSchema>;
export type YinpanChartWithReference = z.infer<typeof YinpanChartWithReferenceSchema>;
export type YinpanContextResponse = z.infer<typeof YinpanContextResponseSchema>;
export type MeihuaChartRequest = z.infer<typeof MeihuaChartRequestSchema>;
export type MeihuaHexagram = z.infer<typeof MeihuaHexagramSchema>;
export type MeihuaChartResponse = z.infer<typeof MeihuaChartResponseSchema>;
export type MeihuaChartWithReference = z.infer<typeof MeihuaChartWithReferenceSchema>;
export type MeihuaContextResponse = z.infer<typeof MeihuaContextResponseSchema>;
export type LuojiChartRequest = z.infer<typeof LuojiChartRequestSchema>;
export type LuojiHexagram = z.infer<typeof LuojiHexagramSchema>;
export type LuojiLine = z.infer<typeof LuojiLineSchema>;
export type LuojiChartResponse = z.infer<typeof LuojiChartResponseSchema>;
export type LuojiChartWithReference = z.infer<typeof LuojiChartWithReferenceSchema>;
export type LuojiContextResponse = z.infer<typeof LuojiContextResponseSchema>;
export type ShanxiangChartRequest = z.infer<typeof ShanxiangChartRequestSchema>;
export type ShanxiangPanel = z.infer<typeof ShanxiangPanelSchema>;
export type ShanxiangChartResponse = z.infer<typeof ShanxiangChartResponseSchema>;
export type ShanxiangChartWithReference = z.infer<typeof ShanxiangChartWithReferenceSchema>;
export type ShanxiangContextResponse = z.infer<typeof ShanxiangContextResponseSchema>;
export type XingxiangChartRequest = z.infer<typeof XingxiangChartRequestSchema>;
export type XingxiangStar = z.infer<typeof XingxiangStarSchema>;
export type XingxiangPalace = z.infer<typeof XingxiangPalaceSchema>;
export type XingxiangChartResponse = z.infer<typeof XingxiangChartResponseSchema>;
export type XingxiangChartWithReference = z.infer<typeof XingxiangChartWithReferenceSchema>;
export type XingxiangContextResponse = z.infer<typeof XingxiangContextResponseSchema>;
export type ShuziGuilvChartRequest = z.infer<typeof ShuziGuilvChartRequestSchema>;
export type ShuziNumberCell = z.infer<typeof ShuziNumberCellSchema>;
export type ShuziGuilvChartResponse = z.infer<typeof ShuziGuilvChartResponseSchema>;
export type ShuziGuilvChartWithReference = z.infer<typeof ShuziGuilvChartWithReferenceSchema>;
export type ShuziGuilvContextResponse = z.infer<typeof ShuziGuilvContextResponseSchema>;
export type XuankongFeixingChartRequest = z.infer<typeof XuankongFeixingChartRequestSchema>;
export type XuankongFeixingPalace = z.infer<typeof XuankongFeixingPalaceSchema>;
export type XuankongFeixingChartResponse = z.infer<typeof XuankongFeixingChartResponseSchema>;
export type XuankongFeixingChartWithReference = z.infer<typeof XuankongFeixingChartWithReferenceSchema>;
export type XuankongFeixingContextResponse = z.infer<typeof XuankongFeixingContextResponseSchema>;
export type FlowMonthsRequest = z.infer<typeof FlowMonthsRequestSchema>;
export type FlowMonthsResponse = z.infer<typeof FlowMonthsResponseSchema>;
export type ShenShaRequest = z.infer<typeof ShenShaRequestSchema>;
export type ShenShaResponse = z.infer<typeof ShenShaResponseSchema>;
