import { ChatCircleDots, PaperPlaneTilt } from "@phosphor-icons/react";
import { trackEvent } from "../lib/api-client";

interface QuestionComposerProps {
  href: string | null;
}

export function QuestionComposer({ href }: QuestionComposerProps) {
  const content = (
    <>
      <span className="question-chat-icon" aria-hidden="true">
        <ChatCircleDots size={25} weight="duotone" />
      </span>
      <span className="question-placeholder">有什么问题，问问国学老师…</span>
      <span className="question-send" aria-hidden="true">
        <PaperPlaneTilt size={23} weight="fill" />
      </span>
    </>
  );

  return (
    <div className="question-dock">
      {href ? (
        <a
          className="question-composer"
          href={href}
          target="_self"
          aria-label="问问题：点击输入框开始咨询"
          onClick={() => {
            void trackEvent("question_click").catch(() => undefined);
          }}
        >
          {content}
        </a>
      ) : (
        <div
          className="question-composer question-composer-disabled"
          aria-disabled="true"
          title="该功能即将开放"
        >
          {content}
        </div>
      )}
    </div>
  );
}
