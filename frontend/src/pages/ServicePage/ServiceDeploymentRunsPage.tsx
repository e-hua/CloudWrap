import { fetchDeployments, reDeploy } from "@/apis/services/deployments";
import { fetchService, serviceURL } from "@/apis/services/services";
import { useSSE } from "@/hooks/useSSE";
import { useQuery, useQueryClient } from "@/lib/query-lite";
import type { ActionExecutionDetail } from "@aws-sdk/client-codepipeline";
import { useState, type ReactNode } from "react";
import { useParams } from "react-router";
import { msToHHMMSS, ServiceDeploymentEntry } from "./ServiceDeploymentPage";
import type { ActionExecutionStatus } from "@aws-sdk/client-codepipeline";
import {
  Check,
  CircleSlash,
  X,
  LoaderCircle,
  ChevronRight,
  CloudUpload,
} from "lucide-react";
import clsx from "clsx";
import BuildLogView from "./LogViews/BuildLogView";
import Skeleton from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";

const actionStatusIcons: Record<ActionExecutionStatus, ReactNode> = {
  Abandoned: (
    <div className="text-text-secondary">
      <CircleSlash className="stroke-3" size={16} />
    </div>
  ),
  InProgress: (
    <div className="text-yellow-600 dark:text-yellow-500 animate-spin">
      <LoaderCircle className="stroke-3" size={16} />
    </div>
  ),
  Failed: (
    <div className="bg-red-600 dark:bg-red-500 rounded-full p-[2px]">
      <X className="text-background stroke-3" size={12} />
    </div>
  ),
  Succeeded: (
    <div className="bg-green-700 dark:bg-green-500 rounded-full p-[2px]">
      <Check className=" text-background stroke-3" size={12} />
    </div>
  ),
};

function ServiceDeploymentRunsPage() {
  const queryClient = useQueryClient();
  const { serviceNumber, executionId } = useParams();
  const [actions, setActions] = useState<ActionExecutionDetail[]>([]);
  const [redeploying, setRedeploying] = useState(false);

  const { data: deploymentData } = useQuery({
    queryKey: `deployment-${serviceNumber}`,
    queryFunction: () => fetchDeployments(serviceNumber),
  });

  const { data: serviceData } = useQuery({
    queryKey: `service-${serviceNumber}`,
    queryFunction: () => fetchService(Number(serviceNumber)),
  });

  const { loading: SSELoading } = useSSE({
    url: `${serviceURL}${serviceNumber}/deploys/${executionId}`,
    onMessage: (event) => {
      // data: {"source":"pipeline-status","data":[]}
      const data = JSON.parse(event.data);

      if (data.source === "pipeline-status") {
        const currActions: ActionExecutionDetail[] = data.data;
        setActions(currActions);
      }
    },
    onSSEClose: () =>
      queryClient.invalidateQuery(`deployment-${serviceNumber}`),
  });

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
          <p>Redeploy</p>
        </Button>
      </div>

      <div className="w-full flex flex-col items-center border border-sidebar-border rounded-md overflow-hidden">
        <ServiceDeploymentEntry
          summary={(deploymentData || []).find(
            (elem) => elem.pipelineExecutionId === executionId
          )}
          serviceData={serviceData}
          className="bg-transparent"
        />
        <div className="w-full">
          {SSELoading ? (
            <Skeleton className="w-full h-60" />
          ) : (
            actions
              .sort(
                (a, b) =>
                  (a.startTime ? new Date(a.startTime) : new Date()).getTime() -
                  (b.startTime ? new Date(b.startTime) : new Date()).getTime()
              )
              .map((elem, idx) => {
                return (
                  <ActionEntry
                    key={idx}
                    actionDetail={elem}
                    serviceNumber={serviceNumber}
                  />
                );
              })
          )}
        </div>
      </div>
    </div>
  );
}

function ActionEntry({
  actionDetail,
  serviceNumber,
}: {
  actionDetail: ActionExecutionDetail;
  serviceNumber: string | undefined;
}) {
  if (!serviceNumber) {
    return;
  }

  const [actionExpanded, setActionExpanded] = useState(false);

  return (
    <div
      className="    
      flex flex-col items-center
      w-full 
      first:border-t first:border-sidebar-border"
    >
      <div
        className="
    w-full p-2
    hover:bg-sidebar-hovered
    flex flex-row justify-between
    text-text-secondary text-sm font-mono"
        onClick={() =>
          setActionExpanded((prevExpanded) => {
            console.log(prevExpanded);
            console.log(actionDetail);
            console.log(
              actionDetail.output?.executionResult?.externalExecutionId
            );
            if (actionDetail.actionName === "Build") {
              return !prevExpanded;
            }
            return prevExpanded;
          })
        }
      >
        <div className="flex flex-row gap-1 items-center">
          {
            <ChevronRight
              size={16}
              className={clsx(
                actionDetail.actionName === "Build" ? "" : "invisible",
                "transition-transform",
                actionExpanded ? "rotate-90" : ""
              )}
            />
          }
          {actionStatusIcons[actionDetail.status || "Abandoned"]}
          <p>{actionDetail.actionName}</p>
        </div>

        <p>
          {msToHHMMSS(
            (actionDetail.lastUpdateTime
              ? new Date(actionDetail.lastUpdateTime)
              : new Date()
            ).getTime() -
              (actionDetail.startTime
                ? new Date(actionDetail.startTime)
                : new Date()
              ).getTime()
          )}
        </p>
      </div>

      {actionExpanded && (
        <BuildLogView
          serviceNumber={serviceNumber}
          buildId={actionDetail.output?.executionResult?.externalExecutionId}
        />
      )}
    </div>
  );
}

export default ServiceDeploymentRunsPage;
