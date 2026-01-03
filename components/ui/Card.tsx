import React from "react"
import { cn } from "@/lib/utils"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: "default" | "elevated" | "outlined"
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = "default",
  ...props
}) => {
  const variants = {
    default: "bg-white border border-[#e5e5ea] shadow-lg",
    elevated: "bg-white shadow-xl border border-[#e5e5ea]",
    outlined: "bg-white border-2 border-[#d2d2d7]",
  }

  return (
    <div
      className={cn(
        "rounded-[18px] p-6 transition-all duration-200",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

