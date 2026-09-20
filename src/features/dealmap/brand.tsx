import type { CSSProperties } from "react";
import type { Deal } from "./data";
import { cn } from "~/lib/cn";
export function Brand({
  deal,
  small = false,
}: {
  deal: Deal;
  small?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("brand-mark", `brand-${deal.id}`, small && "small")}
      style={
        {
          "--brand": deal.color,
          "--brand-ink": deal.ink || "#fff",
        } as CSSProperties
      }
    >
      {deal.mark}
    </span>
  );
}
