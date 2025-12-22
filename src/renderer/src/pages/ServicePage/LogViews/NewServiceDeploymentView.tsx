import type { CreateServicePayload } from "@/apis/services/service.schema";
import { createService } from "@/apis/services/services";
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
