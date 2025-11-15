import { useContext, useEffect, useMemo, useReducer } from "react";
import type { QueryOptions, QueryState } from "./Query";
import { QueryObserver } from "./QueryObserver";
import { QueryClientContext } from "./QueryClientProvider";

// Here we assume queryKey, queryFunction, staleTime are treated as contants
// Meaning they cannot be updated when the application is running
// Which is what useQuery() is supposed to be used
function useQuery<T>({
  queryKey,
  queryFunction,
  staleTime = 0,
  cacheTime = 5000,
}: QueryOptions<T>): QueryState<T> {
  const queryClient = useContext(QueryClientContext);

  if (!queryClient) {
    throw new Error("useQuery hook must be used within QueryCientProvider");
  }

  // This is just a dummy reducer to re-render the parent component
  const [_, rerender] = useReducer((prev) => prev + 1, 0);

  // Using useMemo() to make sure the value is persistent across all re-renders
  const observer = useMemo(() => {
    return new QueryObserver<T>(queryClient, {
      queryKey,
      queryFunction,
      staleTime,
      cacheTime,
    });
  }, []);

  // After every re-render with changed dependencies,
  // React will first run the cleanup function (if you provided it) with the old values,
  // and then run your setup function with the new values.
  useEffect(() => {
    // Return the cleanup function for current dependency
    // Return it so React can unsubscribe the observer when the component unmounts
    return observer.subscribe(rerender);
  }, [observer]);

  return observer.getQueryState();
}

export { useQuery };
