import type { XuankongFeixingChartRequest, XuankongFeixingPalace } from "@guoxue/contracts";
import { ArrowClockwise, CalendarDots, Compass, StarFour } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../../components/PageHeader";
import { InfoGrid, InfoPair } from "../../../components/paipan/InfoGrid";
import { PaipanEmptyState } from "../../../components/paipan/PaipanEmptyState";
import { PaipanPageShell } from "../../../components/paipan/PaipanPageShell";
import { PaipanSectionCard } from "../../../components/paipan/PaipanSectionCard";
import { createXuankongFeixingChart } from "../../../lib/api-client";
import { SolarDateTimePicker } from "../bazi/BaziMobilePickers";
import { useXuankongFeixingSession } from "./XuankongFeixingSession";

const PALACE_ORDER = [4, 9, 2, 3, 5, 7, 8, 1, 6] as const;

function PalaceCell({ palace, selected, onSelect }: { palace: XuankongFeixingPalace; selected: boolean; onSelect: () => void }) {
  return <button type="button" className={`xuankong-palace${selected ? " selected" : ""}${palace.index === 5 ? " center" : ""}`} aria-pressed={selected} onClick={onSelect}>
    <span className="xuankong-palace-heading"><small>{palace.direction}</small><strong>{palace.trigram}{palace.index}</strong></span>
    <span className="xuankong-main-stars"><b>{palace.mountainStar}</b><i>{palace.fortuneStar}</i><b>{palace.facingStar}</b></span>
    <span className="xuankong-star-labels"><small>山</small><em>{palace.star}</em><small>向</small></span>
  </button>;
}

function PalaceDetail({ palace }: { palace: XuankongFeixingPalace }) {
  const readings = [["山向组合", palace.interpretations.combination], ["运星", palace.interpretations.fortune], ["山星", palace.interpretations.mountain], ["向星", palace.interpretations.facing], ["年星", palace.interpretations.annual]].filter((item) => item[1]);
  return <div className="xuankong-palace-detail" aria-live="polite"><div><span>{palace.trigram}{palace.index}宫</span><strong>{palace.direction} · {palace.element} · {palace.star}</strong></div><div className="xuankong-detail-numbers"><span>运星 <b>{palace.fortuneStar}</b></span><span>山星 <b>{palace.mountainStar}</b></span><span>向星 <b>{palace.facingStar}</b></span><span>年星 <b>{palace.annualStar}</b></span></div>{readings.length > 0 ? <div className="xuankong-readings">{readings.map(([label, value]) => <section key={label}><h4>{label}</h4><p>{value}</p></section>)}</div> : <p className="xuankong-reading-empty">此宫暂无原盘文字解读，可结合飞星组合继续研判。</p>}</div>;
}

function TemporalGrid({ label, field, palaces }: { label: string; field: "annualStar" | "monthlyStar" | "dailyStar" | "hourlyStar"; palaces: XuankongFeixingPalace[] }) {
  return <div className="xuankong-temporal"><h3>{label}</h3><div>{palaces.map((palace) => <span key={palace.index}><small>{palace.trigram}</small><strong>{palace[field]}</strong></span>)}</div></div>;
}

export function XuankongFeixingResultPage() {
  const navigate = useNavigate();
  const { chart, chartRequest, isRestoring, setResult } = useXuankongFeixingSession();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [editDateTime, setEditDateTime] = useState("");
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (chart) setEditDateTime(chart.overview.chartDateTime.replace(" ", "T")); }, [chart]);
  const ordered = useMemo(() => chart ? PALACE_ORDER.map((index) => chart.palaces.find((palace) => palace.index === index)).filter((palace): palace is XuankongFeixingPalace => Boolean(palace)) : [], [chart]);

  if (isRestoring) return <PaipanPageShell pageClassName="result-page xuankong-result-page"><PageHeader title="玄空飞星" backTo="/paipan/xuankong-feixing" backLabel="返回飞星表单" /><PaipanEmptyState icon={<CalendarDots size={46} />} title="正在恢复飞星盘" /></PaipanPageShell>;
  if (!chart || !chartRequest) return <PaipanPageShell pageClassName="result-page xuankong-result-page"><PageHeader title="玄空飞星" backTo="/paipan/xuankong-feixing" backLabel="返回飞星表单" /><PaipanEmptyState icon={<CalendarDots size={46} />} title="本次飞星盘已失效" description="排盘引用不存在或已过期，请重新排盘。" action={<button type="button" onClick={() => navigate("/paipan/xuankong-feixing")}>重新排盘</button>} /></PaipanPageShell>;
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
    <PaipanSectionCard className="xuankong-overview-card" labelledBy="xuankong-overview-heading"><div className="xuankong-hero"><span><StarFour size={28} weight="duotone" /></span><div><small>{chart.overview.fortuneLabel} · {chart.overview.methodLabel}</small><h2 id="xuankong-overview-heading">{chart.overview.orientation}</h2><p>{chart.overview.lunarDate}</p></div></div><InfoGrid><InfoPair label="起盘时间" value={chart.overview.chartDateTime} /><InfoPair label="备注" value={chart.overview.note || "未填写"} /></InfoGrid><div className="xuankong-directions" aria-label="八方山向">{chart.directions.map((direction) => <span key={direction}>{direction}</span>)}</div></PaipanSectionCard>
    <PaipanSectionCard className="xuankong-chart-card" labelledBy="xuankong-chart-heading"><h2 className="result-section-title" id="xuankong-chart-heading"><span>01</span>山向九宫</h2><p className="shuzi-reading-hint">宫内从左到右为山星、运星、向星；点击宫位查看原盘解读。</p><div className="xuankong-nine-grid">{ordered.map((palace) => <PalaceCell key={palace.index} palace={palace} selected={selected?.index === palace.index} onSelect={() => setSelectedIndex((current) => current === palace.index ? null : palace.index)} />)}</div>{selected && <PalaceDetail palace={selected} />}</PaipanSectionCard>
    <PaipanSectionCard className="xuankong-temporal-card" labelledBy="xuankong-temporal-heading"><h2 className="result-section-title" id="xuankong-temporal-heading"><span>02</span>年月日时飞星</h2><div className="xuankong-temporal-grid"><TemporalGrid label="年盘" field="annualStar" palaces={ordered} /><TemporalGrid label="月盘" field="monthlyStar" palaces={ordered} /><TemporalGrid label="日盘" field="dailyStar" palaces={ordered} /><TemporalGrid label="时盘" field="hourlyStar" palaces={ordered} /></div></PaipanSectionCard>
    <PaipanSectionCard className="xuankong-rechart-card" labelledBy="xuankong-rechart-heading"><div className="xuankong-rechart-heading"><Compass size={24} weight="duotone" /><div><h2 id="xuankong-rechart-heading">调整起盘时间</h2><p>保留当前元运、山向与挨星方式，只重新计算年月日时盘。</p></div></div>{editDateTime && <div className="form-field picker-field"><SolarDateTimePicker subject="起盘" value={editDateTime} onChange={setEditDateTime} /></div>}{error && <div className="form-error" role="alert">{error}</div>}<button className="paipan-secondary-action" type="button" disabled={recalculating} onClick={() => void recalculate()}><ArrowClockwise size={19} />{recalculating ? "正在重排…" : "按新时间重排"}</button></PaipanSectionCard>
    <p className="culture-notice">传统文化研究与娱乐参考，请理性看待推演结果</p>
  </PaipanPageShell>;
}
