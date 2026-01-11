import Button from "@/components/ui/Button";
import { useQuery, useQueryClient } from "@/lib/query-lite";
import clsx from "clsx";
import { Copy, LoaderCircle } from "lucide-react";
import { ElementType, useState } from "react";
import { useNavigate } from "react-router";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 200);
      }}
    >
      <Copy
        size={14}
        className={clsx(
          "hover:text-accent-background dark:hover:text-accent",
          copied ? "text-accent-background dark:text-accent scale-110" : "text-text-secondary",
          "transition-all",
          "duration-300"
        )}
      />
    </button>
  );
}

function ConfigRow({
  label,
  value,
  icon: Icon,
  copy
}: {
  label: string;
  value: string;
  icon?: ElementType;
  copy: boolean;
}) {
  return (
    <div
      className="
    flex flex-row 
    text-text-secondary bg-sidebar-background 
    border border-sidebar-border 
    rounded-xl overflow-hidden p-5"
    >
      {Icon && <Icon />}
      <div className="flex flex-col w-full">
        <p className="text-xs font-medium text-text-primary uppercase tracking-wider">{label}</p>
        <div className="w-full flex flex-row items-center justify-between">
          <p className={"text-sm text-text-secondary mt-0.5"}>{value}</p>
          {copy && <CopyButton text={value} />}
        </div>
      </div>
    </div>
  );
}

function CredentialsPage() {
  const { data } = useQuery({
    queryKey: "app-credentials-status",
    queryFunction: async () => {
      const res = await window.api.onboarding.configs();
      if (!res.success) {
        throw new Error(res.error);
      }
      return res.data;
    },
    staleTime: 5000
  });

  const { data: githubConnection, status: connectionLoadingStatus } = useQuery({
    queryKey: "app-github-connection",
    queryFunction: async () => {
      const res = await window.api.onboarding.githubConnection(
        data?.isOnboarded ? data.githubConnectionArn : ""
      );

      if (!res.success) {
        throw new Error(res.error);
      }
      return res.data;
    },
    staleTime: 5000
  });

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  async function resetKeys() {
    try {
      await window.api.onboarding.reset();
    } catch (err) {
      console.error(err);
    }
    setDeleting(false);
    queryClient.removeQueryWithKey("app-credentials-status");
    navigate("/onboarding");
  }

  const openAwsConsole = () => {
    if (data?.isOnboarded) {
      if (!data?.githubConnectionArn || !data?.awsRegion) return;

      const parts = data.githubConnectionArn.split(":");
      const region = parts[3];
      const accountId = parts[4];
      const connectionId = parts[5].split("/")[1];

      const url = `https://${region}.console.aws.amazon.com/codesuite/settings/${accountId}/${region}/codestar-connections/connections/${connectionId}?region=${region}`;
      window.open(url, "_blank");
    }
  };

  if (!data?.isOnboarded) {
    return (
      <div className="p-8 text-center text-text-primary">
        <h2 className="text-xl">Not Onboarded</h2>
        <Button variation="default" className="mt-4" onClick={() => navigate("/onboarding")}>
          Go to Setup
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-5 flex flex-col gap-10">
      <div className="flex flex-col w-full justify-between gap-4">
        <h1 className="text-text-primary text-xl">Credentials and Configs</h1>
        <div className="flex flex-row justify-between items-center">
          <p className="text-text-secondary text-sm mt-1">
            Manage your connection to AWS and CloudWrap resources.
          </p>
          <div className="flex flex-row w-fit gap-5">
            <Button
              variation={githubConnection === "AVAILABLE" ? "disabled" : "secondary"}
              className="text-center"
              onClick={() => {
                openAwsConsole();
                queryClient.invalidateQuery("app-github-connection");
              }}
            >
              {connectionLoadingStatus === "success" ? (
                githubConnection === "AVAILABLE" ? (
                  "Github Connected!"
                ) : (
                  "Verify Github ARN"
                )
              ) : (
                <LoaderCircle className="animate-spin" />
              )}
            </Button>
            <Button
              variation="destructive"
              className="text-center"
              onClick={async () => {
                setDeleting(true);
                await resetKeys();
              }}
            >
              {deleting ? <LoaderCircle className="animate-spin" /> : <p>Delete keys</p>}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <h1 className="text-text-primary font-mono">AWS Configs</h1>
          <ConfigRow label={"AWS Region"} value={data.awsRegion} copy={false} />
          <ConfigRow label={"AWS Access Key"} value={"enncrypted & Secure"} copy={false} />
          <ConfigRow label={"AWS Access Key"} value={"enncrypted & Secure"} copy={false} />

          <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-4 text-xs text-text-secondary leading-relaxed">
            <strong className="text-info">Note:</strong> We do not display your raw Access Keys for
            security reasons. If you need to rotate them, please delete keys and run the onboarding
            process again.
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-text-primary font-mono">OpenTofu Infrastructures</h1>
          <ConfigRow label={"OpenTofu state bucket name"} value={data.tfStateBucket} copy />
          <ConfigRow label={"OpenTofu provision IAM role ARN"} value={data.tfRoleARN} copy />
          <ConfigRow label={"CloudWrap service IAM role ARN"} value={data.roleARN} copy />
          <ConfigRow
            label={"CloudWrap Github connection ARN"}
            value={data.githubConnectionArn}
            copy
          />
        </div>
      </div>
    </div>
  );
}

export default CredentialsPage;
