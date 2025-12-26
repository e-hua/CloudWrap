import type { CreateServicePayload } from "@/apis/services/service.schema";
import LogView from "./LogView";

type DeploymentViewProps = {
  payload: CreateServicePayload | undefined;
};

function NewServiceDeploymentView({ payload }: DeploymentViewProps) {
  if (payload) {
    return (
      <LogView 
        key={JSON.stringify(payload)}
        enabled={true} 
        starter={() => window.api.services.create(payload)} 
        listener={window.api.services.onCreateLog} 
      />
    );
  } else {
    return <LogView enabled={false} />;
  }
}

export default NewServiceDeploymentView;
