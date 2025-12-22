import { getErrorMessage } from "@/utils/errors";
import { useState } from "react";

type StreamOptions = {
  onLog: (data: string) => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
};

function useStream(
  streamLogsFunc: () => Promise<Response | undefined>,
  endOfStreamCallback?: () => void
) {
  const [isStreaming, setIsStreaming] = useState(false);

  const stream = async ({ onLog, onSuccess, onError }: StreamOptions) => {
    function processSSEMessage(sseMessage: string) {
      const lines = sseMessage.split("\n");

      let event = "message";
      let jsonData = "";

      for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith("data: ")) {
          jsonData = trimmed.substring(6);
        } else if (trimmed.startsWith("event: ")) {
          event = trimmed.substring(7);
        }
      }

      if (!jsonData) {
        return;
      }

      try {
        const msg = JSON.parse(jsonData);

        if (event === "end") {
          onSuccess(msg.message || "Success");
          return;
        }

        if (event === "error") {
          onError(msg.message || "Unknown Error");
          return;
        }
        // Application Logs
        /*
            runTofu.ts 
            type StreamData = {
              source: "stdout" | "stderr" | "sys-info" | "sys-failure";
              data: string;
            };

            logs.ts
            type LogData = {
              data: string | ActionExecutionDetail[];
            };

            type PipelineLogData = LogData & {
              source: "pipeline-status" | "sys-failure" | "sys-info";
            };

            type BuildingLogData = LogData & {
              source: "build-logs" | "sys-failure" | "sys-info";
            };
          */

        const parsedData = (msg.data as string).endsWith("\n")
          ? msg.data
          : msg.data + "\n";

        switch (msg.source) {
          case "stderr":
          case "sys-failure":
            onError(parsedData);
            break;
          case "sys-info":
            onSuccess(parsedData);
            break;
          default:
            onLog(parsedData);
        }
      } catch (err) {
        console.error("Unable to parse SSE message", err, sseMessage);
      }
    }

    setIsStreaming(true);

    try {
      const res = await streamLogsFunc();

      if (!res || !res.body) {
        throw new Error("No response body received (Network Error)");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        const curr_chunk = decoder.decode(value, { stream: true });
        buffer += curr_chunk;

        if (done) {
          // If there're something left in the buffer
          if (buffer.trim()) {
            processSSEMessage(buffer);
          }
          break;
        }

        // Here we need to parse the logs sent by SSE manually
        const sseMessages = buffer.split("\n\n");
        buffer = sseMessages.pop() || "";

        for (const sseMessage of sseMessages) {
          processSSEMessage(sseMessage);
        }
      }
    } catch (err) {
      console.error(err);
      onError(getErrorMessage(err));
    } finally {
      setIsStreaming(false);
      (endOfStreamCallback ?? (() => {}))();
    }
  };

  return { stream, isStreaming };
}

export { useStream };
