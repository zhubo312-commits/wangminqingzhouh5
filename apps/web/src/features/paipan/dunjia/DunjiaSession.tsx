import type { DunjiaChartRequest, DunjiaChartResponse } from "@guoxue/contracts";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { fetchDunjiaContext } from "../../../lib/api-client";
import { usePaipanSessionRestore } from "../../../hooks/usePaipanSessionRestore";

export type DunjiaDateMode = "solar" | "lunar";

export interface DunjiaDraft {
  mode: DunjiaDateMode;
  solarDateTime: string;
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  lunarHour: number;
  lunarMinute: number;
  lunarLeapMonth: boolean;
}

function localDateTimeValue() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

const initialDraft: DunjiaDraft = {
  mode: "solar",
  solarDateTime: localDateTimeValue(),
  lunarYear: 2026,
  lunarMonth: 6,
  lunarDay: 29,
  lunarHour: 12,
  lunarMinute: 0,
  lunarLeapMonth: false,
};

interface DunjiaSessionValue {
  draft: DunjiaDraft;
  setDraft: Dispatch<SetStateAction<DunjiaDraft>>;
  chart: DunjiaChartResponse | null;
  chartRequest: DunjiaChartRequest | null;
  paipanRef: string | null;
  isRestoring: boolean;
  setResult: (
    chart: DunjiaChartResponse,
    request: DunjiaChartRequest,
    paipanRef: string,
  ) => void;
}

const DunjiaSessionContext = createContext<DunjiaSessionValue | null>(null);
const STORAGE_KEY = "guoxue.paipan.dunjia_ref.v1";

export function DunjiaSessionProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState(initialDraft);
  const [chart, setChart] = useState<DunjiaChartResponse | null>(null);
  const [chartRequest, setChartRequest] = useState<DunjiaChartRequest | null>(null);
  const [paipanRef, setPaipanRef] = useState<string | null>(null);
  const { isRestoring, rememberReference } = usePaipanSessionRestore({
    storageKey: STORAGE_KEY,
    fetchContext: fetchDunjiaContext,
    onRestore(context) {
      setChart(context.chart);
      setChartRequest(context.chartRequest);
      setPaipanRef(context.paipan_ref);
    },
  });

  const value = useMemo<DunjiaSessionValue>(() => ({
    draft,
    setDraft,
    chart,
    chartRequest,
    paipanRef,
    isRestoring,
    setResult(nextChart, request, nextReference) {
      setChart(nextChart);
      setChartRequest(request);
      setPaipanRef(nextReference);
      rememberReference(nextReference);
    },
  }), [chart, chartRequest, draft, isRestoring, paipanRef, rememberReference]);

  return <DunjiaSessionContext.Provider value={value}>{children}</DunjiaSessionContext.Provider>;
}

export function useDunjiaSession() {
  const value = useContext(DunjiaSessionContext);
  if (!value) throw new Error("DunjiaSessionProvider is missing");
  return value;
}
