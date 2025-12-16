import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import type { ThemeType } from "@/hooks/UseTheme";

type ChildHandle = {
  write: (data: string) => void;
  writeln: (data: string) => void;
  clear: () => void;
};

type ChildProps = {
  ref: Ref<ChildHandle>;
  appTheme: ThemeType;
};

// VS Code Dark+
const DARK_THEME = {
  background: "#1e1e1e",
  foreground: "#cccccc",
  cursor: "#ffffff",
  selectionBackground: "#264f78",
  black: "#000000",
  red: "#cd3131",
  green: "#0dbc79",
  yellow: "#e5e510",
  blue: "#2472c8",
  magenta: "#bc3fbc",
  cyan: "#11a8cd",
  white: "#e5e5e5",
  brightBlack: "#666666",
  brightRed: "#f14c4c",
  brightGreen: "#23d18b",
  brightYellow: "#f5f543",
  brightBlue: "#3b8eea",
  brightMagenta: "#d670d6",
  brightCyan: "#29b8db",
  brightWhite: "#e5e5e5",
};

// GitHub Light
const LIGHT_THEME = {
  background: "#ffffff",
  foreground: "#24292f",
  cursor: "#24292f",
  selectionBackground: "#d0d7de",
  black: "#24292f",
  red: "#cf222e",
  green: "#1a7f37",
  yellow: "#9a6700",
  blue: "#0969da",
  magenta: "#8250df",
  cyan: "#1b7c83",
  white: "#6e7781",
  brightBlack: "#57606a",
  brightRed: "#ff8182",
  brightGreen: "#4ac26b",
  brightYellow: "#e99a00",
  brightBlue: "#54aeff",
  brightMagenta: "#a475f9",
  brightCyan: "#6bc4c9",
  brightWhite: "#8c959f",
};

function Xterm({ ref, appTheme }: ChildProps) {
  const containerElementRef = useRef<HTMLDivElement>(null);
  const terminalObjRef = useRef<Terminal>(null);

  // Runs only once on mount to DOM
  useEffect(() => {
    if (!containerElementRef.current || terminalObjRef.current) {
      return;
    }

    const terminal = new Terminal({
      fontFamily: '"JetBrains Mono", monospace',
      cursorBlink: false,
      convertEol: true,
      disableStdin: true,
      theme: appTheme === "dark" ? DARK_THEME : LIGHT_THEME,
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

  // Runs when theme changes
  useEffect(() => {
    if (!terminalObjRef.current) {
      return;
    }

    terminalObjRef.current.options.theme =
      appTheme === "dark" ? DARK_THEME : LIGHT_THEME;
  }, [appTheme]);

  useImperativeHandle(ref, () => {
    return {
      write: (data: string) => {
        terminalObjRef.current?.write(data);
      },

      writeln: (data: string) => {
        terminalObjRef.current?.writeln(data);
      },

      clear: () => {
        terminalObjRef.current?.clear();
      },
    };
  });

  return (
    <div className="h-full w-full">
      <div className="h-full w-full" ref={containerElementRef} />
    </div>
  );
}

export default Xterm;
export type { ChildHandle };
