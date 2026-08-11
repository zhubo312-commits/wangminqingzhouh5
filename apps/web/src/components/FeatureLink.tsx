import { ArrowRight } from "@phosphor-icons/react";
import type { AnalyticsEvent } from "@guoxue/contracts";
import type { ComponentType, SVGProps } from "react";
import { Link } from "react-router-dom";
import { trackEvent } from "../lib/api-client";

interface FeatureLinkProps {
  title: string;
  description: string;
  href: string | null;
  event: AnalyticsEvent;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  primary?: boolean;
  internal?: boolean;
}

export function FeatureLink({
  title,
  description,
  href,
  event,
  icon: FeatureIcon,
  primary = false,
  internal = false,
}: FeatureLinkProps) {
  const className = `feature-card${primary ? " feature-card-primary" : ""}${href ? "" : " feature-card-disabled"}`;
  const content = (
    <>
      <span className="feature-icon" aria-hidden="true">
        <FeatureIcon className="feature-glyph" />
      </span>
      <span className="feature-copy">
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <ArrowRight className="feature-arrow" size={23} weight="bold" aria-hidden="true" />
    </>
  );

  if (!href) {
    return (
      <div className={className} aria-disabled="true" title="该功能即将开放">
        {content}
      </div>
    );
  }

  if (internal) {
    return (
      <Link
        className={className}
        to={href}
        aria-label={`${title}：${description}`}
        onClick={() => {
          void trackEvent(event).catch(() => undefined);
        }}
      >
        {content}
      </Link>
    );
  }

  return (
    <a
      className={className}
      href={href}
      target="_self"
      aria-label={`${title}：${description}`}
      onClick={() => {
        void trackEvent(event).catch(() => undefined);
      }}
    >
      {content}
    </a>
  );
}
