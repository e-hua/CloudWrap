import { createPortal } from "react-dom";

// Need to close the modal when "clicked outside"
export default function Modal({
  children,
  isOpen,
  onClose = () => {},
  className = "",
}) {
  if (!isOpen) return null;

  const backgroundClickHandler = (event) => {
    // Only trigger the handler when we're clicking on the background
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div
      className={`fixed z-50 top-0 left-0 bottom-0 right-0 bg-black/50 ${className}`}
    >
      <div
        className="flex justify-center items-center h-full"
        onClick={backgroundClickHandler}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
