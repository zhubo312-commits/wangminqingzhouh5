import type { YinpanChartRequest, YinpanPalace } from "@guoxue/contracts";
import { ArrowClockwise, ArrowsOut, CalendarDots, CaretDown, CaretLeft, CaretRight, Horse, Signpost, X } from "@phosphor-icons/react";
import { Fragment, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { InfoGrid, InfoPair } from "../../../components/paipan/InfoGrid";
import { PageHeader } from "../../../components/PageHeader";
import { PaipanEmptyState } from "../../../components/paipan/PaipanEmptyState";
import { PaipanPageShell } from "../../../components/paipan/PaipanPageShell";
import { PaipanSectionCard } from "../../../components/paipan/PaipanSectionCard";
import { createYinpanChart } from "../../../lib/api-client";
import { useYinpanSession } from "./YinpanSession";

const PALACE_ORDER = [4, 9, 2, 3, 5, 7, 8, 1, 6] as const;

function shiftMinutes(value: string, minutes: number) {
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) throw new Error("起盘时间格式无效");
  date.setMinutes(date.getMinutes() + minutes);
  const pad = (number: number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function PalaceMarkers({ palace }: { palace: YinpanPalace }) {
  return (
    <span className="juece-palace-markers">
      {palace.isVoid && <i className="void">空</i>}
      {palace.isHorse && <i className="horse">马</i>}
      {palace.isChief && <i className="chief">符</i>}
      {palace.isChiefDoor && <i className="chief-door">使</i>}
      {palace.harms.map((harm, index) => <i className={`harm harm-${harm.type}`} key={`${harm.symbol}-${harm.type}-${index}`}>{harm.symbol}{harm.type}</i>)}
    </span>
  );
}

function YinpanPalaceCell({ palace, selected, onSelect }: { palace: YinpanPalace; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" className={`juece-palace yinpan-palace${selected ? " selected" : ""}${palace.index === 5 ? " center" : ""}`} aria-expanded={selected} onClick={onSelect}>
      <span className="juece-palace-head"><small>{palace.direction}</small><strong>{palace.trigram}{palace.index}</strong></span>
      <span className="yinpan-palace-line"><b>{palace.deity ?? "—"}</b><b>{palace.star ?? "—"}</b></span>
      <span className="juece-door">{palace.door ?? "—"}</span>
      <span className="juece-stems"><span>{palace.heavenStems.join("") || "—"}</span><i>／</i><span>{palace.earthStems.join("") || "—"}</span></span>
      {palace.hiddenStem && <span className="juece-hidden">隐 {palace.hiddenStem}</span>}
      <PalaceMarkers palace={palace} />
    </button>
  );
}

function PalaceDetail({ palace }: { palace: YinpanPalace }) {
  return (
    <div className="juece-palace-detail yinpan-palace-detail" aria-live="polite">
      <div className="dunjia-detail-heading"><span>{palace.trigram}{palace.index}宫</span><strong>{palace.direction} · {palace.element}</strong></div>
      <InfoGrid>
        <InfoPair label="八神" value={palace.deity} /><InfoPair label="九星" value={palace.star} />
        <InfoPair label="八门" value={palace.door} /><InfoPair label="隐干" value={palace.hiddenStem} />
        <InfoPair label="天盘干" value={palace.heavenStems.join("、")} /><InfoPair label="地盘干" value={palace.earthStems.join("、")} />
      </InfoGrid>
      {palace.harms.length > 0 && <div className="dunjia-detail-harms"><h4>四害</h4><div>{palace.harms.map((harm, index) => <span key={`${harm.symbol}-${index}`}>{harm.symbol} · {harm.type}</span>)}</div></div>}
      {(palace.heavenGrowth.length > 0 || palace.earthGrowth.length > 0) && <div className="dunjia-growth-grid">
        <div className="dunjia-growth-group"><h4>天盘长生</h4><div>{palace.heavenGrowth.map((item, index) => <span key={`${item.branch}-${index}`}>{item.branch} · {item.stage}</span>)}</div></div>
        <div className="dunjia-growth-group"><h4>地盘长生</h4><div>{palace.earthGrowth.map((item, index) => <span key={`${item.branch}-${index}`}>{item.branch} · {item.stage}</span>)}</div></div>
      </div>}
    </div>
  );
}

export function YinpanResultPage() {
  const navigate = useNavigate();
  const { chart, chartRequest, isRestoring, setResult } = useYinpanSession();
  const [selectedPalace, setSelectedPalace] = useState<number | null>(null);
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [zoomed, setZoomed] = useState(false);

  const ordered = useMemo(() => PALACE_ORDER.map((index) => chart?.palaces.find((palace) => palace.index === index)).filter((palace): palace is YinpanPalace => Boolean(palace)), [chart]);
  const rows = useMemo(() => Array.from({ length: 3 }, (_, index) => ordered.slice(index * 3, index * 3 + 3)), [ordered]);

  async function changeChart(minutes: number) {
    if (!chartRequest || switching) return;
    setSwitching(true);
    setSwitchError(null);
    try {
      const request: YinpanChartRequest = { ...chartRequest, chartDateTime: shiftMinutes(chartRequest.chartDateTime, minutes) };
      const response = await createYinpanChart(request);
      const { paipan_ref: reference, expiresAt: _expiresAt, ...nextChart } = response;
      setResult(nextChart, request, reference);
      setSelectedPalace(null);
    } catch (reason) {
      setSwitchError(reason instanceof Error ? reason.message : "换盘失败，当前盘已保留");
    } finally {
      setSwitching(false);
    }
  }

  if (isRestoring) return <PaipanPageShell pageClassName="result-page yinpan-result-page"><PageHeader title="阴盘决策" backTo="/paipan/yinpan-juece" backLabel="返回阴盘表单" /><PaipanEmptyState icon={<CalendarDots size={46} aria-hidden="true" />} title="正在恢复阴盘" /></PaipanPageShell>;
  if (!chart || !chartRequest) return <PaipanPageShell pageClassName="result-page yinpan-result-page"><PageHeader title="阴盘决策" backTo="/paipan/yinpan-juece" backLabel="返回阴盘表单" /><PaipanEmptyState icon={<CalendarDots size={46} aria-hidden="true" />} title="本次阴盘已失效" description="排盘引用不存在或已过期，请重新起盘。" action={<button type="button" onClick={() => navigate("/paipan/yinpan-juece")}>重新排盘</button>} /></PaipanPageShell>;

  const { overview } = chart;
  const hourStep = chartRequest.mode === "ke" ? 10 : 120;
  const dayStep = chartRequest.mode === "ke" ? 120 : 1440;
  return (
    <PaipanPageShell pageClassName="result-page yinpan-result-page">
      <PageHeader title="阴盘决策" backTo="/paipan/yinpan-juece" backLabel="返回阴盘表单" />
      <PaipanSectionCard className="juece-overview-card yinpan-overview-card" labelledBy="yinpan-overview-heading">
        <div className="juece-result-hero"><span>阴</span><div><small>{overview.method} · {overview.solarDateTime}</small><h2 id="yinpan-overview-heading">{overview.dunType}遁{overview.juNumber}局</h2></div></div>
        <InfoGrid>
          <InfoPair label="事项" value={overview.question || "未填写"} /><InfoPair label="性别" value={overview.gender === "male" ? "男" : "女"} />
          <InfoPair label="阴历" value={overview.lunarDate} /><InfoPair label="旬空" value={overview.voidBranches} />
          <InfoPair label="旬首" value={overview.xunShou} /><InfoPair label="月将" value={overview.monthGeneral} />
          <InfoPair label="值符" value={`${overview.chiefStar.name} · ${overview.chiefStar.palace}宫`} /><InfoPair label="值使" value={`${overview.chiefDoor.name}门 · ${overview.chiefDoor.palace}宫`} />
          <InfoPair label="节气" value={`${overview.previousSolarTerm}～${overview.nextSolarTerm}`} /><InfoPair label="马星" value={`${overview.horse.branch} · ${overview.horse.palace}宫`} />
        </InfoGrid>
        <div className="dunjia-pillar-strip" aria-label="四柱"><div><small>年柱</small><strong>{overview.pillars.year}</strong></div><div><small>月柱</small><strong>{overview.pillars.month}</strong></div><div><small>日柱</small><strong>{overview.pillars.day}</strong></div><div><small>{chartRequest.mode === "ke" ? "刻柱" : "时柱"}</small><strong>{overview.pillars.hour}</strong></div></div>
        <div className="yinpan-switch-grid" aria-label="换盘">
          <button type="button" disabled={switching} onClick={() => void changeChart(-dayStep)}><CaretLeft size={17} aria-hidden="true" />上一日</button>
          <button type="button" disabled={switching} onClick={() => void changeChart(-hourStep)}>上一局</button>
          <button type="button" disabled={switching} onClick={() => void changeChart(hourStep)}>下一局</button>
          <button type="button" disabled={switching} onClick={() => void changeChart(dayStep)}>下一日<CaretRight size={17} aria-hidden="true" /></button>
        </div>
        {switchError && <div className="inline-error" role="alert">{switchError}</div>}
      </PaipanSectionCard>

      <PaipanSectionCard className="juece-chart-card" labelledBy="yinpan-chart-heading">
        <h2 className="result-section-title" id="yinpan-chart-heading"><span>01</span>阴盘九宫</h2>
        <p className="dunjia-chart-hint">点击宫位查看四害、十二长生与盘面结构</p>
        <div className="juece-nine-grid" role="group" aria-label="阴盘九宫盘">{rows.map((row, rowIndex) => { const selected = row.find((palace) => palace.index === selectedPalace); return <Fragment key={rowIndex}>{row.map((palace) => <YinpanPalaceCell key={palace.index} palace={palace} selected={palace.index === selectedPalace} onSelect={() => setSelectedPalace((current) => current === palace.index ? null : palace.index)} />)}{selected && <PalaceDetail palace={selected} />}</Fragment>; })}</div>
        <div className="juece-chart-actions"><button type="button" onClick={() => setZoomed(true)}><ArrowsOut size={19} aria-hidden="true" />放大查看</button><button type="button" onClick={() => navigate("/paipan/yinpan-juece")}><ArrowClockwise size={19} aria-hidden="true" />重新排盘</button></div>
      </PaipanSectionCard>

      <details className="result-card dunjia-details-card dunjia-gates-card"><summary><span><Signpost size={21} aria-hidden="true" />天门地户</span><CaretDown size={19} aria-hidden="true" /></summary><div className="yinpan-gate-list">{chart.heavenEarthGates.map((item) => <span key={item.branch}><strong>{item.branch}</strong><em>{item.heavenGate}</em><small>{item.earthGate}</small></span>)}</div></details>

      {chart.lifetimeChart && <details className="result-card dunjia-details-card yinpan-lifetime-card"><summary><span>终身局资料</span><CaretDown size={19} aria-hidden="true" /></summary><div><InfoGrid><InfoPair label="阴历出生" value={chart.lifetimeChart.profile.lunarDate} /><InfoPair label="生肖／星座" value={`${chart.lifetimeChart.profile.chineseZodiac} · ${chart.lifetimeChart.profile.zodiac}`} /><InfoPair label="起运" value={chart.lifetimeChart.fortune.startDescription} /><InfoPair label="格局参考" value={chart.lifetimeChart.strength.pattern || chart.lifetimeChart.strength.level} /></InfoGrid><div className="yinpan-fortune-strip">{chart.lifetimeChart.fortune.periods.map((period) => <span key={period.index}><strong>{period.ganZhi}</strong><small>{period.startYear}–{period.endYear}</small></span>)}</div></div></details>}

      <PaipanSectionCard className="juece-legend" label="盘面标记说明"><h2 className="result-section-title"><span>注</span>颜色与标记</h2><div><span><i className="void">空</i>空亡</span><span><i className="chief">符</i>值符</span><span><i className="chief-door">使</i>值使</span><span><i className="harm harm-墓">墓</i>入墓</span><span><i className="harm harm-刑">刑</i>击刑</span><span><i className="harm harm-迫">迫</i>门迫</span><span><Horse size={16} aria-hidden="true" />马星</span></div></PaipanSectionCard>
      <p className="culture-notice">传统文化研究与娱乐参考，请理性看待推演结果</p>

      {zoomed && <div className="juece-zoom-overlay" role="dialog" aria-modal="true" aria-labelledby="yinpan-zoom-heading"><div className="juece-zoom-panel"><div className="juece-zoom-heading"><div><small>{overview.method}</small><h2 id="yinpan-zoom-heading">阴盘九宫放大图</h2></div><button type="button" aria-label="关闭放大查看" onClick={() => setZoomed(false)}><X size={23} aria-hidden="true" /></button></div><div className="juece-zoom-scroll"><div className="juece-nine-grid juece-nine-grid-zoomed">{ordered.map((palace) => <YinpanPalaceCell key={palace.index} palace={palace} selected={false} onSelect={() => { setSelectedPalace(palace.index); setZoomed(false); }} />)}</div></div></div></div>}
    </PaipanPageShell>
  );
}
