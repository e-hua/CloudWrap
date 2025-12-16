import Input from "@/components/ui/Input";
import { useState } from "react";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { GitBranch } from "lucide-react";
import type { ProjectType } from "@/apis/services.types";
import ToggleGroup from "@/components/ui/ToggleGroup";
import { InstanceTypeList } from "../InstancePage";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import type {
  CreateServicePayload,
  ServerAttributesType,
  StaticSiteAttributesType,
} from "@/apis/service.schema";
import NewServiceDeploymentView from "./LogViews/NewServiceDeploymentView";

type InputFieldProps = {
  text: string;
  value: any;
  setValue: (val: string) => void;
};

function InputField({ text, value, setValue }: InputFieldProps) {
  return (
    <div className={`p-2 ${text}`}>
      <p className="text-text-secondary text-sm">{text}</p>
      <div
        className={`
        text-text-primary 
        flex flex-row
        py-2 
        gap-4 items-center
        w-full`}
      >
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="w-30 px-2"
        />
      </div>
    </div>
  );
}

type ServiceSpecificAttributesType =
  | StaticSiteAttributesType
  | ServerAttributesType;

function NewServicePage() {
  const [repoId, setRepoId] = useState<string>("");
  const [branchName, setBranchName] = useState<string>("main");
  const [projectName, setProjectName] = useState<string>("");
  const [projectType, setProjectType] = useState<ProjectType>("static-site");
  const [rootDirectory, setRootDirectory] = useState<string>("./");
  const [serviceSpecificAttributes, setServiceSpecificAttributes] =
    useState<ServiceSpecificAttributesType>({
      buildCommand: "npm run build",
      publishDirectory: "dist",
    });

  const [payload, setPayload] = useState<CreateServicePayload | undefined>(
    undefined
  );

  const onChangeProjectType = (
    previousType: ProjectType,
    newType: ProjectType
  ) => {
    if (newType === previousType) {
      return;
    }

    if (newType === "server") {
      setServiceSpecificAttributes({
        container_port: 3030,
        instance_type: "t3.nano",
        dockerfile_path: "./Dockerfile",
      });
    } else {
      setServiceSpecificAttributes({
        buildCommand: "npm run build",
        publishDirectory: "dist",
      });
    }
  };

  return (
    <div
      className={`
    px-8 py-6
    w-full md:max-w-[690px] h-full 
    flex flex-col gap-5
    `}
    >
      <div className="flex flex-col bg-sidebar-background border-1 border-sidebar-border w-full h-full px-4 pt-4 gap-y-2 rounded-xl">
        <div className="w-full">
          <h1 className="text-text-primary text-3xl text-left font-semibold">
            Let's build something new
          </h1>
        </div>

        <div
          className={`
        text-text-primary 
        flex flex-row
        p-2 gap-4 items-center
        w-full`}
        >
          <SiGithub />
          <Input
            value={repoId}
            onChange={(event) => setRepoId(event.target.value)}
            className="px-2 w-125"
            placeholder={
              "Enter a Github repo Id to continue, format: user_name/repo_name"
            }
          />
        </div>

        <div className="p-2 branchName">
          <p className="text-text-secondary text-sm">Branch Name</p>
          <div
            className={`
        text-text-primary 
        flex flex-row
        py-2 
        gap-4 items-center
        w-full`}
          >
            <GitBranch />
            <Input
              value={branchName}
              onChange={(event) => setBranchName(event.target.value)}
              className="w-25 px-2"
            />
          </div>
        </div>

        <hr className="my-2 text-sidebar-border" />

        <div className="flex flex-row items-center justify-between">
          <InputField
            text={"Project Name"}
            value={projectName}
            setValue={setProjectName}
          />

          <InputField
            text={"Root Directory"}
            value={rootDirectory}
            setValue={setRootDirectory}
          />
        </div>

        <div className="p-2 projectType">
          <p className="text-text-secondary text-sm">Project Type</p>
          <div>
            <ToggleGroup
              options={[
                { value: "static-site", text: "Static Site" },
                { value: "server", text: "Web Server" },
              ]}
              value={projectType}
              onValueChange={(value: ProjectType) => {
                setProjectType((prev) => {
                  onChangeProjectType(prev, value);
                  return value;
                });
              }}
            />
          </div>
        </div>

        <hr className="my-2 text-sidebar-border" />

        <NewServicePanel
          projectType={projectType}
          attributes={serviceSpecificAttributes}
          setAttributes={setServiceSpecificAttributes}
        />

        <div className="mt-30 flex flex-row justify-center">
          <Button
            variation="default"
            onClick={() => {
              const newPayload: CreateServicePayload =
                projectType === "static-site"
                  ? {
                      type: projectType,
                      githubConnectionArn:
                        "arn:aws:codestar-connections:us-east-2:276291856310:connection/e7b8cd7c-295f-4776-9f93-4356f180edd6",
                      projectName,
                      githubRepoId: repoId,
                      githubBranchName: branchName,
                      rootDirectory,
                      ...(serviceSpecificAttributes as StaticSiteAttributesType),
                    }
                  : {
                      type: projectType,
                      githubConnectionArn:
                        "arn:aws:codestar-connections:us-east-2:276291856310:connection/e7b8cd7c-295f-4776-9f93-4356f180edd6",
                      projectName,
                      githubRepoId: repoId,
                      githubBranchName: branchName,
                      rootDirectory,
                      ...(serviceSpecificAttributes as ServerAttributesType),
                    };

              setPayload(newPayload);
            }}
            disabled={!(repoId && branchName && projectName && rootDirectory)}
          >
            <p>Deploy</p>
          </Button>
        </div>
      </div>

      {payload && (
        <div
          className={`
        bg-sidebar-background 
        border-1 border-sidebar-border 
        p-4 rounded-xl`}
        >
          <NewServiceDeploymentView payload={payload} />
        </div>
      )}
    </div>
  );
}

type NewServicePanelProps = {
  projectType: ProjectType;
  attributes: ServiceSpecificAttributesType | undefined;
  setAttributes: (attr: ServiceSpecificAttributesType) => void;
};

function NewServicePanel({
  projectType,
  attributes,
  setAttributes,
}: NewServicePanelProps) {
  const updateAttributes = (key: string, value: any) => {
    setAttributes({
      ...attributes,
      [key]: value,
    } as ServiceSpecificAttributesType);
  };

  if (projectType === "server") {
    const serverAttributes = attributes as ServerAttributesType | undefined;
    return (
      <>
        <div className="flex flex-row justify-between">
          <InputField
            text={"Container Port"}
            value={serverAttributes?.container_port ?? ""}
            setValue={(val: string) =>
              updateAttributes("container_port", Number(val))
            }
          />

          <InputField
            text={"Dockerfile Path"}
            value={serverAttributes?.dockerfile_path ?? ""}
            setValue={(val: string) => updateAttributes("dockerfile_path", val)}
          />
        </div>

        <div className="p-2">
          <Select
            selectedValue={serverAttributes?.instance_type ?? ""}
            onValueChange={(val) => {
              updateAttributes("instance_type", val);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={"choose a type"} />
            </SelectTrigger>
            <InstanceTypeList />
          </Select>
        </div>
      </>
    );
  } else {
    // Static site
    const siteAttributes = attributes as StaticSiteAttributesType | undefined;

    return (
      <>
        <div className="flex flex-row justify-between">
          <InputField
            text={"Build Command"}
            value={siteAttributes?.buildCommand ?? ""}
            setValue={(val: string) => updateAttributes("buildCommand", val)}
          />

          <InputField
            text={"Publish Directory"}
            value={siteAttributes?.publishDirectory ?? ""}
            setValue={(val: string) =>
              updateAttributes("publishDirectory", val)
            }
          />
        </div>
      </>
    );
  }
}

export default NewServicePage;
