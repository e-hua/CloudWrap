import type { UpdateServicePayload } from "@/apis/services/service.schema";
import { fetchService } from "@/apis/services/services";
import type {
  DBServerType,
  DBServiceType,
} from "@/apis/services/services.types";
import Button from "@/components/ui/Button";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { useMutation, useQuery, useQueryClient } from "@/lib/query-lite";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { Copy, GitBranch } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "react-router";
import { InstanceTypeList } from "../InstancePage";
import ServiceUpdateView from "./LogViews/ServiceUpdateView";
import ServiceDeletionView from "./LogViews/ServiceDeletionView";

type EntryWithValueProps = {
  name: string;
  children: ReactNode;
};

function EntryWithValue({ name, children }: EntryWithValueProps) {
  return (
    <div className="flex flex-col text-sm">
      <p className="text-text-secondary">{name}</p>
      <div className="text-wrap">{children}</div>
    </div>
  );
}

type BottomBorderInputProps = {
  name: string;
  modifying?: boolean;
  value?: string;
  onValueChange: (newValue: string) => void;
};

function BottomBorderInput({
  name,
  modifying,
  value,
  onValueChange,
}: BottomBorderInputProps) {
  if (modifying) {
    return (
      <div className="flex flex-col text-sm w-fit">
        <p className="text-text-secondary">{name}</p>
        <input
          className="border-0 border-b-1 border-b-text-secondary focus:border-b-accent outline-0 text-text-primary"
          value={value || ""}
          onChange={(event) => onValueChange(event.target.value)}
        />
      </div>
    );
  } else {
    return (
      <EntryWithValue name={name}>
        <p className="text-text-primary">{value}</p>
      </EntryWithValue>
    );
  }
}

function ServiceSettingsPage() {
  const { serviceNumber } = useParams();

  const { data } = useQuery({
    queryKey: `service-${serviceNumber}`,
    queryFunction: () => fetchService(Number(serviceNumber)),
  });

  const [modifyingProject, setModifyingProject] = useState<boolean>(false);
  const [submittingUpdates, setSubmittingUpdates] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [updatePayload, setUpdatePayload] = useState<UpdateServicePayload>({
    type: "server",
    // Hardcoded dummy value for testing, need to be updated later
    githubConnectionArn:
      "arn:aws:codestar-connections:us-east-2:276291856310:connection/e7b8cd7c-295f-4776-9f93-4356f180edd6",
  });

  const queryClient = useQueryClient();

  const deleteServiceMutation = useMutation({
    mutationFunction: async () => {
      // Just a dummy function to trigger the re-fetching
    },
    onSuccess: () => queryClient.invalidateQuery(`service-${serviceNumber}`),
  });

  useEffect(() => {
    if (!submittingUpdates) {
      setUpdatePayload((prev) => {
        const newPayload = {
          ...prev,
          ...data,
          rootDirectory: data?.rootDir,
          instance_type: (data as DBServerType)?.instanceType,
          container_port: (data as DBServerType)?.containerPort,
          dockerfile_path: (data as DBServerType)?.dockerfilePath,
        };

        return newPayload;
      });
    }
  }, [data, modifyingProject, submittingUpdates]);

  if (!data || !serviceNumber) {
    return;
  }

  return (
    <div className="w-full px-5 flex flex-col gap-10">
      <div
        className="
        flex flex-row w-full 
        p-3
        bg-sidebar-background 
        border-1 border-sidebar-border rounded-xl"
      >
        <div
          className="
        w-full
        p-2 gap-5
        flex flex-col
        align-top
        flex-1
        "
        >
          <div className="flex flex-row gap-2 ">
            <div className="w-fit flex flex-row gap-1 items-center p-1 text-text-secondary">
              <SiGithub className="text-text-primary" size={14} />
              <p className="text-xs">{data.repoId}</p>
              <GitBranch size={14} />
              <p className="text-xs">{data.branchName}</p>
            </div>
          </div>

          <div className="flex flex-row items-center gap-2">
            <a
              className="
            text-xs text-accent truncate
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
            <Copy
              size={14}
              className="text-accent hover:text-accent-background"
              onClick={() => {
                const urlToCopy = data.cloudFrontDomainName.startsWith(
                  "https://"
                )
                  ? data.cloudFrontDomainName
                  : "https://" + data.cloudFrontDomainName;

                navigator.clipboard.writeText(urlToCopy);
                // Need a toast in the future to come
              }}
            />
          </div>

          <EntryWithValue name={"Region"}>
            <p className="text-text-primary">{data.region}</p>
          </EntryWithValue>

          <EntryWithValue name={"Created"}>
            <p className="text-text-primary">
              {data.createdAt.split(" ")[0] +
                " " +
                new Date(data.createdAt + "Z").toLocaleTimeString()}
            </p>
          </EntryWithValue>

          <EntryWithValue name={"Updated"}>
            <p className="text-text-primary">
              {data.updatedAt.split(" ")[0] +
                " " +
                new Date(data.updatedAt + "Z").toLocaleTimeString()}
            </p>
          </EntryWithValue>
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-5">
          <ServiceSpecificDetails
            data={data}
            payload={updatePayload}
            setPayload={setUpdatePayload}
            modifying={modifyingProject}
          />

          {modifyingProject && (
            <div className="flex flex-row justify-center gap-10">
              <Button
                variation="default"
                onClick={() => {
                  setSubmittingUpdates(true);
                }}
                className="w-fit"
              >
                {" "}
                <p>Submit</p>{" "}
              </Button>
              <Button
                variation="secondary"
                onClick={() => {
                  setModifyingProject(false);
                }}
                className="w-fit"
              >
                {" "}
                <p>Cancel</p>{" "}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-row justify-between">
        <Button
          variation="default"
          onClick={() => {
            setModifyingProject(true);
          }}
        >
          <p>Modify Project</p>
        </Button>

        <Button
          variation="destructive"
          onClick={() => {
            setDeleting(true);
          }}
        >
          <p>Delete</p>
        </Button>
      </div>

      {submittingUpdates && (
        <div
          className={`
        bg-sidebar-background 
        border-1 border-sidebar-border 
        p-4 rounded-xl`}
        >
          <ServiceUpdateView
            payload={submittingUpdates ? updatePayload : undefined}
            id={serviceNumber}
          />
        </div>
      )}

      {deleting && (
        <div
          className={`
        bg-sidebar-background 
        border-1 border-sidebar-border 
        p-4 rounded-xl`}
        >
          <ServiceDeletionView
            id={serviceNumber}
            enabled={deleting}
            payload={updatePayload}
            endOfDeletionCallback={() => {
              // 1 is just a dummy value to trigger mutation
              deleteServiceMutation.mutate(1);
            }}
          />
        </div>
      )}
    </div>
  );
}

type ServiceSpecificDetailsProps = {
  data: DBServiceType;
  payload: UpdateServicePayload;
  setPayload: (payload: UpdateServicePayload) => void;
  modifying: boolean;
};

function ServiceSpecificDetails({
  data,
  payload,
  setPayload,
  modifying,
}: ServiceSpecificDetailsProps) {
  if (payload.type === "server") {
    const serverData = data as DBServerType;
    return (
      <div className="flex flex-col justify-center gap-5">
        <BottomBorderInput
          name={"Root Directory"}
          value={payload.rootDirectory}
          onValueChange={(newVal: string) =>
            setPayload({ ...payload, rootDirectory: newVal })
          }
          modifying={modifying}
        />

        <EntryWithValue name={"Instance Type"}>
          {modifying ? (
            <Select
              selectedValue={payload.instance_type ?? ""}
              onValueChange={(newVal: string) =>
                setPayload({ ...payload, instance_type: newVal })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={"choose a type"} />
              </SelectTrigger>
              <InstanceTypeList />
            </Select>
          ) : (
            <p className="text-text-primary">{payload.instance_type}</p>
          )}
        </EntryWithValue>

        <BottomBorderInput
          name={"Container Port"}
          value={payload.container_port?.toString()}
          onValueChange={(newVal: string) =>
            setPayload({ ...payload, container_port: Number(newVal) })
          }
          modifying={modifying}
        />

        <BottomBorderInput
          name={"Dockerfile Path"}
          value={payload.dockerfile_path}
          onValueChange={(newVal: string) =>
            setPayload({ ...payload, dockerfile_path: newVal })
          }
          modifying={modifying}
        />

        <EntryWithValue name={"Secret Header Value"}>
          <p className="text-text-secondary text-xs">
            {" "}
            # Notice that your server have to manage the secret value
            <br />
            # To reject any header that don't have the exact secret value <br />
            name = "X-CloudWrap-Secret" <br />
            value = value of the secret below <br />
          </p>
          <p className="text-text-primary">{serverData.secretHeaderValue}</p>
        </EntryWithValue>
      </div>
    );
  } else {
    return (
      <div className="flex flex-col justify-center gap-5">
        <BottomBorderInput
          name={"Root Directory"}
          value={payload.rootDirectory}
          onValueChange={(newVal: string) =>
            setPayload({ ...payload, rootDirectory: newVal })
          }
          modifying={modifying}
        />

        <BottomBorderInput
          name={"Build Command"}
          value={payload.buildCommand}
          onValueChange={(newVal: string) =>
            setPayload({ ...payload, buildCommand: newVal })
          }
          modifying={modifying}
        />

        <BottomBorderInput
          name={"Publish Directory"}
          value={payload.publishDirectory}
          onValueChange={(newVal: string) =>
            setPayload({ ...payload, publishDirectory: newVal })
          }
          modifying={modifying}
        />
      </div>
    );
  }
}

export default ServiceSettingsPage;
