import { createContext, useEffect, useRef, useState, useContext } from "react";
import clsx from "clsx";
import { ChevronDown, Check } from "lucide-react";

// A react context for the management of all the states const SelectStatesContext = createContext();
const SelectStatesContext = createContext();

function Select({ selectedValue, onValueChange, children }) {
  const [selectOpen, setSelectOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const onMouseDown = (event) => {
      if (!selectRef.current.contains(event.target)) {
        setSelectOpen(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);

    return () => {
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, []);

  return (
    <SelectStatesContext.Provider
      value={{ selectOpen, setSelectOpen, selectedValue, onValueChange }}
    >
      <div className="relative" ref={selectRef}>
        {children}
      </div>
    </SelectStatesContext.Provider>
  );
}

function SelectTrigger({ className, children }) {
  const { selectOpen, setSelectOpen } = useContext(SelectStatesContext);

  return (
    <div
      className={clsx(
        `flex flex-row items-center
        bg-sidebar-selected hover:bg-sidebar-hovered
        p-1.5 rounded-md
        border-1 border-sidebar-border focus:outline-none`,
        className
      )}
      onClick={() => setSelectOpen(!selectOpen)}
    >
      {children}
    </div>
  );
}

function SelectValue({ className, placeholder }) {
  const { selectedValue } = useContext(SelectStatesContext);

  return (
    <div
      className={clsx(
        `flex flex-row items-center justify-between w-full px-1 text-sm`,
        className
      )}
    >
      <span
        className={clsx(
          selectedValue ? "text-text-primary" : "text-text-secondary",
          "font-light"
        )}
      >
        {selectedValue || placeholder}
      </span>
      <ChevronDown className="text-text-secondary" size={14} />
    </div>
  );
}

function SelectContent({ className, children }) {
  const { selectOpen } = useContext(SelectStatesContext);

  if (!selectOpen) return null;

  return (
    <div
      className={clsx(
        `
        absolute bg-sidebar-background w-full mt-1
        border-1 border-sidebar-border 
        p-1.5 rounded-md
        max-h-50 overflow-scroll`,
        className
      )}
    >
      {children}
    </div>
  );
}

function SelectItem({ className, children, value }) {
  const { selectedValue, onValueChange, setSelectOpen } =
    useContext(SelectStatesContext);
  return (
    <div
      className={clsx(
        "relative hover:bg-sidebar-hovered rounded-md p-1",
        className
      )}
      onClick={() => {
        onValueChange(value);
        setSelectOpen(false);
      }}
    >
      {children}
      <div
        className={clsx(
          "absolute right-1 top-1/2 -translate-y-1/2",
          value === selectedValue || "hidden"
        )}
      >
        <Check className="text-accent" size={14} />
      </div>
    </div>
  );
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
