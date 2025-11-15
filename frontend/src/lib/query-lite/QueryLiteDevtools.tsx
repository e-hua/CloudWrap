import { useContext, useEffect, useReducer } from "react";
import { QueryClientContext } from "./QueryClientProvider";

function QueryLiteDevtools() {
  const client = useContext(QueryClientContext);
  const [_, rerender] = useReducer((prevState) => prevState + 1, 0);

  if (!client) {
    throw new Error(
      "<QueryLiteDevtools/> must be used within QueryCientProvider"
    );
  }

  useEffect(() => {
    return client.subscribe(rerender);
  }, [client, rerender]);

  return (
    <div className="bg-black text-white divide-solid divide-y-2 divide-gray-800">
      {[...client.queries.values()]
        .sort((a, b) => (a.queryKey > b.queryKey ? 1 : -1))
        .map((query) => {
          return (
            <div
              key={query.queryKey}
              className="p-2 flex flex-row justify-between items-center"
            >
              <p>{query.queryKey}</p>
              <span className="font-bold">
                {!query.subscribers.length ? (
                  <span className="text-gray-500">inactive</span>
                ) : query.state.status === "idle" ? (
                  <span className="text-amber-100">idle</span>
                ) : query.state.status === "loading" ? (
                  <span className="text-blue-500">loading</span>
                ) : query.state.status === "error" ? (
                  <span className="text-red-500">error</span>
                ) : query.state.status === "success" ? (
                  <span className="text-green-500">success</span>
                ) : null}
              </span>
            </div>
          );
        })}
    </div>
  );
}

export { QueryLiteDevtools };
