import type { ShanxiangPanel, YinpanPalace } from "@guoxue/contracts";
import { CalendarDots, CompassRose, X } from "@phosphor-icons/react";
import { Fragment, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../../components/PageHeader";
import { PaipanActionButton } from "../../../components/paipan/PaipanActionButton";
import { InfoGrid, InfoPair } from "../../../components/paipan/InfoGrid";
import { PaipanEmptyState } from "../../../components/paipan/PaipanEmptyState";
import { PaipanPageShell } from "../../../components/paipan/PaipanPageShell";
import { PaipanSectionCard } from "../../../components/paipan/PaipanSectionCard";
import { useShanxiangSession } from "./ShanxiangSession";

const PALACE_ORDER = [4, 9, 2, 3, 5, 7, 8, 1, 6] as const;

function Markers({ palace }: { palace: YinpanPalace }) {
  return <span className="juece-palace-markers">{palace.isVoid && <i className="void">空</i>}{palace.isHorse && <i className="horse">马</i>}{palace.isChief && <i className="chief">符</i>}{palace.isChiefDoor && <i className="chief-door">使</i>}{palace.harms.map((harm, index) => <i className={`harm harm-${harm.type}`} key={`${harm.symbol}-${harm.type}-${index}`}>{harm.symbol}{harm.type}</i>)}</span>;
}

function PalaceCell({ palace, selected, onSelect }: { palace: YinpanPalace; selected: boolean; onSelect: () => void }) {
  return <button type="button" className={`juece-palace yinpan-palace shanxiang-palace${selected ? " selected" : ""}${palace.index === 5 ? " center" : ""}`} aria-expanded={selected} onClick={onSelect}>
    <span className="juece-palace-head"><small>{palace.direction}</small><strong>{palace.trigram}{palace.index}</strong></span>
    <span className="yinpan-palace-line"><b>{palace.deity ?? "—"}</b><b>{palace.star ?? "—"}</b></span>
    <span className="juece-door">{palace.door ?? "—"}</span>
    <span className="juece-stems"><span>{palace.heavenStems.join("") || "—"}</span><i>／</i><span>{palace.earthStems.join("") || "—"}</span></span>
    {palace.hiddenStem && <span className="juece-hidden">隐 {palace.hiddenStem}</span>}<Markers palace={palace} />
  </button>;
}

function PalaceDetail({ palace }: { palace: YinpanPalace }) {
  return <div className="juece-palace-detail yinpan-palace-detail shanxiang-palace-detail" aria-live="polite">
    <div className="dunjia-detail-heading"><span>{palace.trigram}{palace.index}宫</span><strong>{palace.direction} · {palace.element}</strong></div>
    <InfoGrid><InfoPair label="八神" value={palace.deity} /><InfoPair label="九星" value={palace.star} /><InfoPair label="八门" value={palace.door} /><InfoPair label="隐干" value={palace.hiddenStem} /><InfoPair label="天盘干" value={palace.heavenStems.join("、")} /><InfoPair label="地盘干" value={palace.earthStems.join("、")} /></InfoGrid>
    {palace.harms.length > 0 && <div className="dunjia-detail-harms"><h4>刑墓迫</h4><div>{palace.harms.map((harm, index) => <span key={`${harm.symbol}-${index}`}>{harm.symbol} · {harm.type}</span>)}</div></div>}
    {(palace.heavenGrowth.length > 0 || palace.earthGrowth.length > 0) && <div className="dunjia-growth-grid"><div className="dunjia-growth-group"><h4>天盘长生</h4><div>{palace.heavenGrowth.map((item, index) => <span key={`${item.branch}-${index}`}>{item.branch} · {item.stage}</span>)}</div></div><div className="dunjia-growth-group"><h4>地盘长生</h4><div>{palace.earthGrowth.map((item, index) => <span key={`${item.branch}-${index}`}>{item.branch} · {item.stage}</span>)}</div></div></div>}
  </div>;
}

function PanelChart({ panel, zoomed = false }: { panel: ShanxiangPanel; zoomed?: boolean }) {
  const [selectedPalace, setSelectedPalace] = useState<number | null>(null);
  const ordered = useMemo(() => PALACE_ORDER.map((index) => panel.palaces.find((palace) => palace.index === index)).filter((palace): palace is YinpanPalace => Boolean(palace)), [panel]);
  const rows = Array.from({ length: 3 }, (_, index) => ordered.slice(index * 3, index * 3 + 3));
  return <div className={`juece-nine-grid${zoomed ? " juece-nine-grid-zoomed" : ""}`} role="group" aria-label={`${panel.overview.direction}向九宫盘`}>{rows.map((row, rowIndex) => { const selected = row.find((palace) => palace.index === selectedPalace); return <Fragment key={rowIndex}>{row.map((palace) => <PalaceCell key={palace.index} palace={palace} selected={palace.index === selectedPalace} onSelect={() => setSelectedPalace((current) => current === palace.index ? null : palace.index)} />)}{selected && !zoomed && <PalaceDetail palace={selected} />}</Fragment>; })}</div>;
}

function PanelResult({ panel, index, year, question, onZoom }: { panel: ShanxiangPanel; index: number; year: number; question: string; onZoom: () => void }) {
  const overview = panel.overview;
  const headingId = `shanxiang-panel-${index}-heading`;
  return <PaipanSectionCard className="juece-chart-card shanxiang-panel-card" labelledBy={headingId}>
    <header className="shanxiang-panel-heading">
      <div className="juece-result-hero shanxiang-result-hero"><span><CompassRose size={27} aria-hidden="true" /></span><div><small>第 {String(index + 1).padStart(2, "0")} 盘 · {year}年 · {overview.degrees}° · {overview.degreeRange}</small><h2 id={headingId}>{overview.mountain}山{overview.direction}向</h2></div></div>
      <strong className="shanxiang-panel-ju">{overview.dunType}遁{overview.juNumber}局</strong>
    </header>
    <InfoGrid><InfoPair label="事项" value={question || "未填写"} /><InfoPair label="干支年份" value={overview.yearPillar} /><InfoPair label="山向时柱" value={overview.hourPillar} /><InfoPair label="旬首／空亡" value={`${overview.xunShou} · ${overview.voidBranches}`} /><InfoPair label="值符" value={`${overview.chiefStar.name} · ${overview.chiefStar.palace}宫`} /><InfoPair label="值使" value={`${overview.chiefDoor.name}门 · ${overview.chiefDoor.palace}宫`} /><InfoPair label="马星" value={`${overview.horse.branch} · ${overview.horse.palace}宫`} /><InfoPair label="黄泉八煞" value={overview.huangQuan} /></InfoGrid>
    <div className="shanxiang-panel-chart-heading"><h3>山向九宫</h3><p>点击宫位查看刑墓迫与十二长生。</p></div>
    <PanelChart panel={panel} />
    <div className="juece-chart-actions shanxiang-panel-actions"><PaipanActionButton variant="zoom" onClick={onZoom}>放大查看</PaipanActionButton></div>
  </PaipanSectionCard>;
}

export function ShanxiangResultPage() {
  const navigate = useNavigate();
  const { chart, isRestoring } = useShanxiangSession();
  const [zoomedPanelIndex, setZoomedPanelIndex] = useState<number | null>(null);
  if (isRestoring) return <PaipanPageShell pageClassName="result-page shanxiang-result-page"><PageHeader title="山向决策" backTo="/paipan/shanxiang-juece" backLabel="返回山向表单" /><PaipanEmptyState icon={<CalendarDots size={46} aria-hidden="true" />} title="正在恢复山向盘" /></PaipanPageShell>;
  if (!chart) return <PaipanPageShell pageClassName="result-page shanxiang-result-page"><PageHeader title="山向决策" backTo="/paipan/shanxiang-juece" backLabel="返回山向表单" /><PaipanEmptyState icon={<CalendarDots size={46} aria-hidden="true" />} title="本次山向盘已失效" description="排盘引用不存在或已过期，请重新排盘。" action={<PaipanActionButton variant="restart" onClick={() => navigate("/paipan/shanxiang-juece")}>重新排盘</PaipanActionButton>} /></PaipanPageShell>;
  const zoomedPanel = zoomedPanelIndex === null ? null : chart.panels[zoomedPanelIndex] ?? null;
  return <PaipanPageShell pageClassName="result-page shanxiang-result-page">
    <PageHeader title="山向决策" backTo="/paipan/shanxiang-juece" backLabel="返回山向表单" />
    {chart.panels.map((panel, index) => <PanelResult key={`${panel.overview.degrees}-${index}`} panel={panel} index={index} year={chart.overview.year} question={chart.overview.question} onZoom={() => setZoomedPanelIndex(index)} />)}
    <PaipanSectionCard className="juece-legend" label="盘面标记说明"><h2 className="result-section-title"><span>注</span>颜色与标记</h2><div><span><i className="void">空</i>空亡</span><span><i className="chief">符</i>值符</span><span><i className="chief-door">使</i>值使</span><span><i className="harm harm-墓">墓</i>入墓</span><span><i className="harm harm-刑">刑</i>击刑</span><span><i className="harm harm-迫">迫</i>门迫</span></div></PaipanSectionCard>
    <PaipanActionButton variant="restart" className="shanxiang-restart" onClick={() => navigate("/paipan/shanxiang-juece")}>重新排盘</PaipanActionButton>
    <p className="culture-notice">传统文化研究与娱乐参考，请理性看待推演结果</p>
    {zoomedPanel && <div className="juece-zoom-overlay" role="dialog" aria-modal="true" aria-labelledby="shanxiang-zoom-heading"><div className="juece-zoom-panel"><div className="juece-zoom-heading"><div><small>{zoomedPanel.overview.degrees}° · {zoomedPanel.overview.degreeRange}</small><h2 id="shanxiang-zoom-heading">{zoomedPanel.overview.mountain}山{zoomedPanel.overview.direction}向放大图</h2></div><button type="button" aria-label="关闭放大查看" onClick={() => setZoomedPanelIndex(null)}><X size={23} aria-hidden="true" /></button></div><div className="juece-zoom-scroll"><PanelChart panel={zoomedPanel} zoomed /></div></div></div>}
  </PaipanPageShell>;
}
