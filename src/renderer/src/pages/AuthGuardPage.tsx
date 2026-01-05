import Skeleton from "@/components/ui/Skeleton";
import { useQuery } from "@/lib/query-lite";
import { Navigate, Outlet } from "react-router";

function AuthGuard() {
  const { data, status } = useQuery({
    queryKey: "app-credentials-status",
    queryFunction: async () => {
      const res = await window.api.onboarding.configs();
      if (!res.success) {
        throw new Error(res.error);
      }
      return res.data;
    }
  });

  if (status === "loading" || status === "idle") {
    return <Skeleton className="w-full h-full" />;
  }

  if (!data?.isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}

export default AuthGuard;
