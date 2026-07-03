import * as React from "react"
import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded", className)}
      style={{ background: "var(--surface2)" }}
      {...props}
    />
  );
}

export { Skeleton }
