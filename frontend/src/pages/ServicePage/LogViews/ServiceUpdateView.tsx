import type { UpdateServicePayload } from "@/apis/service.schema";
import { updateService } from "@/apis/services";
import LogView from "./LogView";

type UpdateViewProps = {
  payload: UpdateServicePayload | undefined;
  id: string;
};

function ServiceUpdateView({ payload, id }: UpdateViewProps) {
  if (payload) {
    return (
      <LogView
        enabled={true}
        streamLogsFunc={() => updateService(payload, id)}
      />
    );
  } else {
    return <LogView enabled={false} />;
  }
}

export default ServiceUpdateView;
