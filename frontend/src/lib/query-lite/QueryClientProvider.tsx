import { createContext } from "react";
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
  return (
    <QueryClientContext.Provider value={client}>
      {children}
    </QueryClientContext.Provider>
  );
}

export { QueryClientContext, QueryClientProvider };
