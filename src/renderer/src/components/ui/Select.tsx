import {
  createContext,
  useEffect,
  useRef,
  useState,
  useContext,
  type Dispatch,
  type ReactNode,
} from "react";
import clsx from "clsx";
import { ChevronDown, Check } from "lucide-react";

type SelectUIContextType = {
  selectOpen: boolean;
  setSelectOpen: Dispatch<React.SetStateAction<boolean>>;
};

type SelectValueContextType = {
  selectedValue: string;
  onValueChange: (val: string) => void;
};

type SelectContextType = SelectUIContextType & SelectValueContextType;

// A react context for the management of all the states const SelectStatesContext = createContext();
const SelectStatesContext = createContext<SelectContextType | undefined>(
  undefined
);

const useSelectStatesContext = () => {
  const context = useContext(SelectStatesContext);
  if (!context) {
    throw new Error(
      "useSelectStatesContext must be used within a Select component"
    );
  }
  return context;
};

function Select({
  selectedValue,
  onValueChange,
  children,
}: {
  children: React.ReactNode;
} & SelectValueContextType) {
  const [selectOpen, setSelectOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (!selectRef.current || !event.target) {
        return;
      }

      if (!selectRef.current.contains(event.target as Node)) {
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

function SelectTrigger({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const stateContext = useSelectStatesContext();

  const { selectOpen, setSelectOpen } = stateContext;

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

function SelectValue({
  className,
  placeholder,
}: {
  className?: string;
  placeholder: string;
}) {
  const stateContext = useSelectStatesContext();

  const { selectedValue } = stateContext;

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

function SelectContent({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const stateContext = useSelectStatesContext();
  const { selectOpen } = stateContext;

  if (!selectOpen) return null;

  return (
    <div
      className={clsx(
        `
        absolute bg-sidebar-background w-full mt-1
        border-1 border-sidebar-border 
        p-1.5 rounded-md
        max-h-30 overflow-scroll`,
        className
      )}
    >
      {children}
    </div>
  );
}

function SelectItem({
  className,
  children,
  value,
}: {
  className?: string;
  children: ReactNode;
  value: string;
}) {
  const stateContext = useSelectStatesContext();
  const { selectedValue, onValueChange, setSelectOpen } = stateContext;

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
