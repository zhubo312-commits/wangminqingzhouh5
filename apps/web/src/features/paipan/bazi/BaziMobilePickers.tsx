import type { PaipanAreaNode } from "@guoxue/contracts";
import { CaretDown } from "@phosphor-icons/react";
import { useCallback, useMemo, useState } from "react";
import {
  MobileWheelPicker,
  type WheelColumn,
  type WheelOption,
} from "../../../components/MobileWheelPicker";
import { JIA_ZI } from "./constants";

interface DateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

interface LunarParts extends DateTimeParts {
  leapMonth: boolean;
}

interface FourPillarsValue {
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function numberOptions(start: number, end: number, padded = false): WheelOption[] {
  return Array.from({ length: end - start + 1 }, (_, index) => {
    const value = start + index;
    return { value: String(value), label: padded ? pad(value) : String(value) };
  });
}

const YEAR_OPTIONS = numberOptions(1900, 2100);
const MONTH_OPTIONS = numberOptions(1, 12);
const LUNAR_DAY_OPTIONS = numberOptions(1, 30);
const HOUR_OPTIONS = numberOptions(0, 23, true);
const MINUTE_OPTIONS = numberOptions(0, 59, true);
const SHI_CHEN_NAMES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
function shiChenForHour(hour: number) {
  return SHI_CHEN_NAMES[Math.floor(((hour + 1) % 24) / 2)]!;
}
const LUNAR_HOUR_OPTIONS = HOUR_OPTIONS.map((option) => ({
  ...option,
  label: `${option.label}（${shiChenForHour(Number(option.value))}时）`,
}));
const JIA_ZI_OPTIONS = JIA_ZI.map((value) => ({ value, label: value }));
const LUNAR_MONTH_NAMES = [
  "正月",
  "二月",
  "三月",
  "四月",
  "五月",
  "六月",
  "七月",
  "八月",
  "九月",
  "十月",
  "冬月",
  "腊月",
];
const LUNAR_DAY_NAMES = [
  "初一",
  "初二",
  "初三",
  "初四",
  "初五",
  "初六",
  "初七",
  "初八",
  "初九",
  "初十",
  "十一",
  "十二",
  "十三",
  "十四",
  "十五",
  "十六",
  "十七",
  "十八",
  "十九",
  "二十",
  "廿一",
  "廿二",
  "廿三",
  "廿四",
  "廿五",
  "廿六",
  "廿七",
  "廿八",
  "廿九",
  "三十",
];

function daysInSolarMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function parseSolarDateTime(value: string): DateTimeParts {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return { year: 1990, month: 1, day: 1, hour: 12, minute: 0 };
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
  };
}

function PickerTrigger({
  value,
  ariaLabel,
  hint = "点击滚动选择",
  disabled = false,
  onClick,
}: {
  value: string;
  ariaLabel: string;
  hint?: string | null;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`wheel-picker-trigger${hint ? "" : " wheel-picker-trigger-single"}`}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="wheel-picker-trigger-copy">
        <strong>{value}</strong>
        {hint && <small>{hint}</small>}
      </span>
      <CaretDown size={22} weight="bold" aria-hidden="true" />
    </button>
  );
}

export function SolarDateTimePicker({
  value,
  onChange,
  subject = "出生",
}: {
  value: string;
  onChange: (value: string) => void;
  subject?: "出生" | "起盘";
}) {
  const [open, setOpen] = useState<"date" | "time" | null>(null);
  const [working, setWorking] = useState<DateTimeParts>(() => parseSolarDateTime(value));
  const close = useCallback(() => setOpen(null), []);
  const dayOptions = useMemo(
    () => numberOptions(1, daysInSolarMonth(working.year, working.month)),
    [working.month, working.year],
  );

  function openPicker(part: "date" | "time") {
    setWorking(parseSolarDateTime(value));
    setOpen(part);
  }

  function updatePart(key: keyof DateTimeParts, nextValue: string) {
    setWorking((current) => {
      const next = { ...current, [key]: Number(nextValue) };
      next.day = Math.min(next.day, daysInSolarMonth(next.year, next.month));
      return next;
    });
  }

  const dateColumns: WheelColumn[] = [
    { id: "solar-year", label: "年", value: String(working.year), options: YEAR_OPTIONS, onChange: (next) => updatePart("year", next) },
    { id: "solar-month", label: "月", value: String(working.month), options: MONTH_OPTIONS, onChange: (next) => updatePart("month", next) },
    { id: "solar-day", label: "日", value: String(working.day), options: dayOptions, onChange: (next) => updatePart("day", next) },
  ];
  const timeColumns: WheelColumn[] = [
    { id: "solar-hour", label: "时", value: String(working.hour), options: HOUR_OPTIONS, onChange: (next) => updatePart("hour", next) },
    { id: "solar-minute", label: "分", value: String(working.minute), options: MINUTE_OPTIONS, onChange: (next) => updatePart("minute", next) },
  ];

  const current = parseSolarDateTime(value);
  return (
    <>
      <div className="split-picker-triggers">
        <PickerTrigger
          value={`${current.year}年${current.month}月${current.day}日`}
          ariaLabel="选择阳历日期"
          hint={null}
          onClick={() => openPicker("date")}
        />
        <PickerTrigger
          value={`${pad(current.hour)}:${pad(current.minute)}`}
          ariaLabel="选择阳历时间"
          hint={null}
          onClick={() => openPicker("time")}
        />
      </div>
      <MobileWheelPicker
        open={open === "date"}
        title={`选择阳历${subject}日期`}
        columns={dateColumns}
        onCancel={close}
        onConfirm={() => {
          onChange(`${working.year}-${pad(working.month)}-${pad(working.day)}T${pad(working.hour)}:${pad(working.minute)}`);
          close();
        }}
      />
      <MobileWheelPicker
        open={open === "time"}
        title={`选择阳历${subject}时间`}
        columns={timeColumns}
        onCancel={close}
        onConfirm={() => {
          onChange(`${working.year}-${pad(working.month)}-${pad(working.day)}T${pad(working.hour)}:${pad(working.minute)}`);
          close();
        }}
      />
    </>
  );
}

export function LunarDateTimePicker({
  value,
  onChange,
  subject = "出生",
}: {
  value: LunarParts;
  onChange: (value: LunarParts) => void;
  subject?: "出生" | "起盘";
}) {
  const [open, setOpen] = useState<"date" | "time" | null>(null);
  const [working, setWorking] = useState<LunarParts>(value);
  const close = useCallback(() => setOpen(null), []);

  function openPicker(part: "date" | "time") {
    setWorking(value);
    setOpen(part);
  }

  function updatePart(key: keyof DateTimeParts, nextValue: string) {
    setWorking((current) => ({ ...current, [key]: Number(nextValue) }));
  }

  const dateColumns: WheelColumn[] = [
    { id: "lunar-year", label: "年", value: String(working.year), options: YEAR_OPTIONS, onChange: (next) => updatePart("year", next) },
    { id: "lunar-month", label: "月", value: String(working.month), options: MONTH_OPTIONS, onChange: (next) => updatePart("month", next) },
    { id: "lunar-day", label: "日", value: String(working.day), options: LUNAR_DAY_OPTIONS, onChange: (next) => updatePart("day", next) },
  ];
  const timeColumns: WheelColumn[] = [
    { id: "lunar-hour", label: "时（时辰）", value: String(working.hour), options: LUNAR_HOUR_OPTIONS, onChange: (next) => updatePart("hour", next) },
    { id: "lunar-minute", label: "分", value: String(working.minute), options: MINUTE_OPTIONS, onChange: (next) => updatePart("minute", next) },
  ];

  return (
    <>
      <div className="split-picker-triggers">
        <PickerTrigger
          value={`${value.year}年 ${value.leapMonth ? "闰" : ""}${LUNAR_MONTH_NAMES[value.month - 1]} ${LUNAR_DAY_NAMES[value.day - 1]}`}
          ariaLabel="选择阴历日期"
          hint={null}
          onClick={() => openPicker("date")}
        />
        <PickerTrigger
          value={`${pad(value.hour)}:${pad(value.minute)}（${shiChenForHour(value.hour)}时）`}
          ariaLabel="选择阴历时间"
          hint={null}
          onClick={() => openPicker("time")}
        />
      </div>
      <MobileWheelPicker
        open={open === "date"}
        title={`选择阴历${subject}日期`}
        columns={dateColumns}
        onCancel={close}
        onConfirm={() => {
          onChange(working);
          close();
        }}
        extraContent={
          <fieldset className="leap-month-control">
            <legend>月份类型</legend>
            <div>
              <button
                type="button"
                className={!working.leapMonth ? "active" : ""}
                aria-pressed={!working.leapMonth}
                onClick={() => setWorking((current) => ({ ...current, leapMonth: false }))}
              >
                平月
              </button>
              <button
                type="button"
                className={working.leapMonth ? "active" : ""}
                aria-pressed={working.leapMonth}
                onClick={() => setWorking((current) => ({ ...current, leapMonth: true }))}
              >
                闰月
              </button>
            </div>
          </fieldset>
        }
      />
      <MobileWheelPicker
        open={open === "time"}
        title={`选择阴历${subject}时间`}
        columns={timeColumns}
        onCancel={close}
        onConfirm={() => {
          onChange(working);
          close();
        }}
      />
    </>
  );
}

export function FourPillarsPicker({
  value,
  onChange,
}: {
  value: FourPillarsValue;
  onChange: (value: FourPillarsValue) => void;
}) {
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState<FourPillarsValue>(value);
  const close = useCallback(() => setOpen(false), []);

  function openPicker() {
    setWorking(value);
    setOpen(true);
  }

  const columns: WheelColumn[] = [
    { id: "year-pillar", label: "年柱", value: working.yearPillar, options: JIA_ZI_OPTIONS, onChange: (next) => setWorking((current) => ({ ...current, yearPillar: next })) },
    { id: "month-pillar", label: "月柱", value: working.monthPillar, options: JIA_ZI_OPTIONS, onChange: (next) => setWorking((current) => ({ ...current, monthPillar: next })) },
    { id: "day-pillar", label: "日柱", value: working.dayPillar, options: JIA_ZI_OPTIONS, onChange: (next) => setWorking((current) => ({ ...current, dayPillar: next })) },
    { id: "hour-pillar", label: "时柱", value: working.hourPillar, options: JIA_ZI_OPTIONS, onChange: (next) => setWorking((current) => ({ ...current, hourPillar: next })) },
  ];

  return (
    <>
      <PickerTrigger
        value={`${value.yearPillar} · ${value.monthPillar} · ${value.dayPillar} · ${value.hourPillar}`}
        ariaLabel="选择四柱"
        onClick={openPicker}
      />
      <MobileWheelPicker
        open={open}
        title="滚动选择四柱"
        columns={columns}
        onCancel={close}
        onConfirm={() => {
          onChange(working);
          close();
        }}
      />
    </>
  );
}

function findAreaPath(nodes: PaipanAreaNode[], code: string): PaipanAreaNode[] | null {
  for (const node of nodes) {
    if (node.code === code) return [node];
    const childPath = findAreaPath(node.children, code);
    if (childPath) return [node, ...childPath];
  }
  return null;
}

function firstLeafPath(node: PaipanAreaNode): PaipanAreaNode[] {
  if (node.children.length === 0) return [node];
  return [node, ...firstLeafPath(node.children[0]!)];
}

function optionNodes(nodes: PaipanAreaNode[]): WheelOption[] {
  return nodes.map((node) => ({ value: node.code, label: node.label }));
}

export function AreaWheelPicker({
  areas,
  value,
  disabled,
  onChange,
}: {
  areas: PaipanAreaNode[];
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [workingPath, setWorkingPath] = useState<PaipanAreaNode[]>([]);
  const close = useCallback(() => setOpen(false), []);
  const selectedPath = useMemo(() => findAreaPath(areas, value), [areas, value]);

  function openPicker() {
    const nextPath = selectedPath ?? (areas[0] ? firstLeafPath(areas[0]) : []);
    setWorkingPath(nextPath);
    setOpen(true);
  }

  const province = areas.find((node) => node.code === workingPath[0]?.code) ?? areas[0];
  const hasDirectDistricts = Boolean(
    province?.children.length && province.children.every((node) => node.children.length === 0),
  );
  const city = hasDirectDistricts
    ? undefined
    : province?.children.find((node) => node.code === workingPath[1]?.code) ?? province?.children[0];
  const district = hasDirectDistricts
    ? province?.children.find((node) => node.code === workingPath[1]?.code) ?? province?.children[0]
    : city?.children.find((node) => node.code === workingPath[2]?.code) ?? city?.children[0];

  const provinceOptions = useMemo(() => optionNodes(areas), [areas]);
  const cityOptions = hasDirectDistricts
    ? [{ value: `municipality-${province?.code ?? "empty"}`, label: province?.label ?? "—" }]
    : province?.children.length
      ? optionNodes(province.children)
      : [{ value: `city-empty-${province?.code ?? "empty"}`, label: "—" }];
  const districtOptions = hasDirectDistricts
    ? optionNodes(province?.children ?? [])
    : city?.children.length
      ? optionNodes(city.children)
      : [{ value: province?.code ?? "empty", label: "—" }];

  const columns: WheelColumn[] = province ? [
    {
      id: "area-province",
      label: "省份",
      value: province.code,
      options: provinceOptions,
      onChange: (next) => {
        const nextProvince = areas.find((node) => node.code === next);
        if (nextProvince) setWorkingPath(firstLeafPath(nextProvince));
      },
    },
    {
      id: "area-city",
      label: "城市",
      value: hasDirectDistricts
        ? `municipality-${province.code}`
        : city?.code ?? `city-empty-${province.code}`,
      options: cityOptions,
      onChange: (next) => {
        if (hasDirectDistricts || province.children.length === 0) return;
        const nextCity = province.children.find((node) => node.code === next);
        if (nextCity) setWorkingPath([province, ...firstLeafPath(nextCity)]);
      },
    },
    {
      id: "area-district",
      label: "区县",
      value: district?.code ?? province.code,
      options: districtOptions,
      onChange: (next) => {
        if (hasDirectDistricts) {
          const nextDistrict = province.children.find((node) => node.code === next);
          if (nextDistrict) setWorkingPath([province, nextDistrict]);
          return;
        }
        const nextDistrict = city?.children.find((node) => node.code === next);
        if (city && nextDistrict) setWorkingPath([province, city, nextDistrict]);
      },
    },
  ] : [];

  return (
    <>
      <PickerTrigger
        value={selectedPath?.map((node) => node.label).join(" / ") ?? (disabled ? "正在加载地区…" : "请选择出生地区")}
        ariaLabel="选择出生地区"
        disabled={disabled}
        onClick={openPicker}
      />
      <MobileWheelPicker
        open={open}
        title="选择出生地区"
        columns={columns}
        onCancel={close}
        onConfirm={() => {
          const selected = workingPath.at(-1);
          if (selected) onChange(selected.code);
          close();
        }}
      />
    </>
  );
}
