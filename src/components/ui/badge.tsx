// src/components/ui/badge.tsx

import * as React from "react"
import { clsx } from 'clsx'

// Clean Slate: Removed cva and Tailwind variants.

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 
    | "default" 
    | "secondary" 
    | "destructive" 
    | "outline" 
    | "outline-static"
    | "success"
    | "warning"
    | "info"
    | "success-static"
    | "info-static"
    | "default-static"
    | "warning-static"
    | "destructive-static"
    | "secondary-static"
    | "available"
    | "unavailable"
    | "skill-requirement";
  size?: "sm" | "md" | "lg";
  /** Optional icon to display before the text */
  icon?: React.ReactNode;
  /** Optional count or value to display */
  count?: number;
}

function Badge({ className, variant = "default", size = "md", icon, count, children, ...props }: BadgeProps) {
  return (
    <div className={clsx("badge", `badge-${variant}`, `badge-${size}`, className)} {...props}>
      {icon && <span className="badge-icon">{icon}</span>}
      {children}
      {count !== undefined && (
        <span className={clsx("badge-count")}>
          {count}
        </span>
      )}
    </div>
  )
}

export { Badge }