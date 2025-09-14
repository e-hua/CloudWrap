import {
  LayoutDashboard as Dashboard,
  CreditCard as Bills,
  KeyRound as Credentials,
  Package as Projects,
  Cpu as EC2,
  Cylinder as S3,
  Database as RDS,
  CaseLower,
} from "lucide-react";
import { useWorkspace, useWorkspaceSetter } from "../hooks/UseWorkspace";
import { Link } from "react-router";

export default function Sidebar() {
  return (
    <div
      className="fixed top-0 left-0 
    h-full w-60 
    flex flex-col align-middle space-y-4 px-2
    bg-neutral-900 text-white
    border-r-[1px] border-r-neutral-800"
    >
      <h1 className="text-center">CloudWrap</h1>
      <div>
        <div>
          <SidebarIcon icon={<Dashboard />} name="Dashboard" />
          <SidebarIcon icon={<Bills />} name="Bills" />
          <SidebarIcon icon={<Credentials />} name="Credentials" />
        </div>
      </div>

      <div>
        <h4 className="text-neutral-400 text-sm font-semibold mx-2 my-2">
          Build
        </h4>
        <SidebarIcon icon={<Projects />} name="Projects" />
        <SidebarIcon icon={<EC2 />} name="Instances" />
        <SidebarIcon icon={<S3 />} name="Storage" beta />
        <SidebarIcon icon={<RDS />} name="Database" />
      </div>
    </div>
  );
}

function SidebarIcon({ icon, name, beta }) {
  // de-structuring
  const workspace = useWorkspace();
  const workspaceSetter = useWorkspaceSetter();

  const isHighlighted = workspace === name;

  return (
    <Link to={name.toLowerCase()}>
      <div
        className={
          "flex items-center justify-between p-2 hover:bg-neutral-700 rounded-lg " +
          (isHighlighted ? "bg-neutral-800" : "")
        }
        onClick={() => workspaceSetter(name)}
      >
        <div className="flex items-center space-x-2">
          <div className="text-accent">{icon}</div>
          <h3 className="text-md text-sm text-neutral-400 font-light">
            {name}
          </h3>
        </div>
        {beta ? (
          <></>
        ) : (
          <h5 className="text-xs text-neutral-500 font-bold">soon</h5>
        )}
      </div>
    </Link>
  );
}
