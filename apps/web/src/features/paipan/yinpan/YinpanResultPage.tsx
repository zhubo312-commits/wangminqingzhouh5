import type { YinpanChartRequest, YinpanPalace } from "@guoxue/contracts";
import { CalendarDots, CaretDown, Horse, Signpost, X } from "@phosphor-icons/react";
import { Fragment, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { InfoGrid, InfoPair } from "../../../components/paipan/InfoGrid";
import { PageHeader } from "../../../components/PageHeader";
import { PaipanActionButton } from "../../../components/paipan/PaipanActionButton";
import { PaipanEmptyState } from "../../../components/paipan/PaipanEmptyState";
import { PaipanPageShell } from "../../../components/paipan/PaipanPageShell";
import { PaipanSectionCard } from "../../../components/paipan/PaipanSectionCard";
import { createYinpanChart } from "../../../lib/api-client";
import { useYinpanSession } from "./YinpanSession";

const PALACE_ORDER = [4, 9, 2, 3, 5, 7, 8, 1, 6] as const;

const ORBIT_ROWS = [
  { leftPalace: 4, rightPalace: 2, leftBranch: "辰", rightBranch: "申" },
  { leftPalace: 3, rightPalace: 7, leftBranch: "卯", rightBranch: "酉" },
  { leftPalace: 8, rightPalace: 6, leftBranch: "寅", rightBranch: "戌" },
] as const;

const TOP_GATE_BRANCHES = ["巳", "午", "未"] as const;
const BOTTOM_GATE_BRANCHES = ["丑", "子", "亥"] as const;

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
      <PalaceMarkers palace={palace} />
    </button>
  );
}

function YinpanOrbitBoard({
  palaces,
  selectedPalace,
  gates,
  gatesOpen,
  zoomed = false,
  onSelect,
}: {
  palaces: YinpanPalace[];
  selectedPalace: number | null;
  gates: Array<{ branch: string; heavenGate: string; earthGate: string }>;
  gatesOpen: boolean;
  zoomed?: boolean;
  onSelect: (palace: YinpanPalace) => void;
}) {
  const palacesByIndex = new Map(palaces.map((palace) => [palace.index, palace]));
  const gatesByBranch = new Map(gates.map((gate) => [gate.branch, gate]));
  const horse = palaces.find((palace) => palace.isHorse);
  const rows = Array.from({ length: 3 }, (_, index) => palaces.slice(index * 3, index * 3 + 3));

  function hiddenItem(palaceIndex: number, side: "top" | "bottom" | "left" | "right", slot: number) {
    const palace = palacesByIndex.get(palaceIndex);
    return <span className={`yinpan-orbit-item yinpan-orbit-hidden ${side} slot-${slot}`} aria-label={`隐干 ${palace?.hiddenStem || "无"}`}>{palace?.hiddenStem || "—"}</span>;
  }

  function gateItem(branch: string, side: "top" | "bottom" | "left" | "right", slot: number) {
    const gate = gatesByBranch.get(branch);
    return <span className={`yinpan-orbit-item yinpan-orbit-gate ${side} slot-${slot}`} aria-hidden={!gatesOpen}><span>{gate?.heavenGate || "—"}</span><strong>{gate?.earthGate || "—"}</strong></span>;
  }

  return (
    <div className={`yinpan-orbit-board${gatesOpen ? " gates-open" : ""}${zoomed ? " zoomed" : ""}`} role="group" aria-label={zoomed ? "阴盘九宫放大盘" : "阴盘九宫盘"}>
      <div className="yinpan-orbit-cap yinpan-gate-cap top">
        {TOP_GATE_BRANCHES.map((branch, index) => <Fragment key={branch}>{gateItem(branch, "top", index + 1)}</Fragment>)}
      </div>
      <div className="yinpan-orbit-cap yinpan-hidden-cap top">
        {horse && <span className="yinpan-orbit-horse" aria-label={`马星 ${horse.index}宫`}><Horse size={14} aria-hidden="true" />马</span>}
        {hiddenItem(9, "top", 2)}
      </div>
      {rows.map((row, rowIndex) => {
        const orbit = ORBIT_ROWS[rowIndex]!;
        const selected = row.find((palace) => palace.index === selectedPalace);
        return (
          <Fragment key={`row-${rowIndex}`}>
            <div className={`yinpan-orbit-row row-${rowIndex + 1}`}>
              {gateItem(orbit.leftBranch, "left", rowIndex + 1)}
              {hiddenItem(orbit.leftPalace, "left", rowIndex + 1)}
              <div className="yinpan-nine-row">
                {row.map((palace) => <YinpanPalaceCell key={palace.index} palace={palace} selected={palace.index === selectedPalace} onSelect={() => onSelect(palace)} />)}
              </div>
              {hiddenItem(orbit.rightPalace, "right", rowIndex + 1)}
              {gateItem(orbit.rightBranch, "right", rowIndex + 1)}
            </div>
            {!zoomed && selected && <PalaceDetail palace={selected} />}
          </Fragment>
        );
      })}
      <div className="yinpan-orbit-cap yinpan-hidden-cap bottom">{hiddenItem(1, "bottom", 2)}</div>
      <div className="yinpan-orbit-cap yinpan-gate-cap bottom">
        {BOTTOM_GATE_BRANCHES.map((branch, index) => <Fragment key={branch}>{gateItem(branch, "bottom", index + 1)}</Fragment>)}
      </div>
    </div>
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

function YinpanLifetimePanel({ lifetime }: { lifetime: NonNullable<ReturnType<typeof useYinpanSession>["chart"]>["lifetimeChart"] }) {
  if (!lifetime) return null;
  const pattern = lifetime.strength.pattern || lifetime.strength.level;
  return (
    <details className="result-card dunjia-details-card yinpan-lifetime-card" open>
      <summary><span>终身局资料</span><CaretDown size={19} aria-hidden="true" /></summary>
      <div className="yinpan-lifetime-content">
        <div className="yinpan-lifetime-profile">
          <section className="birth"><small>阴历出生</small><strong>{lifetime.profile.lunarDate}</strong></section>
          <section><small>生肖</small><strong>{lifetime.profile.chineseZodiac}</strong></section>
          <section><small>星座</small><strong>{lifetime.profile.zodiac}</strong></section>
        </div>
        <div className="yinpan-lifetime-insights">
          <section><small>起运</small><strong>{lifetime.fortune.startDescription}</strong><span>{lifetime.fortune.startSolar}</span></section>
          <section><small>格局参考</small><strong>{pattern}</strong>{lifetime.strength.level && lifetime.strength.level !== pattern && <span>{lifetime.strength.level}</span>}</section>
        </div>
        <div className="yinpan-fortune-heading"><div><small>人生节律</small><h3>大运</h3></div></div>
        <div className="yinpan-fortune-grid" role="list" aria-label="大运列表">
          {lifetime.fortune.periods.map((period) => (
            <article role="listitem" key={period.index}>
              <small>第{period.index + 1}运</small>
              <strong>{period.ganZhi || "童限"}</strong>
              <span>{period.startAge}–{period.endAge}岁</span>
              <em>{period.startYear}–{period.endYear}</em>
            </article>
          ))}
        </div>
      </div>
    </details>
  );
}

export function YinpanResultPage() {
  const navigate = useNavigate();
  const { chart, chartRequest, isRestoring, setResult } = useYinpanSession();
  const [selectedPalace, setSelectedPalace] = useState<number | null>(null);
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const [gatesOpen, setGatesOpen] = useState(false);

  const ordered = useMemo(() => PALACE_ORDER.map((index) => chart?.palaces.find((palace) => palace.index === index)).filter((palace): palace is YinpanPalace => Boolean(palace)), [chart]);

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
  if (!chart || !chartRequest) return <PaipanPageShell pageClassName="result-page yinpan-result-page"><PageHeader title="阴盘决策" backTo="/paipan/yinpan-juece" backLabel="返回阴盘表单" /><PaipanEmptyState icon={<CalendarDots size={46} aria-hidden="true" />} title="本次阴盘已失效" description="排盘引用不存在或已过期，请重新起盘。" action={<PaipanActionButton variant="restart" onClick={() => navigate("/paipan/yinpan-juece")}>重新排盘</PaipanActionButton>} /></PaipanPageShell>;

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
          <PaipanActionButton variant="navigate" direction="previous" busy={switching} onClick={() => void changeChart(-dayStep)}>上一日</PaipanActionButton>
          <PaipanActionButton variant="navigate" direction="previous" busy={switching} onClick={() => void changeChart(-hourStep)}>上一局</PaipanActionButton>
          <PaipanActionButton variant="navigate" direction="next" busy={switching} onClick={() => void changeChart(hourStep)}>下一局</PaipanActionButton>
          <PaipanActionButton variant="navigate" direction="next" busy={switching} onClick={() => void changeChart(dayStep)}>下一日</PaipanActionButton>
        </div>
        {switchError && <div className="inline-error" role="alert">{switchError}</div>}
      </PaipanSectionCard>

      <PaipanSectionCard className="juece-chart-card" labelledBy="yinpan-chart-heading">
        <h2 className="result-section-title" id="yinpan-chart-heading"><span>01</span>阴盘九宫</h2>
        <p className="dunjia-chart-hint">外圈常驻显示隐干，开启天门地户后显示第二层门位</p>
        <YinpanOrbitBoard
          palaces={ordered}
          selectedPalace={selectedPalace}
          gates={chart.heavenEarthGates}
          gatesOpen={gatesOpen}
          onSelect={(palace) => setSelectedPalace((current) => current === palace.index ? null : palace.index)}
        />
        <button type="button" className={`yinpan-gate-switch${gatesOpen ? " active" : ""}`} role="switch" aria-label="天门地户" aria-checked={gatesOpen} onClick={() => setGatesOpen((current) => !current)}>
          <Signpost size={21} aria-hidden="true" /><span><strong>天门地户</strong><small>{gatesOpen ? "第二层门位已显示" : "开启后显示第二层门位"}</small></span><i aria-hidden="true"><b /></i>
        </button>
        <div className="juece-chart-actions"><PaipanActionButton variant="zoom" onClick={() => setZoomed(true)}>放大查看</PaipanActionButton><PaipanActionButton variant="restart" onClick={() => navigate("/paipan/yinpan-juece")}>重新排盘</PaipanActionButton></div>
      </PaipanSectionCard>

      {chart.lifetimeChart && <YinpanLifetimePanel lifetime={chart.lifetimeChart} />}

      <PaipanSectionCard className="juece-legend" label="盘面标记说明"><h2 className="result-section-title"><span>注</span>颜色与标记</h2><div><span><i className="void">空</i>空亡</span><span><i className="chief">符</i>值符</span><span><i className="chief-door">使</i>值使</span><span><i className="harm harm-墓">墓</i>入墓</span><span><i className="harm harm-刑">刑</i>击刑</span><span><i className="harm harm-迫">迫</i>门迫</span><span><Horse size={16} aria-hidden="true" />马星</span></div></PaipanSectionCard>
      <p className="culture-notice">传统文化研究与娱乐参考，请理性看待推演结果</p>

      {zoomed && <div className="juece-zoom-overlay" role="dialog" aria-modal="true" aria-labelledby="yinpan-zoom-heading"><div className="juece-zoom-panel"><div className="juece-zoom-heading"><div><small>{overview.method}</small><h2 id="yinpan-zoom-heading">阴盘九宫放大图</h2></div><button type="button" aria-label="关闭放大查看" onClick={() => setZoomed(false)}><X size={23} aria-hidden="true" /></button></div><div className="juece-zoom-scroll"><YinpanOrbitBoard palaces={ordered} selectedPalace={null} gates={chart.heavenEarthGates} gatesOpen={gatesOpen} zoomed onSelect={(palace) => { setSelectedPalace(palace.index); setZoomed(false); }} /></div></div></div>}
    </PaipanPageShell>
  );
}
