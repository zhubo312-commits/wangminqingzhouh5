import type { FlowMonthsResponse } from "@guoxue/contracts";
import { ArrowClockwise, CalendarDots, Coins, Drop, Flame, Mountains, Tree } from "@phosphor-icons/react";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../../components/PageHeader";
import { InterpretationEntry } from "../../../components/InterpretationEntry";
import { InfoGrid, InfoPair } from "../../../components/paipan/InfoGrid";
import { InlineSelectionGrid } from "../../../components/paipan/InlineSelectionGrid";
import { PaipanEmptyState } from "../../../components/paipan/PaipanEmptyState";
import { PaipanPageShell } from "../../../components/paipan/PaipanPageShell";
import { fetchFlowMonths, fetchHome } from "../../../lib/api-client";
import { useBaziSession } from "./BaziSession";
import { ELEMENT_CLASS } from "./constants";

function TextList({ values }: { values: string[] }) {
  if (values.length === 0) return <span className="empty-mark">—</span>;
  return <>{values.map((value, index) => <span className="stacked-text" key={`${value}-${index}`}>{value}</span>)}</>;
}

function FiveElementLabel({ element }: { element: string }) {
  const iconProps = { size: 14, weight: "duotone" as const, "aria-hidden": true };
  const icon = element === "金"
    ? <Coins {...iconProps} />
    : element === "木"
      ? <Tree {...iconProps} />
      : element === "水"
        ? <Drop {...iconProps} />
        : element === "火"
          ? <Flame {...iconProps} />
          : element === "土"
            ? <Mountains {...iconProps} />
            : null;

  return <small className="five-element-label">{icon}<span>{element}</span></small>;
}

function TwoLineValue({ primary, secondary, numeric = false }: {
  primary: ReactNode;
  secondary: ReactNode;
  numeric?: boolean;
}) {
  return (
    <span className={`info-value-lines${numeric ? " info-value-numeric" : ""}`}>
      <strong className="info-value-primary">{primary}</strong>
      <span className="info-value-secondary">{secondary}</span>
    </span>
  );
}

function DateTimeValue({ value }: { value: string }) {
  const match = value.match(/^(\d{4}[-/]\d{2}[-/]\d{2})\s+(.+)$/);
  if (!match) return <>{value}</>;
  return <TwoLineValue primary={match[1]} secondary={match[2]} numeric />;
}

function LunarDateValue({ value }: { value: string }) {
  const match = value.match(/^(.+?年)(.+?日)(.*时)$/);
  if (!match) return <>{value}</>;
  return <TwoLineValue primary={match[1]} secondary={<>{match[2]}<span className="info-value-dot">·</span>{match[3]}</>} />;
}

function AreaValue({ value }: { value: string }) {
  const match = value.match(/^(北京市|上海市|天津市|重庆市|香港特别行政区|澳门特别行政区|.+?省|.+?自治区)(.+)$/);
  if (!match) return <>{value}</>;
  return <TwoLineValue primary={match[1]} secondary={match[2]} />;
}

function SolarTermValue({ value }: { value: string }) {
  const match = value.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})(?::\d{2})?\s+(.+)$/);
  if (!match) return <>{value}</>;
  return (
    <TwoLineValue
      primary={match[1]}
      secondary={<>{match[2]}<span className="info-value-dot">·</span><span className="solar-term-name">{match[3]}</span></>}
      numeric
    />
  );
}

export function displayProfileName(name: string) {
  return name.trim() || "同修";
}

export function BaziResultPage() {
  const navigate = useNavigate();
  const { chart, chartRequest, isRestoring } = useBaziSession();
  const availablePeriods = useMemo(
    () => chart?.fortune.periods.filter((period) => period.ganZhi) ?? [],
    [chart],
  );
  const [periodIndex, setPeriodIndex] = useState(1);
  const [expandedPeriodIndex, setExpandedPeriodIndex] = useState<number | null>(1);
  const selectedPeriod = availablePeriods.find((period) => period.index === periodIndex) ?? availablePeriods[0];
  const [year, setYear] = useState<number | null>(null);
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const selectedYear = selectedPeriod?.years.find((item) => item.year === year) ?? selectedPeriod?.years[0];
  const [months, setMonths] = useState<FlowMonthsResponse["months"]>([]);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(1);
  const [expandedMonthIndex, setExpandedMonthIndex] = useState<number | null>(1);
  const [monthsLoading, setMonthsLoading] = useState(false);
  const [monthsError, setMonthsError] = useState<string | null>(null);
  const [interpretationUrl, setInterpretationUrl] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetchHome(controller.signal)
      .then((data) => setInterpretationUrl(data.links.interpretation))
      .catch(() => setInterpretationUrl(null));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (selectedPeriod?.years[0]) {
      setYear(selectedPeriod.years[0].year);
      setExpandedYear(selectedPeriod.years[0].year);
    }
  }, [selectedPeriod?.index]);

  const loadMonths = useCallback(async () => {
    if (!chartRequest || !selectedYear) return;
    setMonthsLoading(true);
    setMonthsError(null);
    try {
      const response = await fetchFlowMonths({ chart: chartRequest, year: selectedYear.year });
      setMonths(response.months);
      setSelectedMonthIndex(response.months[0]?.index ?? 1);
      setExpandedMonthIndex(response.months[0]?.index ?? null);
    } catch (reason) {
      setMonths([]);
      setMonthsError(reason instanceof Error ? reason.message : "流月暂时无法加载");
    } finally {
      setMonthsLoading(false);
    }
  }, [chartRequest, selectedYear?.year]);

  useEffect(() => {
    void loadMonths();
  }, [loadMonths]);

  if (isRestoring) {
    return (
      <PaipanPageShell pageClassName="result-page">
        <PageHeader title="排盘结果" backTo="/paipan/shengping-zishi" backLabel="返回生平子时表单" />
        <PaipanEmptyState
          icon={<CalendarDots size={46} weight="light" aria-hidden="true" />}
          title="正在恢复排盘信息"
        />
      </PaipanPageShell>
    );
  }

  if (!chart || !chartRequest) {
    return (
      <PaipanPageShell pageClassName="result-page">
        <PageHeader title="排盘结果" backTo="/paipan/shengping-zishi" backLabel="返回生平子时表单" />
        <PaipanEmptyState
          icon={<CalendarDots size={46} weight="light" aria-hidden="true" />}
          title="本次排盘信息已失效"
          description="本次排盘引用不存在或已过期，请重新排盘。"
          action={<button type="button" onClick={() => navigate("/paipan/shengping-zishi")}>重新排盘</button>}
        />
      </PaipanPageShell>
    );
  }

  const selectedMonth = months.find((month) => month.index === selectedMonthIndex) ?? months[0];
  const facts = chart.basicFacts;

  return (
    <PaipanPageShell pageClassName="result-page">
        <PageHeader title="排盘结果" backTo="/paipan/shengping-zishi" backLabel="返回生平子时表单" />

        <InterpretationEntry href={interpretationUrl} placement="top" />

        <section className="result-card profile-card" aria-labelledby="profile-heading">
          <div className="result-title-row"><span>命</span><div><h2 id="profile-heading">{displayProfileName(chart.profile.name)}</h2><p>{chart.profile.gender === "male" ? "乾造 · 男" : "坤造 · 女"}</p></div></div>
          <dl className="profile-grid">
            <InfoPair label="阳历" value={<DateTimeValue value={chart.profile.birthDateTime} />} />
            <InfoPair label="阴历" value={<LunarDateValue value={chart.profile.lunarDate} />} />
            <InfoPair label="地区" value={<AreaValue value={chart.profile.area || "其他地区"} />} />
            <InfoPair
              label="真太阳时"
              value={chart.profile.trueSolarTime ? <DateTimeValue value={chart.profile.trueSolarTime} /> : "未启用"}
            />
          </dl>
        </section>

        <section className="result-card" aria-labelledby="basic-heading">
          <h2 className="result-section-title" id="basic-heading"><span>01</span>基本信息</h2>
          <dl className="facts-grid">
            <InfoPair label="生肖" value={chart.profile.chineseZodiac} />
            <InfoPair label="星座" value={chart.profile.zodiac} />
            <InfoPair label="本命佛" value={facts.benMingFo} />
            <InfoPair label="对冲" value={facts.duiChong} />
            <InfoPair label="胎元" value={<TwoLineValue primary={facts.taiYuan} secondary={facts.taiYuanNaYin} />} />
            <InfoPair label="命宫" value={<TwoLineValue primary={facts.mingGong} secondary={facts.mingGongNaYin} />} />
            <InfoPair label="三煞" value={facts.sanSha} />
            <InfoPair label="文昌位" value={facts.wenChangWei} />
            <InfoPair label="上一节气" value={<SolarTermValue value={facts.prevSolarTerm} />} />
            <InfoPair label="下一节气" value={<SolarTermValue value={facts.nextSolarTerm} />} />
          </dl>
        </section>

        <section className="result-card chart-card" aria-labelledby="pillars-heading">
          <h2 className="result-section-title" id="pillars-heading"><span>02</span>四柱命盘</h2>
          <div className="chart-table-wrap">
            <table className="pillar-table">
              <thead><tr><th>盘面</th>{chart.pillars.map((pillar) => <th key={pillar.key}>{pillar.label}</th>)}</tr></thead>
              <tbody>
                <tr><th>十神</th>{chart.pillars.map((pillar) => <td key={pillar.key}>{pillar.tenGod}</td>)}</tr>
                <tr className="stem-row"><th>天干</th>{chart.pillars.map((pillar) => <td key={pillar.key} className={ELEMENT_CLASS[pillar.stemElement]}><strong>{pillar.stem}</strong><FiveElementLabel element={pillar.stemElement} /></td>)}</tr>
                <tr className="branch-row"><th>地支</th>{chart.pillars.map((pillar) => <td key={pillar.key} className={ELEMENT_CLASS[pillar.branchElement]}><strong>{pillar.branch}</strong><FiveElementLabel element={pillar.branchElement} /></td>)}</tr>
                <tr className="hidden-stems-row"><th>藏干</th>{chart.pillars.map((pillar) => <td key={pillar.key}>{pillar.hiddenStems.map((stem) => <span className={ELEMENT_CLASS[stem.element]} key={`${stem.stem}-${stem.tenGod}`}>{stem.stem}<small>{stem.tenGod}</small></span>)}</td>)}</tr>
                <tr><th>星运</th>{chart.pillars.map((pillar) => <td key={pillar.key}>{pillar.growth}</td>)}</tr>
                <tr><th>自坐</th>{chart.pillars.map((pillar) => <td key={pillar.key}>{pillar.selfSeat}</td>)}</tr>
                <tr><th>纳音</th>{chart.pillars.map((pillar) => <td key={pillar.key}>{pillar.naYin}</td>)}</tr>
                <tr><th>空亡</th>{chart.pillars.map((pillar) => <td key={pillar.key}>{pillar.voidBranch}</td>)}</tr>
                <tr className="shensha-row"><th>神煞</th>{chart.pillars.map((pillar) => <td key={pillar.key}><TextList values={pillar.shenSha} /></td>)}</tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="result-card" aria-labelledby="attention-heading">
          <h2 className="result-section-title" id="attention-heading"><span>03</span>干支留意</h2>
          <div className="attention-group"><h3>天干</h3><div>{chart.attention.heavenlyStems.length ? chart.attention.heavenlyStems.map((item) => <span key={item}>{item}</span>) : <span>无特别留意</span>}</div></div>
          <div className="attention-group"><h3>地支</h3><div>{chart.attention.earthlyBranches.length ? chart.attention.earthlyBranches.map((item) => <span key={item}>{item}</span>) : <span>无特别留意</span>}</div></div>
        </section>

        <section className="result-card fortune-card" aria-labelledby="fortune-heading">
          <h2 className="result-section-title" id="fortune-heading"><span>04</span>十年大运</h2>
          <div className="fortune-meta"><p>{chart.fortune.startDescription}</p><p>{chart.fortune.changeDescription}</p><small>起运：{chart.fortune.startSolar}</small></div>
          <InlineSelectionGrid
            items={availablePeriods}
            columns={2}
            ariaLabel="大运选择"
            className="horizontal-selector"
            itemKey={(period) => period.index}
            isSelected={(period) => expandedPeriodIndex === period.index}
            renderButton={(period) => <button type="button" className={selectedPeriod?.index === period.index ? "active" : ""} aria-pressed={selectedPeriod?.index === period.index} aria-expanded={expandedPeriodIndex === period.index} key={period.index} onClick={() => { const collapse = selectedPeriod?.index === period.index && expandedPeriodIndex === period.index; setPeriodIndex(period.index); setExpandedPeriodIndex(collapse ? null : period.index); }}><strong>{period.ganZhi}</strong><span>{period.startAge}–{period.endAge}岁</span><small>{period.startYear}–{period.endYear}</small></button>}
            renderDetail={(period) => <><div className="selection-heading"><span>大运</span><strong>{period.ganZhi}</strong><em>{period.growth}</em></div><div className="detail-tags"><TextList values={[...period.tenGods, ...period.shenSha]} /></div></>}
          />

          <div className="subsection-heading subsection-heading-context">
            <h3 className="subsection-title">大运流年</h3>
            {selectedPeriod && (
              <span className="subsection-context" aria-label={`当前为${selectedPeriod.ganZhi}大运，${selectedPeriod.startYear}至${selectedPeriod.endYear}年，${selectedPeriod.startAge}至${selectedPeriod.endAge}岁`}>
                <strong>{selectedPeriod.ganZhi}大运</strong>
                <span>{selectedPeriod.startYear}–{selectedPeriod.endYear}年 · {selectedPeriod.startAge}–{selectedPeriod.endAge}岁</span>
              </span>
            )}
          </div>
          <InlineSelectionGrid
            items={selectedPeriod?.years ?? []}
            columns={2}
            ariaLabel="流年选择"
            className="year-selector"
            itemKey={(item) => item.year}
            isSelected={(item) => expandedYear === item.year}
            renderButton={(item) => <button type="button" className={selectedYear?.year === item.year ? "active" : ""} aria-pressed={selectedYear?.year === item.year} aria-expanded={expandedYear === item.year} key={item.year} onClick={() => { const collapse = selectedYear?.year === item.year && expandedYear === item.year; setYear(item.year); setExpandedYear(collapse ? null : item.year); }}><strong>{item.ganZhi}</strong><span>{item.year}</span><small>{item.age}岁</small></button>}
            renderDetail={(item) => <><div className="selection-heading"><span>流年</span><strong>{item.ganZhi}</strong><em>{item.year}年 · {item.age}岁</em></div><dl className="compact-detail"><InfoPair label="十神" value={item.tenGods.join("、")} /><InfoPair label="藏干" value={item.hiddenStems} /><InfoPair label="空亡" value={item.voidBranch} /><InfoPair label="财星" value={item.wealthStrong ? "得力" : "平"} /></dl><div className="detail-tags"><TextList values={[...item.heavenlyStemAttention, ...item.earthlyBranchAttention, ...item.shenSha]} /></div></>}
          />

          <div className="subsection-heading subsection-heading-context">
            <h3 className="subsection-title">流月联动</h3>
            {selectedYear && (
              <span className="subsection-context" aria-label={`当前为${selectedYear.ganZhi}流年，${selectedYear.year}年，${selectedYear.age}岁`}>
                <strong>{selectedYear.ganZhi}流年</strong>
                <span>{selectedYear.year}年 · {selectedYear.age}岁</span>
              </span>
            )}
            {monthsError && <button type="button" className="icon-retry" onClick={() => void loadMonths()} aria-label="重新加载流月"><ArrowClockwise size={18} /></button>}
          </div>
          {monthsLoading ? <div className="months-loading">正在推演流月…</div> : monthsError ? <div className="inline-error" role="alert">{monthsError}</div> : (
            <>
              <InlineSelectionGrid
                items={months}
                columns={3}
                ariaLabel="流月选择"
                className="month-selector"
                itemKey={(month) => month.index}
                isSelected={(month) => expandedMonthIndex === month.index}
                renderButton={(month) => <button type="button" className={selectedMonth?.index === month.index ? "active" : ""} aria-pressed={selectedMonth?.index === month.index} aria-expanded={expandedMonthIndex === month.index} key={month.index} onClick={() => { const collapse = selectedMonth?.index === month.index && expandedMonthIndex === month.index; setSelectedMonthIndex(month.index); setExpandedMonthIndex(collapse ? null : month.index); }}><strong>{month.ganZhi}</strong><span>{month.monthName}</span><small>{month.solarTermName}</small></button>}
                renderDetail={(month) => <><div className="selection-heading"><span>流月</span><strong>{month.ganZhi}</strong><em>{month.solarTermName} · {month.solarTermDateTime.slice(0, 10)}</em></div><dl className="compact-detail"><InfoPair label="十神" value={month.tenGods.join("、")} /><InfoPair label="藏干" value={month.hiddenStems} /></dl><div className="detail-tags"><TextList values={[...month.heavenlyStemAttention, ...month.earthlyBranchAttention, ...month.shenSha]} /></div></>}
              />
            </>
          )}
        </section>

        <section className="result-card strength-card" aria-labelledby="strength-heading">
          <h2 className="result-section-title" id="strength-heading"><span>05</span>旺衰参考</h2>
          <div className="strength-level"><strong>{chart.strength.level}</strong><span>同党 {chart.strength.samePartyScore}</span><span>异党 {chart.strength.otherPartyScore}</span></div>
          <p className="strength-summary">{chart.strength.summary}</p>
          <InfoGrid className="strength-facts"><InfoPair label="格局" value={chart.strength.pattern} /><InfoPair label="喜神参考" value={chart.strength.favorableGod} /><InfoPair label="喜用五行" value={chart.strength.favorableElements.join("、")} /><InfoPair label="旧版分值" value={chart.strength.legacyScore} /></InfoGrid>
          <div className="strength-bars">{Object.entries(chart.strength.relationScores).map(([label, score]) => <div key={label}><span>{label}</span><div><i style={{ width: `${Math.min(100, (score / 250) * 100)}%` }} /></div><strong>{score}</strong></div>)}</div>
        </section>

        <InterpretationEntry href={interpretationUrl} placement="bottom" />
        <p className="culture-notice result-notice">传统文化研究与娱乐参考，请理性看待推演结果</p>
    </PaipanPageShell>
  );
}
