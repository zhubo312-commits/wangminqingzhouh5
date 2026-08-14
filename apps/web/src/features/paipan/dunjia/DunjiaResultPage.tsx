import type { DunjiaPalace } from "@guoxue/contracts";
import {
  CalendarDots,
  CaretDown,
  CompassRose,
  Horse,
  SealCheck,
  Signpost,
} from "@phosphor-icons/react";
import { Fragment, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../../components/PageHeader";
import { InfoGrid, InfoPair } from "../../../components/paipan/InfoGrid";
import { PaipanEmptyState } from "../../../components/paipan/PaipanEmptyState";
import { PaipanActionButton } from "../../../components/paipan/PaipanActionButton";
import { PaipanPageShell } from "../../../components/paipan/PaipanPageShell";
import { useDunjiaSession } from "./DunjiaSession";

const PALACE_ORDER = [4, 9, 2, 3, 5, 7, 8, 1, 6] as const;

function DayStemMarker({ stem, location }: {
  stem: string;
  location: "pillar" | "heaven";
}) {
  const label = location === "pillar" ? `日干 ${stem}` : `日干 ${stem} 落宫`;
  return (
    <span
      className="dunjia-day-stem-marker"
      data-day-stem-location={location}
      aria-label={label}
      title={label}
    >
      {stem}
    </span>
  );
}

function PlateStemValue({ value, dayStem, highlightDayStem = false }: {
  value: string;
  dayStem: string;
  highlightDayStem?: boolean;
}) {
  return (
    <span className="dunjia-plate-value">
      {Array.from(value).map((stem, index) => highlightDayStem && stem === dayStem ? (
        <DayStemMarker key={`${stem}-${index}`} stem={stem} location="heaven" />
      ) : <span key={`${stem}-${index}`}>{stem}</span>)}
    </span>
  );
}

function PillarStrip({ pillars, voids }: {
  pillars: { year: string; month: string; day: string; hour: string };
  voids: { year: string; month: string; day: string; hour: string };
}) {
  const items = [
    ["年柱", pillars.year, voids.year],
    ["月柱", pillars.month, voids.month],
    ["日柱", pillars.day, voids.day],
    ["时柱", pillars.hour, voids.hour],
  ] as const;
  return (
    <div className="dunjia-pillar-strip" aria-label="四柱与空亡">
      {items.map(([label, pillar, voidBranch]) => {
        const isDayPillar = label === "日柱";
        return (
          <div key={label}>
            <small>{label}</small>
            <strong>
              {isDayPillar ? (
                <><DayStemMarker stem={pillar.charAt(0)} location="pillar" />{pillar.slice(1)}</>
              ) : pillar}
            </strong>
            <span>空 {voidBranch}</span>
          </div>
        );
      })}
    </div>
  );
}

function HarmBadges({ palace }: { palace: DunjiaPalace }) {
  if (!palace.isVoid && palace.harms.length === 0 && !palace.isHorse) return null;
  return (
    <div className="dunjia-palace-badges">
      {palace.isVoid && <span className="dunjia-badge void">空</span>}
      {palace.isHorse && <span className="dunjia-badge horse">马</span>}
      {palace.harms.map((harm, index) => (
        <span className={`dunjia-badge harm-${harm.type}`} key={`${harm.symbol}-${harm.type}-${index}`}>
          {harm.symbol}{harm.type}
        </span>
      ))}
    </div>
  );
}

function PalaceCell({ palace, dayStem, selected, onSelect }: {
  palace: DunjiaPalace;
  dayStem: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const canExpand = palace.index !== 5;
  return (
    <button
      type="button"
      className={`dunjia-palace${selected ? " selected" : ""}${palace.index === 5 ? " center" : ""}`}
      aria-expanded={canExpand ? selected : undefined}
      aria-controls={canExpand ? "dunjia-palace-detail" : undefined}
      disabled={!canExpand}
      onClick={onSelect}
    >
      <span className="dunjia-palace-head">
        <small>{palace.direction}</small>
        <strong>{palace.trigram}{palace.index}</strong>
      </span>
      <span className="dunjia-palace-line">
        <em>{palace.deity ?? "中宫"}</em>
        <b>{palace.star ?? "天禽"}</b>
      </span>
      <span className="dunjia-door">{palace.door ? `${palace.door}门` : "—"}</span>
      <span className="dunjia-plates">
        <span><small>天</small><PlateStemValue value={palace.heavenPlate} dayStem={dayStem} highlightDayStem /></span>
        <span><small>地</small><PlateStemValue value={palace.earthPlate} dayStem={dayStem} /></span>
      </span>
      <HarmBadges palace={palace} />
      {(palace.isChief || palace.isChiefDoor) && (
        <span className="dunjia-chief-mark">{palace.isChief ? "值符" : ""}{palace.isChief && palace.isChiefDoor ? " · " : ""}{palace.isChiefDoor ? "值使" : ""}</span>
      )}
    </button>
  );
}

function PalaceDetail({ palace }: { palace: DunjiaPalace }) {
  return (
    <div className="dunjia-palace-detail" id="dunjia-palace-detail" aria-live="polite">
      <div className="dunjia-detail-heading">
        <span>{palace.trigram}{palace.index}宫</span>
        <strong>{palace.direction} · {palace.element}</strong>
      </div>
      <p className="dunjia-detail-note">此宫的神、星、门与天地盘组合；再次点击当前宫位即可收起</p>
      <InfoGrid>
        <InfoPair label="八神（辅助）" value={palace.deity} />
        <InfoPair label="九星（天时）" value={palace.star} />
        <InfoPair label="八门（行动）" value={palace.door ? `${palace.door}门` : null} />
        <InfoPair label="隐干" value={palace.hiddenStem} />
        <InfoPair label="天盘" value={palace.heavenPlate} />
        <InfoPair label="地盘" value={palace.earthPlate} />
      </InfoGrid>
      {palace.harms.length > 0 && (
        <div className="dunjia-detail-harms">
          <h4>四害</h4>
          <div>{palace.harms.map((harm, index) => <span key={`${harm.symbol}-${harm.type}-${index}`}>{harm.symbol} · {harm.type}</span>)}</div>
        </div>
      )}
      <div className="dunjia-growth-grid">
        <GrowthList title="天盘长生" values={palace.heavenGrowth} />
        <GrowthList title="地盘长生" values={palace.earthGrowth} />
      </div>
    </div>
  );
}

function GrowthList({ title, values }: {
  title: string;
  values: DunjiaPalace["heavenGrowth"];
}) {
  return (
    <div className="dunjia-growth-group">
      <h4>{title}</h4>
      <div>{values.length ? values.map((item, index) => (
        <span key={`${item.branch}-${item.stage}-${index}`}>{item.branch} · {item.stage}</span>
      )) : <span>暂无</span>}</div>
    </div>
  );
}

export function DunjiaResultPage() {
  const navigate = useNavigate();
  const { chart, chartRequest, isRestoring } = useDunjiaSession();
  const [selectedPalaceIndex, setSelectedPalaceIndex] = useState<number | null>(null);

  const orderedPalaces = useMemo(() => PALACE_ORDER.map(
    (index) => chart?.palaces.find((palace) => palace.index === index),
  ).filter((palace): palace is DunjiaPalace => Boolean(palace)), [chart]);
  const palaceRows = useMemo(() => Array.from(
    { length: 3 },
    (_, rowIndex) => orderedPalaces.slice(rowIndex * 3, rowIndex * 3 + 3),
  ), [orderedPalaces]);

  if (isRestoring) {
    return (
      <PaipanPageShell pageClassName="result-page">
        <PageHeader title="遁甲盘" backTo="/paipan/dunjia" backLabel="返回遁甲学表单" />
        <PaipanEmptyState
          icon={<CalendarDots size={46} weight="light" aria-hidden="true" />}
          title="正在恢复遁甲盘"
        />
      </PaipanPageShell>
    );
  }

  if (!chart || !chartRequest) {
    return (
      <PaipanPageShell pageClassName="result-page">
        <PageHeader title="遁甲盘" backTo="/paipan/dunjia" backLabel="返回遁甲学表单" />
        <PaipanEmptyState
          icon={<CalendarDots size={46} weight="light" aria-hidden="true" />}
          title="本次遁甲盘已失效"
          description="排盘引用不存在或已过期，请重新起盘。"
          action={<PaipanActionButton variant="restart" onClick={() => navigate("/paipan/dunjia")}>重新排盘</PaipanActionButton>}
        />
      </PaipanPageShell>
    );
  }

  const { overview } = chart;
  const dayStem = overview.pillars.day.charAt(0);
  const heavenGates = chart.heavenEarthGates.filter((item) =>
    ["太冲", "小吉", "从魁"].some((name) => item.heavenGate.startsWith(name)),
  );
  const earthGates = chart.heavenEarthGates.filter((item) =>
    ["除", "危", "定", "开"].includes(item.earthGate),
  );
  return (
    <PaipanPageShell pageClassName="result-page dunjia-result-page">
        <PageHeader title="遁甲盘" backTo="/paipan/dunjia" backLabel="返回遁甲学表单" />

        <section className="result-card dunjia-overview-card" aria-labelledby="dunjia-overview-heading">
          <div className="dunjia-result-hero">
            <span><CompassRose size={27} weight="duotone" aria-hidden="true" /></span>
            <div><small>{overview.method}</small><h2 id="dunjia-overview-heading">{overview.dunType}遁{overview.juNumber}局</h2></div>
          </div>
          <InfoGrid className="dunjia-date-grid">
            <InfoPair label="阳历" value={overview.solarDateTime} />
            <InfoPair label="阴历" value={overview.lunarDate} />
          </InfoGrid>
          <PillarStrip pillars={overview.pillars} voids={overview.voidBranches} />
          <div className="dunjia-foundation" aria-labelledby="dunjia-foundation-heading">
            <div className="dunjia-foundation-heading">
              <SealCheck size={21} weight="duotone" aria-hidden="true" />
              <div>
                <h3 id="dunjia-foundation-heading">节气与旬首</h3>
                <p>节气定遁局，旬首定位值符与值使</p>
              </div>
            </div>
            <InfoGrid className="dunjia-term-grid">
              <InfoPair label="上一节气" value={<>{overview.previousSolarTerm.name}<small>{overview.previousSolarTerm.dateTime}</small></>} />
              <InfoPair label="下一节气" value={<>{overview.nextSolarTerm.name}<small>{overview.nextSolarTerm.dateTime}</small></>} />
              <InfoPair label="旬首" value={overview.xunShou} />
              <InfoPair label="马星" value={`${overview.horse.trigram} · ${overview.horse.branch}`} />
              <InfoPair label="值符" value={`${overview.chiefStar.name} · ${overview.chiefStar.palace}宫`} />
              <InfoPair label="值使" value={`${overview.chiefDoor.name}门 · ${overview.chiefDoor.palace}宫`} />
            </InfoGrid>
          </div>
        </section>

        <section className="result-card dunjia-chart-card" aria-labelledby="dunjia-chart-heading">
          <h2 className="result-section-title" id="dunjia-chart-heading"><span>01</span>九宫盘</h2>
          <p className="dunjia-chart-hint">点击宫位查看天盘、地盘、四害与十二长生</p>
          <div className="dunjia-nine-grid" role="group" aria-label="遁甲九宫盘">
            {palaceRows.map((row, rowIndex) => {
              const selectedPalace = row.find((palace) => palace.index === selectedPalaceIndex);
              return (
                <Fragment key={`palace-row-${rowIndex}`}>
                  {row.map((palace) => (
                    <PalaceCell
                      key={palace.index}
                      palace={palace}
                      dayStem={dayStem}
                      selected={selectedPalaceIndex === palace.index}
                      onSelect={() => setSelectedPalaceIndex((current) => current === palace.index ? null : palace.index)}
                    />
                  ))}
                  {selectedPalace && <PalaceDetail palace={selectedPalace} />}
                </Fragment>
              );
            })}
          </div>
        </section>

        <details className="result-card dunjia-details-card dunjia-gates-card">
          <summary><span><Signpost size={21} weight="duotone" aria-hidden="true" />天门地户 · 出行辅助</span><CaretDown size={19} weight="bold" aria-hidden="true" /></summary>
          <div className="dunjia-gates-content">
            <p>用于传统出行、避难和择向的辅助参考，不属于九宫主盘的必读信息。</p>
            <div className="dunjia-gate-groups">
              <section aria-labelledby="dunjia-heaven-gates-heading">
                <h3 id="dunjia-heaven-gates-heading">天三门</h3>
                <small>太冲、小吉、从魁所临方位</small>
                <div>{heavenGates.map((item) => (
                  <span className="dunjia-gate-item" key={`heaven-${item.branch}`}><strong>{item.heavenGate}</strong><em>临 {item.branch}</em></span>
                ))}</div>
              </section>
              <section aria-labelledby="dunjia-earth-gates-heading">
                <h3 id="dunjia-earth-gates-heading">地四户</h3>
                <small>除、危、定、开所临方位</small>
                <div>{earthGates.map((item) => (
                  <span className="dunjia-gate-item" key={`earth-${item.branch}`}><strong>{item.earthGate}</strong><em>临 {item.branch}</em></span>
                ))}</div>
              </section>
            </div>
          </div>
        </details>

        <section className="result-card dunjia-legend" aria-label="盘面标记说明">
          <h2 className="result-section-title"><span>注</span>盘面标记</h2>
          <div>
            <span><i className="legend-day-stem" />日干落宫</span>
            <span><i className="legend-void" />旬空</span>
            <span><i className="legend-mu" />入墓</span>
            <span><i className="legend-xing" />击刑</span>
            <span><i className="legend-po" />门迫</span>
            <span><Horse size={16} weight="duotone" aria-hidden="true" />马星</span>
          </div>
        </section>

        <p className="culture-notice">传统文化研究与娱乐参考，请理性看待推演结果</p>
    </PaipanPageShell>
  );
}
