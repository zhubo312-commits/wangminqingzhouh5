import type { JueceChartRequest, JueceChartResponse } from "@guoxue/contracts";
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
import { fetchJueceContext } from "../../../lib/api-client";

export interface JueceDraft {
  dateMode: "solar" | "lunar";
  solarDateTime: string;
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  lunarHour: number;
  lunarMinute: number;
  lunarLeapMonth: boolean;
  timeMode: "standard" | "true_solar";
  areaCode: string;
  panStyle: "rotating" | "flying";
  directionRule: "yang_forward_yin_reverse" | "all_forward";
  bureauMethod: "chai_bu" | "zhi_run" | "mao_shan" | "manual";
  manualDunType: "yin" | "yang";
  manualNumber: number;
  voidBasis: "hour" | "day" | "month" | "year";
  centerPalaceMethod: "kun" | "yang_gen_yin_kun" | "four_corners" | "seasonal";
}

function localDateTimeValue() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

const initialDraft: JueceDraft = {
  dateMode: "solar",
  solarDateTime: localDateTimeValue(),
  lunarYear: 2026,
  lunarMonth: 6,
  lunarDay: 29,
  lunarHour: 16,
  lunarMinute: 0,
  lunarLeapMonth: false,
  timeMode: "standard",
  areaCode: "110105",
  panStyle: "rotating",
  directionRule: "yang_forward_yin_reverse",
  bureauMethod: "chai_bu",
  manualDunType: "yin",
  manualNumber: 5,
  voidBasis: "hour",
  centerPalaceMethod: "kun",
};

interface JueceSessionValue {
  draft: JueceDraft;
  setDraft: Dispatch<SetStateAction<JueceDraft>>;
  chart: JueceChartResponse | null;
  chartRequest: JueceChartRequest | null;
  paipanRef: string | null;
  isRestoring: boolean;
  setResult: (
    chart: JueceChartResponse,
    request: JueceChartRequest,
    paipanRef: string,
  ) => void;
}

const JueceSessionContext = createContext<JueceSessionValue | null>(null);
const STORAGE_KEY = "guoxue.paipan.shijia_juece_ref.v1";

export function JueceSessionProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState(initialDraft);
  const [chart, setChart] = useState<JueceChartResponse | null>(null);
  const [chartRequest, setChartRequest] = useState<JueceChartRequest | null>(null);
  const [paipanRef, setPaipanRef] = useState<string | null>(null);
  const { isRestoring, rememberReference } = usePaipanSessionRestore({
    storageKey: STORAGE_KEY,
    fetchContext: fetchJueceContext,
    onRestore(context) {
      setChart(context.chart);
      setChartRequest(context.chartRequest);
      setPaipanRef(context.paipan_ref);
    },
  });

  const value = useMemo<JueceSessionValue>(() => ({
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

  return <JueceSessionContext.Provider value={value}>{children}</JueceSessionContext.Provider>;
}

export function useJueceSession() {
  const value = useContext(JueceSessionContext);
  if (!value) throw new Error("JueceSessionProvider is missing");
  return value;
}
