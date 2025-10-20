import DropdownMenu from "@/components/ui/DropdownMenu";
import type { RequiredChildrenProps } from "@/types/BaseProps";
import clsx from "clsx";

type CardProps = {
  headerContent: React.ReactNode;
  dropDownMenuContent: React.ReactNode;
} & RequiredChildrenProps;

type CardEntryProps = {
  entryName: string;
} & RequiredChildrenProps;

export default function Card({
  headerContent,
  dropDownMenuContent,
  className = "",
  children,
}: CardProps) {
  return (
    <div
      className={clsx(
        `flex flex-col items-center gap-x-4 
    bg-surface-primary border-1 border-sidebar-border px-4 pt-4 rounded-lg
    overflow-scroll`,
        className
      )}
    >
      <div className="flex flex-row justify-between w-full">
        {headerContent}

        <DropdownMenu>{dropDownMenuContent}</DropdownMenu>
      </div>

      {children}
    </div>
  );
}

export function CardEntry({
  entryName,
  className = "",
  children,
}: CardEntryProps) {
  return (
    <div
      className={clsx(
        `flex flex-row py-2 justify-start items-center gap-5 w-full border-b last:border-0 border-sidebar-border`,
        className
      )}
    >
      <h1 className="text-text-secondary text-sm w-18">{entryName}</h1>
      <div className="flex flex-col justify-center items-center">
        {children}
      </div>
    </div>
  );
}
