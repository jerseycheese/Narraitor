import * as React from "react"
import { cssClasses } from '@/lib/utils'

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cssClasses(
      "",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<

  HTMLDivElement,

  React.HTMLAttributes<HTMLDivElement>

>(({ className, ...props }, ref) => (

  <div ref={ref} className={className} {...props} />

))

CardHeader.displayName = "CardHeader"



const CardTitle = React.forwardRef<

  HTMLParagraphElement,

  React.HTMLAttributes<HTMLHeadingElement>

>(({ className, ...props }, ref) => (

  <h3

    ref={ref}

    className={className}

    {...props}

  />

))

CardTitle.displayName = "CardTitle"



const CardDescription = React.forwardRef<

  HTMLParagraphElement,

  React.HTMLAttributes<HTMLParagraphElement>

>(({ className, ...props }, ref) => (

  <p

    ref={ref}

    className={className}

    {...props}

  />

))

CardDescription.displayName = "CardDescription"



const CardContent = React.forwardRef<

  HTMLDivElement,

  React.HTMLAttributes<HTMLDivElement>

>(({ className, ...props }, ref) => (

  <div ref={ref} className={className} {...props} />

))

CardContent.displayName = "CardContent"



const CardFooter = React.forwardRef<

  HTMLDivElement,

  React.HTMLAttributes<HTMLDivElement>

>(({ className, ...props }, ref) => (

  <div ref={ref} className={className} {...props} />

))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }