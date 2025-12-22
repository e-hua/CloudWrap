import Cookies from "js-cookie";
import React from "react";
import { useContext, createContext, useState, useEffect } from "react";

// Step 1: creating a context
const WorkspaceContext = createContext("");
const WorkspaceContextSetter = createContext<(value: string) => void>((val) => {
  console.log(val);
}); // Just a dummy initailization of contexts

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  // Use lazy function to prevent re-run this on every render
  const [workspace, setWorkspace] = useState(() => {
    return Cookies.get("workspace") || "Landing";
  });

  // Update the cookies everytime we update its state
  useEffect(() => {
    Cookies.set("workspace", workspace);
  }, [workspace]);

  return (
    // Step2: setting up the providers
    <WorkspaceContext.Provider value={workspace}>
      <WorkspaceContextSetter.Provider value={setWorkspace}>
        {children}
      </WorkspaceContextSetter.Provider>
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  if (!useContext(WorkspaceContext)) {
    throw new Error("useWorkspace must be used within a context provider");
  }
  return useContext(WorkspaceContext);
}

export function useWorkspaceSetter() {
  if (!useContext(WorkspaceContextSetter)) {
    throw new Error(
      "useWorkspace setter must be used within a context provider"
    );
  }
  return useContext(WorkspaceContextSetter);
}
