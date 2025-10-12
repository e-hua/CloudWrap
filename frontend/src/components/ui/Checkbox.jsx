import { useEffect, useState } from "react";
import { Check, Minus } from "lucide-react";
import clsx from "clsx";

const CHECK_MAPPING = {
  checked: {
    className: "bg-accent border-accent",
    icon: <Check size={15} className="text-white" />,
  },
  halfchecked: {
    className: "bg-accent border-accent",
    icon: <Minus size={15} className="text-white" />,
  },
  unchecked: {
    className: "bg-sidebar-background",
    icon: <Check size={15} className="text-transparent" />,
  },
};

export default function Checkbox({ onClick, checkState }) {
  const [check, setCheck] = useState(checkState);
  // "unchecked" | "checked" | "halfchecked"

  useEffect(() => {
    setCheck(checkState);
  }, [checkState]);

  return (
    <div
      className={clsx(
        "border-[1px] rounded-sm w-4 h-4",
        CHECK_MAPPING[check].className
      )}
      onClick={() => {
        if (check !== "unchecked") {
          setCheck("unchecked");
        } else {
          setCheck("checked");
        }
        onClick();
      }}
    >
      {CHECK_MAPPING[check].icon}
    </div>
  );
}
