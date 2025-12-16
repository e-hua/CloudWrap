import type { CreateServicePayload } from "@/apis/service.schema";
import { createService } from "@/apis/services";
import LogView from "./LogView";

type DeploymentViewProps = {
  payload: CreateServicePayload | undefined;
};

function NewServiceDeploymentView({ payload }: DeploymentViewProps) {
  if (payload) {
    return (
      <LogView enabled={true} streamLogsFunc={() => createService(payload)} />
    );
  } else {
    return <LogView enabled={false} />;
  }
}

export default NewServiceDeploymentView;
