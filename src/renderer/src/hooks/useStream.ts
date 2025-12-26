import { getErrorMessage } from "@/utils/errors";
import { ActionExecutionDetail } from "@aws-sdk/client-codepipeline";
import { useEffect, useRef, useState } from "react";

type StreamOptions = {
  onLog: (data: string) => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
};

type LogData = {
  data: string | ActionExecutionDetail[], 
  source: string, 
  end?: boolean
}

// T: StreamData / PipelineLogData / BuildingLogData
function useStream<T extends LogData>(
  // Starter: the async function to tell the main process to start streaming
  starter: () => Promise<void>,
  // Listener: the function 
  // taking in a callback waiting for the data sent by the events, 
  // returning a cleanup function
  listener: (callback: (data: T) => void) => () => void, 
  endOfStreamCallback?: () => void
) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const stopStreaming = () => {
    setIsStreaming(false);
    setIsLoading(false);
    if (cleanupRef.current) cleanupRef.current();
    if (endOfStreamCallback) endOfStreamCallback();
  };

  const stream = async ({ onLog, onSuccess, onError }: StreamOptions) => {
    if (isStreaming) return;
    setIsStreaming(true);
    setIsLoading(true);
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

    cleanupRef.current = listener((msg: T) => {
        // Set the isLoading to false on the first packet received
        setIsLoading((prevIsLoading) => {
          if (prevIsLoading) {
            return false
          }
          return prevIsLoading
        });

        const textData = typeof msg.data === 'string' 
          ? msg.data 
          : JSON.stringify(msg.data, null, 2);

        switch (msg.source) {
          case "stderr":
          case "sys-failure":
            onError(textData);
            break;
          case "sys-info":
            onSuccess(textData);
            break;
          default:
            onLog(textData);
        }
        if (msg.end) {
          stopStreaming();
        }
    })
  
    // First register the event listener, then call the starter function 
    try {
      await starter();
    } catch (err) {
      onError(getErrorMessage(err));
      console.error(err)
      stopStreaming()
    }
  };

  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        console.log("Event listener removed: useEffect")
        // remove the event listener when unmounts, preventing memory leak
        stopStreaming()
      }
    }
  }, [])

  return { stream, isStreaming, isLoading};
}

export { useStream };
export type {LogData}