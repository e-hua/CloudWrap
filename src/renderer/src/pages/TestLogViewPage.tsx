import { useLogStream } from "@/lib/log-stream-lite/archive_components/useLogStream";
import { useLayoutEffect, useRef, useState } from "react";
import { BACKEND_ENDPOINT_URL } from "@/config/constants";

const testSSEURL = `${BACKEND_ENDPOINT_URL}testSSE/`;

// If the distance to the bottom is less than 50px, scroll to bottom
const scrollToBottomThreshold = 200;

function TestLogViewPage() {
  const [logs, setLogs] = useState<string[]>([]);

  const [scrollDownEnabled, setScrollDownEnabled] = useState<boolean>(true);

  const logsContainerRef = useRef<HTMLDivElement | null>(null);
  const previousScrollTopRef = useRef<number>(-1);

  useLayoutEffect(() => {
    if (scrollDownEnabled && logsContainerRef.current) {
      /*
      scrollTop: height of the part of the component hidden above the viewport
      scrollHeight: the total height of the component 
      clientHeight: height of the viewport 
      */

      // Set the height of the "hidden part" to be the height of the entire component
      // Showing only the last line of the logs
      logsContainerRef.current.scrollTop =
        logsContainerRef.current.scrollHeight;

      // reset the ref for the previousScrollTop
      previousScrollTopRef.current = logsContainerRef.current.scrollTop;
    }
  }, [logs, scrollDownEnabled]);

  const scrollHandler = () => {
    const component = logsContainerRef.current;

    if (!component) {
      return;
    }

    // if the user is scrolling up,
    // meaning the height of the "hidden part" is decreasing
    if (component.scrollTop < previousScrollTopRef.current) {
      // disable the "auto-scroll-down", allow the user to view previous logs
      setScrollDownEnabled(false);
    } else {
      // else the user is scrolling down

      // If the distance to the bottom is smaller than the threshold
      // Meaning the user enters the "sticky zone"
      // Enable the auto-scroll-down
      if (
        component.scrollHeight - component.scrollTop - component.clientHeight <=
        scrollToBottomThreshold
      ) {
        setScrollDownEnabled(true);
      }
    }

    previousScrollTopRef.current = component.scrollTop;
  };

  useLogStream({
    url: testSSEURL,
    onStream: (newLogs: string[]) => setLogs((prev) => [...prev, ...newLogs]),
  });

  return (
    <div className="h-11/12">
      <div
        className="h-full overflow-scroll"
        onScroll={scrollHandler}
        ref={logsContainerRef}
      >
        {logs.map((log, idx) => (
          <p key={idx}>{log}</p>
        ))}
      </div>
    </div>
  );
}

export default TestLogViewPage;
