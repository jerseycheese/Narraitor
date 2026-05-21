import * as React from "react"
import { clsx } from 'clsx'

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={clsx(
          "form-label",
          className
        )}
        {...props}
      />
    )
  }
)
Label.displayName = "Label"

export { Label }