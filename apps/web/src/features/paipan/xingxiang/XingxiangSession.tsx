import type { XingxiangChartRequest, XingxiangChartResponse } from "@guoxue/contracts";
import { createContext, useContext, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { usePaipanSessionRestore } from "../../../hooks/usePaipanSessionRestore";
import { fetchXingxiangContext } from "../../../lib/api-client";

function initialDateTime() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 30);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T12:00`;
}

export interface XingxiangDraft { name: string; gender: "male" | "female"; birthDateTime: string }
const initialDraft: XingxiangDraft = { name: "", gender: "male", birthDateTime: initialDateTime() };

interface XingxiangSessionValue {
  draft: XingxiangDraft;
  setDraft: Dispatch<SetStateAction<XingxiangDraft>>;
  chart: XingxiangChartResponse | null;
  chartRequest: XingxiangChartRequest | null;
  isRestoring: boolean;
  setResult: (chart: XingxiangChartResponse, request: XingxiangChartRequest, paipanRef: string) => void;
}

const Context = createContext<XingxiangSessionValue | null>(null);

export function XingxiangSessionProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState(initialDraft);
  const [chart, setChart] = useState<XingxiangChartResponse | null>(null);
  const [chartRequest, setChartRequest] = useState<XingxiangChartRequest | null>(null);
  const { isRestoring, rememberReference } = usePaipanSessionRestore({
    storageKey: "guoxue.paipan.xingxiang_ref.v1",
    fetchContext: fetchXingxiangContext,
    onRestore(value) { setChart(value.chart); setChartRequest(value.chartRequest); },
  });
  const value = useMemo(() => ({ draft, setDraft, chart, chartRequest, isRestoring, setResult(nextChart: XingxiangChartResponse, request: XingxiangChartRequest, paipanRef: string) { setChart(nextChart); setChartRequest(request); rememberReference(paipanRef); } }), [chart, chartRequest, draft, isRestoring, rememberReference]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useXingxiangSession() {
  const value = useContext(Context);
  if (!value) throw new Error("XingxiangSessionProvider is missing");
  return value;
}
