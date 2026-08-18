import { BookOpen } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../../components/PageHeader";
import { PaipanActionButton } from "../../../components/paipan/PaipanActionButton";
import { PaipanEmptyState } from "../../../components/paipan/PaipanEmptyState";
import { PaipanPageShell } from "../../../components/paipan/PaipanPageShell";
import { PaipanSectionCard } from "../../../components/paipan/PaipanSectionCard";
import {
  XingmingCharacterReferenceList,
  XingmingNameCharacterGroups,
} from "../xingming/XingmingCharacterDetails";
import { useXingmingSession } from "../xingming/XingmingSession";

function ResultShell({ children }: { children: ReactNode }) {
  return (
    <PaipanPageShell pageClassName="result-page kangxi-result-page">
      <PageHeader title="康熙字典" backTo="/paipan/kangxi" backLabel="返回康熙字典查询" />
      {children}
    </PaipanPageShell>
  );
}

export function KangxiResultPage() {
  const navigate = useNavigate();
  const { chart, isRestoring } = useXingmingSession();

  if (isRestoring) {
    return (
      <ResultShell>
        <PaipanEmptyState icon={<BookOpen size={46} />} title="正在恢复查字结果" />
      </ResultShell>
    );
  }

  if (!chart) {
    return (
      <ResultShell>
        <PaipanEmptyState
          icon={<BookOpen size={46} />}
          title="本次查字结果已失效"
          description="查询引用不存在、版本已升级或已过期，请重新查询。"
          action={<PaipanActionButton variant="restart" onClick={() => navigate("/paipan/kangxi")}>重新查询</PaipanActionButton>}
        />
      </ResultShell>
    );
  }

  return (
    <ResultShell>
      <PaipanSectionCard className="kangxi-overview-card" labelledBy="kangxi-overview-heading">
        <div className="kangxi-result-heading">
          <span>姓名用字</span>
          <h2 id="kangxi-overview-heading">{chart.name.fullName}</h2>
          <p>共查询 {chart.characters.length} 个字，以下展示逐字用字信息。</p>
        </div>
        <XingmingNameCharacterGroups chart={chart} />
      </PaipanSectionCard>

      <PaipanSectionCard className="kangxi-character-detail-card" labelledBy="kangxi-character-heading">
        <h2 className="result-section-title" id="kangxi-character-heading"><span>01</span>逐字用字参考</h2>
        <XingmingCharacterReferenceList characters={chart.characters} open />
      </PaipanSectionCard>

      <div className="kangxi-result-actions">
        <PaipanActionButton variant="restart" className="kangxi-restart" onClick={() => navigate("/paipan/kangxi")}>重新查询</PaipanActionButton>
      </div>
      <p className="culture-notice">字库信息仅供传统文化与姓名用字参考</p>
    </ResultShell>
  );
}
