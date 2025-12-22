// Create the QueryClient object at App.tsx
export { QueryClient } from "./QueryClient";

// The provider component and the useClient hook
export { QueryClientProvider, useQueryClient } from "./QueryClientProvider";

// hooks
export { useMutation } from "./useMutation";
export { useQuery } from "./useQuery";

// Devtools to show all the queries inside our client
export { QueryLiteDevtools } from "./QueryLiteDevtools";

/** Example usages 

1. App.tsx 
import {
  QueryClient,
  QueryClientProvider,
  QueryLiteDevtools,
} from "@/lib/query-lite";

const queryClient = new QueryClient()
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <QueryExample />
      <QueryLiteDevtools />
    </QueryClientProvider>
  )
}


2. QueryExample.tsx 

function QueryExample() {
  const { 
    status: Status, 
    error: any, 
    data: SomeReturnType, 
    lastUpdated: Date
  } = useQuery<SomeReturnType>({

    queryKey: 'repoData', <<= This must be a string
    queryFunction: () =>
      fetch('https://api.github.com/repos/TanStack/query').then((res) =>
        res.json(),
      ),
  })  
}


3. MutationExample.tsx
function MutationExample() {
  // This is a must in components related to useMutation
  // Because we need to trigger the invalidate of queries our self
  const queryClient = useQueryClient(); 

  // Queries
  const query = useQuery({ queryKey: 'todos', queryFunction: getTodos })

  // Mutations
  const mutation = useMutation({
    mutationFunction: postTodo,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries( queryKey: 'todos' )
    },
  })
}
 */
