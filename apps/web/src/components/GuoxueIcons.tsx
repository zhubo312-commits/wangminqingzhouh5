import type { SVGProps } from "react";

type GuoxueIconProps = SVGProps<SVGSVGElement>;

const sharedProps = {
  viewBox: "0 0 32 32",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
} as const;

export function PaipanIcon(props: GuoxueIconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.65"
      >
        <circle cx="16" cy="16" r="12.6" />
        <circle cx="16" cy="16" r="9.35" opacity="0.72" />
        <circle cx="16" cy="16" r="3.25" />
        <path d="M16 3.4v3.2M28.6 16h-3.2M16 28.6v-3.2M3.4 16h3.2" strokeWidth="1.95" />
        <path d="M8.55 8.55l1.35 1.35M23.45 8.55 22.1 9.9M23.45 23.45l-1.35-1.35M8.55 23.45 9.9 22.1" opacity="0.7" />
        <path d="m14.25 17.75-5.1 5.1 3-7.1 2.1 2Z" fill="currentColor" strokeWidth="1.2" />
      </g>
      <path
        d="m17.75 14.25 5.1-5.1-3 7.1-2.1-2Z"
        fill="var(--feature-icon-accent, #b77924)"
        stroke="var(--feature-icon-accent, #b77924)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
      <circle cx="16" cy="16" r="1.15" fill="var(--feature-icon-accent, #b77924)" />
    </svg>
  );
}

export function InterpretationIcon(props: GuoxueIconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <circle
        cx="16"
        cy="16"
        r="12.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M16 3.5c-5.1 0-7.75 3.35-7.75 6.65S10.9 16 16 16s7.75 2.55 7.75 5.85S21.1 28.5 16 28.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <circle cx="16" cy="9.75" r="1.55" fill="currentColor" />
      <circle cx="16" cy="22.25" r="1.55" fill="var(--feature-icon-accent, #b77924)" />
      <path
        d="M5.8 15.9h2.35M23.85 15.9h2.35"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
        opacity="0.68"
      />
    </svg>
  );
}

export function LearningIcon(props: GuoxueIconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      >
        <path d="M4.5 6.85c4.3-1.1 8.15-.35 11.5 2.15v17.1c-3.25-2.35-7.1-2.9-11.5-1.45V6.85Z" />
        <path d="M27.5 6.85C23.2 5.75 19.35 6.5 16 9v17.1c3.25-2.35 7.1-2.9 11.5-1.45V6.85Z" />
        <path d="M4.5 22.35c4.35-1.2 8.2-.45 11.5 2.05 3.3-2.5 7.15-3.25 11.5-2.05" opacity="0.68" />
      </g>
      <path
        d="M21.3 6.5v7.65l2.05-1.65 2.05 1.65V6.1"
        stroke="var(--feature-icon-accent, #b77924)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}
