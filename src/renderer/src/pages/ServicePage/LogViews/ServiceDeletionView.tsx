import { deleteService } from "@/apis/services/services";
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
        enabled={true}
        streamLogsFunc={() => deleteService(payload, id)}
        endOfStreamCallback={endOfDeletionCallback}
      />
    );
  } else {
    return <LogView enabled={false} />;
  }
}

export default ServiceDeletionView;
