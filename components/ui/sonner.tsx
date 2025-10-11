"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast border-2 shadow-lg backdrop-blur-sm",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:border-primary/20",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          error: "group-[.toast]:border-destructive/50 group-[.toast]:bg-destructive/10 group-[.toast]:text-destructive-foreground group-[.toast]:shadow-destructive/20",
          success: "group-[.toast]:border-primary/50 group-[.toast]:bg-primary/10 group-[.toast]:text-foreground group-[.toast]:shadow-primary/20",
          warning: "group-[.toast]:border-muted-foreground/50 group-[.toast]:bg-muted group-[.toast]:text-foreground",
          info: "group-[.toast]:border-border group-[.toast]:bg-card group-[.toast]:text-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
