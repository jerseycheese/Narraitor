import * as React from "react"
import { cssClasses } from '@/lib/utils/classNames'

export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  onValueChange?: (value: string) => void
  name?: string
  disabled?: boolean
  orientation?: 'vertical' | 'horizontal'
}

export interface RadioGroupItemProps extends React.InputHTMLAttributes<HTMLInputElement> {
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
          className={cssClasses(
            orientation === 'horizontal' ? "grid-flow-col auto-cols-max" : "grid-flow-row",
            className
          )}
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
      <div>
        <input
          type="radio"
          id={itemId}
          value={value}
          name={context.name}
          checked={context.value === value}
          onChange={() => context.onValueChange?.(value)}
          disabled={context.disabled || props.disabled}
          className={cssClasses(
            className
          )}
          ref={ref}
          {...props}
        />
        {children && (
          <label htmlFor={itemId} >
            {children}
          </label>
        )}
      </div>
    )
  }
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }