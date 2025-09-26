import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router";
import ThemeToggle from "../components/ThemeToggle";

export default function Layout() {
  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-col align-middle ml-60 h-full w-full">
        {/* A sticky topbar just like Render */}
        <div className="border-b border-sidebar-border sticky top-0 bg-background p-2">
          <ThemeToggle />
        </div>
        {/* Outlet is like its "children" props*/}
        <Outlet />
      </div>
    </div>
  );
}
