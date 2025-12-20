import { useStream } from "@/hooks/useStream";
import { useTheme } from "@/hooks/UseTheme";
import Xterm, { type ChildHandle } from "@/lib/log-stream-lite/Xterm";
import { useEffect, useRef } from "react";

type DeploymentViewProps = {
  enabled: boolean;
  streamLogsFunc?: () => Promise<Response | undefined>;
  endOfStreamCallback?: () => void;
};

function LogView({
  enabled,
  streamLogsFunc,
  endOfStreamCallback,
}: DeploymentViewProps) {
  const appTheme = useTheme();
  const XtermRef = useRef<ChildHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { stream } = useStream(
    streamLogsFunc ??
      (async () => {
        return undefined;
      }),
    endOfStreamCallback
  );
  const deploymentStartedRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      return;
    } else if (!XtermRef.current) {
      // Element not rendered, likely due to payload is null or undefined
      return;
    } else if (deploymentStartedRef.current) {
      // Prevent to start two streams
      return;
    }

    if (containerRef.current) {
      containerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    deploymentStartedRef.current = true;

    const onText = (text: string) => {
      const time = new Date().toLocaleTimeString("en-GB");

      // \x1b[2m = Dim (faint)
      // \x1b[0m = Reset to normal
      const timestamp = `\x1b[2m[${time}]\x1b[0m`;

      XtermRef.current?.write(`${timestamp} ${text.replace(/\n/g, "\r\n")}`);
    };

    stream({
      onLog: onText,
      onSuccess: onText,
      onError: onText,
    });
  }, [enabled]);

  if (!enabled) {
    return;
  }

  return (
    <div ref={containerRef} className="w-full">
      <Xterm ref={XtermRef} appTheme={appTheme} />
    </div>
  );
}

export default LogView;
