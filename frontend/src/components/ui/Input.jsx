import clsx from "clsx";

export default function Input({ value, onChange, className }) {
  return (
    <input
      // sync it with react state
      value={value}
      // Sync react state with it
      onChange={onChange}
      type="text"
      className={clsx(
        `
        bg-sidebar-selected
        border-1 border-sidebar-border
        focus:outline-none
        p-1 rounded-md`,
        className
      )}
    />
  );
}
