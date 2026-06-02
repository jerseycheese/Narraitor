"use client"

import * as React from "react"
import { clsx } from 'clsx'
import './tabs.css'

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined)

interface TabsProps {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  children: React.ReactNode
}

const Tabs: React.FC<TabsProps> = ({ 
  defaultValue = "", 
  value: controlledValue,
  onValueChange,
  className,
  children 
}) => {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const value = controlledValue ?? uncontrolledValue
  
  const handleValueChange = React.useCallback((newValue: string) => {
    setUncontrolledValue(newValue)
    onValueChange?.(newValue)
  }, [onValueChange])
  
  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div className={clsx('component-tabs', className)}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

const TabsList: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  className, 
  children,
  ...props 
}) => (
  <div
    className={clsx('tabs-list', className)}
    {...props}
  >
    {children}
  </div>
)

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

const TabsTrigger: React.FC<TabsTriggerProps> = ({ 
  className, 
  value, 
  children,
  ...props 
}) => {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error("TabsTrigger must be used within Tabs")
  
  const isActive = context.value === value

  return (
    <button
      type="button"
      className={clsx('tabs-trigger', isActive && 'tabs-trigger-active', className)}
      onClick={() => context.onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  )
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

const TabsContent: React.FC<TabsContentProps> = ({ 
  className, 
  value, 
  children,
  ...props 
}) => {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error("TabsContent must be used within Tabs")
  
  if (context.value !== value) return null

  return (
    <div
      className={clsx('tabs-content', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }