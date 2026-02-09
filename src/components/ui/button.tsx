import * as React from "react"
import { cssClasses } from '@/lib/utils/classNames'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive' | 'success' | 'info' | 'warning'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const buttonVariants = {
  default: "",
  destructive: "",
  outline: "",
  secondary: "",
  ghost: "",
  link: "underline-offset-4",
  success: "",
  info: "",
  warning: "",
}

const buttonSizes = {
  default: "",
  sm: "",
  lg: "",
  icon: "",
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cssClasses(
          "",
          buttonVariants[variant],
          buttonSizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }