import { Link } from "react-router";
import {
  Trash,
  Hourglass,
  CircleCheckBig,
  CirclePause,
  CircleDot,
  Loader,
  RotateCw,
  Power,
  TriangleAlert
} from "lucide-react";
import Card, { CardEntry } from "./ui/Card";
import { Globe } from "lucide-react";
import { deleteInstance, restartInstance, startInstance, stopInstance } from "../apis/ec2";
import clsx from "clsx";
import type { ReactNode } from "react";
import awsIcon from "@/public/aws.svg";

const STATE_MAPPING = {
  pending: {
    className: "text-orange-400",
    get icon() {
      return <Hourglass size={15} className={this.className} />;
    }
  },

  running: {
    className: "text-green-500",
    get icon() {
      return <CircleCheckBig size={15} className={this.className} />;
    }
  },

  stopping: {
    className: "text-purple-400",
    get icon() {
      return <Loader size={15} className={this.className} />;
    }
  },

  stopped: {
    className: "text-purple-700",
    get icon() {
      return <CirclePause size={15} className={this.className} />;
    }
  },

  rebooting: {
    className: "text-blue-400",
    get icon() {
      return <RotateCw size={15} className={this.className} />;
    }
  },

  "shutting-down": {
    className: "text-red-400",
    get icon() {
      return <Power size={15} className={this.className} />;
    }
  },

  terminated: {
    className: "text-red-600",
    get icon() {
      return <Trash size={15} className={this.className} />;
    }
  },

  unknown: {
    className: "text-gray-400",
    get icon() {
      return <CircleDot size={15} className={this.className} />;
    }
  },

  // Error or failure case
  error: {
    className: "text-red-500",
    get icon() {
      return <TriangleAlert size={15} className={this.className} />;
    }
  }
};

type EC2ServiceCardProps = {
  Name: string | undefined;
  instanceID: string | undefined;
  instanceState: string | undefined;
  instanceType: string | undefined;
  creationDate: string | undefined;
  publicIp: string | undefined;
  platform: string | undefined;
  serviceProvider: string | undefined;
};

const EntryText = ({ children }: { children: ReactNode }) => {
  return <p className="text-text-primary text-xs">{children}</p>;
};

export default function EC2ServiceCard({
  Name,
  instanceID,
  instanceState,
  instanceType,
  creationDate,
  publicIp,
  platform,
  serviceProvider
}: EC2ServiceCardProps) {
  const serviceHeader = (
    <Link to={`/instances/`}>
      <h1 className="text-text-primary hover:text-accent text-sm underline">{Name}</h1>
    </Link>
  );

  const dropDownEntries = (
    <>
      <div
        className={`
          flex gap-2 items-center 
          text-success hover:bg-success-background/20
          py-1 px-2 cursor-pointer
          transition-colors duration-150`}
        onClick={() => {
          if (!instanceID) {
            throw new Error("Instanec ID not available");
          }
          startInstance(instanceID);
        }}
      >
        <Power size={17} />
        <p>Start</p>
      </div>

      {/* Stop */}
      <div
        className={`
          flex gap-2 items-center 
          text-careful hover:bg-careful-background/20
          py-1 px-2 cursor-pointer
          transition-colors duration-150`}
        onClick={() => {
          if (!instanceID) {
            throw new Error("Instanec ID not available");
          }
          stopInstance(instanceID);
        }}
      >
        <CirclePause size={17} />
        <p>Stop</p>
      </div>

      {/* Restart */}
      <div
        className={`
          flex gap-2 items-center 
          text-info hover:bg-info-background/20
          py-1 px-2 cursor-pointer
          transition-colors duration-150`}
        onClick={() => {
          if (!instanceID) {
            throw new Error("Instanec ID not available");
          }
          restartInstance(instanceID);
        }}
      >
        <RotateCw size={17} />
        <p>Restart</p>
      </div>

      {/* Terminate */}
      <div
        className="flex gap-2 items-center text-warning hover:bg-destructive hover:text-destructive-foreground py-1 px-2 cursor-pointer transition-colors duration-150"
        onClick={() => {
          if (!instanceID) {
            throw new Error("Instanec ID not available");
          }
          deleteInstance(instanceID);
        }}
      >
        <Trash size={17} />
        <p>Terminate</p>
      </div>
    </>
  );

  const stateKey = (instanceState || "unknown") as keyof typeof STATE_MAPPING;
  const entires = (
    <>
      <CardEntry entryName="Instance ID">
        <EntryText>{instanceID}</EntryText>
      </CardEntry>

      <CardEntry entryName="Instance state">
        <div className="flex flex-row items-center gap-2">
          {(STATE_MAPPING[stateKey] ?? STATE_MAPPING["unknown"]).icon}
          <p
            className={clsx(
              "text-xs",
              (STATE_MAPPING[stateKey] ?? STATE_MAPPING["unknown"]).className
            )}
          >
            {instanceState}
          </p>
        </div>
      </CardEntry>

      <CardEntry entryName="Instance type">
        <EntryText>{instanceType}</EntryText>
      </CardEntry>

      <CardEntry entryName="Public IP">
        <EntryText>{publicIp}</EntryText>
      </CardEntry>

      <CardEntry entryName="Launch time">
        <EntryText>{creationDate?.substring(0, 10) || "Creation Date Not Available"}</EntryText>
      </CardEntry>

      <CardEntry entryName="Platform">
        <EntryText>{platform}</EntryText>
      </CardEntry>

      <CardEntry entryName="provider">
        <ServiceProviderToIcon serviceProvider={serviceProvider || "AWS"} />
      </CardEntry>
    </>
  );

  return (
    <Card headerContent={serviceHeader} dropDownMenuContent={dropDownEntries}>
      {entires}
    </Card>
  );
}

function ServiceProviderToIcon({ serviceProvider }: { serviceProvider: string }) {
  if (serviceProvider === "AWS") {
    return (
      <div className="flex items-center rounded-sm size-8 text-text-primary p-0.5">
        <img src={awsIcon} alt="AWS" />
      </div>
    );
  } else {
    return <Globe className="rounded-sm size-8 text-text-primary p-0.5" />;
  }
}
