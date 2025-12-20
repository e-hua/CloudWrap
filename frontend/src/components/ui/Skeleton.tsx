import clsx from "clsx";
import type { ReactNode } from "react";

function Skeleton({
  className,
  children,
}: {
  className: string;
  children?: ReactNode;
}) {
  return (
    <div className={clsx("bg-sidebar-selected animate-pulse", className)}>
      {children}
    </div>
  );
}

export default Skeleton;
