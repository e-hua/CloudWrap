import { useState, useRef, useEffect } from "react";
import { EllipsisVertical } from "lucide-react";

export default function DropdownMenu({ children, className = "" }) {
  const [isOpen, setOpen] = useState(false);
  const menuRef = useRef(null);
  // Navigation lambda from react router

  useEffect(() => {
    // triggers before any possible state changes
    // Due to it being an onMouseDown event instead of an onClick
    const onMouseDown = (event) => {
      if (!menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);

    // cleanup function runs before the unmount / re-render of this component
    return () => document.removeEventListener("mousedown", onMouseDown);
  });

  return (
    <>
      <div
        ref={menuRef}
        className={
          "relative hover:bg-button-hover p-2 " +
          (isOpen && "bg-button-active ") +
          className
        }
        onClick={() => {
          setOpen(!isOpen);
        }}
      >
        <EllipsisVertical className="text-text-primary size-4 " />
        {isOpen && (
          <div
            className="
          absolute
          flex flex-col 
          bg-transparent/50 backdrop-blur-md
          border-1 border-sidebar-border
          py-1 px-2 rounded-sm
          left-full -translate-x-full"
          >
            {/*
            left-1/2 to put the left edge at 50% of its parent
            -translate-x-1/2 to push the element to left by half of its width
            */}
            {children}
          </div>
        )}
      </div>
    </>
  );
}
