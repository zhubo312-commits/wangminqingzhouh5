import type { XingmingChartRequest } from "@guoxue/contracts";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../../components/PageHeader";
import { PaipanPageShell } from "../../../components/paipan/PaipanPageShell";
import { PaipanSectionCard } from "../../../components/paipan/PaipanSectionCard";
import { createXingmingChart } from "../../../lib/api-client";
import { CompositionSafeNameInput } from "../xingming/CompositionSafeNameInput";
import { useXingmingSession } from "../xingming/XingmingSession";
import { splitChineseFullName } from "../xingming/surname-dictionary";

const HAN = /^\p{Script=Han}+$/u;

export function KangxiFormPage() {
  const navigate = useNavigate();
  const { draft, setDraft, setResult } = useXingmingSession();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const fullName = `${draft.surname}${draft.givenName}`;

  function updateFullName(value: string) {
    const name = splitChineseFullName(value);
    setDraft((current) => ({ ...current, ...name, school: "wuge" }));
  }

  async function submit() {
    if (lock.current) return;
    const surname = draft.surname.trim();
    const givenName = draft.givenName.trim();
    const normalizedFullName = `${surname}${givenName}`;
    const fullNameLength = Array.from(normalizedFullName).length;

    if (!HAN.test(normalizedFullName) || fullNameLength < 2 || fullNameLength > 5) {
      setError("姓名请填写 2 至 5 个汉字");
      return;
    }
    if (!HAN.test(surname) || Array.from(surname).length > 2) {
      setError("姓氏请填写 1 至 2 个汉字");
      return;
    }
    if (!HAN.test(givenName) || Array.from(givenName).length > 3) {
      setError("名字请填写 1 至 3 个汉字");
      return;
    }

    lock.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const request: XingmingChartRequest = { surname, givenName, school: "wuge" };
      const response = await createXingmingChart(request);
      const { paipan_ref: reference, expiresAt: _expiresAt, ...chart } = response;
      setResult(chart, request, reference);
      navigate("/paipan/kangxi/result");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "康熙字典查询失败，请稍后重试");
    } finally {
      lock.current = false;
      setSubmitting(false);
    }
  }

  return (
    <PaipanPageShell pageClassName="form-page kangxi-form-page">
      <PageHeader title="康熙字典" backTo="/paipan" backLabel="返回排盘导航" />
      <div className="kangxi-form">
        <PaipanSectionCard variant="form" labelledBy="kangxi-query-heading">
          <div className="form-card-heading"><span>01</span><h3 id="kangxi-query-heading">姓名查字</h3></div>
          <p className="kangxi-form-intro">输入姓名，查看每个字的繁体、拼音、部首、康熙笔画与取名含义。</p>
          <label className="form-field kangxi-full-name-field">
            <span>姓名</span>
            <CompositionSafeNameInput
              value={fullName}
              maxCharacters={5}
              autoComplete="name"
              placeholder="例如：李明"
              onValueChange={updateFullName}
            />
          </label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="submit-chart" type="button" disabled={submitting} onClick={() => void submit()}>
            {submitting ? "正在查询…" : "查询姓名用字"}
          </button>
        </PaipanSectionCard>
      </div>
      <p className="culture-notice form-notice">字库信息仅供传统文化与姓名用字参考</p>
    </PaipanPageShell>
  );
}
