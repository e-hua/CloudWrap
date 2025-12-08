import { useEffect, useRef } from "react";

type LogStreamOptions = {
  url: string;
  bufferFlushInterval?: number;
  onStream: (logs: string[]) => void;
};

function useLogStream({
  url,
  bufferFlushInterval = 100,
  onStream,
}: LogStreamOptions) {
  const logBufferRef = useRef<string[]>([]);

  useEffect(() => {
    const eventSource = new EventSource(url);
    eventSource.onmessage = (event) => {
      logBufferRef.current.push(event.data);
    };

    const intervalId = setInterval(() => {
      onStream(logBufferRef.current);
      logBufferRef.current = [];
    }, bufferFlushInterval);

    return () => {
      eventSource.close();
      clearInterval(intervalId);
    };
  }, [url, bufferFlushInterval]);
}

export type { LogStreamOptions };
export { useLogStream };
