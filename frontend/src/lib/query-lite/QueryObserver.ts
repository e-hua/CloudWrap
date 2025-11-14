import type { Query, QueryOptions } from "./Query";
import type { QueryClient } from "./QueryClient";

class QueryObserver<T> {
  queryClient: QueryClient;
  queryKey: string;
  queryFunction: () => Promise<T>;
  query: Query<T>;
  reRenderCallback: (() => void) | undefined = undefined;
  staleTime: number;

  constructor(
    queryClient: QueryClient,
    { queryKey, queryFunction, staleTime = 0 }: QueryOptions<T>
  ) {
    this.queryClient = queryClient;
    this.queryKey = queryKey;
    this.queryFunction = queryFunction;
    this.query = queryClient.getQuery({ queryKey, queryFunction });
    this.staleTime = staleTime;
  }

  fetch() {
    // time passed in ms
    const timeElapsed = Date.now() - this.query.state.lastUpdated.getTime();
    // Only fetch when the data is too old
    if (!this.query.state.data || timeElapsed > this.staleTime) {
      this.query.fetch();
    }
  }

  getQueryState() {
    return this.query.state;
  }

  notify() {
    // Can only be notified if it's subscribed to a certain query
    if (this.reRenderCallback) {
      this.reRenderCallback();
    }
  }

  subscribe(reRenderCallback: () => void) {
    this.reRenderCallback = reRenderCallback;
    const unsubscribe = this.query.subscribe(this);

    // Try to fetch the data on mount
    this.fetch();
    return unsubscribe;
  }
}

export { QueryObserver };
