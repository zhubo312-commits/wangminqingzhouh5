import type { LuojiChartRequest } from "@guoxue/contracts";
import { Coins, ListNumbers, ShuffleAngular, Trash } from "@phosphor-icons/react";
import { useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../../components/PageHeader";
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

export function LuojiFormPage() {
  const navigate = useNavigate();
  const { draft, setDraft, setResult } = useLuojiSession();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submissionLock = useRef(false);

  function update<Key extends keyof LuojiDraft>(key: Key, value: LuojiDraft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function tossCoins() {
    if (draft.coinBacks.length >= 6) return;
    const backs = Array.from({ length: 3 }, () => Math.floor(Math.random() * 2)).filter((value) => value === 1).length;
    update("coinBacks", `${draft.coinBacks}${backs}`);
  }

  function clearCurrent() {
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
          <div className="luoji-mode-grid">{MODES.map((mode) => { const Icon = mode.icon; return <button type="button" key={mode.key} className={draft.mode === mode.key ? "active" : ""} aria-pressed={draft.mode === mode.key} onClick={() => { update("mode", mode.key); setError(null); }}><Icon size={24} weight="duotone" aria-hidden="true" /><span><strong>{mode.label}</strong><small>{mode.note}</small></span></button>; })}</div>

          {draft.mode === "coins" && <div className="luoji-coin-panel">
            <div className="luoji-back-sequence" aria-label="六次铜钱背数">{LINE_LABELS.map((label, index) => <span key={label} className={draft.coinBacks[index] !== undefined ? "filled" : ""}><small>{label}</small><strong>{draft.coinBacks[index] ?? "—"}</strong></span>)}</div>
            <button className="luoji-toss" type="button" disabled={draft.coinBacks.length >= 6} onClick={tossCoins}><span className="luoji-coins" aria-hidden="true"><i>易</i><i>朴</i><i>币</i></span><strong>{draft.coinBacks.length >= 6 ? "六爻已完成" : `摇一次铜钱 · 第 ${draft.coinBacks.length + 1} 爻`}</strong></button>
            <p>每次模拟三枚铜钱，背面数量记为 0–3；由初爻起，依次摇到上爻。</p>
          </div>}

          {draft.mode === "names" && <div className="luoji-name-grid"><label><span>本卦</span><select value={draft.originalHexagram} onChange={(event) => update("originalHexagram", event.target.value)}>{LUOJI_HEXAGRAM_NAMES.map((name) => <option key={name} value={name}>{name}</option>)}</select></label><span>变</span><label><span>变卦</span><select value={draft.changedHexagram} onChange={(event) => update("changedHexagram", event.target.value)}>{LUOJI_HEXAGRAM_NAMES.map((name) => <option key={name} value={name}>{name}</option>)}</select></label></div>}

          {draft.mode === "backs" && <div className="luoji-backs-panel"><label><span>六次硬币背数</span><input inputMode="numeric" maxLength={6} value={draft.coinBacks} onChange={(event) => update("coinBacks", event.target.value.replace(/[^0-3]/g, "").slice(0, 6))} placeholder="例如：312101" /></label><div className="luoji-back-help"><strong>填写顺序</strong><span>初爻 → 二爻 → 三爻 → 四爻 → 五爻 → 上爻</span><small>无背面记 0，一个记 1，两个记 2，三个记 3。</small></div></div>}

          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="luoji-form-actions"><button type="button" onClick={clearCurrent}><Trash size={18} aria-hidden="true" />重新起盘</button><button type="submit" disabled={submitting}>{submitting ? "正在排盘…" : "立即排盘"}</button></div>
        </PaipanSectionCard>
      </form>
      <p className="culture-notice form-notice">传统文化研究与娱乐参考，请理性看待推演结果</p>
    </PaipanPageShell>
  );
}
