import { createPortal } from "react-dom";

export default function Modal({ children, isOpen }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed z-50 top-0 left-0 bottom-0 right-0 bg-black/50">
      <div className="flex justify-center items-center h-full">{children}</div>
    </div>,
    document.body
  );
}
