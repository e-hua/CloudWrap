import Sidebar from "@/components/Sidebar";
import { Outlet } from "react-router";
import ThemeToggle from "@/components/ThemeToggle";

export default function Layout() {
  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex flex-col align-middle pl-60 h-full w-full">
        {/* A sticky topbar just like Render */}
        <div className="flex justify-start border-b border-sidebar-border fixed top-0 bg-background p-2 w-full">
          <div className="w-fit">
            <ThemeToggle />
          </div>
        </div>
        {/* Outlet is like its "children" props*/}
        <div className="flex flex-col w-full h-full items-center mt-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
