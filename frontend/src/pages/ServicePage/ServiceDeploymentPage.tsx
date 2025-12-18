import {
  fetchDeployments,
  type BackendPipelineExecutionSummary,
} from "@/apis/services/deployments";
import { fetchService } from "@/apis/services/services";
import type { DBServerType, DBSiteType } from "@/apis/services/services.types";
import { processUpdateTime } from "@/components/ProjectCard";
import { useQuery } from "@/lib/query-lite";
import type { PipelineExecutionStatus } from "@aws-sdk/client-codepipeline";
import { SiGithub } from "@icons-pack/react-simple-icons";
import clsx from "clsx";
import { GitCommitHorizontal } from "lucide-react";
import { useParams } from "react-router";

function ServiceDeploymentPage() {
  const { serviceNumber } = useParams();

  const { data, status } = useQuery({
    queryKey: `deployment-${serviceNumber}`,
    queryFunction: () => fetchDeployments(serviceNumber),
  });

  const { data: serviceData } = useQuery({
    queryKey: `service-${serviceNumber}`,
    queryFunction: () => fetchService(Number(serviceNumber)),
  });

  if (!data && status === "loading") {
    return <p className="text-blue-400">Loading ...</p>;
  } else if (!data) {
    return;
  }

  return (
    <div className="w-full rounded-md border border-sidebar-border overflow-hidden">
      {data.map((elem, idx) => {
        return (
          <ServiceDeploymentEntry
            key={idx}
            summary={elem}
            serviceData={serviceData}
          />
        );
      })}
    </div>
  );
}

export default ServiceDeploymentPage;

const statusConfig: Record<PipelineExecutionStatus, { className: string }> = {
  Succeeded: {
    className: "bg-cyan-500 dark:bg-cyan-400",
  },
  InProgress: {
    className: "bg-blue-500 dark:bg-blue-500",
  },
  Failed: {
    className: "bg-red-500 dark:bg-red-500",
  },
  Stopping: {
    className: "bg-amber-500 dark:bg-amber-400",
  },
  Stopped: {
    className: "bg-gray-400 dark:bg-gray-500",
  },
  Cancelled: {
    className: "bg-gray-400 dark:bg-gray-500",
  },
  Superseded: {
    className: "bg-slate-300 dark:bg-slate-600",
  },
};

function msToHHMMSS(ms: number): string {
  const seconds = Math.trunc(ms / 1000);
  const secondsLeft = seconds % 60;

  const minutes = Math.trunc((seconds - secondsLeft) / 60);
  const minutesLeft = minutes % 60;

  const hours = Math.trunc((minutes - minutesLeft) / 60);

  if (hours) {
    return `${hours}h ${minutesLeft}m ${secondsLeft}s`;
  } else if (minutesLeft) {
    return `${minutesLeft}m ${secondsLeft}s`;
  } else {
    return `${secondsLeft}s`;
  }
}

function ServiceDeploymentEntry({
  summary,
  serviceData,
}: {
  summary: BackendPipelineExecutionSummary;
  serviceData: DBServerType | DBSiteType | undefined;
}) {
  if (!serviceData) {
    return;
  }

  return (
    <div
      className="
    flex flex-row 
    justify-between items-center 
    w-full bg-sidebar-selected p-4
    border-t border-sidebar-border first:border-t-0
    "
    >
      <h2
        className="
        flex-1 truncate min-w-0
        text-text-primary text-sm font-semibold 
        hover:text-accent hover:underline"
      >
        {summary.pipelineExecutionId}
      </h2>

      <div
        className="
      flex-1
      flex flex-col items-center gap-1"
      >
        <div className="flex flex-row items-center gap-2">
          <span
            className={clsx(
              "size-2 rounded-full",
              statusConfig[summary.status || "Cancelled"].className
            )}
          />

          <span className="text-sm text-text-secondary">{summary.status}</span>
        </div>
        <p className="text-text-secondary text-sm font-mono">
          {msToHHMMSS(
            (summary.lastUpdateTime
              ? new Date(summary.lastUpdateTime)
              : new Date()
            ).getTime() -
              (summary.startTime
                ? new Date(summary.startTime)
                : new Date()
              ).getTime()
          )}
        </p>
      </div>

      <div
        className="
      flex-1 min-w-0
      flex flex-col items-start
      gap-1 text-text-primary/80 text-sm"
      >
        <div className="flex flex-row items-center gap-2 w-full">
          <SiGithub size={14} className="shrink-0" />
          <a
            className="truncate flex-1 min-w-0 hover:underline"
            href={`https://github.com/${serviceData.repoId}/commit/${
              (summary?.sourceRevisions || [])[0]?.revisionId
            }`}
            target="_blank"
          >
            {(summary?.sourceRevisions || [])[0]?.revisionId}{" "}
          </a>
        </div>

        <div className="flex flex-row items-center gap-2 w-full">
          <GitCommitHorizontal size={14} className="shrink-0" />{" "}
          <p className="truncate flex-1 min-w-0">
            {
              JSON.parse(
                (summary?.sourceRevisions || [])[0]?.revisionSummary || ""
              ).CommitMessage
            }
          </p>
        </div>
      </div>

      <div
        className="
      flex-1 min-w-0
      flex flex-col 
      text-right
      text-text-secondary text-sm"
      >
        <p className="truncate">
          {processUpdateTime(summary.startTime)}{" "}
          {new Date(summary.startTime).toLocaleTimeString()}
        </p>
        <p className="min-w-0 truncate">by {summary.trigger?.triggerType}</p>
      </div>
    </div>
  );
}
