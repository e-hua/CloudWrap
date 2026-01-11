import { Query, type QueryOptions } from "./Query";

class QueryClient {
  queries: Map<string, Query<any>>;
  subscribers: (() => void)[];

  constructor() {
    this.queries = new Map();
    this.subscribers = [];
  }

  getQuery<T>({
    queryKey,
    queryFunction,
    cacheTime
  }: Required<Omit<QueryOptions<T>, "staleTime">>): Query<T> {
    const queryFound = this.queries.get(queryKey);

    if (queryFound) {
      return queryFound as Query<T>;
    }

    const newQuery = new Query<T>(this, { queryKey, queryFunction, cacheTime });
    this.queries.set(queryKey, newQuery);

    return newQuery;
  }

  removeQuery(query: Query<any>) {
    this.queries.delete(query.queryKey);
  }

  removeQueryWithKey(queryKey: string) {
    this.queries.delete(queryKey);
  }

  subscribe(callback: () => void) {
    this.subscribers.push(callback);

    return () => {
      this.subscribers = this.subscribers.filter((subscriber) => subscriber !== callback);
    };
  }

  // This is to remind the Devtool to rerender
  notify() {
    this.subscribers.forEach((callback) => callback());
  }

  invalidateQuery(queryKey: string) {
    const query = this.queries.get(queryKey);

    if (query) {
      // This will notify the query to re-render,
      // but not to re-fetch, so we need to do this manually
      query.setState((oldState) => {
        return { ...oldState, lastUpdated: new Date(2000, 1, 1) };
      });

      // Re-fetching
      query.subscribers.forEach((subscriber) => {
        subscriber.fetch();
      });
    }
  }
}

export { QueryClient };
