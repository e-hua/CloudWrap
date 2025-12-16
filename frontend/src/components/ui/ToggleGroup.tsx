import clsx from "clsx";

type option = {
  value: string;
  text: string;
};

type ToggleGroupProps = {
  options: option[];
  value: string;
  onValueChange: (value: any) => void;
  className?: string;
};
export default function ToggleGroup({
  options,
  value,
  onValueChange,
  className,
}: ToggleGroupProps) {
  return (
    <div
      className={clsx(
        `
        inline-flex flex-row
        bg-card border-[1px] border-card-border 
        text-sm text-text-primary text-wrap
        rounded-lg
        overflow-hidden`,
        className
      )}
    >
      {options.map((option, idx: number) => {
        const selected = option.value === value;
        return (
          <button
            className={clsx(
              "border-card-border h-full p-2",
              idx !== 0 && "border-l-[1px]",
              selected && "bg-sidebar-selected"
            )}
            onClick={() => {
              if (selected) {
                return;
              }
              onValueChange(option.value);
            }}
            key={idx}
          >
            {option.text}
          </button>
        );
      })}
    </div>
  );
}
