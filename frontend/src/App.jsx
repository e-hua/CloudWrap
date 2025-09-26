import "./tailwind.css";
import { WorkspaceProvider } from "./hooks/UseWorkspace";
import Layout from "./layout/Layout";
import { Route, Routes } from "react-router";
import StoragePage from "./pages/StoragePage";
import StorageInfoPage from "./pages/StorageInfoPage";
import ThemeProvider from "./hooks/UseTheme";

function App() {
  return (
    <WorkspaceProvider>
      <ThemeProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route path="/dashboard" element={<></>} />
            <Route path="/bills" element={<></>} />
            <Route path="/credentials" element={<></>} />
            <Route path="/projects" element={<></>} />
            <Route path="/instances" element={<></>} />
            <Route path="/storage/:storageName" element={<StorageInfoPage />} />
            <Route path="/storage" element={<StoragePage />} />
            <Route path="/database" element={<></>} />
          </Route>
          <Route
            path="*"
            element={<p className="text-accent">This is a landing page</p>}
          />
        </Routes>
      </ThemeProvider>
    </WorkspaceProvider>
  );
}

export default App;
