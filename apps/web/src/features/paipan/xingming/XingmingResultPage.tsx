import { IdentificationCard } from "@phosphor-icons/react";
import type { XingmingChartResponse } from "@guoxue/contracts";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../../components/PageHeader";
import { FiveElementLabel } from "../../../components/paipan/FiveElementLabel";
import { PaipanActionButton } from "../../../components/paipan/PaipanActionButton";
import { PaipanEmptyState } from "../../../components/paipan/PaipanEmptyState";
import { PaipanPageShell } from "../../../components/paipan/PaipanPageShell";
import { PaipanSectionCard } from "../../../components/paipan/PaipanSectionCard";
import {
  XingmingCharacterReferenceList,
  XingmingDetail,
  XingmingNameCharacterGroups,
  type XingmingCharacter,
} from "./XingmingCharacterDetails";
import { XingmingNameEditor } from "./XingmingNameEditor";
import { useXingmingSession } from "./XingmingSession";
type XingmingGrid = XingmingChartResponse["grids"][number];

const GRID_ROLE_TEXT: Record<XingmingGrid["key"], string> = {
  heaven: "天格由姓氏笔画计算，传统上主要看家族与先天基础。",
  person: "人格连接姓和名，是五格中的核心，传统上主要看性格与发展趋势。",
  earth: "地格由名字笔画计算，传统上主要看早期发展与基础。",
  outer: "外格由姓名外侧笔画计算，传统上主要看人际与外部关系。",
  total: "总格是姓名全部笔画之和，传统上主要看整体与后期发展。",
  change: "变格是六格中的补充项，用来辅助看姓名内部变化。",
};

function parseNumberMeaning(value: string | null) {
  if (!value) return null;
  const match = value.match(/^（([^）]+)）\s*(.*)$/s);
  if (!match) return { title: "传统说法", description: value };
  const title = match[1]?.trim() ?? "传统说法";
  let description = match[2]?.trim() ?? value;
  if (description.startsWith(`${title}，`)) description = description.slice(title.length + 1);
  return { title, description };
}

function GridExplanation({ grid, duplicateOf }: { grid: XingmingGrid; duplicateOf: string | undefined }) {
  const meaning = parseNumberMeaning(grid.interpretation.summary);

  return <div className="xingming-grid-explanation">
    <p className="xingming-grid-role">{GRID_ROLE_TEXT[grid.key]}</p>
    {duplicateOf
      ? <p className="xingming-grid-duplicate">同为 <strong>{grid.interpretationNumber} 数</strong>，含义与{duplicateOf}相同，本处不重复。</p>
      : <>
        {meaning && <div className="xingming-grid-number-meaning">
          <span><strong>{grid.interpretationNumber}</strong><small>数</small></span>
          <div><strong>{meaning.title}</strong><p>{meaning.description}</p></div>
        </div>}
      </>}
  </div>;
}

function FiveGridValue({ grid, className = "" }: { grid: XingmingGrid; className?: string }) {
  return <div className={`xingming-five-grid-value ${className}`.trim()} data-xingming-grid={grid.key}>
    <span>{grid.label}</span>
    <strong>{grid.number}</strong>
    <small><FiveElementLabel element={grid.element} iconSize={10} /><span>· {grid.rating}</span></small>
    {grid.number !== grid.interpretationNumber && <em>按 {grid.interpretationNumber} 解读</em>}
  </div>;
}

function FiveGridDiagram({ chart }: { chart: XingmingChartResponse }) {
  const surnameLength = Array.from(chart.name.surname).length;
  const surnameCharacters = chart.characters.slice(0, surnameLength);
  const givenNameCharacters = chart.characters.slice(surnameLength);
  const slots: Array<{ key: string; kind: "virtual" } | { key: string; kind: "character"; role: "姓" | "名"; character: XingmingCharacter }> = [];

  if (surnameCharacters.length === 1) slots.push({ key: "surname-virtual", kind: "virtual" });
  surnameCharacters.forEach((character, index) => slots.push({ key: `surname-${character.traditional}-${index}`, kind: "character", role: "姓", character }));
  givenNameCharacters.forEach((character, index) => slots.push({ key: `given-${character.traditional}-${index}`, kind: "character", role: "名", character }));
  if (givenNameCharacters.length === 1) slots.push({ key: "given-virtual", kind: "virtual" });

  const givenStart = (surnameCharacters.length === 1 ? 1 : 0) + surnameCharacters.length;
  const gridByKey = (key: XingmingGrid["key"]) => chart.grids.find((grid) => grid.key === key)!;
  const outer = gridByKey("outer");
  const total = gridByKey("total");
  const change = chart.grids.find((grid) => grid.key === "change");
  const rightRelations = [
    { grid: gridByKey("heaven"), start: 0, span: givenStart },
    { grid: gridByKey("person"), start: givenStart - 1, span: 2 },
    { grid: gridByKey("earth"), start: givenStart, span: slots.length - givenStart },
  ];

  return <figure className="xingming-five-grid-diagram" aria-label={chart.school === "wuge" ? "五格关系图" : "六格关系图"}>
    <div className="xingming-five-grid-map">
      <div className="xingming-five-grid-relation xingming-five-grid-relation--outer" style={{ gridRow: `1 / span ${slots.length}` }}>
        <FiveGridValue grid={outer} />
        <i className="xingming-five-grid-bracket" aria-hidden="true" />
      </div>

      {slots.map((slot, index) => slot.kind === "virtual"
        ? <div key={slot.key} className="xingming-five-grid-name-node xingming-five-grid-name-node--virtual" style={{ gridRow: index + 1 }} aria-label="虚位一画"><strong>+1</strong><small>虚位</small></div>
        : <div key={slot.key} className={`xingming-five-grid-name-node xingming-five-grid-name-node--character xingming-five-grid-name-node--${slot.role === "姓" ? "surname" : "given"}`} style={{ gridRow: index + 1 }} aria-label={`${slot.role} ${slot.character.traditional} 康熙 ${slot.character.kangxiStrokes} 画`}><em>{slot.role}</em><strong>{slot.character.traditional}</strong><small>{slot.character.kangxiStrokes} 画</small></div>)}

      {rightRelations.map(({ grid, start, span }) => <div key={grid.key} className="xingming-five-grid-relation xingming-five-grid-relation--right" style={{ gridRow: `${start + 1} / span ${span}` }}>
        <i className="xingming-five-grid-bracket" aria-hidden="true" />
        <FiveGridValue grid={grid} />
      </div>)}
    </div>

    <div className={`xingming-five-grid-footer${change ? " xingming-five-grid-footer--six" : ""}`}>
      <FiveGridValue grid={total} className="xingming-five-grid-value--total" />
      {change && <FiveGridValue grid={change} className="xingming-five-grid-value--change" />}
    </div>
  </figure>;
}

export function XingmingResultPage() {
  const navigate = useNavigate();
  const { chart, chartRequest, isRestoring } = useXingmingSession();
  if (isRestoring) return <PaipanPageShell pageClassName="result-page xingming-result-page"><PageHeader title="姓名学" backTo="/paipan/xingming" backLabel="返回姓名学表单" /><PaipanEmptyState icon={<IdentificationCard size={46} />} title="正在恢复姓名盘" /></PaipanPageShell>;
  if (!chart) return <PaipanPageShell pageClassName="result-page xingming-result-page"><PageHeader title="姓名学" backTo="/paipan/xingming" backLabel="返回姓名学表单" /><PaipanEmptyState icon={<IdentificationCard size={46} />} title="本次姓名盘已失效" description="排盘引用不存在、版本已升级或已过期，请重新排盘。" action={<PaipanActionButton variant="restart" onClick={() => navigate("/paipan/xingming")}>重新排盘</PaipanActionButton>} /></PaipanPageShell>;

  const firstGridByNumber = new Map<number, string>();
  const gridDetails = chart.grids.map((grid) => {
    const duplicateOf = firstGridByNumber.get(grid.interpretationNumber);
    if (!duplicateOf) firstGridByNumber.set(grid.interpretationNumber, grid.label);
    return <XingmingDetail key={grid.key} title={`${grid.label} ${grid.number}`} meta={<><FiveElementLabel element={grid.element} iconSize={13} /><span>· {grid.rating}</span></>} open>
      <GridExplanation grid={grid} duplicateOf={duplicateOf} />
    </XingmingDetail>;
  });

  return <PaipanPageShell pageClassName="result-page xingming-result-page">
    <PageHeader title="姓名学" backTo="/paipan/xingming" backLabel="返回姓名学表单" />

    <PaipanSectionCard className="xingming-overview-card" labelledBy="xingming-overview-heading">
      <div className="xingming-result-hero"><div><small>{chart.school === "wuge" ? "三才五格" : "三才六格"}</small><h2 id="xingming-overview-heading">{chart.name.fullName}</h2></div><div className="xingming-score"><strong>{chart.score}</strong><span>参考分</span></div></div>
      <XingmingNameCharacterGroups chart={chart} />
      <XingmingNameEditor surname={chartRequest?.surname ?? chart.name.surname} givenName={chartRequest?.givenName ?? chart.name.givenName} school={chart.school} />
    </PaipanSectionCard>

    <PaipanSectionCard className="xingming-grids-card" labelledBy="xingming-grids-heading">
      <h2 className="result-section-title" id="xingming-grids-heading"><span>01</span>{chart.school === "wuge" ? "五格数理" : "六格数理"}</h2>
      <FiveGridDiagram chart={chart} />
      <div className="xingming-detail-stack">{gridDetails}</div>
    </PaipanSectionCard>

    <PaipanSectionCard className="xingming-reading-card" labelledBy="xingming-sancai-heading">
      <h2 className="result-section-title" id="xingming-sancai-heading"><span>02</span>三才配置</h2>
      <div className="xingming-sancai">
        <div className="xingming-sancai-heading"><span>三才五行</span><strong>{chart.threeTalents.rating}</strong></div>
        <div className="xingming-sancai-elements" aria-label={`三才五行 ${chart.threeTalents.title}`}>
          {Array.from(chart.threeTalents.title).map((element, index) => <div className="xingming-sancai-element" key={`${element}-${index}`}><small>{["天格", "人格", "地格"][index]}</small><FiveElementLabel element={element} iconSize={20} /></div>)}
        </div>
      </div>
      <div className="xingming-relation-list">{chart.elementRelations.map((relation) => <span key={`${relation.from}-${relation.to}`}>{relation.summary}</span>)}</div>
    </PaipanSectionCard>

    <PaipanSectionCard className="xingming-character-detail-card" labelledBy="xingming-character-heading">
      <h2 className="result-section-title" id="xingming-character-heading"><span>03</span>逐字用字参考</h2>
      <XingmingCharacterReferenceList characters={chart.characters} />
    </PaipanSectionCard>

    <PaipanActionButton variant="restart" className="xingming-restart" onClick={() => navigate("/paipan/xingming")}>重新排盘</PaipanActionButton>
    <p className="culture-notice">传统文化研究与娱乐参考，请理性看待推演结果</p>
  </PaipanPageShell>;
}
