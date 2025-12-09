import { BACKEND_ENDPOINT_URL } from "@/config/constants";
import Xterm from "@/lib/log-stream-lite/Xterm";

const testSSEURL = `${BACKEND_ENDPOINT_URL}testSSE/`;

function LogViewPage() {
  return <Xterm url={testSSEURL} />;
}

export default LogViewPage;
