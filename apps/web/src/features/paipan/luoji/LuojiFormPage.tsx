import type { LuojiChartRequest } from "@guoxue/contracts";
import { Coins, ListNumbers, ShuffleAngular, Trash } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../../components/PageHeader";
import { WheelSelectPicker } from "../../../components/WheelSelectPicker";
import { PaipanPageShell } from "../../../components/paipan/PaipanPageShell";
import { PaipanSectionCard } from "../../../components/paipan/PaipanSectionCard";
import { createLuojiChart } from "../../../lib/api-client";
import { SolarDateTimePicker } from "../bazi/BaziMobilePickers";
import { LUOJI_HEXAGRAM_NAMES } from "./hexagram-names";
import { useLuojiSession, type LuojiDraft } from "./LuojiSession";

const MODES = [
  { key: "coins", label: "铜钱摇盘法", note: "点击铜钱，依次完成六次", icon: Coins },
  { key: "names", label: "盘名起盘法", note: "直接指定本卦和变卦", icon: ShuffleAngular },
  { key: "backs", label: "硬币背数法", note: "填写六次抛币的背数", icon: ListNumbers },
] as const;
const LINE_LABELS = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"] as const;
const HEXAGRAM_OPTIONS = LUOJI_HEXAGRAM_NAMES.map((name) => ({ value: name, label: name }));
const COIN_TOSS_DURATION_MS = 720;
const REDUCED_MOTION_TOSS_DURATION_MS = 120;

export function LuojiFormPage() {
  const navigate = useNavigate();
  const { draft, setDraft, setResult } = useLuojiSession();
  const [submitting, setSubmitting] = useState(false);
  const [isTossing, setIsTossing] = useState(false);
  const [tossAnnouncement, setTossAnnouncement] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submissionLock = useRef(false);
  const tossTimerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (tossTimerRef.current !== null) window.clearTimeout(tossTimerRef.current);
  }, []);

  function update<Key extends keyof LuojiDraft>(key: Key, value: LuojiDraft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function cancelToss() {
    if (tossTimerRef.current !== null) {
      window.clearTimeout(tossTimerRef.current);
      tossTimerRef.current = null;
    }
    setIsTossing(false);
    setTossAnnouncement("");
  }

  function tossCoins() {
    if (isTossing || draft.coinBacks.length >= 6) return;
    const lineIndex = draft.coinBacks.length;
    const backs = Array.from({ length: 3 }, () => Math.floor(Math.random() * 2)).filter((value) => value === 1).length;
    const reducedMotion = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setIsTossing(true);
    setTossAnnouncement(`第 ${lineIndex + 1} 爻铜钱摇动中`);
    tossTimerRef.current = window.setTimeout(() => {
      setDraft((current) => current.mode === "coins" && current.coinBacks.length === lineIndex
        ? { ...current, coinBacks: `${current.coinBacks}${backs}` }
        : current);
      setTossAnnouncement(`第 ${lineIndex + 1} 爻已记录，背数为 ${backs}`);
      setIsTossing(false);
      tossTimerRef.current = null;
    }, reducedMotion ? REDUCED_MOTION_TOSS_DURATION_MS : COIN_TOSS_DURATION_MS);
  }

  function clearCurrent() {
    cancelToss();
    if (draft.mode === "names") setDraft((current) => ({ ...current, originalHexagram: "乾为天", changedHexagram: "乾为天" }));
    else update("coinBacks", "");
    setError(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionLock.current) return;
    submissionLock.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const common = { chartDateTime: draft.chartDateTime.replace("T", " "), question: draft.question.trim() };
      let request: LuojiChartRequest;
      if (draft.mode === "names") request = { ...common, mode: "names", originalHexagram: draft.originalHexagram, changedHexagram: draft.changedHexagram };
      else {
        if (!/^[0-3]{6}$/.test(draft.coinBacks)) throw new Error("请按初爻到上爻填写 6 位背数，每位只能是 0、1、2、3");
        request = { ...common, mode: draft.mode, coinBacks: draft.coinBacks };
      }
      const response = await createLuojiChart(request);
      const { paipan_ref: reference, expiresAt: _expiresAt, ...chart } = response;
      setResult(chart, request, reference);
      navigate("/paipan/luoji/result");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "逻辑排盘失败，请稍后重试");
    } finally {
      submissionLock.current = false;
      setSubmitting(false);
    }
  }

  return (
    <PaipanPageShell pageClassName="form-page luoji-form-page">
      <PageHeader title="逻辑学" backTo="/paipan" backLabel="返回排盘导航" />
      <form className="luoji-form" onSubmit={onSubmit}>
        <PaipanSectionCard variant="form" labelledBy="luoji-base-heading">
          <div className="form-card-heading"><span>01</span><h3 id="luoji-base-heading">起盘信息</h3></div>
          <div className="form-field picker-field"><SolarDateTimePicker subject="起盘" value={draft.chartDateTime} onChange={(value) => update("chartDateTime", value)} /></div>
          <label className="form-field luoji-question"><span>占问事项 <small>选填，限80字</small></span><textarea maxLength={80} value={draft.question} onChange={(event) => update("question", event.target.value)} placeholder="填写想要研究的事项" /><em>{draft.question.length}/80</em></label>
        </PaipanSectionCard>

        <PaipanSectionCard variant="form" labelledBy="luoji-mode-heading">
          <div className="form-card-heading"><span>02</span><h3 id="luoji-mode-heading">选择起盘方式</h3></div>
          <div className="luoji-mode-grid">{MODES.map((mode) => { const Icon = mode.icon; return <button type="button" key={mode.key} className={draft.mode === mode.key ? "active" : ""} aria-pressed={draft.mode === mode.key} onClick={() => { cancelToss(); update("mode", mode.key); setError(null); }}><Icon size={24} weight="duotone" aria-hidden="true" /><span><strong>{mode.label}</strong><small>{mode.note}</small></span></button>; })}</div>

          {draft.mode === "coins" && <div className="luoji-coin-panel">
            <div className="luoji-back-sequence" aria-label="六次铜钱背数">{LINE_LABELS.map((label, index) => { const value = draft.coinBacks[index]; const filled = value !== undefined; const current = index === draft.coinBacks.length; const complete = draft.coinBacks.length >= 6; const actionLabel = complete ? `${label}背数${value}` : current ? `${label}未填写，点击摇此爻` : filled ? `${label}背数${value}，点击摇下一爻` : `${label}未填写，点击继续摇盘`; return <button type="button" key={label} className={`${filled ? "filled" : ""}${current ? " current" : ""}`} aria-label={actionLabel} disabled={isTossing || complete} onClick={tossCoins}><small>{label}</small><strong>{value ?? "—"}</strong></button>; })}</div>
            <button className={`luoji-toss${isTossing ? " is-tossing" : ""}`} type="button" disabled={isTossing || draft.coinBacks.length >= 6} onClick={tossCoins}><span className="luoji-coins" aria-hidden="true"><i>易</i><i>朴</i><i>币</i></span><strong>{isTossing ? "铜钱摇动中…" : draft.coinBacks.length >= 6 ? "六爻已完成" : `点击摇铜钱 · 第 ${draft.coinBacks.length + 1} 爻`}</strong></button>
            <p>点击“摇铜钱”模拟三枚铜钱；摇动结束后，自动把背数 0–3 填入当前爻位。</p>
            <span className="sr-only" role="status" aria-live="polite">{tossAnnouncement}</span>
          </div>}

          {draft.mode === "names" && <div className="luoji-name-grid"><WheelSelectPicker label="本卦" value={draft.originalHexagram} options={HEXAGRAM_OPTIONS} onChange={(value) => update("originalHexagram", value)} /><span>变</span><WheelSelectPicker label="变卦" value={draft.changedHexagram} options={HEXAGRAM_OPTIONS} onChange={(value) => update("changedHexagram", value)} /></div>}

          {draft.mode === "backs" && <div className="luoji-backs-panel"><label><span>六次硬币背数</span><input inputMode="numeric" maxLength={6} value={draft.coinBacks} onChange={(event) => update("coinBacks", event.target.value.replace(/[^0-3]/g, "").slice(0, 6))} placeholder="例如：312101" /></label><div className="luoji-back-help"><strong>填写顺序</strong><span>初爻 → 二爻 → 三爻 → 四爻 → 五爻 → 上爻</span><small>无背面记 0，一个记 1，两个记 2，三个记 3。</small></div></div>}

          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="luoji-form-actions"><button type="button" disabled={isTossing} onClick={clearCurrent}><Trash size={18} aria-hidden="true" />重新起盘</button><button type="submit" disabled={submitting || isTossing}>{submitting ? "正在排盘…" : "立即排盘"}</button></div>
        </PaipanSectionCard>
      </form>
      <p className="culture-notice form-notice">传统文化研究与娱乐参考，请理性看待推演结果</p>
    </PaipanPageShell>
  );
}
