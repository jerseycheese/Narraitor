import * as React from "react"
import { cssClasses } from '@/lib/utils/classNames'

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cssClasses(
          "",
          className
        )}
        {...props}
      />
    )
  }
)
Label.displayName = "Label"

export { Label }