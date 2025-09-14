import "./tailwind.css";
import { WorkspaceProvider } from "./hooks/UseWorkspace";
import Layout from "./layout/Layout";
import { Route, Routes } from "react-router";
import Storage from "./pages/Storage";

function App() {
  return (
    <WorkspaceProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="/dashboard" element={<></>} />
          <Route path="/bills" element={<></>} />
          <Route path="/credentials" element={<></>} />
          <Route path="/projects" element={<></>} />
          <Route path="/instances" element={<></>} />
          <Route path="/storage" element={<Storage />} />
          <Route path="/database" element={<></>} />
        </Route>
        <Route
          path="*"
          element={<p className="text-accent">This is a landing page</p>}
        />
      </Routes>
    </WorkspaceProvider>
  );
}

export default App;
