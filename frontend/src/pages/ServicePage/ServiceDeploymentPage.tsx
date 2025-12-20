import {
  fetchDeployments,
  reDeploy,
  type BackendPipelineExecutionSummary,
} from "@/apis/services/deployments";
import { fetchService } from "@/apis/services/services";
import type { DBServerType, DBSiteType } from "@/apis/services/services.types";
import { processUpdateTime } from "@/components/ProjectCard";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { useQuery, useQueryClient } from "@/lib/query-lite";
import type { PipelineExecutionStatus } from "@aws-sdk/client-codepipeline";
import { SiGithub } from "@icons-pack/react-simple-icons";
import clsx from "clsx";
import { CloudUpload, GitCommitHorizontal, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";

function ServiceDeploymentPage() {
  const { serviceNumber } = useParams();

  const queryClient = useQueryClient();

  const { data, status } = useQuery({
    queryKey: `deployment-${serviceNumber}`,
    queryFunction: () => fetchDeployments(serviceNumber),
  });

  const { data: serviceData } = useQuery({
    queryKey: `service-${serviceNumber}`,
    queryFunction: () => fetchService(Number(serviceNumber)),
  });

  const [redeploying, setRedeploying] = useState(false);

  if (!data && status === "loading") {
    return (
      <Skeleton
        className="
    bg-sidebar-background w-full h-[60vh]
    rounded-md border border-sidebar-border overflow-hidden"
      />
    );
  } else if (!data) {
    return;
  }

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="w-full flex flex-row justify-end">
        <Button
          variation="secondary"
          onClick={async () => {
            setRedeploying(true);
            await reDeploy(serviceNumber);
            queryClient.invalidateQuery(`deployment-${serviceNumber}`);
            setRedeploying(false);
          }}
          disabled={redeploying}
        >
          {redeploying ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <CloudUpload size={16} />
          )}
          <p>ReDeploy</p>
        </Button>
      </div>
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
    </div>
  );
}

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
  className,
}: {
  summary: BackendPipelineExecutionSummary | undefined;
  serviceData: DBServerType | DBSiteType | undefined;
  className?: string;
}) {
  const navigate = useNavigate();
  if (!serviceData) {
    return;
  } else if (!summary) {
    return;
  }

  return (
    <div
      className={clsx(
        `flex flex-row 
          justify-between items-center 
          w-full bg-sidebar-selected p-4
          border-t border-sidebar-border first:border-t-0`,
        className
      )}
    >
      <a
        className="
        flex-1 truncate min-w-0
        text-text-primary text-sm font-semibold 
        hover:text-accent hover:underline"
        onClick={() =>
          navigate(
            `/services/${serviceData.id}/deployment/${summary.pipelineExecutionId}`
          )
        }
      >
        {summary.pipelineExecutionId}
      </a>

      <div
        className="
      flex-1
      flex flex-col 
      justify-start items-center gap-1"
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
            {summary?.sourceRevisions?.[0]?.revisionSummary
              ? JSON.parse(summary.sourceRevisions[0].revisionSummary)
                  .CommitMessage
              : "No commit message"}
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

export default ServiceDeploymentPage;
export { ServiceDeploymentEntry };
export { msToHHMMSS };
