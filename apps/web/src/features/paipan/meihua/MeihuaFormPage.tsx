import type { MeihuaChartRequest } from "@guoxue/contracts";
import { BookOpenText, ClockCountdown, DiceFive, Hash, SlidersHorizontal } from "@phosphor-icons/react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../../components/PageHeader";
import { WheelSelectPicker } from "../../../components/WheelSelectPicker";
import { PaipanPageShell } from "../../../components/paipan/PaipanPageShell";
import { PaipanSectionCard } from "../../../components/paipan/PaipanSectionCard";
import { createMeihuaChart } from "../../../lib/api-client";
import { SolarDateTimePicker } from "../bazi/BaziMobilePickers";
import { MeihuaClassicBrowser } from "./MeihuaClassics";
import { useMeihuaSession, type MeihuaDraft } from "./MeihuaSession";

const TRIGRAMS = ["乾", "兑", "离", "震", "巽", "坎", "艮", "坤"] as const;
const TRIGRAM_OPTIONS = TRIGRAMS.map((name, index) => ({ value: String(index + 1), label: `${index + 1} · ${name}` }));
const MOVING_LINE_OPTIONS = Array.from({ length: 6 }, (_, index) => ({ value: String(index + 1), label: `第 ${index + 1} 爻` }));
type Panel = "time" | "random" | "number" | "specified" | "classics";
const PANELS: Array<{ key: Panel; label: string; note: string; icon: typeof ClockCountdown }> = [
  { key: "time", label: "时间起盘", note: "按年月日时起卦", icon: ClockCountdown },
  { key: "random", label: "随机起盘", note: "随机取得上下卦与动爻", icon: DiceFive },
  { key: "number", label: "报数起盘", note: "支持双数与三数起盘", icon: Hash },
  { key: "specified", label: "指定起盘", note: "直接选择卦象与动爻", icon: SlidersHorizontal },
  { key: "classics", label: "八宫六十四卦", note: "查阅卦辞、彖象与六爻", icon: BookOpenText },
];

function nowInputValue() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function MeihuaFormPage() {
  const navigate = useNavigate();
  const { draft, setDraft, setResult } = useMeihuaSession();
  const [panel, setPanel] = useState<Panel>("time");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submissionLock = useRef(false);

  function update<Key extends keyof MeihuaDraft>(key: Key, value: MeihuaDraft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function create(mode: Exclude<Panel, "classics">, useNow = false) {
    if (submissionLock.current) return;
    submissionLock.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const chartDateTime = (useNow ? nowInputValue() : draft.chartDateTime).replace("T", " ");
      let request: MeihuaChartRequest;
      if (mode === "number") {
        const numberOne = Number(draft.numberOne);
        const numberTwo = Number(draft.numberTwo);
        const numberThree = draft.numberCount === 3 ? Number(draft.numberThree) : undefined;
        const numbers = [numberOne, numberTwo, ...(numberThree === undefined ? [] : [numberThree])];
        if (numbers.some((value) => !Number.isInteger(value) || value < 1 || value > 999_999_999)) {
          throw new Error(`请填写${draft.numberCount === 3 ? "三个" : "两个"} 1–999999999 的整数`);
        }
        request = {
          chartDateTime,
          mode,
          numberCount: draft.numberCount,
          numberOne,
          numberTwo,
          ...(numberThree === undefined ? {} : { numberThree }),
          includeHour: draft.includeHour,
          school: draft.school,
        };
      } else if (mode === "random") {
        request = { chartDateTime, mode, upperTrigram: Math.floor(Math.random() * 8) + 1, lowerTrigram: Math.floor(Math.random() * 8) + 1, movingLine: Math.floor(Math.random() * 6) + 1 };
      } else if (mode === "specified") {
        request = { chartDateTime, mode, upperTrigram: draft.upperTrigram, lowerTrigram: draft.lowerTrigram, movingLine: draft.movingLine };
      } else {
        request = { chartDateTime, mode };
      }
      if (useNow) update("chartDateTime", chartDateTime.replace(" ", "T"));
      const response = await createMeihuaChart(request);
      const { paipan_ref: reference, expiresAt: _expiresAt, ...chart } = response;
      setResult(chart, request, reference);
      navigate("/paipan/meihua/result");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "梅花起盘失败，请稍后重试");
    } finally {
      submissionLock.current = false;
      setSubmitting(false);
    }
  }

  return (
    <PaipanPageShell pageClassName="form-page meihua-form-page">
      <PageHeader title="梅花学" backTo="/paipan" backLabel="返回排盘导航" />
      <div className="meihua-form">
        <PaipanSectionCard variant="form" className="meihua-entry-card" labelledBy="meihua-entry-heading">
          <div className="form-card-heading"><span>01</span><h3 id="meihua-entry-heading">选择起盘方式</h3></div>
          <div className="meihua-entry-grid">
            {PANELS.map((item) => { const Icon = item.icon; return <button type="button" key={item.key} className={panel === item.key ? "active" : ""} aria-pressed={panel === item.key} onClick={() => { setPanel(item.key); setError(null); }}><Icon size={24} weight="duotone" aria-hidden="true" /><span><strong>{item.label}</strong><small>{item.note}</small></span></button>; })}
          </div>
        </PaipanSectionCard>

        {panel !== "classics" && <PaipanSectionCard variant="form" className="meihua-condition-card" labelledBy="meihua-condition-heading">
          <div className="form-card-heading"><span>02</span><h3 id="meihua-condition-heading">{PANELS.find((item) => item.key === panel)?.label}</h3></div>
          <div className="form-field picker-field"><SolarDateTimePicker subject="起盘" value={draft.chartDateTime} onChange={(value) => update("chartDateTime", value)} /></div>

          {panel === "number" && <>
            <fieldset className="form-field juece-choice-field"><legend>起盘数字</legend><div className="segment-control juece-two-tabs"><button type="button" className={draft.numberCount === 2 ? "active" : ""} aria-pressed={draft.numberCount === 2} onClick={() => update("numberCount", 2)}>双数起盘</button><button type="button" className={draft.numberCount === 3 ? "active" : ""} aria-pressed={draft.numberCount === 3} onClick={() => update("numberCount", 3)}>三数起盘</button></div></fieldset>
            <div className={`meihua-number-grid${draft.numberCount === 3 ? " is-triple" : ""}`}><label><span>第一个数</span><input type="number" inputMode="numeric" min="1" max="999999999" value={draft.numberOne} onChange={(event) => update("numberOne", event.target.value)} placeholder="请输入正整数" /></label><label><span>第二个数</span><input type="number" inputMode="numeric" min="1" max="999999999" value={draft.numberTwo} onChange={(event) => update("numberTwo", event.target.value)} placeholder="请输入正整数" /></label>{draft.numberCount === 3 && <label className="meihua-third-number"><span>第三个数</span><input type="number" inputMode="numeric" min="1" max="999999999" value={draft.numberThree} onChange={(event) => update("numberThree", event.target.value)} placeholder="用于计算动爻" /></label>}</div>
            <fieldset className="form-field juece-choice-field"><legend>起卦流派</legend><div className="segment-control juece-two-tabs"><button type="button" className={draft.school === "digit_sum" ? "active" : ""} onClick={() => update("school", "digit_sum")}>朱昱／易谦老师</button><button type="button" className={draft.school === "raw_number" ? "active" : ""} onClick={() => update("school", "raw_number")}>广元老师</button></div></fieldset>
            <label className="meihua-hour-toggle"><input type="checkbox" checked={draft.includeHour} onChange={(event) => update("includeHour", event.target.checked)} /><span><strong>动爻计算加入时辰数</strong><small>上下卦仍按所选流派计算</small></span></label>
          </>}

          {panel === "specified" && <div className="meihua-select-grid"><WheelSelectPicker label="上卦" value={String(draft.upperTrigram)} options={TRIGRAM_OPTIONS} onChange={(value) => update("upperTrigram", Number(value))} /><WheelSelectPicker label="下卦" value={String(draft.lowerTrigram)} options={TRIGRAM_OPTIONS} onChange={(value) => update("lowerTrigram", Number(value))} /><WheelSelectPicker label="动爻" value={String(draft.movingLine)} options={MOVING_LINE_OPTIONS} onChange={(value) => update("movingLine", Number(value))} /></div>}

          {panel === "random" && <p className="meihua-mode-note">系统将随机取得上卦、下卦与动爻；起盘时间仅用于四柱信息展示。</p>}
          {panel === "specified" && <p className="meihua-mode-note">日期时间仅用于展示公历、农历与四柱，不参与指定卦象计算。</p>}
          {error && <div className="form-error" role="alert">{error}</div>}
          {panel === "time" ? <div className="meihua-time-actions"><button type="button" disabled={submitting} onClick={() => void create("time")}>{submitting ? "正在起盘…" : "选时起盘"}</button><button type="button" disabled={submitting} onClick={() => void create("time", true)}>现时起盘</button></div> : <button className="submit-chart" type="button" disabled={submitting} onClick={() => void create(panel)}>{submitting ? "正在起盘…" : panel === "random" ? "随机起盘" : panel === "number" ? "报数起盘" : "指定起盘"}</button>}
        </PaipanSectionCard>}

        {panel === "classics" && <PaipanSectionCard variant="form" className="meihua-classics-card" labelledBy="meihua-classics-heading"><div className="form-card-heading"><span>64</span><h3 id="meihua-classics-heading">八宫六十四卦</h3></div><MeihuaClassicBrowser /></PaipanSectionCard>}
      </div>
      <p className="culture-notice form-notice">传统文化研究与娱乐参考，请理性看待推演结果</p>
    </PaipanPageShell>
  );
}
