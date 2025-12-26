import LogView from "./LogView";
import type { DeleteServicePayload } from "@/apis/services/service.schema";

type DeletionViewProps = {
  enabled: boolean;
  payload: DeleteServicePayload;
  id?: string;
  endOfDeletionCallback: () => void;
};

function ServiceDeletionView({
  payload,
  enabled,
  id,
  endOfDeletionCallback,
}: DeletionViewProps) {
  if (enabled && id) {
    return (
      <LogView
        key={JSON.stringify(payload)}
        enabled={true} 
        starter={() => window.api.services.delete(id, payload)} 
        listener={(callback) => window.api.services.onDeleteLog(id, callback)} 
        endOfStreamCallback={endOfDeletionCallback}
      />
    );
  } else {
    return <LogView enabled={false} />;
  }
}

export default ServiceDeletionView;
