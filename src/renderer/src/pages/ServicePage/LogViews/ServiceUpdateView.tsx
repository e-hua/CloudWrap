import type { UpdateServicePayload } from "@/apis/services/service.schema";
import LogView from "./LogView";

type UpdateViewProps = {
  payload: UpdateServicePayload | undefined;
  id: string;
};

function ServiceUpdateView({ payload, id }: UpdateViewProps) {
  if (payload) {
    return (
      <LogView
        key={JSON.stringify(payload)}
        enabled={true} 
        starter={() => window.api.services.update(id, payload)} 
        listener={(callback) => window.api.services.onUpdateLog(id, callback)} 
      />
    );
  } else {
    return <LogView enabled={false} />;
  }
}

export default ServiceUpdateView;
