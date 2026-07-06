import * as React from "react"
import { clsx } from 'clsx'
import './radio-group.css'

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  onValueChange?: (value: string) => void
  name?: string
  disabled?: boolean
  orientation?: 'vertical' | 'horizontal'
}

interface RadioGroupItemProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string
  id?: string
  children?: React.ReactNode
}

const RadioGroupContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
  name?: string
  disabled?: boolean
}>({})

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, onValueChange, name, disabled, orientation = 'vertical', ...props }, ref) => {
    const contextValue = React.useMemo(() => ({
      value,
      onValueChange,
      name,
      disabled,
    }), [value, onValueChange, name, disabled])

    return (
      <RadioGroupContext.Provider value={contextValue}>
        <div
          className={clsx("radio-group", className)}
          data-orientation={orientation}
          role="radiogroup"
          ref={ref}
          {...props}
        />
      </RadioGroupContext.Provider>
    )
  }
)
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, id, children, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext)
    const itemId = id || `radio-${value}`

    return (
      <div className="radio-option">
        <input
          type="radio"
          id={itemId}
          value={value}
          name={context.name}
          checked={context.value === value}
          onChange={() => context.onValueChange?.(value)}
          disabled={context.disabled || props.disabled}
          className={clsx("radio-item", className)}
          ref={ref}
          {...props}
        />
        {children && (
          <label htmlFor={itemId} className="radio-label">
            {children}
          </label>
        )}
      </div>
    )
  }
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
