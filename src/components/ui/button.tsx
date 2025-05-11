import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow-sm hover:shadow-lg active:scale-[0.98] hover:-translate-y-0.5 active:shadow-inner", // Added active:shadow-inner and slightly adjusted active:scale and hover:translate
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80", // Added active state
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80", // Added active state
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent/80", // Added active state
        secondary: 
          "bg-accent text-accent-foreground hover:bg-accent/90 active:bg-accent/80", // Adjusted secondary to use accent, added active state
        ghost: "hover:bg-accent/10 hover:text-accent-foreground shadow-none hover:shadow-none active:scale-100 hover:translate-y-0 active:bg-accent/20", // Added active state for ghost
        link: "text-primary underline-offset-4 hover:underline shadow-none hover:shadow-none active:scale-100 hover:translate-y-0 hover:text-primary/80", // Added hover color change
      },
      size: {
        default: "h-10 px-4 py-2", // Default height slightly increased to h-10
        sm: "h-9 rounded-md px-3", // Small button height adjusted to h-9
        lg: "h-12 rounded-lg px-8", // lg button with rounded-lg
        icon: "h-10 w-10", // Icon button height changed to h-10
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
