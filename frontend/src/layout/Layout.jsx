import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router";

export default function Layout() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-60">
        <Outlet />
      </div>
    </div>
  );
}
