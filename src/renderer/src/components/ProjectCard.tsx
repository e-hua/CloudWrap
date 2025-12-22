import type { DBServiceType } from "@/apis/services/services.types";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { AppWindow, GitBranch, Server } from "lucide-react";
import { useNavigate } from "react-router";

type ProjectCardProps = {
  data: DBServiceType;
};

function processUpdateTime(updatedAt: string) {
  const lastUpdatedTime = new Date(updatedAt);
  const lastUpdatedYear = lastUpdatedTime.getFullYear();

  const currYear = new Date().getFullYear();

  if (lastUpdatedYear === currYear) {
    return lastUpdatedTime
      .toDateString()
      .substring(4)
      .replace(currYear.toString(), "");
  } else {
    return lastUpdatedTime.toDateString().substring(4);
  }
}

function ProjectCard({ data }: ProjectCardProps) {
  const navigate = useNavigate();
  return (
    <div
      className="
    bg-surface-primary 
    border-1 border-sidebar-border
    rounded-md
    px-4 py-2
    flex flex-col gap-2
    w-full
    "
    >
      <div className="flex flex-row items-center text-text-primary gap-4">
        {data.type === "server" ? <Server /> : <AppWindow />}
        <div className="flex flex-col gap-1 truncate">
          <h2
            className="
          text-xs truncate 
          hover:text-accent hover:underline"
            onClick={() => {
              navigate(data.id.toString());
            }}
          >
            {data.name}
          </h2>
          <a
            className="
            text-xs text-text-secondary truncate
            hover:underline"
            href={
              data.cloudFrontDomainName.startsWith("https://")
                ? data.cloudFrontDomainName
                : "https://" + data.cloudFrontDomainName
            }
            target="_blank"
          >
            {data.cloudFrontDomainName.replace("https://", "")}
          </a>
        </div>
      </div>

      <div className="w-fit flex flex-row gap-1 items-center bg-badge rounded-xl p-1 text-text-primary">
        <SiGithub size={14} />
        <p className="text-xs">{data.repoId}</p>
      </div>

      <span className="text-text-secondary text-xs">
        {processUpdateTime(data.updatedAt)} on
        <span className="px-1">
          <GitBranch className="inline-block" size={14} />
        </span>
        <p className="inline">{data.branchName}</p>
      </span>
    </div>
  );
}

export default ProjectCard;
export { processUpdateTime };
