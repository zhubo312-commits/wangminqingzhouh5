import type { XingmingChartResponse } from "@guoxue/contracts";
import type { ReactNode } from "react";
import { FiveElementLabel } from "../../../components/paipan/FiveElementLabel";

export type XingmingCharacter = XingmingChartResponse["characters"][number];

export function XingmingDetail({
  title,
  meta,
  children,
  open = false,
}: {
  title: string;
  meta?: ReactNode;
  children: ReactNode;
  open?: boolean;
}) {
  return (
    <details className="xingming-detail" open={open}>
      <summary><span>{title}</span>{meta && <small>{meta}</small>}</summary>
      <div className="xingming-detail-body">{children}</div>
    </details>
  );
}

function XingmingTextRow({ label, value }: { label: string; value: string | null }) {
  return value ? <div className="xingming-text-row"><strong>{label}</strong><p>{value}</p></div> : null;
}

function CharacterRecord({
  character,
  groupLabel,
}: {
  character: XingmingCharacter;
  groupLabel: "姓氏" | "名字";
}) {
  const fields = [
    ["拼音", character.pinyin],
    ["简体字", character.simplified],
    ["繁体字", character.traditional],
    ["笔画（计入）", character.calculationStrokes],
  ] as const;

  return (
    <article className="xingming-character-record" aria-label={`${groupLabel}用字 ${character.traditional}`}>
      <div className="xingming-character-glyph-stack">
        <strong className="xingming-character-glyph">{character.traditional}</strong>
        <FiveElementLabel element={character.element} iconSize={13} />
      </div>
      <dl className="xingming-character-fields">
        {fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>
      <div className="xingming-kangxi-strokes">
        <span>康熙笔画</span>
        <p><strong>{character.kangxiStrokes}</strong><small>画</small></p>
      </div>
    </article>
  );
}

function NameCharacterGroup({
  label,
  name,
  characters,
}: {
  label: "姓氏" | "名字";
  name: string;
  characters: XingmingCharacter[];
}) {
  const columnCount = Math.min(characters.length, 3);
  return (
    <section className={`xingming-name-group xingming-name-group--${label === "姓氏" ? "surname" : "given"}`} aria-label={`${label} ${name}`}>
      <header className="xingming-name-group-heading"><span>{label}</span><strong>{name}</strong></header>
      <div className={`xingming-name-character-list xingming-name-character-list--${columnCount}`}>
        {characters.map((character, index) => (
          <CharacterRecord key={`${character.traditional}-${index}`} character={character} groupLabel={label} />
        ))}
      </div>
    </section>
  );
}

export function XingmingNameCharacterGroups({ chart }: { chart: XingmingChartResponse }) {
  const surnameCharacterCount = Array.from(chart.name.surname).length;
  const surnameCharacters = chart.characters.slice(0, surnameCharacterCount);
  const givenNameCharacters = chart.characters.slice(surnameCharacterCount);

  return (
    <div className="xingming-name-groups" aria-label="姓名用字信息">
      <NameCharacterGroup label="姓氏" name={chart.name.surname} characters={surnameCharacters} />
      <NameCharacterGroup label="名字" name={chart.name.givenName} characters={givenNameCharacters} />
    </div>
  );
}

export function XingmingCharacterReferenceList({
  characters,
  open = false,
}: {
  characters: XingmingCharacter[];
  open?: boolean;
}) {
  return (
    <div className="xingming-detail-stack">
      {characters.map((character, index) => (
        <XingmingDetail
          key={`${character.input}-${index}`}
          title={`${character.traditional} · ${character.pinyin}`}
          meta={<><FiveElementLabel element={character.element} iconSize={13} /><span>· {character.kangxiStrokes} 画</span></>}
          open={open}
        >
          <div className="xingming-character-meta">
            <span>康熙 {character.kangxiStrokes} 画</span>
            {character.radical && <span>部首 {character.radical}</span>}
            {character.common !== null && <span>{character.common ? "常用字" : "非常用字"}</span>}
          </div>
          <div className="xingming-character-reading">
            <XingmingTextRow label="字义" value={character.nameExplanation} />
            <XingmingTextRow label="取名寓意" value={character.namingImplication ?? character.namingMeaning} />
          </div>
        </XingmingDetail>
      ))}
    </div>
  );
}
