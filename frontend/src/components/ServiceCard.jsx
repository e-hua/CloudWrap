import { HardDrive, Globe } from "lucide-react";
import DropdownMenu from "./DropdownMenu";
import { Link } from "react-router";

export default function ServiceCard({
  serviceType,
  serviceName,
  creationDate,
  serviceProvider,
}) {
  return (
    <div
      className="flex flex-col items-center gap-x-4 
    bg-surface-primary border-1 border-sidebar-border px-4 pt-4 rounded-lg
    overflow-scroll"
    >
      <div className="flex flex-row justify-between w-full">
        <Link to={`/${serviceType}/${serviceName}`}>
          <h1 className="text-text-primary hover:text-accent text-sm underline">
            {serviceName}
          </h1>
        </Link>
        <DropdownMenu serviceType={serviceType} serviceName={serviceName} />
      </div>

      <ServiceEntry entryName={serviceType}>
        <ServiceTypeToIcon serviceType={serviceType} />
      </ServiceEntry>

      <ServiceEntry entryName="created at">
        <p className="text-text-primary text-xs">
          {creationDate.substring(0, 10)}
        </p>
      </ServiceEntry>

      <ServiceEntry entryName="provider">
        <ServiceProviderToIcon serviceProvider={serviceProvider} />
      </ServiceEntry>
    </div>
  );
}

function ServiceEntry({ entryName, children }) {
  return (
    <div className="flex flex-row py-2 justify-start items-center gap-5 w-full border-b last:border-0 border-sidebar-border">
      <h1 className="text-text-secondary text-sm min-w-18">{entryName}</h1>
      <div className="flex flex-col justify-center items-center">
        {children}
      </div>
    </div>
  );
}

function ServiceTypeToIcon({ serviceType }) {
  if (serviceType === "storage") {
    return <HardDrive className="rounded-sm size-8 text-text-primary p-0.5" />;
  } else {
    return <Globe className="rounded-sm size-8 text-text-primary p-0.5" />;
  }
}

function ServiceProviderToIcon({ serviceProvider }) {
  if (serviceProvider === "AWS") {
    return (
      <div className="flex items-center rounded-sm size-8 text-text-primary p-0.5">
        <img src="/aws.svg" alt="AWS" />
      </div>
    );
  } else {
    return <Globe className="rounded-sm size-8 text-text-primary p-0.5" />;
  }
}
