import { Query } from "./Query";

class QueryClient {
  queries: Map<string, Query<any>>;

  constructor() {
    this.queries = new Map();
  }

  getQuery<T>(queryKey: string, queryFunction: () => Promise<T>): Query<T> {
    const queryFound = this.queries.get(queryKey);

    if (queryFound) {
      return queryFound as Query<T>;
    }

    const newQuery = new Query<T>(queryKey, queryFunction);
    this.queries.set(queryKey, newQuery);

    return newQuery;
  }

  removeQuery(query: Query<any>) {
    this.queries.delete(query.queryKey);
  }
}

export { QueryClient };
