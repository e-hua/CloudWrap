// This is much easier since we don't need to consider shared fetches
// across different components

import { useReducer } from "react";

type MutationOptions<TData, TVariables> = {
  mutationFunction: (variables: TVariables) => Promise<TData>;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: any, variables: TVariables) => void;
};

type MutationState<TData> = {
  data?: TData;
  error?: any;

  isError: boolean;
  isIdle: boolean;
  isPending: boolean;
  isSuccess: boolean;
};

type MutationAction<TData> =
  | {
      type: "success";
      data: TData;
    }
  | {
      type: "error";
      error: any;
    }
  | {
      type: "pending";
    };

function mutationStateReducer<TData>(
  mutationState: MutationState<TData>,
  mutationAction: MutationAction<TData>
): MutationState<TData> {
  switch (mutationAction.type) {
    case "pending":
      return {
        isError: false,
        isIdle: false,
        isPending: true,
        isSuccess: false,
      };
    case "error":
      return {
        error: mutationAction.error,
        isError: true,
        isIdle: false,
        isPending: false,
        isSuccess: false,
      };
    case "success":
      return {
        data: mutationAction.data,
        isError: false,
        isIdle: false,
        isPending: false,
        isSuccess: true,
      };
    default:
      return mutationState;
  }
}

// So we just need to manage them independently
function useMutation<TData, TVariables>({
  mutationFunction,
  onSuccess,
  onError,
}: MutationOptions<TData, TVariables>) {
  const initState: MutationState<TData> = {
    isError: false,
    isIdle: true,
    isPending: false,
    isSuccess: false,
  };

  const [mutationState, mutationDispatch] = useReducer(
    mutationStateReducer,
    initState
  );

  const mutate = async (variables: TVariables) => {
    mutationDispatch({ type: "pending" });

    try {
      const data: TData = await mutationFunction(variables);
      mutationDispatch({ type: "success", data });
      onSuccess?.(data, variables);
    } catch (error) {
      mutationDispatch({ type: "error", error });
      onError?.(error, variables);
    }
  };

  return { ...mutationState, mutate };
}

export { useMutation };
