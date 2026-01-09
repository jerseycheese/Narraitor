// src/components/ui/badge.tsx

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:
          "border-transparent bg-muted text-muted-foreground hover:bg-muted/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "text-foreground border border-border bg-background hover:bg-muted",
        "outline-static": "text-foreground border border-border bg-background",
        // Entity badge variants
        success: "border-transparent bg-success text-success-foreground hover:bg-success/90",
        warning: "border-transparent bg-warning text-warning-foreground hover:bg-warning/90",
        info: "border-transparent bg-info text-info-foreground hover:bg-info/90",
        // Static entity badge variants (no hover states)
        "success-static": "border-transparent bg-success text-success-foreground",
        "info-static": "border-transparent bg-info text-info-foreground",
        "default-static": "border-transparent bg-secondary text-secondary-foreground",
        "warning-static": "border-transparent bg-warning text-warning-foreground",
        "destructive-static": "border-transparent bg-destructive text-destructive-foreground",
        "secondary-static": "border-transparent bg-muted text-muted-foreground",
        // Skill requirement variants
        available: "border-transparent bg-success/20 text-success hover:bg-success/30",
        unavailable: "border-transparent bg-destructive/10 text-destructive hover:bg-destructive/20",
        "skill-requirement": "border border-border bg-muted text-muted-foreground",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Optional icon to display before the text */
  icon?: React.ReactNode;
  /** Optional count or value to display */
  count?: number;
}

function Badge({ className, variant, size, icon, count, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {icon && <span className="mr-1">{icon}</span>}
      {children}
      {count !== undefined && (
        <span className={cn("ml-1", count > 0 ? "font-bold" : "opacity-70")}>
          {count}
        </span>
      )}
    </div>
  )
}

export { Badge, badgeVariants }
