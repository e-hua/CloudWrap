import { createContext, useEffect } from "react";
import type { ReactNode } from "react";

import type { QueryClient } from "./QueryClient";

const QueryClientContext = createContext<QueryClient | undefined>(undefined);

function QueryClientProvider({
  client,
  children,
}: {
  client: QueryClient;
  children: ReactNode;
}) {
  // This useEffect hook tells all the queries to refetch when some events are detected
  useEffect(() => {
    const refetchAllQueries = () => {
      client.queries.forEach((query) => {
        // Just force the query to fetch
        // Ensure that the users are getting fresh data
        query.fetch();
      });
    };

    window.addEventListener("online", refetchAllQueries, false);
    window.addEventListener("focus", refetchAllQueries, false);

    return () => {
      window.removeEventListener("online", refetchAllQueries, false);
      window.removeEventListener("focus", refetchAllQueries, false);
    };
  }, [client]);

  return (
    <QueryClientContext.Provider value={client}>
      {children}
    </QueryClientContext.Provider>
  );
}

export { QueryClientContext, QueryClientProvider };
