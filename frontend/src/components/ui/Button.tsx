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
};

const baseStyles = `flex flex-row gap-2 
  items-center justify-center 
  rounded-md border-1 border-sidebar-border
  py-1 px-2`;

type ButtonProps = {
  variation: "secondary" | "default" | "disabled";
  text: string;
  onClick: () => unknown;
  disabled?: boolean;
} & BaseComponentProps;

export default function Button({
  children,
  variation,
  className = "",
  text,
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
        className
      )}
      onClick={onClick}
    >
      {children}
      <p>{text}</p>
    </div>
  );
}
