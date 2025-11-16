// src/components/ui/badge.tsx

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-blue-700 text-white hover:bg-blue-900",
        secondary:
          "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-300",
        destructive:
          "border-transparent bg-destructive text-white hover:bg-destructive/90",
        outline: "text-gray-900 border border-gray-300 bg-white hover:bg-gray-100",
        // Entity badge variants
        success: "border-transparent bg-green-500 text-white hover:bg-green-700",
        warning: "border-transparent bg-amber-500 text-white hover:bg-amber-700",
        info: "border-transparent bg-blue-700 text-white hover:bg-blue-900",
        // Static entity badge variants (no hover states)
        "success-static": "border-transparent bg-green-500 text-white",
        "info-static": "border-transparent bg-blue-700 text-white",
        "default-static": "border-transparent bg-gray-700 text-white",
        "warning-static": "border-transparent bg-amber-500 text-white",
        "destructive-static": "border-transparent bg-destructive text-white",
        "secondary-static": "border-transparent bg-gray-100 text-gray-900",
        // Skill requirement variants
        available: "border-transparent bg-green-200 text-green-700 hover:bg-green-500",
        unavailable: "border-transparent bg-destructive/10 text-destructive hover:bg-destructive/20",
        "skill-requirement": "border border-gray-300 bg-gray-100 text-gray-700",
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