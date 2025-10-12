import clsx from "clsx";
export default function AccentButton({ icon, text, className }) {
  return (
    <div
      className={clsx(
        `flex flex-row items-center
      gap-1 p-2 
      bg-surface-primary border-[1px] border-sidebar-border 
      text-text-primary
      hover:border-accent 
      max-w-40`,
        className
      )}
    >
      <div className="items-center">{icon}</div>
      <span className="text-center text-sm font-normal">{text}</span>
    </div>
  );
}
