import type { ReactNode } from "react";

type GlassPanelProps = {
  children: ReactNode;
  className?: string;
};

export function GlassPanel({ children, className = "" }: GlassPanelProps) {
  return (
    <div
      className={`rounded-[2px] border border-[#424754]/30 bg-[#181c23]/80 backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}