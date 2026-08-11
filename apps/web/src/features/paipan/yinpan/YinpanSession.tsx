import type { YinpanChartRequest, YinpanChartResponse } from "@guoxue/contracts";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { usePaipanSessionRestore } from "../../../hooks/usePaipanSessionRestore";
import { fetchYinpanContext } from "../../../lib/api-client";

function localDateTimeValue() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export interface YinpanDraft {
  chartDateTime: string;
  gender: "male" | "female";
  question: string;
  mode: "time" | "ke";
  lifetime: boolean;
}

const initialDraft: YinpanDraft = {
  chartDateTime: localDateTimeValue(),
  gender: "male",
  question: "",
  mode: "time",
  lifetime: false,
};

interface YinpanSessionValue {
  draft: YinpanDraft;
  setDraft: Dispatch<SetStateAction<YinpanDraft>>;
  chart: YinpanChartResponse | null;
  chartRequest: YinpanChartRequest | null;
  isRestoring: boolean;
  setResult: (chart: YinpanChartResponse, request: YinpanChartRequest, paipanRef: string) => void;
}

const YinpanSessionContext = createContext<YinpanSessionValue | null>(null);
const STORAGE_KEY = "guoxue.paipan.yinpan_juece_ref.v1";

export function YinpanSessionProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState(initialDraft);
  const [chart, setChart] = useState<YinpanChartResponse | null>(null);
  const [chartRequest, setChartRequest] = useState<YinpanChartRequest | null>(null);
  const { isRestoring, rememberReference } = usePaipanSessionRestore({
    storageKey: STORAGE_KEY,
    fetchContext: fetchYinpanContext,
    onRestore(context) {
      setChart(context.chart);
      setChartRequest(context.chartRequest);
    },
  });

  const value = useMemo<YinpanSessionValue>(() => ({
    draft,
    setDraft,
    chart,
    chartRequest,
    isRestoring,
    setResult(nextChart, request, paipanRef) {
      setChart(nextChart);
      setChartRequest(request);
      rememberReference(paipanRef);
    },
  }), [chart, chartRequest, draft, isRestoring, rememberReference]);

  return <YinpanSessionContext.Provider value={value}>{children}</YinpanSessionContext.Provider>;
}

export function useYinpanSession() {
  const value = useContext(YinpanSessionContext);
  if (!value) throw new Error("YinpanSessionProvider is missing");
  return value;
}
