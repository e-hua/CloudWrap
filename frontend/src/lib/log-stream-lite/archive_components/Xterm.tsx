import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
// Import the CSS file via Vite
import "@xterm/xterm/css/xterm.css";
import { FitAddon } from "@xterm/addon-fit";
import { useLogStream } from "./useLogStream";

type XtermProps = {
  url: string;
};

function Xterm({ url }: XtermProps) {
  const containerElementRef = useRef<HTMLDivElement>(null);
  const terminalObjRef = useRef<Terminal>(null);

  // Runs only once on mount to DOM
  useEffect(() => {
    if (!containerElementRef.current || terminalObjRef.current) {
      return;
    }

    const terminal = new Terminal({
      cursorBlink: false,
      convertEol: true,
      disableStdin: true,
      theme: {},
      fontSize: 12,
    });
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(containerElementRef.current);
    fitAddon.fit();

    // Force the terminal to fit on every resize
    const handleResize = () => fitAddon.fit();
    window.addEventListener("resize", handleResize);

    terminalObjRef.current = terminal;

    return () => {
      window.removeEventListener("resize", handleResize);
      terminal.dispose();
      // Clean the object stored in the ref
      terminalObjRef.current = null;
    };
  }, []);

  useLogStream({
    url,
    onStream: (logs: string[]) => {
      const terminal = terminalObjRef.current;
      if (!terminal) {
        return;
      }

      const data = logs.map((log) => JSON.parse(log));
      if (data.length !== 0) {
        const text = data.join("\n") + "\n";
        terminal.write(text);
      }
    },
  });

  return (
    <div className="h-full w-full">
      <div className="h-full w-full" ref={containerElementRef} />
    </div>
  );
}

export default Xterm;
