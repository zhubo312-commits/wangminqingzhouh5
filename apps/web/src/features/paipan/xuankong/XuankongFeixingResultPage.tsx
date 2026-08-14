import type { XuankongFeixingChartRequest, XuankongFeixingPalace } from "@guoxue/contracts";
import { CalendarDots, Compass, StarFour } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../../components/PageHeader";
import { PaipanActionButton } from "../../../components/paipan/PaipanActionButton";
import { InfoGrid, InfoPair } from "../../../components/paipan/InfoGrid";
import { PaipanEmptyState } from "../../../components/paipan/PaipanEmptyState";
import { PaipanPageShell } from "../../../components/paipan/PaipanPageShell";
import { PaipanSectionCard } from "../../../components/paipan/PaipanSectionCard";
import { createXuankongFeixingChart } from "../../../lib/api-client";
import { SolarDateTimePicker } from "../bazi/BaziMobilePickers";
import { useXuankongFeixingSession } from "./XuankongFeixingSession";

const PALACE_ORDER = [4, 9, 2, 3, 5, 7, 8, 1, 6] as const;
const CHINESE_NUMBERS = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"] as const;
const FLYING_STAR_NAMES = ["", "一白", "二黑", "三碧", "四绿", "五黄", "六白", "七赤", "八白", "九紫"] as const;
const TEMPORAL_FIELDS = [
  ["年飞星", "annualStar"],
  ["月飞星", "monthlyStar"],
  ["日飞星", "dailyStar"],
  ["时飞星", "hourlyStar"],
] as const;

function DirectionRing({ directions }: { directions: string[] }) {
  const positions = [
    ["bottom-center", directions[0]],
    ["bottom-left", directions[1]],
    ["middle-left", directions[2]],
    ["top-left", directions[3]],
    ["top-center", directions[4]],
    ["top-right", directions[5]],
    ["middle-right", directions[6]],
    ["bottom-right", directions[7]],
  ] as const;

  return <>{positions.map(([position, direction]) => <span className={`xuankong-ring-label ${position}`} key={direction}>{direction}</span>)}</>;
}

function PalaceCell({ palace, selected, onSelect }: { palace: XuankongFeixingPalace; selected: boolean; onSelect: () => void }) {
  return <button type="button" className={`xuankong-palace${selected ? " selected" : ""}${palace.index === 5 ? " center" : ""}`} aria-label={`${palace.trigram}${palace.index}宫，${palace.direction}，点击查看解读`} aria-pressed={selected} onClick={onSelect}>
    <span className="xuankong-star-corners" aria-label={`山星 ${palace.mountainStar}，向星 ${palace.facingStar}`}><b>{palace.mountainStar}</b><b>{palace.facingStar}</b></span>
    <strong className="xuankong-fortune-star" aria-label={`运星 ${palace.fortuneStar}`}>{CHINESE_NUMBERS[palace.fortuneStar]}</strong>
    <span className="xuankong-palace-temporal-labels" aria-hidden="true"><small>年</small><small>月</small><small>日</small><small>时</small></span>
    <span className="xuankong-palace-temporal-values" aria-label={`年星 ${palace.annualStar}，月星 ${palace.monthlyStar}，日星 ${palace.dailyStar}，时星 ${palace.hourlyStar}`}><b>{palace.annualStar}</b><b>{palace.monthlyStar}</b><b>{palace.dailyStar}</b><b>{palace.hourlyStar}</b></span>
  </button>;
}

function PalaceDetail({ palace }: { palace: XuankongFeixingPalace }) {
  const readings = [["山向组合", palace.interpretations.combination], ["运星", palace.interpretations.fortune], ["山星", palace.interpretations.mountain], ["向星", palace.interpretations.facing], ["年星", palace.interpretations.annual]].filter((item) => item[1]);
  return <div className="xuankong-palace-detail" aria-live="polite"><div><span>{palace.trigram}{palace.index}宫</span><strong>{palace.direction} · {palace.element} · {palace.star}</strong></div><div className="xuankong-detail-numbers"><span>运星 <b>{palace.fortuneStar}</b></span><span>山星 <b>{palace.mountainStar}</b></span><span>向星 <b>{palace.facingStar}</b></span><span>年星 <b>{palace.annualStar}</b></span></div>{readings.length > 0 ? <div className="xuankong-readings">{readings.map(([label, value]) => <section key={label}><h4>{label}</h4><p>{value}</p></section>)}</div> : <p className="xuankong-reading-empty">此宫暂无原盘文字解读，可结合飞星组合继续研判。</p>}</div>;
}

function TemporalStrip({ label, field, palaces }: { label: string; field: "annualStar" | "monthlyStar" | "dailyStar" | "hourlyStar"; palaces: XuankongFeixingPalace[] }) {
  return <section className="xuankong-temporal"><h3>{label}</h3><div role="list" aria-label={`${label}九宫顺序`}>{palaces.map((palace) => <span role="listitem" key={palace.index}>{FLYING_STAR_NAMES[palace[field]]}</span>)}</div></section>;
}

export function XuankongFeixingResultPage() {
  const navigate = useNavigate();
  const { chart, chartRequest, isRestoring, setResult } = useXuankongFeixingSession();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [editDateTime, setEditDateTime] = useState("");
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (chart) setEditDateTime(chart.overview.chartDateTime.replace(" ", "T")); }, [chart]);
  useEffect(() => {
    if (selectedIndex === null) return;
    const frame = window.requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }));
    return () => window.cancelAnimationFrame(frame);
  }, [selectedIndex]);
  const ordered = useMemo(() => chart ? PALACE_ORDER.map((index) => chart.palaces.find((palace) => palace.index === index)).filter((palace): palace is XuankongFeixingPalace => Boolean(palace)) : [], [chart]);

  if (isRestoring) return <PaipanPageShell pageClassName="result-page xuankong-result-page"><PageHeader title="玄空飞星" backTo="/paipan/xuankong-feixing" backLabel="返回飞星表单" /><PaipanEmptyState icon={<CalendarDots size={46} />} title="正在恢复飞星盘" /></PaipanPageShell>;
  if (!chart || !chartRequest) return <PaipanPageShell pageClassName="result-page xuankong-result-page"><PageHeader title="玄空飞星" backTo="/paipan/xuankong-feixing" backLabel="返回飞星表单" /><PaipanEmptyState icon={<CalendarDots size={46} />} title="本次飞星盘已失效" description="排盘引用不存在或已过期，请重新排盘。" action={<PaipanActionButton variant="restart" onClick={() => navigate("/paipan/xuankong-feixing")}>重新排盘</PaipanActionButton>} /></PaipanPageShell>;
  const selected = selectedIndex === null ? null : chart.palaces.find((palace) => palace.index === selectedIndex) ?? null;

  async function recalculate() {
    if (!chartRequest || !editDateTime) return;
    setRecalculating(true); setError(null);
    try {
      const request: XuankongFeixingChartRequest = { ...chartRequest, chartDateTime: editDateTime.replace("T", " ") };
      const response = await createXuankongFeixingChart(request);
      const { paipan_ref: reference, expiresAt: _expiresAt, ...nextChart } = response;
      setResult(nextChart, request, reference);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "重新起盘失败，请稍后重试"); }
    finally { setRecalculating(false); }
  }

  return <PaipanPageShell pageClassName="result-page xuankong-result-page">
    <PageHeader title="玄空飞星" backTo="/paipan/xuankong-feixing" backLabel="返回飞星表单" />
    <PaipanSectionCard className="xuankong-overview-card" labelledBy="xuankong-overview-heading"><div className="xuankong-hero"><span><StarFour size={28} weight="duotone" /></span><div><small>{chart.overview.fortuneLabel} · {chart.overview.methodLabel}</small><h2 id="xuankong-overview-heading">{chart.overview.orientation}</h2><p>{chart.overview.lunarDate}</p></div></div><InfoGrid><InfoPair label="起盘时间" value={chart.overview.chartDateTime} /><InfoPair label="备注" value={chart.overview.note || "未填写"} /></InfoGrid></PaipanSectionCard>
    <PaipanSectionCard className="xuankong-chart-card" labelledBy="xuankong-chart-heading"><h2 className="result-section-title" id="xuankong-chart-heading"><span>01</span>山向九宫</h2><p className="shuzi-reading-hint">宫内依次显示山星、运星、向星及年月日时飞星；点击宫位后自动下滑查看解读。</p><div className="xuankong-orientation-board" aria-label={`${chart.overview.orientation}九宫飞星盘`}><DirectionRing directions={chart.directions} /><div className="xuankong-nine-grid">{ordered.map((palace) => <PalaceCell key={palace.index} palace={palace} selected={selected?.index === palace.index} onSelect={() => setSelectedIndex((current) => current === palace.index ? null : palace.index)} />)}</div></div>{selected && <div className="xuankong-detail-anchor" ref={detailRef}><PalaceDetail palace={selected} /></div>}</PaipanSectionCard>
    <PaipanSectionCard className="xuankong-temporal-card" labelledBy="xuankong-temporal-heading"><h2 className="result-section-title" id="xuankong-temporal-heading"><span>02</span>年月日时飞星</h2><div className="xuankong-temporal-grid">{TEMPORAL_FIELDS.map(([label, field]) => <TemporalStrip key={field} label={label} field={field} palaces={ordered} />)}</div></PaipanSectionCard>
    <PaipanSectionCard className="xuankong-rechart-card" labelledBy="xuankong-rechart-heading"><div className="xuankong-rechart-heading"><Compass size={24} weight="duotone" /><div><h2 id="xuankong-rechart-heading">调整起盘时间</h2><p>保留当前元运、山向与挨星方式，只重新计算年月日时盘。</p></div></div>{editDateTime && <div className="form-field picker-field"><SolarDateTimePicker subject="起盘" value={editDateTime} onChange={setEditDateTime} /></div>}{error && <div className="form-error" role="alert">{error}</div>}<PaipanActionButton variant="restart" busy={recalculating} onClick={() => void recalculate()}>{recalculating ? "正在重排…" : "按新时间重排"}</PaipanActionButton></PaipanSectionCard>
    <p className="culture-notice">传统文化研究与娱乐参考，请理性看待推演结果</p>
  </PaipanPageShell>;
}
