import { serviceURL } from "@/apis/services/services";
import Skeleton from "@/components/ui/Skeleton";
import { useSSE } from "@/hooks/useSSE";
import { useTheme } from "@/hooks/UseTheme";
import type { ChildHandle } from "@/lib/log-stream-lite/Xterm";
import Xterm from "@/lib/log-stream-lite/Xterm";
import { useEffect, useRef } from "react";

type BuildLogViewProps = {
  serviceNumber: string | undefined;
  buildId: string | undefined;
};

function BuildLogView({ serviceNumber, buildId }: BuildLogViewProps) {
  if (!buildId || !serviceNumber) {
    return;
  }

  const theme = useTheme();
  const XtermRef = useRef<ChildHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const onText = (text: string) => {
    XtermRef.current?.write(`${text.replace(/\n/g, "\r\n")}`);
  };

  const { loading: SSELoading } = useSSE({
    url: `${serviceURL}${serviceNumber}/deploys/builds/${buildId}`,
    onMessage: (event) => {
      // data: {"source":"build-logs","data":"[Container] 2025/12/17 08:08:33.174342 Running on CodeBuild On-demand\n"}
      const data = JSON.parse(event.data);

      if (data.source === "build-logs") {
        const currLog: string = data.data;
        onText(currLog);
      }
    },
  });

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, []);

  return (
    <div
      className="
    w-full grid
    bg-[#ffffff] dark:bg-[#1e1e1e]  border-y border-sidebar-border"
      ref={containerRef}
    >
      <div className="w-full col-start-1 row-start-1 p-5">
        {<Xterm ref={XtermRef} appTheme={theme} />}
      </div>

      {SSELoading && (
        <Skeleton className="w-full col-start-1 row-start-1 bg-[#ffffff] dark:[lab(27.036%_0_0)] h-110" />
      )}
    </div>
  );
}

export default BuildLogView;
