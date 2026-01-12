import { useEffect, useState } from "react";
import clsx from "clsx";

import { fetchInstances, launchInstance } from "@/apis/ec2";
import { Plus } from "lucide-react";
import AccentButton from "@/components/ui/AccentButton";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/Select";
import EC2ServiceCard from "@/components/EC2ServiceCard";
import type { EC2_API_Instance } from "@shared/ec2.type";
import ubuntuIcon from "@/public/ubuntu.svg";
import windowsIcon from "@/public/windows.svg";

type PriceKey = "linux_price" | "windows_price";

type InstanceType = {
  vCPUs: number;
  RAM: string;
  linux_price: number;
  windows_price: number;
};

function getHourlyCost(instanceType: string, instanceImage: string) {
  const instanceKey = instanceType as keyof typeof INSTANCE_TYPE_MAPPING;

  // 2. Safely get the instance details
  const instanceDetail = INSTANCE_TYPE_MAPPING[instanceKey];

  // 3. Assert the dynamically generated price key to be one of the known PriceKeys
  const priceKey = `${instanceImage.toLowerCase()}_price` as PriceKey;

  // 4. Safely get the hourly cost. Result is number | undefined
  const hourly_cost: number | undefined = instanceDetail?.[priceKey];
  return hourly_cost;
}

const INSTANCE_TYPE_MAPPING: Record<string, InstanceType> = {
  "t3.nano": {
    vCPUs: 2,
    RAM: "0.5GB",
    linux_price: 0.0056,
    windows_price: 0.0102
  },
  "t3.micro": {
    vCPUs: 2,
    RAM: "1.0GB",
    linux_price: 0.0112,
    windows_price: 0.0204
  },
  "t3.small": {
    vCPUs: 2,
    RAM: "2.0GB",
    linux_price: 0.0224,
    windows_price: 0.0408
  },
  "t3.medium": {
    vCPUs: 2,
    RAM: "4.0GB",
    linux_price: 0.0448,
    windows_price: 0.0632
  },
  "t3.large": {
    vCPUs: 2,
    RAM: "8.0GB",
    linux_price: 0.0896,
    windows_price: 0.1172
  }
};

const INSTANCE_IMAGE_MAPPING = {
  Linux: <img src={ubuntuIcon} alt="linux" />,
  Windows: <img src={windowsIcon} alt="windows" />
};

function InstanceTypeList() {
  return (
    <SelectContent>
      {Object.entries(INSTANCE_TYPE_MAPPING).map(([key, val]) => {
        return (
          <SelectItem key={key} value={key}>
            <div className="flex flex-col gap-2">
              <span className="text-text-primary text-sm font-light w-1/2 overflow-scroll">
                {key}
              </span>
              <div className="flex flex-col gap-0.5 text-text-secondary text-[10px] font-light">
                <div className="flex flex-row justify-start gap-4">
                  <span>{val.RAM} RAM</span>
                  <span>{val.vCPUs} vCPUs</span>
                </div>
                <span>
                  On-Demand Linux
                  <span className="text-accent"> {val.linux_price} </span> per hour
                </span>
                <span>
                  On-Demand Windows
                  <span className="text-accent"> {val.windows_price} </span> per hour
                </span>
              </div>
            </div>
          </SelectItem>
        );
      })}
    </SelectContent>
  );
}

function InstanceImageGroup({
  newInstanceImage,
  setNewInstanceImage
}: {
  newInstanceImage: string;
  setNewInstanceImage: (image: string) => void;
}) {
  return (
    <div className="flex flex-row gap-2 justify-between w-full overflow-scroll scrollbar-hide">
      {Object.entries(INSTANCE_IMAGE_MAPPING).map(([key, val]) => {
        return (
          <div
            className={clsx(
              `w-full flex flex-col items-center 
              border p-2
              min-w-[45%]`,
              newInstanceImage === key
                ? "border-accent bg-accent-background/30"
                : "border-sidebar-border bg-sidebar-hovered"
            )}
            key={key}
            onClick={() => setNewInstanceImage(key)}
          >
            <span className="text-text-primary font-mono text-sm">{key}</span>
            <div className="flex items-center rounded-sm size-20 text-text-primary">{val}</div>
          </div>
        );
      })}
    </div>
  );
}

function InstanceCostPanel({
  instanceType,
  instanceImage
}: {
  instanceType: string;
  instanceImage: string;
}) {
  const hourly_cost = getHourlyCost(instanceType, instanceImage);

  const monthly_cost = (hourly_cost * 24 * 30).toFixed(2);

  return (
    <div className="w-40">
      <p className="text-text-secondary font-mono text-wrap text-sm">
        Monthly estimate
        <span className="text-accent">
          {isNaN(parseFloat(monthly_cost)) ? " Not available" : ` $${monthly_cost}`}
        </span>
      </p>
    </div>
  );
}

export default function InstancePage() {
  const [instances, setInstances] = useState<EC2_API_Instance[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const [newInstanceName, setNewInstanceName] = useState("");
  const [newInstanceImage, setNewInstanceImage] = useState(""); // "t3.nano"
  const [newInstanceType, setNewInstanceType] = useState(""); // "Linux | Windows"

  useEffect(() => {
    (async () => {
      try {
        const fetchedInstances = await fetchInstances();

        if (fetchedInstances === undefined) {
          throw new Error("Instances fetched is undefined");
        }

        setInstances(fetchedInstances);
      } catch (error) {
        console.log(error);
      }
    })();
  }, []);

  const plusIcon = <Plus />;

  const onCreateNewInstance = async function () {
    try {
      await launchInstance(newInstanceName, newInstanceImage, newInstanceType);
      setModalOpen(false);
    } catch (err) {
      console.log(err);
    }
  };

  const modalCleanUp = () => {
    setModalOpen(false);
    setNewInstanceName("");
    setNewInstanceType("");
    setNewInstanceImage("");
  };

  const instanceSpecification = (
    <div
      className="flex flex-col 
      items-center bg-strong 
      p-8
      text-text-primary
      rounded-lg
      border border-sidebar-border"
    >
      <div className="flex flex-col gap-5">
        <div>
          <h2 className="text-sm font-medium text-text-secondary">Name</h2>
          <Input
            // sync it with react state
            value={newInstanceName}
            // Sync react state with it
            onChange={(event) => setNewInstanceName(event.target.value)}
          />
        </div>

        <div>
          <h2 className="text-sm font-medium text-text-secondary">Instance type</h2>
          <Select
            selectedValue={newInstanceType}
            onValueChange={(val) => {
              setNewInstanceType(val);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={"choose a type"} />
            </SelectTrigger>
            <InstanceTypeList />
          </Select>
        </div>

        <InstanceImageGroup
          setNewInstanceImage={setNewInstanceImage}
          newInstanceImage={newInstanceImage}
        />

        <InstanceCostPanel instanceImage={newInstanceImage} instanceType={newInstanceType} />

        <div className="flex flex-row justify-end gap-5">
          <Button variation={"secondary"} onClick={modalCleanUp}>
            <p>Cancel</p>
          </Button>
          <Button variation={"default"} onClick={onCreateNewInstance}>
            <p>Create</p>
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col px-[15%] w-full h-full gap-y-2">
      <div className="flex flex-row justify-between mt-1">
        <h1 className="text-text-primary text-2xl font-bold">EC2 instances</h1>
        <div
          onClick={() => {
            setModalOpen(true);
          }}
        >
          <AccentButton icon={plusIcon} text="Launch instance" />
        </div>
        <Modal isOpen={modalOpen} onClose={modalCleanUp}>
          {instanceSpecification}
        </Modal>
      </div>

      <p className="text-text-secondary"></p>
      <div className="flex flex-col gap-y-5">
        {instances.map((elem, idx) => {
          return (
            <EC2ServiceCard
              Name={elem.Name}
              instanceID={elem.InstanceId}
              instanceState={elem.InstanceState}
              instanceType={elem.InstanceType}
              creationDate={elem.LaunchTime}
              publicIp={elem.Ipv4}
              platform={elem.Platform}
              serviceProvider="AWS"
              key={idx}
            />
          );
        })}
      </div>
    </div>
  );
}

export { InstanceTypeList };
