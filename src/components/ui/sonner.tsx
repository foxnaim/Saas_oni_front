'use client';

import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
type ToasterProps = React.ComponentProps<typeof Sonner>;
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-2 group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-none",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-none",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-none",
          error: "group-[.toaster]:border-destructive group-[.toaster]:text-destructive",
          success: "group-[.toaster]:border-primary group-[.toaster]:text-foreground",
          warning: "group-[.toaster]:border-accent group-[.toaster]:text-foreground",
          info: "group-[.toaster]:border-border group-[.toaster]:text-foreground",
        },
      }}
      {...props}
    />
  );
};
export { Toaster, toast };
