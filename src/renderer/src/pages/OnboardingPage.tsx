import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/Select";
import { AlertTriangle, Key, Lock, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { BottomBorderInput } from "./ServicePage/ServiceSettingsPage";
import Button from "@/components/ui/Button";
import LogView from "./ServicePage/LogViews/LogView";
import { LogData } from "@/hooks/useStream";
import { useNavigate } from "react-router";

type Region = {
  id: string;
  name: string;
};

const AWS_REGIONS: Region[] = [
  { id: "us-east-1", name: "US East (N. Virginia)" },
  { id: "us-east-2", name: "US East (Ohio)" },
  { id: "us-west-1", name: "US West (N. California)" },
  { id: "us-west-2", name: "US West (Oregon)" },
  { id: "ap-south-1", name: "Asia Pacific (Mumbai)" },
  { id: "ap-northeast-3", name: "Asia Pacific (Osaka)" },
  { id: "ap-northeast-2", name: "Asia Pacific (Seoul)" },
  { id: "ap-southeast-1", name: "Asia Pacific (Singapore)" },
  { id: "ap-southeast-2", name: "Asia Pacific (Sydney)" },
  { id: "ap-northeast-1", name: "Asia Pacific (Tokyo)" },
  { id: "ca-central-1", name: "Canada (Central)" },
  { id: "eu-central-1", name: "Europe (Frankfurt)" },
  { id: "eu-west-1", name: "Europe (Ireland)" },
  { id: "eu-west-2", name: "Europe (London)" },
  { id: "eu-west-3", name: "Europe (Paris)" },
  { id: "eu-north-1", name: "Europe (Stockholm)" },
  { id: "sa-east-1", name: "South America (São Paulo)" }
];

function RegionSelectList() {
  return (
    <>
      <SelectContent>
        {AWS_REGIONS.map((region, _) => {
          return (
            <SelectItem key={region.id} value={region.id}>
              <div className="flex flex-col gap-1">
                <span className="text-text-primary text-sm font-light w-1/2 overflow-scroll">
                  {region.id}
                </span>
                <span className="text-text-secondary text-sm font-light w-1/2 overflow-scroll">
                  {region.name}
                </span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </>
  );
}

const waitForUserListener = (callback: (data: LogData) => void) => {
  callback({
    source: "sys-info",
    data: "CloudWrap initialized."
  });
  callback({
    source: "stdout",
    data: "Waiting for user configuration..."
  });

  return () => {};
};

const dummyStarter = async () => {};

function OnboardingPage() {
  const [formData, setFormData] = useState({
    accessKey: "",
    secretKey: "",
    region: "us-east-1"
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  return (
    <div
      className="
      bg-sidebar-background 
      w-full h-full 
      flex flex-col 
      gap-2
      text-text-primary p-5"
    >
      <h1
        className="
      text-center
      text-3xl 
      font-mono font-semibold"
      >
        Your Cloud, Wrapped
      </h1>
      <div className="flex flex-col md:flex-row md:h-full gap-5">
        <div className="flex-1 flex flex-col gap-2 md:h-full">
          <div className="flex flex-col gap-2 md:my-20">
            <div
              className="
          bg-careful-background/10 
          border border-careful-background/20 
          rounded-lg p-4 
          flex flex-col gap-2 items-start"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-full flex flex-row items-center gap-2 ">
                  <AlertTriangle className="w-5 h-5 text-careful-background shrink-0" />
                  <span className="font-medium text-sm text-careful-background">
                    Do not use your AWS Root Account
                  </span>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed">
                  Please create a dedicated IAM User (e.g.
                  <code className="text-careful">cloudwrap-admin</code>) with
                  <code className="bg-black/30 px-1 py-0.5 rounded mx-1 text-careful">
                    AdministratorAccess
                  </code>
                </p>
              </div>

              <ul className="text-xs text-text-secondary/80 flex flex-col gap-2">
                <li className="bg-inverted/5 p-2 rounded border border-inverted/5">
                  <strong>Why Admin?</strong>
                  <p>We need permissions to bootstrap the initial State Bucket and IAM Roles.</p>
                </li>
                <li className="bg-inverted/5 p-2 rounded border border-inverted/5">
                  <strong>Daily Use:</strong>
                  <p>
                    Once onboarded, CloudWrap purely uses
                    <strong className="px-1 py-0.5 rounded mx-1 bg-black/30">sts:AssumeRole</strong>
                    to perform operations, keeping your long-term credentials safe.
                  </p>
                </li>
              </ul>
            </div>

            <div
              className="
          bg-success-background/10 
          border border-success-background/20 
          rounded-lg p-4 
          flex flex-col gap-3 items-start"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-success-background" />
                <span className="font-medium text-sm text-success-background">
                  Security Guarantee
                </span>
              </div>

              <ul className="w-full grid grid-cols-1 gap-2 text-text-secondary text-xs">
                <li
                  className="
              bg-inverted/5 p-2 rounded 
              border border-inverted/5 
              flex flex-row
              items-center
              gap-3 "
                >
                  <Lock className="w-4 h-4 text-text-secondary shrink-0" />
                  <span>
                    Encrypted using <strong>AES-256</strong> via Electron SafeStorage.
                  </span>
                </li>

                <li
                  className="
              bg-inverted/5 p-2 rounded 
              border border-inverted/5 
              flex flex-row
              items-center
              gap-3 "
                >
                  <Key className="w-4 h-4 text-text-secondary shrink-0" />
                  <span>
                    Stored strictly in your <strong>OS Password Manager</strong> (Keychain/DPAPI).
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-row items-center">
            <div className="flex-1 flex flex-col gap-2">
              <BottomBorderInput
                name="Access Key"
                modifying
                value={formData.accessKey}
                onValueChange={(value) => {
                  if (!isSubmitted) setFormData((prev) => ({ ...prev, accessKey: value }));
                }}
              />
              <BottomBorderInput
                name="Secret Key"
                modifying
                value={formData.secretKey}
                onValueChange={(value) => {
                  if (!isSubmitted) setFormData((prev) => ({ ...prev, secretKey: value }));
                }}
              />
            </div>

            <div className="flex-1">
              <Select
                selectedValue={formData.region}
                onValueChange={(val) => {
                  if (!isSubmitted) setFormData((prev) => ({ ...prev, region: val }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={"choose a type"} />
                </SelectTrigger>
                <RegionSelectList />
              </Select>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <Button
                className="w-fit"
                variation={isSubmitted ? "disabled" : "default"}
                onClick={() => {
                  setIsSubmitted(true);
                }}
              >
                <p>{isSubmitted ? "Submitting" : "Submit"}</p>
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full md:h-full flex items-center">
          <div className="w-full h-fit bg-[#ffffff] dark:bg-[#1e1e1e] border border-sidebar-border rounded-xl overflow-hidden">
            {isSubmitted ? (
              <LogView
                key="real-deployment"
                enabled={true}
                starter={async () => {
                  await window.api.onboarding.start(formData);
                  setIsSubmitted(true);
                }}
                endOfStreamCallback={() => {
                  // Giving the users some time to watch the CloudFormation logs
                  setTimeout(() => {
                    navigate("/");
                  }, 1500);
                }}
                listener={window.api.onboarding.onLog}
              />
            ) : (
              <LogView
                key="preview-deployment"
                enabled={true}
                starter={dummyStarter}
                listener={waitForUserListener}
                timeDisabled={true}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingPage;
