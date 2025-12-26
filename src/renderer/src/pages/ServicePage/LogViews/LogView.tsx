import Skeleton from "@/components/ui/Skeleton";
import { LogData, useStream } from "@/hooks/useStream";
import { useTheme } from "@/hooks/UseTheme";
import Xterm, { type ChildHandle } from "@/lib/log-stream-lite/Xterm";
import { useEffect, useRef } from "react";


type DeploymentViewProps = {
  enabled: boolean;
  starter?: () => Promise<void>;
  // The subscriber (e.g., api.services.onCreateLog)
  listener?: (callback: (data: LogData) => void) => () => void;
  endOfStreamCallback?: () => void;
  timeDisabled?: boolean;
};

function LogView({
  enabled,
  starter,
  listener,
  endOfStreamCallback,
  timeDisabled
}: DeploymentViewProps) {
  const appTheme = useTheme();
  const XtermRef = useRef<ChildHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const safeStarter = starter ?? (async () => {});
  const safeListener = listener ?? ((() => () => {}));

  const { stream, isLoading} = useStream(safeStarter, safeListener, endOfStreamCallback);

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
      if (!text.endsWith('\n')) {
        text = text + "\n";
      }

      const time = new Date().toLocaleTimeString("en-GB");

      // \x1b[2m = Dim (faint)
      // \x1b[0m = Reset to normal
      const timestamp = timeDisabled ? "" : `\x1b[2m[${time}]\x1b[0m`;

      XtermRef.current?.write(`${timestamp} ${text.replace(/\n/g, "\r\n")}`);
    };

    stream({
      onLog: onText,
      onSuccess: onText,
      onError:  onText
    });

    return () => {
      deploymentStartedRef.current = false;
    };
  }, [enabled]);

  if (!enabled) {
    return;
  }

  return (
    <div className="w-full grid">
      <div ref={containerRef} className="w-full col-start-1 row-start-1">
        <Xterm ref={XtermRef} appTheme={appTheme} />
      </div>
      {isLoading && (
        <Skeleton className="w-full col-start-1 row-start-1 bg-[#ffffff] dark:[lab(27.036%_0_0)] h-110" />
      )}
    </div>
  );
}

export default LogView;
