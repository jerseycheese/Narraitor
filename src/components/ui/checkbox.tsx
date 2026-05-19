import * as React from "react"
import { clsx } from 'clsx'

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, ...props }, ref) => {
    if (label) {
      return (
        <label>
          <input
            type="checkbox"
            className={clsx(
              className
            )}
            ref={ref}
            {...props}
          />
          <span>{label}</span>
        </label>
      )
    }

    return (
      <input
        type="checkbox"
        className={clsx(
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