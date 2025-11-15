import type { QueryClient } from "./QueryClient";

type Status = "idle" | "loading" | "success" | "error";

type QueryState<T> = {
  data: T | undefined;

  // Since almost everything can be thrown in JS...
  error: any | undefined;
  status: Status;
  lastUpdated: Date;
};

type Subscriber = {
  notify: () => void;
};

type QueryOptions<T> = {
  queryKey: string;
  queryFunction: () => Promise<T>;
  staleTime?: number;
  cacheTime?: number;
};

class Query<T> {
  // The "internal" promise we're using to track the status of ongoing fetching
  promise: Promise<void> | undefined = undefined;

  // This must be unique across different queries in order to carry out hashing
  queryKey: string;
  queryFunction: () => Promise<T>;
  state: QueryState<T>;

  // This is an array of Objects with "notify" method
  subscribers: Subscriber[];

  // How long the query is going to stay in the client
  // if there're no observer attached to it
  cacheTime: number;
  gcTimeout: number | undefined = undefined;
  queryClient: QueryClient;

  constructor(
    queryClient: QueryClient,
    {
      queryKey,
      queryFunction,
      cacheTime,
    }: Required<Omit<QueryOptions<T>, "staleTime">>
  ) {
    // This is for garbage collection triggering
    this.queryClient = queryClient;

    this.queryKey = queryKey;
    this.queryFunction = queryFunction;
    this.subscribers = [];
    this.state = {
      data: undefined,
      error: undefined,
      status: "idle",
      // This creates an dummy date, indicating that you must refetch the data
      lastUpdated: new Date(2000, 1, 1),
    };
    this.cacheTime = cacheTime;
  }

  // We use only call this fetch function when we want to re-fetch fresh data
  fetch(): Promise<void> {
    // This is the "deduping" logic, we only update the promise when there're no promise
    // Meaning we only return the existing promise when there's already one fetching going on
    if (this.promise) {
      return this.promise;
    }

    this.promise = (async () => {
      try {
        this.setState((oldState) => {
          return {
            ...oldState,
            // We're using the status to carry out discrimated typing,
            // so it's safe to make use of part of the previous state
            status: "loading",
          };
        });
        const newData: T = await this.queryFunction();
        this.setState((oldState) => {
          return {
            ...oldState,
            data: newData,
            status: "success",
            lastUpdated: new Date(),
          };
        });
      } catch (err) {
        this.setState((oldState) => {
          return {
            ...oldState,
            error: err,
            status: "error",
          };
        });
      } finally {
        // Empty the promise, get ready for the next fetch call
        this.promise = undefined;
      }
    })();

    return this.promise;
  }

  // Only schedule GC when there're no observer subscribing
  subscribe(subscriber: Subscriber): () => void {
    this.subscribers.push(subscriber);
    this.unscheduleGC();

    const unsubscribe = () => {
      this.subscribers = this.subscribers.filter((elem) => elem !== subscriber);

      if (this.subscribers.length === 0) {
        this.scheduleGC();
      }
    };

    return unsubscribe;
  }

  scheduleGC() {
    this.gcTimeout = setTimeout(() => {
      this.queryClient.removeQuery(this);
    }, this.cacheTime);
  }

  unscheduleGC() {
    clearTimeout(this.gcTimeout);
  }

  // any update on the state will notify the observer
  // triggering the component to re-render
  setState(updater: (oldState: QueryState<T>) => QueryState<T>) {
    this.state = updater(this.state);
    this.subscribers.forEach((subscriber) => subscriber.notify());
  }
}

export { Query };
export type { Status, QueryState, Subscriber, QueryOptions };
