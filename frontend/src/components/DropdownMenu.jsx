import { useState, useRef, useEffect } from "react";
import { EllipsisVertical, Trash, Settings } from "lucide-react";
import { deleteBucket } from "../apis/s3";
import { useNavigate } from "react-router";

export default function DropdownMenu({ serviceType, serviceName }) {
  const [isOpen, setOpen] = useState(false);
  const menuRef = useRef(null);
  // Navigation lambda from react router
  const navigate = useNavigate();

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
          "relative hover:bg-button-hover p-2 " + (isOpen && "bg-button-active")
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
            <div className="flex gap-2 items-center text-text-primary py-1 px-2 hover:bg-button-hover">
              <Settings size={17} />
              <p
                onClick={() => {
                  navigate(`/${serviceType}/${serviceName}`);
                }}
              >
                Settings
              </p>
            </div>

            <div className="flex gap-2 items-center text-warning hover:bg-destructive py-1 px-2">
              <Trash size={17} />
              <p onClick={() => deleteBucket(serviceName)}>Delete</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
