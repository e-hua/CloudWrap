import { ChevronRight } from "lucide-react";

export default function Breadcrumb({
  prefix,
  callback,
}: {
  prefix: string;
  callback: (newPath: string) => void;
}) {
  const children = prefix.split("/");
  // remove the empty string
  children.pop();
  children.unshift("");

  return (
    <div className="flex flex-row font-semibold text-text-secondary">
      {children.map((child, idx) => {
        return (
          <div key={idx} className="flex flex-row items-center">
            <p
              className={`${
                idx === children.length - 1 ? "text-text-primary" : ""
              } hover:underline hover:text-accent`}
              onClick={() => {
                const path = children.slice(1, idx + 1);
                path.push("");
                callback(path.join("/"));
              }}
              key={"p" + idx}
            >
              {child || "~"}
            </p>
            <ChevronRight
              className={`${idx === children.length - 1 ? "hidden" : ""}`}
              key={"ChevronRight" + idx}
            />
          </div>
        );
      })}
    </div>
  );
}
