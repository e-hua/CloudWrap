import clsx from "clsx";

export default function ToggleGroup({
  options,
  value,
  onValueChange,
  className,
}) {
  return (
    <div
      className={clsx(
        `flex flex-row
bg-card border-[1px] border-card-border 
text-sm text-text-primary text-wrap
rounded-lg`,
        className
      )}
    >
      {options.map((option, idx) => {
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
          >
            {option.text}
          </button>
        );
      })}
    </div>
  );
}
