import type { ShuziGuilvChartRequest, ShuziGuilvChartResponse } from "@guoxue/contracts";
import { createContext, useContext, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { usePaipanSessionRestore } from "../../../hooks/usePaipanSessionRestore";
import { fetchShuziGuilvContext } from "../../../lib/api-client";

function initialDateTime() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 30);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T12:00`;
}

export interface ShuziGuilvDraft { name: string; gender: "male" | "female"; birthDateTime: string }
const initialDraft: ShuziGuilvDraft = { name: "", gender: "male", birthDateTime: initialDateTime() };

interface SessionValue {
  draft: ShuziGuilvDraft;
  setDraft: Dispatch<SetStateAction<ShuziGuilvDraft>>;
  chart: ShuziGuilvChartResponse | null;
  chartRequest: ShuziGuilvChartRequest | null;
  isRestoring: boolean;
  setResult: (chart: ShuziGuilvChartResponse, request: ShuziGuilvChartRequest, paipanRef: string) => void;
}

const Context = createContext<SessionValue | null>(null);

export function ShuziGuilvSessionProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState(initialDraft);
  const [chart, setChart] = useState<ShuziGuilvChartResponse | null>(null);
  const [chartRequest, setChartRequest] = useState<ShuziGuilvChartRequest | null>(null);
  const { isRestoring, rememberReference } = usePaipanSessionRestore({
    storageKey: "guoxue.paipan.shuzi_guilv_ref.v1",
    fetchContext: fetchShuziGuilvContext,
    onRestore(value) { setChart(value.chart); setChartRequest(value.chartRequest); },
  });
  const value = useMemo<SessionValue>(() => ({
    draft, setDraft, chart, chartRequest, isRestoring,
    setResult(nextChart, request, paipanRef) { setChart(nextChart); setChartRequest(request); rememberReference(paipanRef); },
  }), [chart, chartRequest, draft, isRestoring, rememberReference]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useShuziGuilvSession() {
  const value = useContext(Context);
  if (!value) throw new Error("ShuziGuilvSessionProvider is missing");
  return value;
}
