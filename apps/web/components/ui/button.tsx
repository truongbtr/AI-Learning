import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";

/** Adult-area button (MEDIFA ONE `Button`): teal primary, soft secondary, outline, ghost, danger. */
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-control font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-70",
  {
    variants: {
      variant: {
        default:
          "bg-brand-500 text-white shadow-control hover:bg-brand-600 active:bg-brand-700 disabled:bg-brand-200",
        secondary:
          "bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-200 disabled:text-brand-300",
        outline:
          "border border-ink-200 bg-white text-ink-700 hover:border-brand-300 hover:text-brand-700 active:bg-brand-50",
        ghost: "text-ink-600 hover:bg-ink-100 hover:text-ink-800 active:bg-ink-200",
        destructive:
          "bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700 disabled:bg-danger-100",
        link: "text-brand-700 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 gap-2 px-4 text-sm",
        sm: "h-9 gap-1.5 px-3 text-[13px]",
        lg: "h-12 gap-2 px-5 text-[15px]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  type = "button",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}

export { buttonVariants };
