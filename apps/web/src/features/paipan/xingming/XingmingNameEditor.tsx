import type { XingmingChartRequest } from "@guoxue/contracts";
import { Info } from "@phosphor-icons/react";
import { useRef, useState } from "react";
import { PaipanActionButton } from "../../../components/paipan/PaipanActionButton";
import { createXingmingChart } from "../../../lib/api-client";
import { CompositionSafeNameInput } from "./CompositionSafeNameInput";
import { useXingmingSession } from "./XingmingSession";

const HAN = /^\p{Script=Han}+$/u;

export function XingmingNameEditor({ surname: currentSurname, givenName: currentGivenName, school }: { surname: string; givenName: string; school: XingmingChartRequest["school"] }) {
  const { setDraft, setResult } = useXingmingSession();
  const [open, setOpen] = useState(false);
  const [surname, setSurname] = useState(currentSurname);
  const [givenName, setGivenName] = useState(currentGivenName);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);

  function openEditor() {
    setSurname(currentSurname);
    setGivenName(currentGivenName);
    setError(null);
    setOpen(true);
  }

  function closeEditor() {
    if (submitting) return;
    setError(null);
    setOpen(false);
  }

  async function submit() {
    if (lock.current) return;
    const nextSurname = surname.trim();
    const nextGivenName = givenName.trim();
    if (!HAN.test(nextSurname) || [...nextSurname].length > 2) { setError("姓氏请填写 1 至 2 个汉字"); return; }
    if (!HAN.test(nextGivenName) || [...nextGivenName].length > (school === "liuge" ? 2 : 3)) { setError(school === "liuge" ? "六格名字请填写 1 至 2 个汉字" : "名字请填写 1 至 3 个汉字"); return; }

    lock.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const request: XingmingChartRequest = { surname: nextSurname, givenName: nextGivenName, school };
      const response = await createXingmingChart(request);
      const { paipan_ref: reference, expiresAt: _expiresAt, ...chart } = response;
      setDraft(request);
      setResult(chart, request, reference);
      setOpen(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "姓名学排盘失败，请稍后重试");
    } finally {
      lock.current = false;
      setSubmitting(false);
    }
  }

  return <div className="xingming-name-adjustment">
    {!open && <PaipanActionButton variant="edit" className="xingming-name-adjust-trigger" aria-expanded="false" aria-controls="xingming-name-editor" onClick={openEditor}>调整姓名</PaipanActionButton>}
    {open && <div className="xingming-name-editor" id="xingming-name-editor">
      <div className="xingming-adjust-fields">
        <label className="form-field"><span>姓氏</span><CompositionSafeNameInput value={surname} maxCharacters={2} autoComplete="family-name" onValueChange={setSurname} /></label>
        <label className="form-field"><span>名字</span><CompositionSafeNameInput value={givenName} maxCharacters={school === "liuge" ? 2 : 3} autoComplete="given-name" onValueChange={setGivenName} /></label>
      </div>
      <p className="xingming-adjust-tip"><Info size={15} aria-hidden="true" />若自动拆分不准确，可手动调整姓氏和名字后重新排盘。</p>
      {error && <div className="form-error" role="alert" aria-live="polite">{error}</div>}
      <div className="xingming-adjust-actions"><button className="xingming-adjust-cancel" type="button" disabled={submitting} onClick={closeEditor}>取消</button><button className="xingming-adjust-submit" type="button" disabled={submitting} aria-busy={submitting} onClick={() => void submit()}>{submitting ? "正在排盘…" : "重新排盘"}</button></div>
    </div>}
  </div>;
}
