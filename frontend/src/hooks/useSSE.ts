import { useEffect, useState } from "react";

type UseSSEProps = {
  url: string;
  onMessage: (event: MessageEvent) => void;
  onError?: (event: Event) => void;
  onSSEClose?: () => void;
};

function useSSE({ url, onMessage, onError, onSSEClose }: UseSSEProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const eventSource = new EventSource(url);

    eventSource.addEventListener("end", () => {
      console.log("Backend signaled completion. Closing connection.");
      eventSource.close();
      if (onSSEClose) {
        onSSEClose();
      }
    });

    eventSource.onmessage = (event) => {
      if (loading) {
        setLoading(false);
      }
      onMessage(event);
    };

    eventSource.onerror = (event) => {
      if (loading) {
        setLoading(false);
      }
      if (onError) {
        onError(event);
      } else {
        console.error(event);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [url]);

  return { loading };
}

export { useSSE };
