import * as React from "react"
import { cn } from "@/lib/utils/classNames"

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, ...props }, ref) => {
    if (label) {
      return (
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            className={cn(
              "h-4 w-4 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 focus:ring-offset-0",
              className
            )}
            ref={ref}
            {...props}
          />
          <span className="text-sm text-gray-700">{label}</span>
        </label>
      )
    }

    return (
      <input
        type="checkbox"
        className={cn(
          "h-4 w-4 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 focus:ring-offset-0",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }