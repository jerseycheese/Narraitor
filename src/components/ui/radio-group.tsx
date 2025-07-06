import * as React from "react"
import { cn } from "@/lib/utils/classNames"

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
          className={cn(
            "grid gap-2",
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
      <div className="flex items-center space-x-2">
        <input
          type="radio"
          id={itemId}
          value={value}
          name={context.name}
          checked={context.value === value}
          onChange={() => context.onValueChange?.(value)}
          disabled={context.disabled || props.disabled}
          className={cn(
            "h-4 w-4 rounded-full border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 focus:ring-offset-0",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            className
          )}
          ref={ref}
          {...props}
        />
        {children && (
          <label htmlFor={itemId} className="text-sm text-gray-700 cursor-pointer">
            {children}
          </label>
        )}
      </div>
    )
  }
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }