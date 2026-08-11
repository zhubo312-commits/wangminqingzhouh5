import type { HomeResponse } from "@guoxue/contracts";
import { useCallback, useEffect, useState } from "react";
import { FeatureLink } from "../../components/FeatureLink";
import {
  InterpretationIcon,
  LearningIcon,
  PaipanIcon,
} from "../../components/GuoxueIcons";
import { HomeSkeleton } from "../../components/HomeSkeleton";
import { QuestionComposer } from "../../components/QuestionComposer";
import { TodayGuide } from "../../components/TodayGuide";
import { fetchHome, trackEvent } from "../../lib/api-client";

export function HomePage() {
  const [data, setData] = useState<HomeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchHome(signal));
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      setError(reason instanceof Error ? reason.message : "首页信息暂时无法加载");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    void trackEvent("home_view").catch(() => undefined);
    return () => controller.abort();
  }, [load]);

  if (loading && !data) return <HomeSkeleton />;

  if (error && !data) {
    return (
      <main className="app-shell flex min-h-[100dvh] items-center justify-center px-5">
        <section className="error-panel" role="alert">
          <span className="eyebrow">国学老师</span>
          <h1>今日内容暂时没有准备好</h1>
          <p>{error}</p>
          <button type="button" onClick={() => void load()}>
            重新加载
          </button>
        </section>
      </main>
    );
  }

  if (!data) return null;

  return (
    <main className="app-shell min-h-[100dvh]">
      <div className="paper-grain" aria-hidden="true" />
      <div className="page-content">
        <TodayGuide data={data} />

        <nav className="feature-list" aria-label="国学功能">
          <FeatureLink
            title="专业排盘"
            description="输入出生信息，查看专业命盘"
            href="/paipan"
            internal
            event="paipan_click"
            icon={PaipanIcon}
            primary
          />
          <FeatureLink
            title="国心解读"
            description="在线解读，查看专属命理报告"
            href={data.links.interpretation}
            event="interpretation_click"
            icon={InterpretationIcon}
          />
          <FeatureLink
            title="学习资料"
            description="领取国学入门与命理学习资料"
            href={data.links.learning}
            event="learning_click"
            icon={LearningIcon}
          />
        </nav>

        <footer>
          <p>历法来源：香港天文台 · 今日指引仅供传统文化参考</p>
        </footer>
      </div>

      <QuestionComposer href={data.links.question} />
    </main>
  );
}
