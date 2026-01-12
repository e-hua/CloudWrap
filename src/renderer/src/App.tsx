import "./tailwind.css";
import { WorkspaceProvider } from "./hooks/UseWorkspace";
import Layout from "@/layout/Layout";
import { Navigate, Route, Routes } from "react-router";
import StoragePage from "@/pages/StoragePage";
import StorageInfoPage from "@/pages/StorageInfoPage";
import ThemeProvider from "@/hooks/UseTheme";
import InstancePage from "@/pages/InstancePage";
import CostDashboardPage from "@/pages/CostDashboardPage";
import { TestDashboard } from "@/lib/query-lite/tests/TestDashboard";
import TestLogViewPage from "./pages/TestLogViewPage";
import LogViewPage from "./pages/LogViewPage";
import ServicePage from "./pages/ServicePage/ServicePage";
import { QueryClient, QueryClientProvider } from "./lib/query-lite";
import NewServicePage from "./pages/ServicePage/NewServicePage";
import ServiceLayout from "./pages/ServicePage/ServiceLayout";
import ServiceSettingsPage from "./pages/ServicePage/ServiceSettingsPage";
import ServiceDeploymentPage from "./pages/ServicePage/ServiceDeploymentPage";
import ServiceDeploymentRunsPage from "./pages/ServicePage/ServiceDeploymentRunsPage";
import CredentialsPage from "./pages/CredentialsPage";
import OnboardingPage from "./pages/OnboardingPage";
import AuthGuard from "./pages/AuthGuardPage";
// import { QueryLiteDevtools } from "./lib/query-lite";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WorkspaceProvider>
        <ThemeProvider>
          <Routes>
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route element={<AuthGuard />}>
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/services" replace />} />
                <Route path="/dashboard" element={<></>} />
                <Route path="/bills" element={<CostDashboardPage />} />
                <Route path="/credentials" element={<CredentialsPage />} />

                <Route path="/services" element={<ServicePage />} />
                <Route path="/services/new" element={<NewServicePage />} />
                <Route path="/services/:serviceNumber" element={<ServiceLayout />}>
                  <Route index element={<Navigate to="settings" replace />} />
                  <Route path="settings" element={<ServiceSettingsPage />} />
                  <Route path="deployment" element={<ServiceDeploymentPage />} />
                  <Route path="deployment/:executionId" element={<ServiceDeploymentRunsPage />} />
                </Route>

                <Route path="/instances" element={<InstancePage />} />
                <Route path="/storage/:storageName" element={<StorageInfoPage />} />
                <Route path="/storage" element={<StoragePage />} />
                <Route path="/database" element={<></>} />
                <Route path="/testdashboard" element={<TestDashboard />} />
                <Route path="/testSSE" element={<TestLogViewPage />} />
                <Route path="/SSE" element={<LogViewPage />} />
                <Route path="*" element={<p className="text-accent">This is a landing page</p>} />
              </Route>
            </Route>
          </Routes>
        </ThemeProvider>
      </WorkspaceProvider>
      {/*
      <div className="fixed bottom-0 w-full">
        <QueryLiteDevtools />
      </div>
         */}
    </QueryClientProvider>
  );
}

export default App;
