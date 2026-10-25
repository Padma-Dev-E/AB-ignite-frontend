import type { ReactNode } from "react";

export type CommunityFeedIconName = "announcement" | "book" | "flag" | "idea" | "trophy";

const iconPaths: Record<CommunityFeedIconName, string> = {
  announcement: "M4 11V7a1 1 0 0 1 1-1h3l9-3v18l-9-3H5a1 1 0 0 1-1-1v-4m4-1 2 7m7-14 4-2v12l-4-2",
  book: "M5 4.5A2.5 2.5 0 0 1 7.5 2H20v18H7.5A2.5 2.5 0 0 0 5 22zm0 0V22M8 6h8m-8 4h8",
  flag: "M5 21V4m0 1h13l-2.5 3L18 11H5",
  idea: "M9 18h6m-5 4h4m-4-7a6 6 0 1 1 4 0c-.7.5-1 1.1-1 2h-2c0-.9-.3-1.5-1-2z",
  trophy: "M8 21h8m-4-4v4m-6-18h12v5a6 6 0 0 1-12 0zm0 2H3v2a4 4 0 0 0 4 4m10-6h4v2a4 4 0 0 1-4 4",
};

const iconColors: Record<CommunityFeedIconName, string> = {
  announcement: "#d97706",
  book: "#6d4bd8",
  flag: "#1e5eff",
  idea: "#1e5eff",
  trophy: "#0e9f7a",
};

export function CommunityFeedIcon({ name }: { name: CommunityFeedIconName }) {
  const color = iconColors[name];
  return (
    <span
      aria-hidden="true"
      className="grid h-10 w-10 shrink-0 place-items-center rounded-[11px]"
      style={{ color, backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)` }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d={iconPaths[name]} />
      </svg>
    </span>
  );
}

export function CommunityFeedRow({
  icon,
  children,
  trailing,
  isLast = false,
}: {
  icon: CommunityFeedIconName;
  children: ReactNode;
  trailing?: ReactNode;
  isLast?: boolean;
}) {
  return (
    <div className={`flex items-start gap-3.5 border-b border-[var(--line)] py-[18px] ${isLast ? "border-b-0 pb-0" : ""}`}>
      <CommunityFeedIcon name={icon} />
      <div className="min-w-0 flex-1">{children}</div>
      {trailing}
    </div>
  );
}
