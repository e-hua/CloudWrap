import type { BaseComponentProps } from "@/types/BaseProps";
import clsx from "clsx";

const BUTTON_MAPPING = {
  secondary: {
    className: "bg-sidebar-strong hover:bg-surface-primary text-text-primary",
  },
  default: {
    className: "bg-inverted hover:bg-inverted/80 text-background",
  },
  disabled: {
    className: "bg-sidebar-strong text-text-primary disabled",
  },
  destructive: {
    className:
      "bg-button-destructive dark:bg-button-destructive/60 text-white hover:bg-button-destructive/90 dark:hover:bg-button-destructive/50",
  },
};

const baseStyles = `flex flex-row gap-2 
  items-center justify-center 
  rounded-md border-1 border-sidebar-border
  py-2 px-3`;

type ButtonProps = {
  variation: "secondary" | "default" | "disabled" | "destructive";
  onClick: () => unknown;
  disabled?: boolean;
} & BaseComponentProps;

export default function Button({
  children,
  variation,
  className = "",
  onClick,
  disabled,
}: ButtonProps) {
  if (disabled) {
    variation = "disabled";
  }

  return (
    <div
      className={clsx(
        baseStyles,
        BUTTON_MAPPING[variation].className,
        !disabled || "cursor-not-allowed",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
