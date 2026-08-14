import type { XingmingChartRequest } from "@guoxue/contracts";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../../components/PageHeader";
import { PaipanPageShell } from "../../../components/paipan/PaipanPageShell";
import { PaipanSectionCard } from "../../../components/paipan/PaipanSectionCard";
import { createXingmingChart } from "../../../lib/api-client";
import { CompositionSafeNameInput } from "./CompositionSafeNameInput";
import { useXingmingSession, type XingmingDraft } from "./XingmingSession";
import { splitChineseFullName } from "./surname-dictionary";

const HAN = /^\p{Script=Han}+$/u;

export function XingmingFormPage() {
  const navigate = useNavigate();
  const { draft, setDraft, setResult } = useXingmingSession();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const update = <Key extends keyof XingmingDraft>(key: Key, value: XingmingDraft[Key]) => setDraft((current) => ({ ...current, [key]: value }));
  const fullName = `${draft.surname}${draft.givenName}`;

  function updateFullName(value: string) {
    const name = splitChineseFullName(value);
    setDraft((current) => ({ ...current, ...name }));
  }

  async function submit() {
    if (lock.current) return;
    const surname = draft.surname.trim();
    const givenName = draft.givenName.trim();
    if (!HAN.test(surname) || [...surname].length > 2) { setError("姓氏请填写 1 至 2 个汉字"); return; }
    if (!HAN.test(givenName) || [...givenName].length > (draft.school === "liuge" ? 2 : 3)) { setError(draft.school === "liuge" ? "六格名字请填写 1 至 2 个汉字" : "名字请填写 1 至 3 个汉字"); return; }
    lock.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const request: XingmingChartRequest = { surname, givenName, school: draft.school };
      const response = await createXingmingChart(request);
      const { paipan_ref: reference, expiresAt: _expiresAt, ...chart } = response;
      setResult(chart, request, reference);
      navigate("/paipan/xingming/result");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "姓名学排盘失败，请稍后重试"); }
    finally { lock.current = false; setSubmitting(false); }
  }

  return <PaipanPageShell pageClassName="form-page xingming-form-page">
    <PageHeader title="姓名学" backTo="/paipan" backLabel="返回排盘导航" />
    <div className="xingming-form">
      <PaipanSectionCard variant="form" labelledBy="xingming-info-heading">
        <div className="form-card-heading"><span>01</span><h3 id="xingming-info-heading">姓名与流派</h3></div>
        <label className="form-field xingming-full-name-field"><span>姓名</span><CompositionSafeNameInput value={fullName} maxCharacters={5} autoComplete="name" placeholder="例如：李明" onValueChange={updateFullName} /></label>
        <fieldset className="form-field juece-choice-field"><legend>计算流派</legend><div className="segment-control xingming-school-tabs"><button type="button" className={draft.school === "wuge" ? "active" : ""} aria-pressed={draft.school === "wuge"} onClick={() => update("school", "wuge")}><strong>三才五格</strong><small>传统五格结构</small></button><button type="button" className={draft.school === "liuge" ? "active" : ""} aria-pressed={draft.school === "liuge"} onClick={() => update("school", "liuge")}><strong>三才六格</strong><small>增加变格判断</small></button></div></fieldset>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="submit-chart" type="button" disabled={submitting} onClick={() => void submit()}>{submitting ? "正在排盘…" : "开始排盘"}</button>
      </PaipanSectionCard>
    </div>
    <p className="culture-notice form-notice">传统文化研究与娱乐参考，请理性看待推演结果</p>
  </PaipanPageShell>;
}
